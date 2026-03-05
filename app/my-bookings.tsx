import { View, Text, FlatList, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-expo';
import { Calendar, Clock, ArrowLeft, CheckCircle2, XCircle, RotateCcw, MessageCircle, Video } from 'lucide-react-native';
import api from '../lib/api';
import { useTranslation } from 'react-i18next';
import { useUserStore } from '../store/userStore';
import * as Haptics from 'expo-haptics';
import { useIsAuthenticated } from '../hooks/useIsAuthenticated';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNavigationState } from '@react-navigation/native';
import { GlassContainer } from '../src/components/ui/GlassContainer';

interface Booking {
    _id: string;
    monkId?: string;
    monkName?: string;
    clientName?: string;
    date: string;
    time?: string;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected';
    serviceName?: any;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
    pending: { label: 'Pending', color: '#D4AF37', icon: Clock },
    confirmed: { label: 'Confirmed', color: '#10B981', icon: CheckCircle2 },
    completed: { label: 'Completed', color: '#A89F91', icon: CheckCircle2 },
    cancelled: { label: 'Cancelled', color: '#EF4444', icon: XCircle },
    rejected: { label: 'Rejected', color: '#EF4444', icon: XCircle },
};

export default function MyBookingsScreen() {
    try {
        useNavigationState(state => state);
    } catch {
        return (
            <View className="flex-1 bg-[#FDFBF7] items-center justify-center">
                <ActivityIndicator size="large" color="#D4AF37" />
            </View>
        );
    }

    return <MyBookingsContent />;
}

function MyBookingsContent() {
    const router = useRouter();
    const { isSignedIn } = useAuth();
    const isAuthenticated = useIsAuthenticated();
    const { user: dbUser } = useUserStore();
    const [refreshing, setRefreshing] = useState(false);
    const { i18n } = useTranslation();
    const lang = i18n.language === 'mn' ? 'mn' : 'en';

    const t_db = (data: any) => {
        if (!data) return '';
        if (typeof data === 'string') return data;
        return data[lang] || data.en || data.mn || '';
    };

    const userId = dbUser?._id?.toString() || dbUser?.clerkId;
    const isMonk = dbUser?.role === 'monk';

    const { data: bookings, isLoading, refetch } = useQuery({
        queryKey: ['bookings', userId, isMonk],
        queryFn: async () => {
            if (!userId) return [];
            // Monks see bookings clients made WITH them; users see bookings they made
            const param = isMonk ? `monkId=${userId}` : `userId=${userId}`;
            const res = await api.get(`/bookings?${param}`);
            const data = Array.isArray(res.data) ? res.data : (res.data?.bookings || []);
            // Sort newest first
            return data.sort((a: Booking, b: Booking) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
            );
        },
        enabled: !!userId && isAuthenticated,
    });

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    }, [refetch]);

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString(lang === 'mn' ? 'mn-MN' : 'en-US', {
            weekday: 'short', month: 'short', day: 'numeric'
        });
    };

    if (!isAuthenticated) {
        return (
            <View className="flex-1 bg-[#FDFBF7]">
                <Stack.Screen options={{ headerShown: false }} />
                <SafeAreaView edges={['top']} className="flex-1 items-center justify-center px-6">
                    <Text className="text-[#291E14] text-xl font-serif font-bold mb-4 tracking-tight">
                        {lang === 'mn' ? 'Нэвтрэх шаардлагатай' : 'Sign in required'}
                    </Text>
                    <TouchableOpacity
                        onPress={() => router.push('/(auth)/sign-in')}
                        className="bg-[#D4AF37] rounded-full px-8 py-4 shadow-lg border border-[#D4AF37]"
                        style={{ shadowColor: '#D4AF37', shadowRadius: 15, shadowOpacity: 0.2 }}
                    >
                        <Text className="text-[#FDFBF7] font-bold uppercase tracking-widest text-xs">
                            {lang === 'mn' ? 'Нэвтрэх' : 'Sign In'}
                        </Text>
                    </TouchableOpacity>
                </SafeAreaView>
            </View>
        );
    }

    const renderBooking = ({ item, index }: { item: Booking; index: number }) => {
        const config = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
        const StatusIcon = config.icon;

        return (
            <Animated.View entering={FadeInDown.delay(index * 80).duration(400)}>
                <GlassContainer className="rounded-3xl p-5 mb-4 border border-white bg-white/60 shadow-sm backdrop-blur-xl" style={{ shadowColor: '#D4AF37', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 }}>
                    <View className="flex-row items-center justify-between mb-3">
                        <View className="flex-1 pr-2">
                            <Text className="text-[#291E14] font-serif font-bold text-lg tracking-tight" numberOfLines={1}>
                                {isMonk ? (item.clientName || 'Client') : (item.monkName || 'Booking')}
                            </Text>
                            {item.serviceName && (
                                <Text className="text-[#544636] text-xs mt-0.5 tracking-wide font-medium" numberOfLines={1}>
                                    {t_db(item.serviceName)}
                                </Text>
                            )}
                        </View>
                        <View className="flex-row items-center px-3 py-1.5 rounded-full border" style={{ backgroundColor: `${config.color}10`, borderColor: `${config.color}30` }}>
                            <StatusIcon size={12} color={config.color} />
                            <Text className="ml-1.5 text-[10px] font-bold uppercase tracking-[2px]" style={{ color: config.color }}>
                                {config.label}
                            </Text>
                        </View>
                    </View>

                    <View className="h-[1px] bg-[#E8E0D5]/50 w-full mb-3" />

                    <View className="flex-row items-center gap-6">
                        <View className="flex-row items-center">
                            <View className="w-6 h-6 rounded-full bg-[#FFF9E6] border border-[#D4AF37]/20 items-center justify-center mr-2">
                                <Calendar size={12} color="#D4AF37" />
                            </View>
                            <Text className="text-[#544636] text-xs font-bold tracking-wide">
                                {formatDate(item.date)}
                            </Text>
                        </View>
                        {item.time && (
                            <View className="flex-row items-center">
                                <View className="w-6 h-6 rounded-full bg-[#FFF9E6] border border-[#D4AF37]/20 items-center justify-center mr-2">
                                    <Clock size={12} color="#D4AF37" />
                                </View>
                                <Text className="text-[#544636] text-xs font-bold tracking-[1px]">
                                    {item.time}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Chat & Call buttons for confirmed bookings */}
                    {item.status === 'confirmed' && (
                        <View className="flex-row gap-3 mt-3 pt-3 border-t border-[#E8E0D5]/50">
                            <TouchableOpacity
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    router.push(`/chat/${item._id}`);
                                }}
                                activeOpacity={0.9}
                                className="flex-1 flex-row items-center justify-center gap-2 bg-[#FFF9E6] rounded-2xl py-3.5 border border-[#D4AF37]/20"
                            >
                                <MessageCircle size={16} color="#D4AF37" />
                                <Text className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest">
                                    {lang === 'mn' ? 'Чат' : 'Chat'}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                    router.push(`/live-session/${item._id}`);
                                }}
                                activeOpacity={0.9}
                                className="flex-1 flex-row items-center justify-center gap-2 bg-[#D4AF37] rounded-2xl py-3.5 shadow-lg"
                                style={{ shadowColor: '#D4AF37', shadowRadius: 10, shadowOpacity: 0.2 }}
                            >
                                <Video size={16} color="#FDFBF7" />
                                <Text className="text-xs font-bold text-[#FDFBF7] uppercase tracking-widest">
                                    {lang === 'mn' ? 'Дуудлага' : 'Call'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </GlassContainer>
            </Animated.View>
        );
    };

    return (
        <View className="flex-1 bg-[#FDFBF7]">
            <Stack.Screen options={{ headerShown: false }} />

            {/* Premium Header */}
            <SafeAreaView edges={['top']} className="bg-[#FDFBF7] z-10 pb-4 shadow-sm" style={{ shadowColor: '#D4AF37', shadowOpacity: 0.05, shadowRadius: 10 }}>
                <View className="px-6 py-4 flex-row items-center border-b border-[#E8E0D5]/50">
                    <TouchableOpacity
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            router.back();
                        }}
                        className="w-10 h-10 bg-white/80 rounded-full items-center justify-center border border-[#E8E0D5] shadow-sm backdrop-blur-3xl"
                    >
                        <ArrowLeft size={20} color="#291E14" />
                    </TouchableOpacity>
                    <Text className="text-2xl font-serif font-bold text-[#291E14] ml-5 tracking-tight flex-1">
                        {lang === 'mn' ? 'Миний захиалгууд' : 'My Bookings'}
                    </Text>
                </View>
            </SafeAreaView>

            {isLoading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#D4AF37" />
                </View>
            ) : !bookings || bookings.length === 0 ? (
                <View className="flex-1 items-center justify-center px-6">
                    <View className="w-24 h-24 rounded-full bg-[#FFF9E6] border border-[#D4AF37]/20 items-center justify-center mb-6 shadow-sm">
                        <RotateCcw size={40} color="#D4AF37" opacity={0.5} />
                    </View>
                    <Text className="text-[#544636] text-center font-serif text-lg tracking-wide">
                        {lang === 'mn' ? 'Захиалга байхгүй' : 'The path is empty'}
                    </Text>
                    <Text className="text-[#A89F91] text-center mt-2 text-sm max-w-[200px]">
                        {lang === 'mn' ? 'Одоогоор ямар нэгэн захиалга алга байна.' : 'You have no confirmed spiritual sessions yet.'}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={bookings}
                    keyExtractor={(item) => item._id}
                    renderItem={renderBooking}
                    contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#D4AF37"
                        />
                    }
                />
            )}
        </View>
    );
}
