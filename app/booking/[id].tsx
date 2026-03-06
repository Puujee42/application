import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
    View, Text, ScrollView, Pressable, TextInput,
    ActivityIndicator, StyleSheet, Modal, Alert,
    Dimensions, Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth, useUser } from '../../lib/useClerkSafe';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, Star, X, Check } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import api from '../../lib/api';
import { useTranslation } from 'react-i18next';
import { useUserStore } from '../../store/userStore';
import { useIsAuthenticated } from '../../hooks/useIsAuthenticated';
import { COLORS, SHADOWS } from '../../design-system/theme';

const { width: SW } = Dimensions.get('window');
const BLURHASH = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

// ─── TYPES ────────────────────────────────────────────
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
}

// ─── CONSTANTS ────────────────────────────────────────
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

// ─── HELPERS ──────────────────────────────────────────
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

const formatPrice = (monk: Monk): string => {
    const price = monk.services?.[0]?.price;
    if (price) return `${price.toLocaleString()}₮`;
    return monk.isSpecial ? '888,000₮' : '50,000₮';
};

const formatPriceNum = (monk: Monk): number => {
    const price = monk.services?.[0]?.price;
    if (price) return price;
    return monk.isSpecial ? 888000 : 50000;
};

// ═══════════════════════════════════════════════════════
// MAIN SCREEN
// ═══════════════════════════════════════════════════════
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

    // ── State ──
    const days = useMemo(() => generateDays(14), []);
    const [selectedDate, setSelectedDate] = useState(days[0]);
    const [selectedTime, setSelectedTime] = useState('');
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

    // ── Data fetch ──
    const { data: monk, isLoading } = useQuery({
        queryKey: ['monk', id],
        queryFn: async () => {
            const res = await api.get(`/monks/${id}`);
            return res.data as Monk;
        },
    });

    // Auto-select single service
    useEffect(() => {
        if (monk?.services && monk.services.length === 1 && !selectedService) {
            setSelectedService(monk.services[0]);
            setServiceAutoSelected(true);
        }
    }, [monk]);

    // Cleanup polling on unmount
    useEffect(() => {
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, []);

    // ── Formatted date for summary ──
    const formattedDateMn = useMemo(() => {
        const d = selectedDate;
        return `${d.getFullYear()} оны ${MN_MONTHS[d.getMonth()]} ${d.getDate()}`;
    }, [selectedDate]);

    // ── Booking + QPay flow ──
    const handleBooking = useCallback(async () => {
        if (!selectedTime) {
            Alert.alert('Анхааруулга', 'Цаг сонгоно уу');
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
            // Step 1: Create booking
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

            // Step 2: Create QPay invoice
            try {
                const paymentRes = await api.post('/payment/create', {
                    bookingId: newBookingId,
                    amount: formatPriceNum(monk!),
                    description: `${t_db(monk!.name)} - ${formattedDateMn} ${selectedTime}`,
                });

                if (paymentRes.data?.qrImage) {
                    setQrImage(paymentRes.data.qrImage);
                    setInvoiceId(paymentRes.data.invoiceId || '');
                    setQpayModalVisible(true);
                    startPaymentPolling(paymentRes.data.invoiceId || newBookingId);
                } else {
                    // No QPay — direct success
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    setBookingSuccess(true);
                }
            } catch {
                // Payment endpoint not available — treat as direct booking success
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setBookingSuccess(true);
            }
        } catch (err: any) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Алдаа', err.message || 'Захиалга үүсгэхэд алдаа гарлаа');
        }
    }, [id, selectedDate, selectedTime, selectedService, specialRequests, isAuthenticated, monk, dbUser, clerkUser, router, formattedDateMn]);

    // ── QPay polling ──
    const startPaymentPolling = useCallback((payId: string) => {
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = setInterval(async () => {
            try {
                const res = await api.get(`/payment/check?invoiceId=${payId}`);
                if (res.data?.paid) {
                    if (pollRef.current) clearInterval(pollRef.current);
                    setPaymentSuccess(true);
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    setTimeout(() => {
                        setQpayModalVisible(false);
                        setBookingSuccess(true);
                    }, 2000);
                }
            } catch {
                // silent
            }
        }, 3000);
    }, []);

    const checkPaymentManual = useCallback(async () => {
        setPaymentChecking(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        try {
            const res = await api.get(`/payment/check?invoiceId=${invoiceId || bookingId}`);
            if (res.data?.paid) {
                if (pollRef.current) clearInterval(pollRef.current);
                setPaymentSuccess(true);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setTimeout(() => {
                    setQpayModalVisible(false);
                    setBookingSuccess(true);
                }, 2000);
            } else {
                Alert.alert('Мэдэгдэл', 'Төлбөр хараахан баталгаажаагүй байна. Түр хүлээнэ үү.');
            }
        } catch {
            Alert.alert('Алдаа', 'Төлбөр шалгахад алдаа гарлаа');
        } finally {
            setPaymentChecking(false);
        }
    }, [invoiceId, bookingId]);

    // ═══════════════════════════════════════════════════
    // LOADING
    // ═══════════════════════════════════════════════════
    if (isLoading) {
        return (
            <View style={[s.center, { backgroundColor: COLORS.bg }]}>
                <Stack.Screen options={{ headerShown: false }} />
                <ActivityIndicator size="large" color={COLORS.gold} />
                <Text style={s.loadingText}>Уншиж байна...</Text>
            </View>
        );
    }

    if (!monk) {
        return (
            <View style={[s.center, { backgroundColor: COLORS.bg }]}>
                <Stack.Screen options={{ headerShown: false }} />
                <Text style={{ color: COLORS.textLight, fontSize: 16 }}>Үзмэрч олдсонгүй</Text>
            </View>
        );
    }

    // ═══════════════════════════════════════════════════
    // SUCCESS SCREEN
    // ═══════════════════════════════════════════════════
    if (bookingSuccess) {
        return (
            <View style={[s.center, { backgroundColor: COLORS.bg, paddingHorizontal: 32 }]}>
                <Stack.Screen options={{ headerShown: false }} />
                <Animated.View entering={ZoomIn.duration(500)} style={s.successCircle}>
                    <Check size={40} color={COLORS.gold} />
                </Animated.View>
                <Animated.View entering={FadeInDown.delay(300).duration(500)} style={{ alignItems: 'center' }}>
                    <Text style={s.successTitle}>Захиалга баталгаажлаа!</Text>
                    <Text style={s.successDesc}>
                        <Text style={{ fontWeight: '700', color: COLORS.gold }}>{t_db(monk.name)}</Text>
                        {' '}{formattedDateMn}, {selectedTime} цагт.
                    </Text>
                    <Pressable
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            router.push('/(tabs)');
                        }}
                    >
                        <LinearGradient colors={[COLORS.gold, COLORS.deepGold]} style={[s.successBtn, SHADOWS.gold]}>
                            <Text style={s.successBtnText}>НҮҮР ХУУДАС →</Text>
                        </LinearGradient>
                    </Pressable>
                </Animated.View>
            </View>
        );
    }

    // ═══════════════════════════════════════════════════
    // MAIN BOOKING UI
    // ═══════════════════════════════════════════════════
    return (
        <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
            <Stack.Screen options={{ headerShown: false }} />
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>

                {/* ─── HEADER ─── */}
                <View style={s.header}>
                    <Pressable
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            router.back();
                        }}
                        style={s.backBtn}
                    >
                        <ArrowLeft size={22} color={COLORS.text} />
                    </Pressable>
                    <Text style={s.headerTitle}>Цаг захиалах</Text>
                    <View style={{ width: 44 }} />
                </View>

                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{ paddingBottom: 140 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* ─── MONK INFO CARD ─── */}
                    <Animated.View entering={FadeInDown.delay(100).duration(500)} style={s.monkCard}>
                        <View style={s.goldTopLine} />
                        <View style={s.monkCardRow}>
                            <Image
                                source={{ uri: monk.image || monk.imageUrl || 'https://via.placeholder.com/150' }}
                                style={s.monkAvatar}
                                contentFit="cover"
                                placeholder={BLURHASH}
                                transition={300}
                            />
                            <View style={s.monkInfo}>
                                <Text style={s.monkName} numberOfLines={1}>{t_db(monk.name)}</Text>
                                <Text style={s.monkRole} numberOfLines={1}>
                                    {t_db(monk.specialization) || t_db(monk.title) || 'Үзмэрч'}
                                </Text>
                                <View style={s.ratingRow}>
                                    <Star size={13} color={COLORS.gold} fill={COLORS.gold} />
                                    <Text style={s.ratingText}>4.9</Text>
                                    <Text style={s.ratingYears}>
                                        ({monk.yearsOfExperience || 0} жил)
                                    </Text>
                                </View>
                            </View>
                            <Text style={s.monkPrice}>{formatPrice(monk)}</Text>
                        </View>
                    </Animated.View>

                    {/* ─── SERVICE SELECTION (if multiple) ─── */}
                    {monk.services && monk.services.length > 1 && (
                        <Animated.View entering={FadeInDown.delay(150).duration(500)} style={s.section}>
                            <Text style={s.sectionTitle}>Үйлчилгээ сонгох</Text>
                            {monk.services.map((service, idx) => {
                                const isActive = selectedService === service;
                                return (
                                    <Pressable
                                        key={idx}
                                        onPress={() => {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            setSelectedService(service);
                                        }}
                                        style={[s.serviceChip, isActive && s.serviceChipActive]}
                                    >
                                        <View style={{ flex: 1 }}>
                                            <Text style={[s.serviceName, isActive && { color: COLORS.gold }]}>
                                                {t_db(service.name)}
                                            </Text>
                                            <Text style={s.serviceDuration}>{service.duration} мин</Text>
                                        </View>
                                        <Text style={[s.servicePrice, isActive && { color: COLORS.gold }]}>
                                            {service.price.toLocaleString()}₮
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </Animated.View>
                    )}

                    {/* ─── DATE PICKER (horizontal 14 days) ─── */}
                    <Animated.View entering={FadeInDown.delay(200).duration(500)} style={s.section}>
                        <Text style={s.sectionTitle}>Өдөр сонгох</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
                        >
                            {days.map((day, idx) => {
                                const isActive = selectedDate.toDateString() === day.toDateString();
                                const dayNum = day.getDate();
                                const weekday = MN_WEEKDAYS[day.getDay()];
                                const isToday = idx === 0;

                                if (isActive) {
                                    return (
                                        <Pressable
                                            key={idx}
                                            onPress={() => {
                                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                setSelectedDate(day);
                                            }}
                                        >
                                            <LinearGradient
                                                colors={[COLORS.gold, COLORS.glow]}
                                                style={[s.dayCard, s.dayCardActive, SHADOWS.gold]}
                                            >
                                                <Text style={s.dayWeekdayActive}>{weekday}</Text>
                                                <Text style={s.dayNumActive}>{dayNum}</Text>
                                                {isToday && <Text style={s.todayLabelActive}>Өнөөдөр</Text>}
                                            </LinearGradient>
                                        </Pressable>
                                    );
                                }

                                return (
                                    <Pressable
                                        key={idx}
                                        onPress={() => {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            setSelectedDate(day);
                                        }}
                                        style={s.dayCard}
                                    >
                                        <Text style={s.dayWeekday}>{weekday}</Text>
                                        <Text style={s.dayNum}>{dayNum}</Text>
                                        {isToday && <Text style={s.todayLabel}>Өнөөдөр</Text>}
                                    </Pressable>
                                );
                            })}
                        </ScrollView>
                    </Animated.View>

                    {/* ─── TIME PICKER (3 column grid) ─── */}
                    <Animated.View entering={FadeInDown.delay(300).duration(500)} style={s.section}>
                        <Text style={s.sectionTitle}>Цаг сонгох</Text>
                        <View style={s.timeGrid}>
                            {TIME_SLOTS.map((time) => {
                                const isActive = selectedTime === time;
                                if (isActive) {
                                    return (
                                        <Pressable
                                            key={time}
                                            onPress={() => {
                                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                                setSelectedTime(time);
                                            }}
                                        >
                                            <LinearGradient
                                                colors={[COLORS.gold, COLORS.deepGold]}
                                                style={[s.timeSlot, SHADOWS.gold]}
                                            >
                                                <Text style={s.timeTextActive}>{time}</Text>
                                            </LinearGradient>
                                        </Pressable>
                                    );
                                }
                                return (
                                    <Pressable
                                        key={time}
                                        onPress={() => {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                            setSelectedTime(time);
                                        }}
                                        style={s.timeSlot}
                                    >
                                        <Text style={s.timeText}>{time}</Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </Animated.View>

                    {/* ─── NOTES ─── */}
                    <Animated.View entering={FadeInDown.delay(350).duration(500)} style={[s.section, { paddingHorizontal: 20 }]}>
                        <Text style={s.sectionTitle}>Нэмэлт тэмдэглэл</Text>
                        <TextInput
                            value={specialRequests}
                            onChangeText={setSpecialRequests}
                            placeholder="Асуулт, хүсэлтээ бичнэ үү..."
                            placeholderTextColor={COLORS.textLight}
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                            style={s.notesInput}
                        />
                    </Animated.View>

                    {/* ─── ORDER SUMMARY CARD ─── */}
                    {selectedTime ? (
                        <Animated.View entering={FadeInDown.delay(400).duration(500)} style={s.summaryCard}>
                            <View style={s.goldTopLine} />
                            <Text style={s.summaryTitle}>Захиалгын дүн</Text>

                            <View style={s.summaryRow}>
                                <Text style={s.summaryLabel}>Үзмэрч</Text>
                                <Text style={s.summaryValue}>{t_db(monk.name)}</Text>
                            </View>
                            <View style={s.summaryRow}>
                                <Text style={s.summaryLabel}>Огноо</Text>
                                <Text style={s.summaryValue}>{formattedDateMn}</Text>
                            </View>
                            <View style={s.summaryRow}>
                                <Text style={s.summaryLabel}>Цаг</Text>
                                <Text style={s.summaryValue}>{selectedTime}</Text>
                            </View>
                            <View style={s.summaryDivider} />
                            <View style={s.summaryRow}>
                                <Text style={s.summaryTotalLabel}>Нийт дүн</Text>
                                <Text style={s.summaryTotal}>{formatPrice(monk)}</Text>
                            </View>
                        </Animated.View>
                    ) : null}
                </ScrollView>

                {/* ─── FIXED BOTTOM: QPAY BUTTON ─── */}
                <Animated.View entering={FadeInUp.delay(600).duration(500)} style={s.bottomBar}>
                    <Pressable
                        onPress={handleBooking}
                        disabled={!selectedTime}
                        style={{ opacity: selectedTime ? 1 : 0.5 }}
                    >
                        <LinearGradient
                            colors={selectedTime ? [COLORS.gold, COLORS.deepGold] : ['#ccc', '#bbb']}
                            style={[s.qpayBtn, selectedTime ? SHADOWS.gold : {}]}
                        >
                            <Text style={s.qpayBtnText}>
                                ⚡ QPAY-Р ТӨЛЖ ЗАХИАЛАХ
                            </Text>
                        </LinearGradient>
                    </Pressable>
                </Animated.View>

            </SafeAreaView>

            {/* ═══════════════════════════════════════════
                QPAY MODAL (bottom sheet)
            ═══════════════════════════════════════════ */}
            <Modal
                visible={qpayModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => {
                    if (pollRef.current) clearInterval(pollRef.current);
                    setQpayModalVisible(false);
                }}
            >
                <View style={s.modalOverlay}>
                    <View style={s.modalSheet}>
                        {/* Handle bar */}
                        <View style={s.modalHandle} />

                        {/* Close */}
                        <Pressable
                            onPress={() => {
                                if (pollRef.current) clearInterval(pollRef.current);
                                setQpayModalVisible(false);
                            }}
                            style={s.modalCloseBtn}
                        >
                            <X size={20} color={COLORS.textMid} />
                        </Pressable>

                        {paymentSuccess ? (
                            /* ── SUCCESS STATE ── */
                            <Animated.View entering={ZoomIn.duration(400)} style={{ alignItems: 'center', paddingVertical: 40 }}>
                                <View style={s.successCircle}>
                                    <Check size={36} color={COLORS.gold} />
                                </View>
                                <Text style={[s.successTitle, { fontSize: 20, marginTop: 16 }]}>
                                    Захиалга баталгаажлаа!
                                </Text>
                            </Animated.View>
                        ) : (
                            /* ── QPAY CONTENT ── */
                            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                                <Text style={s.modalTitle}>QPay төлбөр</Text>
                                <Text style={s.modalSubtitle}>{formatPrice(monk)}</Text>

                                {/* QR Code */}
                                {qrImage ? (
                                    <View style={s.qrContainer}>
                                        <Image
                                            source={{ uri: `data:image/png;base64,${qrImage}` }}
                                            style={s.qrImage}
                                            contentFit="contain"
                                        />
                                    </View>
                                ) : (
                                    <ActivityIndicator size="large" color={COLORS.gold} style={{ marginVertical: 30 }} />
                                )}

                                {/* Bank buttons */}
                                <Text style={s.bankSectionTitle}>Банкаар төлөх</Text>
                                <View style={s.bankRow}>
                                    {BANK_LINKS.map((bank) => (
                                        <Pressable
                                            key={bank.name}
                                            onPress={() => {
                                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                Linking.openURL(bank.prefix).catch(() => {
                                                    Alert.alert('Алдаа', `${bank.name} апп суулгаагүй байна`);
                                                });
                                            }}
                                            style={[s.bankBtn, { borderColor: bank.color }]}
                                        >
                                            <Text style={[s.bankBtnText, { color: bank.color }]}>
                                                {bank.name}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </View>

                                {/* Check payment */}
                                <Pressable onPress={checkPaymentManual} disabled={paymentChecking}>
                                    <LinearGradient
                                        colors={[COLORS.gold, COLORS.deepGold]}
                                        style={[s.checkPayBtn, SHADOWS.gold]}
                                    >
                                        <Text style={s.checkPayBtnText}>
                                            {paymentChecking ? '⏳ Шалгаж байна...' : '🔄 Төлбөр шалгах'}
                                        </Text>
                                    </LinearGradient>
                                </Pressable>
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

// ═══════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════
const s = StyleSheet.create({
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    loadingText: {
        color: COLORS.gold, marginTop: 12,
        fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', fontSize: 11,
    },

    /* Header */
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 12,
    },
    backBtn: {
        width: 44, height: 44, borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.85)', borderWidth: 1, borderColor: COLORS.border,
        alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: {
        fontFamily: 'Georgia', fontSize: 18, fontWeight: '700', color: COLORS.text,
    },

    /* Monk card */
    monkCard: {
        marginHorizontal: 20, marginBottom: 16,
        backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 22,
        borderWidth: 1, borderColor: COLORS.border,
        padding: 16, overflow: 'hidden',
        ...SHADOWS.card,
    },
    goldTopLine: {
        position: 'absolute', top: 0, left: 0, right: 0,
        height: 3, backgroundColor: COLORS.gold, borderTopLeftRadius: 22, borderTopRightRadius: 22,
    },
    monkCardRow: {
        flexDirection: 'row', alignItems: 'center',
    },
    monkAvatar: {
        width: 60, height: 60, borderRadius: 20,
        borderWidth: 1.5, borderColor: COLORS.gold, backgroundColor: COLORS.goldPale,
    },
    monkInfo: { flex: 1, marginLeft: 14 },
    monkName: {
        fontFamily: 'Georgia', fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 2,
    },
    monkRole: { fontSize: 13, color: COLORS.textLight, marginBottom: 4 },
    ratingRow: { flexDirection: 'row', alignItems: 'center' },
    ratingText: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginLeft: 4 },
    ratingYears: { fontSize: 12, color: COLORS.textLight, marginLeft: 6 },
    monkPrice: {
        fontFamily: 'Georgia', fontSize: 16, fontWeight: '800', color: COLORS.gold,
    },

    /* Sections */
    section: { marginBottom: 20 },
    sectionTitle: {
        fontFamily: 'Georgia', fontSize: 16, fontWeight: '700', color: COLORS.text,
        paddingHorizontal: 20, marginBottom: 12,
    },

    /* Service chips */
    serviceChip: {
        flexDirection: 'row', alignItems: 'center', marginHorizontal: 20,
        backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 16,
        borderWidth: 1, borderColor: COLORS.border, padding: 16, marginBottom: 10,
    },
    serviceChipActive: {
        borderColor: COLORS.gold, ...SHADOWS.card,
    },
    serviceName: {
        fontFamily: 'Georgia', fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 2,
    },
    serviceDuration: { fontSize: 12, color: COLORS.textLight },
    servicePrice: {
        fontFamily: 'Georgia', fontSize: 15, fontWeight: '800', color: COLORS.textMid,
    },

    /* Day cards */
    dayCard: {
        width: 64, paddingVertical: 14, borderRadius: 16, alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.8)', borderWidth: 1, borderColor: COLORS.border,
    },
    dayCardActive: {
        borderWidth: 0,
    },
    dayWeekday: { fontSize: 11, fontWeight: '600', color: COLORS.textLight, marginBottom: 4 },
    dayNum: { fontSize: 20, fontWeight: '800', color: COLORS.text },
    todayLabel: { fontSize: 9, fontWeight: '700', color: COLORS.gold, marginTop: 4 },
    dayWeekdayActive: { fontSize: 11, fontWeight: '600', color: '#1A0800', marginBottom: 4 },
    dayNumActive: { fontSize: 20, fontWeight: '800', color: '#1A0800' },
    todayLabelActive: { fontSize: 9, fontWeight: '700', color: '#1A0800', marginTop: 4 },

    /* Time grid */
    timeGrid: {
        flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 10,
    },
    timeSlot: {
        width: (SW - 60) / 3, paddingVertical: 14, borderRadius: 14, alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.9)', borderWidth: 1, borderColor: COLORS.border,
    },
    timeText: { fontSize: 15, fontWeight: '700', color: COLORS.textMid, letterSpacing: 1 },
    timeTextActive: { fontSize: 15, fontWeight: '700', color: '#1A0800', letterSpacing: 1 },

    /* Notes */
    notesInput: {
        backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 16,
        borderWidth: 1, borderColor: COLORS.border,
        paddingHorizontal: 16, paddingVertical: 14,
        fontSize: 14, color: COLORS.text, minHeight: 100,
        fontWeight: '500', lineHeight: 22,
    },

    /* Summary card */
    summaryCard: {
        marginHorizontal: 20, marginBottom: 16,
        backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 22,
        borderWidth: 1, borderColor: COLORS.border,
        padding: 20, overflow: 'hidden',
        ...SHADOWS.card,
    },
    summaryTitle: {
        fontFamily: 'Georgia', fontSize: 16, fontWeight: '700', color: COLORS.text,
        marginBottom: 16, textAlign: 'center',
    },
    summaryRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingVertical: 8,
    },
    summaryLabel: { fontSize: 14, color: COLORS.textLight },
    summaryValue: { fontSize: 14, fontWeight: '600', color: COLORS.text },
    summaryDivider: {
        height: 1, backgroundColor: COLORS.border, marginVertical: 10,
    },
    summaryTotalLabel: {
        fontFamily: 'Georgia', fontSize: 16, fontWeight: '700', color: COLORS.text,
    },
    summaryTotal: {
        fontFamily: 'Georgia', fontSize: 20, fontWeight: '800', color: COLORS.gold,
    },

    /* Bottom bar */
    bottomBar: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: 'rgba(255,251,240,0.95)', borderTopWidth: 1,
        borderTopColor: COLORS.border, paddingHorizontal: 20,
        paddingTop: 12, paddingBottom: 34,
    },
    qpayBtn: {
        borderRadius: 18, paddingVertical: 17, alignItems: 'center',
    },
    qpayBtnText: {
        color: '#1A0800', fontWeight: '800', fontSize: 15, letterSpacing: 1,
    },

    /* Success screen */
    successCircle: {
        width: 88, height: 88, borderRadius: 44,
        backgroundColor: COLORS.goldPale, borderWidth: 2, borderColor: COLORS.gold,
        alignItems: 'center', justifyContent: 'center', marginBottom: 20,
        ...SHADOWS.gold,
    },
    successTitle: {
        fontFamily: 'Georgia', fontSize: 24, fontWeight: '800', color: COLORS.text,
        textAlign: 'center', marginBottom: 12,
    },
    successDesc: {
        fontSize: 15, color: COLORS.textMid, textAlign: 'center',
        lineHeight: 24, marginBottom: 32, maxWidth: 300,
    },
    successBtn: {
        borderRadius: 18, paddingVertical: 16, paddingHorizontal: 40, alignItems: 'center',
    },
    successBtnText: {
        color: '#1A0800', fontWeight: '800', fontSize: 14, letterSpacing: 1.5,
    },

    /* Modal */
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end',
    },
    modalSheet: {
        backgroundColor: COLORS.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28,
        paddingHorizontal: 24, paddingTop: 12, paddingBottom: 40,
        maxHeight: '85%',
    },
    modalHandle: {
        width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border,
        alignSelf: 'center', marginBottom: 16,
    },
    modalCloseBtn: {
        position: 'absolute', top: 16, right: 20, width: 36, height: 36, borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.8)', borderWidth: 1, borderColor: COLORS.border,
        alignItems: 'center', justifyContent: 'center', zIndex: 10,
    },
    modalTitle: {
        fontFamily: 'Georgia', fontSize: 20, fontWeight: '800', color: COLORS.text,
        textAlign: 'center', marginTop: 8,
    },
    modalSubtitle: {
        fontFamily: 'Georgia', fontSize: 28, fontWeight: '800', color: COLORS.gold,
        textAlign: 'center', marginTop: 4, marginBottom: 20,
    },
    qrContainer: {
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#fff', borderRadius: 20, padding: 20,
        marginHorizontal: 20, marginBottom: 24,
        borderWidth: 1, borderColor: COLORS.border,
        ...SHADOWS.card,
    },
    qrImage: { width: 200, height: 200 },
    bankSectionTitle: {
        fontFamily: 'Georgia', fontSize: 14, fontWeight: '700', color: COLORS.textMid,
        textAlign: 'center', marginBottom: 12,
    },
    bankRow: {
        flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap',
    },
    bankBtn: {
        borderRadius: 14, borderWidth: 1.5, paddingVertical: 12, paddingHorizontal: 18,
        backgroundColor: 'rgba(255,255,255,0.8)',
    },
    bankBtnText: { fontSize: 13, fontWeight: '700' },
    checkPayBtn: {
        borderRadius: 18, paddingVertical: 16, alignItems: 'center', marginTop: 4,
    },
    checkPayBtnText: {
        color: '#1A0800', fontWeight: '800', fontSize: 15, letterSpacing: 0.5,
    },
});
