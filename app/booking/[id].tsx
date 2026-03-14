import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
    View, Text, ScrollView, Pressable, TextInput,
    ActivityIndicator, StyleSheet, Modal, Alert,
    Dimensions, Linking, Platform, Animated as RNAnimated,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth, useUser } from '../../lib/useClerkSafe';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Star, X, Check } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp, ZoomIn, useSharedValue, withSpring } from 'react-native-reanimated';
import TouchableScale from '../../components/ui/TouchableScale';
import api from '../../lib/api';
import { useTranslation } from 'react-i18next';
import { useUserStore } from '../../store/userStore';
import { useIsAuthenticated } from '../../hooks/useIsAuthenticated';
import { COLORS, SHADOWS, FONT } from '../../design-system/theme';

const { width: SW, width: SCREEN_WIDTH } = Dimensions.get('window');
const BLURHASH = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

interface Service {
    _id?: string;
    id?: string;
    name: any;
    duration: number;
    price: number;
}

interface Monk {
    _id: string;
    name: any;
    title?: any;
    image?: string;
    imageUrl?: string;
    specialization?: any;
    specialties?: string[];
    isSpecial?: boolean;
    services?: Service[];
    yearsOfExperience?: number;
    rating?: number;
}

const TIME_SLOTS = [
    '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00',
    '17:00', '18:00', '19:00', '20:00',
];

const BANK_LINKS = [
    { name: 'Khan Bank', prefix: 'khanbank://', color: '#00A859' },
    { name: 'Golomt Bank', prefix: 'golomtbank://', color: '#003DA5' },
    { name: 'TDB', prefix: 'tdbbank://', color: '#E31937' },
];

const MN_MONTHS = [
    '1-р сар', '2-р сар', '3-р сар', '4-р сар', '5-р сар', '6-р сар',
    '7-р сар', '8-р сар', '9-р сар', '10-р сар', '11-р сар', '12-р сар',
];

const MN_WEEKDAYS = ['Ня', 'Да', 'Мя', 'Лх', 'Пү', 'Ба', 'Бя'];

const t_field = (data: any, lang: string) => {
    if (!data) return '';
    if (typeof data === 'string') return data;
    return data[lang] || data.mn || data.en || '';
};

const generateDays = (count: number): Date[] => {
    const days: Date[] = [];
    const today = new Date();
    for (let i = 0; i < count; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        days.push(d);
    }
    return days;
};

const formatPriceNum = (monk: Monk): number => {
    const price = monk.services?.[0]?.price;
    if (price) return price;
    return monk.isSpecial ? 888000 : 50000;
};

export default function MonkBookingScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { isSignedIn } = useAuth();
    const { user: clerkUser } = useUser();
    const { user: dbUser } = useUserStore();
    const isAuthenticated = useIsAuthenticated();
    const { i18n } = useTranslation();
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const t_db = (data: any) => t_field(data, i18n.language);

    const days = useMemo(() => generateDays(14), []);
    const [selectedDate, setSelectedDate] = useState(days[0]);
    const [selectedTime, setSelectedTime] = useState('');
    
    // Dynamic availability logic
    const availableTimeSlots = useMemo(() => {
        const now = new Date();
        const isToday = selectedDate.getDate() === now.getDate() && 
                        selectedDate.getMonth() === now.getMonth() && 
                        selectedDate.getFullYear() === now.getFullYear();
        
        return TIME_SLOTS.map(time => {
            const [hour] = time.split(':').map(Number);
            let isAvailable = true;
            
            // Disable past hours for today
            if (isToday && hour <= now.getHours() + 1) { // Adding 1hr buffer
                isAvailable = false;
            }
            
            // Mock unavailable slots logic based on date
            const seed = selectedDate.getDate() + hour;
            if (seed % 7 === 0 || seed % 11 === 0) {
                isAvailable = false;
            }
            
            return { time, isAvailable };
        });
    }, [selectedDate]);

    // Reset selected time if the new date makes it unavailable
    useEffect(() => {
        if (selectedTime) {
            const slot = availableTimeSlots.find(s => s.time === selectedTime);
            if (!slot || !slot.isAvailable) {
                setSelectedTime('');
            }
        }
    }, [availableTimeSlots]);

    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [specialRequests, setSpecialRequests] = useState('');
    const [bookingSuccess, setBookingSuccess] = useState(false);
    const [serviceAutoSelected, setServiceAutoSelected] = useState(false);

    // QPay state
    const [qpayModalVisible, setQpayModalVisible] = useState(false);
    const [qrImage, setQrImage] = useState('');
    const [invoiceId, setInvoiceId] = useState('');
    const [paymentChecking, setPaymentChecking] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [bookingId, setBookingId] = useState('');

    const { data: monk, isLoading } = useQuery({
        queryKey: ['monk', id],
        queryFn: async () => {
            const res = await api.get(`/monks/${id}`);
            return res.data as Monk;
        },
    });

    useEffect(() => {
        if (monk?.services && monk.services.length === 1 && !selectedService) {
            setSelectedService(monk.services[0]);
            setServiceAutoSelected(true);
        }
    }, [monk]);

    useEffect(() => {
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, []);

    const formattedDateMn = useMemo(() => {
        const d = selectedDate;
        return `${d.getFullYear()} оны ${MN_MONTHS[d.getMonth()]} ${d.getDate()}`;
    }, [selectedDate]);

    const handleBooking = useCallback(async () => {
        if (!selectedTime) {
            Alert.alert('Анхааруулга', 'Цаг сонгоно уу');
            return;
        }
        if (!selectedService) {
            Alert.alert('Анхааруулга', 'Үйлчилгээ сонгоно уу');
            return;
        }
        if (!isAuthenticated) {
            router.push('/(auth)/sign-in');
            return;
        }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        const userName = dbUser?.firstName
            ? `${dbUser.firstName} ${dbUser.lastName || ''}`.trim()
            : clerkUser?.fullName || 'Хэрэглэгч';
        const userEmail = dbUser?.email || clerkUser?.primaryEmailAddress?.emailAddress || '';
        const userPhone = dbUser?.phone || clerkUser?.primaryPhoneNumber?.phoneNumber || '';

        try {
            const bookingRes = await api.post('/bookings', {
                monkId: id,
                date: selectedDate.toISOString().split('T')[0],
                time: selectedTime,
                serviceId: selectedService?._id || selectedService?.id,
                userName,
                userEmail,
                userPhone,
                note: specialRequests || undefined,
            });

            const newBookingId = bookingRes.data?.id || bookingRes.data?._id;
            setBookingId(newBookingId);

            try {
                const paymentRes = await api.post('/payment/create', {
                    bookingId: newBookingId,
                    amount: formatPriceNum(monk!),
                    description: `${t_db(monk!.name)} - ${formattedDateMn} ${selectedTime}`,
                });

                if (paymentRes.data?.qPay_URL) {
                    setQrImage(paymentRes.data.qPay_URL);
                    setInvoiceId(paymentRes.data.invoice_id);
                    setQpayModalVisible(true);
                    startPaymentPolling(newBookingId);
                } else {
                    handleSuccess();
                }
            } catch (err) {
                console.error('Payment Error:', err);
                Alert.alert('Алдаа', 'Төлбөрийн нэхэмжлэл үүсгэхэд алдаа гарлаа.');
                handleSuccess(); // Proceed with booking anyway
            }
        } catch (error: any) {
            Alert.alert('Алдаа', error?.response?.data?.message || 'Захиалга үүсгэхэд алдаа гарлаа');
        }
    }, [id, selectedDate, selectedTime, selectedService, specialRequests, isAuthenticated, monk]);

    const startPaymentPolling = (idx: string) => {
        if (pollRef.current) clearInterval(pollRef.current);

        pollRef.current = setInterval(async () => {
            try {
                const res = await api.get(`/payment/check/${idx}`);
                if (res.data?.status === 'PAID') {
                    if (pollRef.current) clearInterval(pollRef.current);
                    setPaymentSuccess(true);
                    setTimeout(() => {
                        setQpayModalVisible(false);
                        handleSuccess();
                    }, 2000);
                }
            } catch (e) {
                console.log('Poll check err', e);
            }
        }, 5000); // every 5 seconds
    };

    const checkPaymentManual = async () => {
        if (!bookingId) return;
        setPaymentChecking(true);
        try {
            const res = await api.get(`/payment/check/${bookingId}`);
            if (res.data?.status === 'PAID') {
                if (pollRef.current) clearInterval(pollRef.current);
                setPaymentSuccess(true);
                setTimeout(() => {
                    setQpayModalVisible(false);
                    handleSuccess();
                }, 1500);
            } else {
                Alert.alert('Мэдээлэл', 'Төлбөр төлөгдөөгүй байна.');
            }
        } catch (e) {
            Alert.alert('Алдаа', 'Шалгахад алдаа гарлаа.');
        } finally {
            setPaymentChecking(false);
        }
    };

    const openBankApp = (prefix: string) => {
        Linking.openURL(prefix).catch(() => {
            Alert.alert('Алдаа', 'Тухайн банкны апп олдсонгүй.');
        });
    };

    const closeModal = () => {
        if (pollRef.current) clearInterval(pollRef.current);
        setQpayModalVisible(false);
    };

    const handleSuccess = () => {
        setBookingSuccess(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    if (bookingSuccess) {
        return (
            <SafeAreaView style={s.successContainer}>
                <Stack.Screen options={{ headerShown: false }} />
                <Animated.View entering={ZoomIn.duration(600).springify()} style={s.successCard}>
                    <LinearGradient colors={['#D1FAE5', '#A7F3D0']} style={s.successIconBg}>
                        <Check size={48} color="#059669" />
                    </LinearGradient>
                    <Text style={s.successTitle}>Захиалга баталгаажлаа!</Text>
                    <Text style={s.successText}>
                        Таны {formattedDateMn} өдрийн {selectedTime} цагийн захиалга амжилттай бүртгэгдлээ.
                    </Text>
                    <TouchableScale onPress={() => router.replace('/my-bookings')} >
                        <LinearGradient colors={[COLORS.goldBright, COLORS.gold, COLORS.amber]} style={[s.viewBookingsBtn, SHADOWS.glow]}>
                            <View style={s.btnShine} />
                            <Text style={s.viewBookingsText}>Захиалгууд харах</Text>
                        </LinearGradient>
                    </TouchableScale>
                </Animated.View>
            </SafeAreaView>
        );
    }

    if (isLoading || !monk) {
        const pulse = new RNAnimated.Value(0.4);
        RNAnimated.loop(RNAnimated.sequence([
            RNAnimated.timing(pulse, { toValue: 0.75, duration: 900, useNativeDriver: true }),
            RNAnimated.timing(pulse, { toValue: 0.4, duration: 900, useNativeDriver: true })
        ])).start();

        return (
            <View style={s.loadingContainer}>
                <Stack.Screen options={{ headerShown: false }} />
                <RNAnimated.View style={{ opacity: pulse }}>
                    <ActivityIndicator size="large" color={COLORS.gold} />
                </RNAnimated.View>
            </View>
        );
    }

    const priceNum = formatPriceNum(monk);
    const isReady = !!selectedDate && !!selectedTime && !!selectedService;

    return (
        <View style={s.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                {/* Fixed Header */}
                <View style={s.header}>
                    <TouchableScale onPress={() => router.back()} style={s.backBtn} >
                        <Text style={s.backBtnText}>‹</Text>
                    </TouchableScale>
                    <Text style={s.headerTitle}>Цаг захиалах</Text>
                    <View style={{ width: 38 }} />
                </View>

                <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
                    {/* Monk Info */}
                    <Animated.View entering={FadeInDown.delay(80)} style={s.monkInfo}>
                        <Image
                            source={{ uri: monk.imageUrl || monk.image || 'https://i.pravatar.cc/150' }}
                            style={s.monkAvatar}
                            placeholder={BLURHASH}
                            contentFit="cover"
                        />
                        <View style={s.monkTextInfo}>
                            <Text style={s.monkName}>{t_db(monk.name)}</Text>
                            <Text style={s.monkSpecialty}>{t_db(monk.specialization)}</Text>
                            <View style={s.ratingRow}>
                                <Star size={14} color={COLORS.goldBright} fill={COLORS.goldBright} />
                                <Text style={s.ratingText}>{monk.rating || '4.9'}</Text>
                            </View>
                        </View>
                    </Animated.View>

                    {/* Service Selection */}
                    {!serviceAutoSelected && monk.services && monk.services.length > 1 && (
                        <Animated.View entering={FadeInDown.delay(160)}>
                            <Text style={s.sectionTitle}>Үйлчилгээ сонгох</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.hScrollProvider}>
                                {monk.services.map((srv) => {
                                    const isSel = selectedService?.name === srv.name;
                                    return (
                                        <TouchableScale key={srv._id || srv.id || srv.name} onPress={() => { Haptics.selectionAsync(); setSelectedService(srv); }}>
                                            {isSel ? (
                                                <LinearGradient colors={[COLORS.goldBright, COLORS.gold, COLORS.amber]} style={[s.serviceCardActive, SHADOWS.glow]}>
                                                    <Text style={s.serviceCardTextActive}>{t_db(srv.name)}</Text>
                                                    <Text style={s.serviceCardPriceActive}>{srv.price.toLocaleString()}₮</Text>
                                                </LinearGradient>
                                            ) : (
                                                <View style={s.serviceCardInactive}>
                                                    <Text style={s.serviceCardTextInactive}>{t_db(srv.name)}</Text>
                                                    <Text style={s.serviceCardPriceInactive}>{srv.price.toLocaleString()}₮</Text>
                                                </View>
                                            )}
                                        </TouchableScale>
                                    );
                                })}
                            </ScrollView>
                        </Animated.View>
                    )}

                    {/* Date Selection */}
                    <Animated.View entering={FadeInDown.delay(240)}>
                        <Text style={s.sectionTitle}>Огноо сонгох</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.hScrollProvider}>
                            {days.map((day, idx) => {
                                const isSel = selectedDate.getDate() === day.getDate() && selectedDate.getMonth() === day.getMonth();
                                const isToday = idx === 0;
                                return (
                                    <TouchableScale key={idx} onPress={() => { Haptics.selectionAsync(); setSelectedDate(day); }}>
                                        {isSel ? (
                                            <LinearGradient colors={[COLORS.goldBright, COLORS.gold, COLORS.amber]} style={[s.dayCardActive, SHADOWS.glow]}>
                                                <Text style={s.dayCardMonthActive}>{MN_MONTHS[day.getMonth()]}</Text>
                                                <Text style={s.dayCardDateActive}>{day.getDate()}</Text>
                                                <Text style={s.dayCardDayActive}>{MN_WEEKDAYS[day.getDay()]}</Text>
                                            </LinearGradient>
                                        ) : (
                                            <View style={s.dayCardInactive}>
                                                <Text style={s.dayCardMonthInactive}>{MN_MONTHS[day.getMonth()]}</Text>
                                                <Text style={s.dayCardDateInactive}>{day.getDate()}</Text>
                                                <Text style={s.dayCardDayInactive}>{MN_WEEKDAYS[day.getDay()]}</Text>
                                                {isToday && <Text style={s.todayText}>Өнөөдөр</Text>}
                                            </View>
                                        )}
                                    </TouchableScale>
                                );
                            })}
                        </ScrollView>
                    </Animated.View>

                    {/* Time Selection */}
                    <Animated.View entering={FadeInDown.delay(320)}>
                        <Text style={s.sectionTitle}>Цаг сонгох</Text>
                        <View style={s.timeGrid}>
                            {availableTimeSlots.map(({ time, isAvailable }) => {
                                const isSel = selectedTime === time;
                                return (
                                    <TouchableScale 
                                        key={time} 
                                        onPress={() => { 
                                            if (isAvailable) {
                                                Haptics.selectionAsync(); 
                                                setSelectedTime(time); 
                                            } else {
                                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                                            }
                                        }} 
                                        style={[s.timeCol, !isAvailable && { opacity: 0.4 }]}
                                    >
                                        {isSel ? (
                                            <LinearGradient colors={[COLORS.goldBright, COLORS.gold, COLORS.amber]} style={[s.timeCardActive, SHADOWS.glow]}>
                                                <Text style={s.timeCardTextActive}>{time}</Text>
                                            </LinearGradient>
                                        ) : (
                                            <View style={[s.timeCardInactive, !isAvailable && s.timeCardDisabled]}>
                                                <Text style={[s.timeCardTextInactive, !isAvailable && s.timeCardTextDisabled]}>{time}</Text>
                                            </View>
                                        )}
                                    </TouchableScale>
                                );
                            })}
                        </View>
                    </Animated.View>

                    {/* Notes */}
                    <Animated.View entering={FadeInDown.delay(400)}>
                        <Text style={s.sectionTitle}>Нэмэлт хүсэлт</Text>
                        <View style={s.inputWrapper}>
                            <TextInput
                                style={s.input}
                                placeholder="Тухайн үзмэрчид зориулан үлдээх үг (заавал биш)"
                                placeholderTextColor={COLORS.textMute}
                                multiline
                                numberOfLines={3}
                                value={specialRequests}
                                onChangeText={setSpecialRequests}
                                selectionColor={COLORS.gold}
                            />
                        </View>
                    </Animated.View>

                    {/* Summary Card */}
                    <Animated.View entering={FadeInDown.delay(480)} style={s.summaryCard}>
                        <View style={s.summaryTopLine} />
                        <View style={s.summaryRow}>
                            <Text style={s.summaryLabel}>Үзмэрч</Text>
                            <Text style={s.summaryValue}>{t_db(monk.name)}</Text>
                        </View>
                        <View style={s.summaryDivider} />
                        <View style={s.summaryRow}>
                            <Text style={s.summaryLabel}>Огноо</Text>
                            <Text style={s.summaryValue}>{formattedDateMn}</Text>
                        </View>
                        <View style={s.summaryDivider} />
                        <View style={s.summaryRow}>
                            <Text style={s.summaryLabel}>Цаг</Text>
                            <Text style={s.summaryValue}>{selectedTime || 'Сонгоогүй'}</Text>
                        </View>
                        {selectedService && (
                            <>
                                <View style={s.summaryDivider} />
                                <View style={s.summaryRow}>
                                    <Text style={s.summaryLabel}>Үйлчилгээ</Text>
                                    <Text style={s.summaryValue}>{t_db(selectedService.name)}</Text>
                                </View>
                            </>
                        )}
                        <View style={s.summaryTotalBox}>
                            <Text style={s.summaryTotalLabel}>Нийт төлөх дүн</Text>
                            <Text style={s.summaryTotalAmount}>{priceNum.toLocaleString()}₮</Text>
                        </View>
                    </Animated.View>
                </ScrollView>

                {/* Fixed Footer */}
                <View style={s.footer}>
                    <View style={{ flex: 1, marginRight: 16 }}>
                        <Text style={s.footerSmallText}>Төлөх дүн</Text>
                        <Text style={s.footerPrice}>{priceNum.toLocaleString()}₮</Text>
                    </View>
                    <TouchableScale
                        disabled={!isReady}
                        onPress={handleBooking}

                        style={{ flex: 1.5 }}
                    >
                        <LinearGradient colors={isReady ? [COLORS.goldBright, COLORS.gold, COLORS.amber] : ['#E8E8E8', '#D8D8D8', '#C8C8C8']} style={[s.bookBtn, isReady ? SHADOWS.glow : {}]}>
                            {isReady && <View style={s.btnShine} />}
                            <Text style={[s.bookBtnText, !isReady && { color: COLORS.textMid }]}>
                                {isReady ? '⚡ QPay-р төлөх' : 'Төлбөр төлөх'}
                            </Text>
                        </LinearGradient>
                    </TouchableScale>
                </View>
            </SafeAreaView>

            {/* QPay Modal */}
            <Modal visible={qpayModalVisible} transparent animationType="slide">
                <View style={s.modalOverlay}>
                    <View style={s.modalSheet}>
                        <View style={s.modalHandle} />
                        <TouchableScale onPress={closeModal} style={s.modalClose} >
                            <X size={20} color={COLORS.text} />
                        </TouchableScale>
                        <Text style={s.qpayTitle}>Төлбөр төлөх (QPay)</Text>
                        <Text style={s.qpaySub}>Доорх QR кодыг уншуулж төлбөрөө төлнө үү</Text>

                        <Text style={s.qpayAmount}>{priceNum.toLocaleString()}₮</Text>

                        {paymentSuccess ? (
                            <Animated.View entering={ZoomIn}>
                                <View style={s.paymentSuccessBox}>
                                    <Check size={40} color={COLORS.success} />
                                    <Text style={s.paymentSuccessText}>Төлбөр амжилттай!</Text>
                                </View>
                            </Animated.View>
                        ) : (
                            <>
                                {qrImage ? (
                                    <View style={s.qrWrapper}>
                                        <Image source={{ uri: `data:image/png;base64,${qrImage}` }} style={s.qrImg} />
                                    </View>
                                ) : (
                                    <ActivityIndicator size="large" color={COLORS.gold} style={{ marginVertical: 30 }} />
                                )}

                                <Text style={s.bankTitle}>Банкны апп-аар төлөх:</Text>
                                <View style={s.bankGrid}>
                                    {BANK_LINKS.map(bank => (
                                        <TouchableScale key={bank.name} style={[s.bankBtn, { borderColor: bank.color }]} onPress={() => openBankApp(bank.prefix)} >
                                            <Text style={[s.bankBtnText, { color: bank.color }]}>{bank.name}</Text>
                                        </TouchableScale>
                                    ))}
                                </View>

                                <TouchableScale
                                    style={s.checkBtn}
                                    onPress={checkPaymentManual}
                                    disabled={paymentChecking}

                                >
                                    {paymentChecking ? (
                                        <ActivityIndicator color={COLORS.textMid} />
                                    ) : (
                                        <Text style={s.checkBtnText}>Төлбөр шалгах (Manual)</Text>
                                    )}
                                </TouchableScale>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    loadingContainer: { flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' },
    successContainer: { flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' },
    successCard: { backgroundColor: COLORS.surface, borderRadius: 20, padding: 32, alignItems: 'center', width: SW * 0.85, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.md },
    successIconBg: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
    successTitle: { fontFamily: FONT.display, fontSize: 22, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
    successText: { fontSize: 14, color: COLORS.textSub, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
    viewBookingsBtn: { paddingVertical: 15, paddingHorizontal: 32, borderRadius: 16, alignItems: 'center' },
    viewBookingsText: { color: '#1C0E00', fontWeight: '800', fontSize: 15, letterSpacing: 0.5, fontFamily: FONT.display },
    btnShine: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' },

    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 12, backgroundColor: COLORS.bg, zIndex: 10,
    },
    backBtn: {
        width: 38, height: 38, borderRadius: 12, backgroundColor: COLORS.surface,
        borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center',
        ...SHADOWS.sm,
    },
    backBtnText: { fontSize: 24, color: COLORS.text, marginTop: -4, fontWeight: '600' },
    headerTitle: { fontFamily: FONT.display, fontSize: 18, fontWeight: '700', color: COLORS.text },

    scrollContent: { paddingHorizontal: 20, paddingBottom: 140, paddingTop: 10 },

    monkInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 30, backgroundColor: COLORS.surface, borderRadius: 20, padding: 12, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.md },
    monkAvatar: { width: 64, height: 64, borderRadius: 18, marginRight: 14, borderWidth: 1.5, borderColor: COLORS.borderMed },
    monkTextInfo: { flex: 1 },
    monkName: { fontFamily: FONT.display, fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
    monkSpecialty: { fontSize: 13, color: COLORS.textSub, marginBottom: 4 },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    ratingText: { fontSize: 12, fontWeight: '700', color: COLORS.text },

    sectionTitle: { fontFamily: FONT.display, fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 12, marginLeft: 4 },
    hScrollProvider: { gap: 10, paddingRight: 20, marginBottom: 28 },

    serviceCardActive: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, minWidth: 120, alignItems: 'center' },
    serviceCardTextActive: { color: '#1C0E00', fontWeight: '700', fontSize: 14 },
    serviceCardPriceActive: { color: '#1C0E00', fontWeight: '800', fontSize: 14, marginTop: 4, fontFamily: FONT.display },
    serviceCardInactive: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, minWidth: 120, alignItems: 'center', backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
    serviceCardTextInactive: { color: COLORS.text, fontWeight: '600', fontSize: 14 },
    serviceCardPriceInactive: { color: COLORS.gold, fontWeight: '800', fontSize: 14, marginTop: 4, fontFamily: FONT.display },

    dayCardActive: { paddingVertical: 12, paddingHorizontal: 8, borderRadius: 14, minWidth: 50, alignItems: 'center' },
    dayCardMonthActive: { color: 'rgba(28,14,0,0.6)', fontSize: 10, fontWeight: '600', marginBottom: 2, textTransform: 'uppercase' },
    dayCardDateActive: { color: '#1C0E00', fontSize: 20, fontWeight: '700', fontFamily: FONT.display },
    dayCardDayActive: { color: 'rgba(28,14,0,0.6)', fontSize: 11, fontWeight: '700', marginTop: 2, textTransform: 'uppercase' },
    dayCardInactive: { paddingVertical: 12, paddingHorizontal: 8, borderRadius: 14, minWidth: 50, alignItems: 'center', backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
    dayCardMonthInactive: { color: COLORS.textMute, fontSize: 10, fontWeight: '600', marginBottom: 2, textTransform: 'uppercase' },
    dayCardDateInactive: { color: COLORS.text, fontSize: 20, fontWeight: '700', fontFamily: FONT.display },
    dayCardDayInactive: { color: COLORS.textMute, fontSize: 11, fontWeight: '700', marginTop: 2, textTransform: 'uppercase' },
    todayText: { color: COLORS.gold, fontSize: 8, fontWeight: '700', letterSpacing: 0.5, marginTop: 4 },

    timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28 },
    timeCol: { width: (SCREEN_WIDTH - 56) / 4 },
    timeCardActive: { paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
    timeCardTextActive: { color: '#1C0E00', fontWeight: '700', fontSize: 13, letterSpacing: 0.5 },
    timeCardInactive: { paddingVertical: 10, borderRadius: 12, alignItems: 'center', backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
    timeCardTextInactive: { color: COLORS.text, fontWeight: '700', fontSize: 13, letterSpacing: 0.5 },
    timeCardDisabled: { backgroundColor: '#F3EAC820', borderColor: 'transparent' },
    timeCardTextDisabled: { color: COLORS.textMute, textDecorationLine: 'line-through' },

    inputWrapper: { backgroundColor: COLORS.bgWarm, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 30 },
    input: { minHeight: 60, fontSize: 15, color: COLORS.text, textAlignVertical: 'top' },

    summaryCard: { backgroundColor: COLORS.surface, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden', ...SHADOWS.md },
    summaryTopLine: { height: 3, marginHorizontal: -20, marginBottom: 6, backgroundColor: COLORS.goldBright, borderTopLeftRadius: 22, borderTopRightRadius: 22 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
    summaryDivider: { height: 1, backgroundColor: COLORS.divider, marginVertical: 0 },
    summaryLabel: { fontSize: 14, color: COLORS.textSub, fontWeight: '500' },
    summaryValue: { fontSize: 14, color: COLORS.text, fontWeight: '600', textAlign: 'right', flex: 1, marginLeft: 20 },
    summaryTotalBox: { backgroundColor: 'rgba(200,150,12,0.07)', marginHorizontal: -20, paddingHorizontal: 36, paddingVertical: 12, borderRadius: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: COLORS.border, marginTop: 10 },
    summaryTotalLabel: { fontFamily: FONT.display, fontSize: 18, fontWeight: '700', color: COLORS.text },
    summaryTotalAmount: { fontFamily: FONT.display, fontSize: 20, fontWeight: '800', color: COLORS.gold },

    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(253,250,242,0.96)', borderTopWidth: 1, borderTopColor: COLORS.border, paddingHorizontal: 20, paddingVertical: 16, paddingBottom: Platform.OS === 'ios' ? 34 : 16, flexDirection: 'row', alignItems: 'center', ...((Platform.OS === 'web' || Platform.OS === 'ios') && { backdropFilter: 'blur(20px)' }) as any },
    footerSmallText: { fontSize: 12, color: COLORS.textSub, marginBottom: 2 },
    footerPrice: { fontFamily: FONT.display, fontSize: 22, fontWeight: '800', color: COLORS.gold },
    bookBtn: { paddingVertical: 15, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    bookBtnText: { color: '#1C0E00', fontWeight: '800', fontSize: 15, letterSpacing: 0.5, fontFamily: FONT.display },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalSheet: { backgroundColor: COLORS.bg, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, paddingBottom: 40, alignItems: 'center', position: 'relative' },
    modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.borderMed, alignSelf: 'center', marginBottom: 20 },
    modalClose: { position: 'absolute', top: 20, right: 20, padding: 6, backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
    qpayTitle: { fontFamily: FONT.display, fontSize: 20, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
    qpaySub: { fontSize: 13, color: COLORS.textSub, marginBottom: 12, textAlign: 'center' },
    qpayAmount: { fontFamily: FONT.display, fontSize: 30, fontWeight: '800', color: COLORS.gold, marginBottom: 24 },
    qrWrapper: { padding: 16, backgroundColor: COLORS.surface, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.md, marginBottom: 24 },
    qrImg: { width: 220, height: 220 },
    paymentSuccessBox: { padding: 30, alignItems: 'center', backgroundColor: '#ECFDF5', borderRadius: 24, borderWidth: 1, borderColor: '#34D399', marginVertical: 30 },
    paymentSuccessText: { marginTop: 12, fontSize: 18, fontWeight: '700', color: '#065F46' },
    bankTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textSub, width: '100%', marginBottom: 12 },
    bankGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, width: '100%', marginBottom: 24 },
    bankBtn: { flex: 1, minWidth: '30%', paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, alignItems: 'center' },
    bankBtnText: { fontSize: 12, fontWeight: '700' },
    checkBtn: { width: '100%', paddingVertical: 14, borderRadius: 14, backgroundColor: COLORS.bgWarm, borderWidth: 1, borderColor: COLORS.border },
    checkBtnText: { color: COLORS.text, fontWeight: '600', fontSize: 14, textAlign: 'center' },
});
