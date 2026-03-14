import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, RefreshControl, Platform, FlatList, Animated as RNAnimated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react-native';
import api from '../lib/api';
import { useUserStore } from '../store/userStore';
import * as Haptics from 'expo-haptics';
import { useIsAuthenticated } from '../hooks/useIsAuthenticated';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import TouchableScale from '../components/ui/TouchableScale';
import { COLORS, SHADOWS, FONT } from '../design-system/theme';

interface Booking {
    _id: string;
    monkId?: string;
    monkName?: string;
    clientName?: string;
    userName?: string;
    date: string;
    time?: string;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected';
    serviceName?: any;
    amount?: number;
    price?: number;
}

function SkeletonCard() {
    const pulse = useRef(new RNAnimated.Value(0.35)).current;

    useEffect(() => {
        RNAnimated.loop(
            RNAnimated.sequence([
                RNAnimated.timing(pulse, { toValue: 0.75, duration: 900, useNativeDriver: true }),
                RNAnimated.timing(pulse, { toValue: 0.35, duration: 900, useNativeDriver: true })
            ])
        ).start();
    }, [pulse]);

    return (
        <RNAnimated.View style={[st.card, { opacity: pulse, paddingVertical: 24 }]}>
            <View style={{ width: '60%', height: 16, backgroundColor: COLORS.goldPale, borderRadius: 8, marginBottom: 12 }} />
            <View style={{ width: '40%', height: 12, backgroundColor: COLORS.goldPale, borderRadius: 6, marginBottom: 16 }} />
            <View style={{ width: '80%', height: 12, backgroundColor: COLORS.goldPale, borderRadius: 6 }} />
        </RNAnimated.View>
    );
}

export default function PaymentHistoryScreen() {
    const router = useRouter();
    const isAuthenticated = useIsAuthenticated();
    const { user: dbUser } = useUserStore();
    const [refreshing, setRefreshing] = useState(false);

    const userId = dbUser?._id?.toString() || dbUser?.clerkId;
    // Don't show this to monks as they have the dashboard
    const isMonk = dbUser?.role === 'monk';

    // Fetch monks to determine their rates
    const { data: monks = [] } = useQuery({
        queryKey: ['monks'],
        queryFn: async () => {
            const res = await api.get('/monks');
            return Array.isArray(res.data) ? res.data : (res.data?.monks || []);
        },
        enabled: isAuthenticated && !isMonk,
    });

    const { data: payHistory, isLoading, error, refetch } = useQuery({
        queryKey: ['payment-history', userId, monks.length], // Re-run when monks load
        queryFn: async () => {
            if (!userId || isMonk) return { bookings: [], totalCount: 0, totalSpent: 0 };
            
            const res = await api.get(`/bookings?userId=${userId}`);
            const allBookings = Array.isArray(res.data) ? res.data : (res.data?.bookings || []);
            
            // Only show confirmed and completed bookings for payment history
            const paidBookings = allBookings
                .filter((b: Booking) => b.status === 'confirmed' || b.status === 'completed')
                .sort((a: Booking, b: Booking) => new Date(b.date).getTime() - new Date(a.date).getTime());
                
            const totalSpent = paidBookings.reduce((sum: number, b: Booking) => {
                // Determine rate based on the monk assigned to this booking
                let rate = 50000; // Default rate
                if (b.monkId) {
                    const monk = monks.find((m: any) => m._id === b.monkId || m.id === b.monkId);
                    if (monk && monk.isSpecial === true) {
                        rate = 88800; // Special monk rate
                    } else if (!monk && (b.amount || b.price)) {
                        let fallbackAmount = b.amount || b.price || 50000;
                        rate = fallbackAmount === 40000 ? 50000 : fallbackAmount;
                    }
                } else if (b.amount || b.price) {
                    let fallbackAmount = b.amount || b.price || 50000;
                    rate = fallbackAmount === 40000 ? 50000 : fallbackAmount;
                }
                
                return sum + rate;
            }, 0);
            
            return {
                bookings: paidBookings,
                totalCount: paidBookings.length,
                totalSpent
            };
        },
        enabled: !!userId && isAuthenticated && !isMonk && !!monks,
    });

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    }, [refetch]);

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return `${d.getFullYear()} оны ${d.getMonth() + 1}-р сарын ${d.getDate()}`;
    };

    if (!isAuthenticated || isMonk) {
        return (
            <View style={st.container}>
                <Stack.Screen options={{ headerShown: false }} />
                <SafeAreaView edges={['top']} style={st.center}>
                    <Text style={st.unauthText}>Нэвтрэх шаардлагатай</Text>
                    <TouchableScale onPress={() => router.push('/(auth)/sign-in')} >
                        <LinearGradient colors={[COLORS.goldBright, COLORS.gold, COLORS.amber]} style={[st.primaryBtn, SHADOWS.glow]}>
                            <Text style={st.primaryBtnText}>НЭВТРЭХ</Text>
                        </LinearGradient>
                    </TouchableScale>
                </SafeAreaView>
            </View>
        );
    }

    const renderBooking = ({ item, index }: { item: Booking; index: number }) => {
        const displayName = item.monkName || 'Үзмэрч';
        const serviceName = item.serviceName?.mn || item.serviceName?.en || item.serviceName || 'Үйлчилгээ';
        
        // Calculate amount for display
        let amount = 50000;
        if (item.monkId) {
            const monk = monks.find((m: any) => m._id === item.monkId || m.id === item.monkId);
            if (monk && monk.isSpecial === true) {
                amount = 88800;
            } else if (!monk && (item.amount || item.price)) {
                let fallbackAmount = item.amount || item.price || 50000;
                amount = fallbackAmount === 40000 ? 50000 : fallbackAmount;
            }
        } else if (item.amount || item.price) {
            let fallbackAmount = item.amount || item.price || 50000;
            amount = fallbackAmount === 40000 ? 50000 : fallbackAmount;
        }

        return (
            <Animated.View entering={FadeInDown.delay(Math.min(index * 80, 320)).duration(400)}>
                <View style={st.card}>
                    <View style={st.cardHeader}>
                        <View style={{ flex: 1 }}>
                            <Text style={st.cardTitle} numberOfLines={1}>{displayName}</Text>
                            <Text style={st.cardSub}>{serviceName}</Text>
                        </View>
                        <View style={[st.statusBadge, { backgroundColor: '#D1FAE5' }]}>
                            <Text style={[st.statusText, { color: '#065F46' }]}>Төлөгдсөн</Text>
                        </View>
                    </View>

                    <View style={st.divider} />

                    <View style={st.cardBody}>
                        <View style={{ flex: 1 }}>
                            <Text style={st.dateText}>{formatDate(item.date)} {item.time ? `• ${item.time} цаг` : ''}</Text>
                        </View>
                        <Text style={st.priceText}>
                            {amount.toLocaleString()}₮
                        </Text>
                    </View>
                </View>
            </Animated.View>
        );
    };

    return (
        <View style={st.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <SafeAreaView edges={['top']} style={{ flex: 1 }}>
                <View style={st.header}>
                    <TouchableScale
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            router.back();
                        }}
                        style={st.backBtn}
                    >
                        <ArrowLeft size={22} color={COLORS.text} />
                    </TouchableScale>
                    <Text style={st.headerTitle}>
                        Төлбөрийн түүх
                    </Text>
                    <View style={{ width: 38 }} />
                </View>

                {error && (
                    <View style={st.errorBlock}>
                        <Text style={st.errorText}>⚠️ Мэдээлэл ачаалж чадсангүй</Text>
                        <TouchableScale onPress={() => refetch()} >
                            <Text style={st.errorAction}>Дахин оролдох</Text>
                        </TouchableScale>
                    </View>
                )}

                {isLoading ? (
                    <View style={{ padding: 20 }}>
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                    </View>
                ) : !payHistory || payHistory.bookings.length === 0 ? (
                    <View style={st.emptyState}>
                        <Text style={st.emptyEmoji}>💳</Text>
                        <Text style={st.emptyTitle}>Төлбөрийн түүх алга</Text>
                        <Text style={st.emptySub}>Та одоогоор захиалга баталгаажуулж төлбөр төлөөгүй байна</Text>
                    </View>
                ) : (
                    <>
                        <Animated.View entering={FadeInDown.duration(400)} style={st.summaryCard}>
                            <Text style={st.summaryLabel}>Нийт зарцуулалт</Text>
                            <Text style={st.summaryAmount}>{payHistory.totalSpent.toLocaleString()}₮</Text>
                            <Text style={st.summarySubtitle}>{payHistory.totalCount} удаагийн амжилттай захиалга</Text>
                        </Animated.View>
                        <FlatList
                            data={payHistory.bookings}
                            keyExtractor={(item) => item._id}
                            renderItem={renderBooking}
                            contentContainerStyle={st.listContent}
                            showsVerticalScrollIndicator={false}
                            refreshControl={
                                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.gold} />
                            }
                        />
                    </>
                )}
            </SafeAreaView>
        </View>
    );
}

const st = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 12,
        borderBottomWidth: 1, borderBottomColor: COLORS.divider,
        backgroundColor: COLORS.bg,
    },
    backBtn: {
        width: 38, height: 38, borderRadius: 12,
        backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
        alignItems: 'center', justifyContent: 'center',
        ...SHADOWS.sm,
    },
    headerTitle: { fontFamily: FONT.display, fontSize: 20, fontWeight: '700', color: COLORS.text },

    unauthText: { fontFamily: FONT.display, fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 20 },
    primaryBtn: { borderRadius: 16, paddingVertical: 15, paddingHorizontal: 32, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' },
    primaryBtnText: { color: '#1C0E00', fontWeight: '800', fontSize: 15, letterSpacing: 0.5, fontFamily: FONT.display },

    summaryCard: {
        margin: 20, padding: 24, borderRadius: 24,
        backgroundColor: COLORS.surface,
        borderWidth: 1.5, borderColor: COLORS.goldBright,
        alignItems: 'center', ...SHADOWS.md,
    },
    summaryLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textSub, marginBottom: 8, letterSpacing: 0.5, textTransform: 'uppercase' },
    summaryAmount: { fontFamily: FONT.display, fontSize: 36, fontWeight: '800', color: COLORS.gold, marginBottom: 4 },
    summarySubtitle: { fontSize: 13, color: COLORS.textMute },

    listContent: { paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 116 : 96 },

    card: {
        backgroundColor: COLORS.surface, borderRadius: 20,
        borderWidth: 1, borderColor: COLORS.border, padding: 18, marginBottom: 14, overflow: 'hidden',
        ...SHADOWS.md, elevation: 2,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    cardTitle: { fontFamily: FONT.display, fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
    cardSub: { fontSize: 13, color: COLORS.textSub },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 4 },
    statusText: { fontSize: 11, fontWeight: '700' },

    divider: { height: 1, backgroundColor: COLORS.divider, marginVertical: 14 },

    cardBody: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    dateText: { fontSize: 13, color: COLORS.textMute },
    priceText: { fontFamily: FONT.display, fontSize: 16, fontWeight: '800', color: COLORS.text },

    emptyState: { paddingVertical: 72, alignItems: 'center' },
    emptyEmoji: { fontSize: 56, marginBottom: 18 },
    emptyTitle: { fontFamily: FONT.display, fontSize: 17, fontWeight: '600', color: COLORS.textSub },
    emptySub: { fontSize: 13, color: COLORS.textMute, textAlign: 'center', marginTop: 6, lineHeight: 20 },

    errorBlock: {
        backgroundColor: 'rgba(220,38,38,0.06)', borderRadius: 16,
        borderWidth: 1, borderColor: 'rgba(220,38,38,0.15)',
        padding: 16, margin: 16, alignItems: 'center'
    },
    errorText: { color: '#DC2626', fontSize: 14, fontWeight: '600', marginBottom: 8 },
    errorAction: { color: COLORS.gold, fontWeight: '700' },
});
