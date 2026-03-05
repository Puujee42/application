import { View, Text, ScrollView, Pressable, TextInput, ActivityIndicator, Platform, TouchableOpacity, Dimensions } from 'react-native';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth, useUser } from '@clerk/clerk-expo';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { Calendar, Clock, Check, ArrowLeft, Star, Sparkles } from 'lucide-react-native';
import api from '../../lib/api';
import { useTranslation } from 'react-i18next';
import { useUserStore } from '../../store/userStore';
import { useIsAuthenticated } from '../../hooks/useIsAuthenticated';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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
    image?: string;
    imageUrl?: string;
    specialization?: any;
    services?: Service[];
}

const TIME_SLOTS = [
    '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00',
    '17:00', '18:00', '19:00', '20:00'
];

export default function MonkBookingScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { isSignedIn } = useAuth();
    const { user: clerkUser } = useUser();
    const { user: dbUser } = useUserStore();
    const isAuthenticated = useIsAuthenticated();
    const { i18n } = useTranslation();

    const t_db = (data: any) => {
        if (!data) return '';
        if (typeof data === 'string') return data;
        return data[i18n.language] || data.en || data.mn || '';
    };

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedTime, setSelectedTime] = useState<string>('');
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [specialRequests, setSpecialRequests] = useState('');
    const [bookingSuccess, setBookingSuccess] = useState(false);
    const [serviceAutoSelected, setServiceAutoSelected] = useState(false);

    const { data: monk, isLoading } = useQuery({
        queryKey: ['monk', id],
        queryFn: async () => {
            const res = await api.get(`/monks/${id}`);
            return res.data as Monk;
        },
    });

    // Auto-select service when monk has only 1 service
    useEffect(() => {
        if (monk?.services && monk.services.length === 1 && !selectedService) {
            setSelectedService(monk.services[0]);
            setServiceAutoSelected(true);
        }
    }, [monk]);

    const bookingMutation = useMutation({
        mutationFn: async (bookingData: any) => {
            const res = await api.post('/bookings', bookingData);
            return res.data;
        },
        onSuccess: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setBookingSuccess(true);
        },
        onError: (error: any) => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            alert(error.response?.data?.message || 'Booking failed. Please try again.');
        },
    });

    const handleDateChange = useCallback((event: any, date?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (date) {
            setSelectedDate(date);
        }
    }, []);

    const handleTimeSelect = useCallback((time: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setSelectedTime(time);
    }, []);

    const handleServiceSelect = useCallback((service: Service) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedService(service);
    }, []);

    const handleBooking = useCallback(async () => {
        if (!selectedTime) {
            alert('Please select a time slot');
            return;
        }

        if (!isAuthenticated) {
            router.push('/(auth)/sign-in');
            return;
        }

        const userName = dbUser?.firstName
            ? `${dbUser.firstName} ${dbUser.lastName || ''}`.trim()
            : clerkUser?.fullName || 'Seeker';
        const userEmail = dbUser?.email || clerkUser?.primaryEmailAddress?.emailAddress || '';
        const userPhone = dbUser?.phone || clerkUser?.primaryPhoneNumber?.phoneNumber || '';

        const bookingData = {
            monkId: id,
            date: selectedDate.toISOString().split('T')[0],
            time: selectedTime,
            serviceId: selectedService?._id || selectedService?.id,
            userName,
            userEmail,
            userPhone,
            note: specialRequests || undefined,
        };

        bookingMutation.mutate(bookingData);
    }, [id, selectedDate, selectedTime, selectedService, specialRequests, isSignedIn, bookingMutation, router]);

    const formattedDate = useMemo(() => {
        return selectedDate.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    }, [selectedDate]);

    if (isLoading) {
        return (
            <View className="flex-1 bg-[#FDFBF7] items-center justify-center">
                <Stack.Screen options={{ headerShown: false }} />
                <ActivityIndicator size="large" color="#D4AF37" />
                <Text className="text-[#D4AF37] mt-4 font-bold tracking-widest uppercase text-xs">
                    Summoning...
                </Text>
            </View>
        );
    }

    if (!monk) {
        return (
            <View className="flex-1 bg-[#FDFBF7] items-center justify-center">
                <Stack.Screen options={{ headerShown: false }} />
                <Text className="text-[#D4AF37]">Mentor not found</Text>
            </View>
        );
    }

    if (bookingSuccess) {
        return (
            <View className="flex-1 bg-[#FDFBF7] items-center justify-center px-6">
                <Stack.Screen options={{ headerShown: false }} />
                <Animated.View entering={FadeInDown.duration(600)} className="items-center">
                    <View className="w-24 h-24 bg-[#FFF9E6] rounded-full items-center justify-center mb-8 border border-[#D4AF37]/30 shadow-2xl" style={{ shadowColor: '#D4AF37', shadowRadius: 30, shadowOpacity: 0.2 }}>
                        <Check size={40} color="#D4AF37" />
                    </View>
                    <Text className="text-4xl font-serif font-bold text-[#291E14] mb-4 text-center tracking-tight">
                        Sanctuary Secured
                    </Text>
                    <Text className="text-[#544636] text-center mb-12 text-lg leading-8 opacity-90 max-w-[300px]">
                        Your guidance session with <Text className="text-[#D4AF37] font-bold">{t_db(monk.name)}</Text> has been booked for {formattedDate} at {selectedTime}.
                    </Text>

                    <TouchableOpacity
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            router.push('/my-bookings');
                        }}
                        activeOpacity={0.9}
                        className="bg-[#D4AF37] rounded-full py-5 w-full shadow-lg border border-[#D4AF37] mb-4"
                        style={{ shadowColor: '#D4AF37', shadowRadius: 15, shadowOpacity: 0.2 }}
                    >
                        <Text className="text-[#FDFBF7] text-center font-bold text-base tracking-widest uppercase">
                            View Bookings
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => router.push('/(tabs)')}
                        className="py-4"
                    >
                        <Text className="text-[#A89F91] text-center font-bold tracking-widest uppercase text-xs hover:text-[#291E14]">
                            Return Home
                        </Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-[#FDFBF7]">
            <Stack.Screen options={{ headerShown: false }} />

            {/* Immersive Parallax Header Element */}
            <View style={{ height: SCREEN_HEIGHT * 0.35, width: '100%', position: 'absolute', top: 0, backgroundColor: '#FFF9E6' }}>
                <Image
                    source={{ uri: monk.image || monk.imageUrl || 'https://via.placeholder.com/400' }}
                    style={{ width: '100%', height: '100%', opacity: 0.8 }}
                    contentFit="cover"
                />
                <View className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#FDFBF7] via-[#FDFBF7]/90 to-transparent" />

                <SafeAreaView edges={['top']}>
                    <TouchableOpacity
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            router.back();
                        }}
                        className="ml-6 mt-2 w-12 h-12 bg-white/60 rounded-full items-center justify-center border border-white backdrop-blur-3xl shadow-sm"
                    >
                        <ArrowLeft size={24} color="#291E14" />
                    </TouchableOpacity>
                </SafeAreaView>
            </View>

            {/* Bottom-Sheet Style Container */}
            <View className="flex-1 bg-[#FDFBF7] rounded-t-[40px] mt-[25%]" style={{ shadowColor: '#D4AF37', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.1, shadowRadius: 30, elevation: 20 }}>
                <View className="items-center mt-4 mb-2">
                    <View className="w-12 h-1.5 bg-[#E8E0D5] rounded-full" />
                </View>

                <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 150 }} showsVerticalScrollIndicator={false}>

                    {/* Monk Info Header */}
                    <Animated.View entering={FadeInDown.delay(100).duration(600)} className="px-8 pb-8 pt-4 border-b border-[#E8E0D5]/50 items-center">
                        <View className="bg-[#D4AF37]/10 px-4 py-1.5 rounded-full border border-[#D4AF37]/20 mb-4 shadow-sm">
                            <Text className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-[3px]">
                                {t_db(monk.specialization) || 'Master Guide'}
                            </Text>
                        </View>
                        <Text className="text-4xl font-serif font-bold text-[#291E14] tracking-tight text-center mb-2 shadow-sm" style={{ textShadowColor: 'rgba(212, 175, 55, 0.1)', textShadowRadius: 10 }}>
                            {t_db(monk.name)}
                        </Text>
                        <View className="flex-row items-center justify-center gap-1 opacity-80">
                            {[1, 2, 3, 4, 5].map(star => (
                                <Star key={star} size={14} color="#D4AF37" fill="#D4AF37" />
                            ))}
                            <Text className="text-xs font-bold text-[#291E14] ml-2 tracking-widest">5.0</Text>
                        </View>
                    </Animated.View>

                    {/* Service Selection — only show if multiple services */}
                    {monk.services && monk.services.length > 1 && (
                        <Animated.View entering={FadeInDown.delay(200).duration(600)} className="px-6 pt-8 pb-4 border-b border-[#E8E0D5]/50">
                            <Text className="text-xs uppercase tracking-[3px] font-bold text-[#D4AF37] mb-4 ml-2">
                                01. The Path (Service)
                            </Text>
                            {monk.services.map((service, index) => (
                                <Pressable
                                    key={index}
                                    onPress={() => handleServiceSelect(service)}
                                    className={`flex-row items-center justify-between rounded-[24px] px-6 py-5 mb-4 border transition-colors shadow-sm backdrop-blur-xl ${selectedService === service
                                        ? 'bg-white/80 border-[#D4AF37]/50'
                                        : 'bg-white/40 border-white/60'
                                        }`}
                                    style={selectedService === service ? { shadowColor: '#D4AF37', shadowRadius: 15, shadowOpacity: 0.1, elevation: 5 } : {}}
                                >
                                    <View className="flex-1 pr-4">
                                        <Text className={`font-serif font-bold text-xl mb-1 ${selectedService === service ? 'text-[#D4AF37]' : 'text-[#291E14]'}`}>
                                            {t_db(service.name)}
                                        </Text>
                                        <View className="flex-row items-center opacity-80">
                                            <Clock size={12} color={selectedService === service ? '#D4AF37' : '#A89F91'} />
                                            <Text className={`ml-1.5 text-xs font-bold uppercase tracking-widest ${selectedService === service ? 'text-[#544636]' : 'text-[#A89F91]'}`}>
                                                {service.duration} min session
                                            </Text>
                                        </View>
                                    </View>
                                    <View className={`px-4 py-2 rounded-full border ${selectedService === service ? 'bg-[#D4AF37]/10 border-[#D4AF37]/30' : 'bg-[#FDFBF7] border-[#E8E0D5]'}`}>
                                        <Text className={`font-bold text-lg ${selectedService === service ? 'text-[#D4AF37]' : 'text-[#291E14]'}`}>
                                            ${service.price}
                                        </Text>
                                    </View>
                                </Pressable>
                            ))}
                        </Animated.View>
                    )}

                    {/* Date Selection */}
                    <Animated.View entering={FadeInDown.delay(300).duration(600)} className="px-6 py-8 border-b border-[#E8E0D5]/50">
                        <Text className="text-xs uppercase tracking-[3px] font-bold text-[#D4AF37] mb-4 ml-2">
                            {serviceAutoSelected ? '01' : '02'}. The Alignment (Date)
                        </Text>
                        <Pressable
                            onPress={() => setShowDatePicker(true)}
                            className="flex-row items-center bg-white/60 rounded-[24px] px-6 py-5 border border-white shadow-sm backdrop-blur-xl"
                        >
                            <View className="w-10 h-10 rounded-full bg-[#FFF9E6] border border-[#D4AF37]/20 items-center justify-center mr-4">
                                <Calendar size={20} color="#D4AF37" />
                            </View>
                            <View>
                                <Text className="text-[#A89F91] text-[10px] uppercase font-bold tracking-widest mb-0.5">Selected Date</Text>
                                <Text className="text-[#291E14] font-serif font-bold text-xl">
                                    {formattedDate}
                                </Text>
                            </View>
                        </Pressable>

                        {showDatePicker && (
                            <DateTimePicker
                                value={selectedDate}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={handleDateChange}
                                minimumDate={new Date()}
                            />
                        )}
                    </Animated.View>

                    {/* Time Slot Selection */}
                    <Animated.View entering={FadeInDown.delay(400).duration(600)} className="px-6 py-8 border-b border-[#E8E0D5]/50">
                        <Text className="text-xs uppercase tracking-[3px] font-bold text-[#D4AF37] mb-4 ml-2">
                            {serviceAutoSelected ? '02' : '03'}. The Moment (Time)
                        </Text>
                        <View className="flex-row flex-wrap gap-3">
                            {TIME_SLOTS.map((time) => (
                                <Pressable
                                    key={time}
                                    onPress={() => handleTimeSelect(time)}
                                    className={`px-6 py-4 rounded-[20px] border shadow-sm backdrop-blur-xl ${selectedTime === time
                                        ? 'bg-white/80 border-[#D4AF37]/50'
                                        : 'bg-white/40 border-white/60'
                                        }`}
                                    style={selectedTime === time ? { shadowColor: '#D4AF37', shadowRadius: 10, shadowOpacity: 0.1, elevation: 4 } : {}}
                                >
                                    <Text
                                        className={`text-center font-bold tracking-[2px] text-sm ${selectedTime === time ? 'text-[#D4AF37]' : 'text-[#544636]'
                                            }`}
                                    >
                                        {time}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </Animated.View>

                    {/* Special Requests */}
                    <Animated.View entering={FadeInDown.delay(500).duration(600)} className="px-6 py-8">
                        <Text className="text-xs uppercase tracking-[3px] font-bold text-[#D4AF37] mb-4 ml-2">
                            {serviceAutoSelected ? '03' : '04'}. The Intention (Notes)
                        </Text>
                        <TextInput
                            value={specialRequests}
                            onChangeText={setSpecialRequests}
                            placeholder="Share your spiritual intentions, questions, or concerns..."
                            placeholderTextColor="#A89F91"
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                            className="bg-white/60 border border-white backdrop-blur-xl rounded-[24px] px-6 py-6 text-[#291E14] shadow-sm text-base leading-6"
                            style={{ minHeight: 140 }}
                        />
                    </Animated.View>
                </ScrollView>

                {/* Fixed Glassmorphic Book Button Container */}
                <Animated.View entering={FadeInUp.delay(800).duration(600)} className="absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-3xl border-t border-[#E8E0D5]/50 px-6 py-4 pb-8">
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={handleBooking}
                        disabled={!selectedTime || bookingMutation.isPending}
                        className={`rounded-[24px] py-5 flex-row justify-center items-center shadow-lg border ${selectedTime && !bookingMutation.isPending
                            ? 'bg-[#D4AF37] border-[#D4AF37]'
                            : 'bg-[#E8E0D5] border-[#E8E0D5] shadow-none'
                            }`}
                        style={selectedTime && !bookingMutation.isPending ? { shadowColor: '#D4AF37', shadowRadius: 20, shadowOpacity: 0.3 } : {}}
                    >
                        <Text className={`text-center font-bold tracking-widest text-sm uppercase ${selectedTime && !bookingMutation.isPending ? 'text-[#FDFBF7]' : 'text-[#A89F91]'}`}>
                            {bookingMutation.isPending ? 'Securing Sanctuary...' : 'Confirm Ceremony'}
                        </Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </View>
    );
}
