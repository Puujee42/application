import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, RefreshControl, ActivityIndicator, Platform, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Bell } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, withRepeat, withSequence, withTiming, useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { useUserStore } from '../store/userStore';
import api from '../lib/api';
import TouchableScale from '../components/ui/TouchableScale';
import { COLORS, SHADOWS } from '../design-system/theme';

const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';

function SkeletonRect({ width, height, style }: any) {
    const pulse = useSharedValue(0.4);
    pulse.value = withRepeat(withSequence(withTiming(0.75, { duration: 800 }), withTiming(0.4, { duration: 800 })), -1, true);

    const animatedStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

    return (
        <Animated.View style={[{ width, height, backgroundColor: COLORS.goldPale, borderRadius: 8 }, animatedStyle, style]} />
    );
}

export default function MonkDashboard() {
    const router = useRouter();
    const { user: dbUser } = useUserStore();
    const [refreshing, setRefreshing] = useState(false);

    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        return { label: `${d.getMonth() + 1}-р сар`, value: d.getMonth(), year: d.getFullYear() };
    });

    const [selectedMonth, setSelectedMonth] = useState(months[0]);

    if (dbUser?.role !== 'monk') {
        router.replace('/(tabs)');
        return null;
    }

    const { data: bookings, isLoading, error, refetch } = useQuery({
        queryKey: ['monk-dashboard', dbUser?._id],
        queryFn: async () => {
            if (!dbUser?._id) return [];
            const res = await api.get(`/bookings?monkId=${dbUser._id}`);
            return Array.isArray(res.data) ? res.data : (res.data?.bookings || []);
        },
        enabled: !!dbUser?._id,
    });

    const onRefresh = async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    };

    const allBookings = bookings || [];
    const completedBookings = allBookings.filter((b: any) => b.status === 'completed');
    const pendingBookings = allBookings.filter((b: any) => b.status === 'pending');
    const confirmedBookings = allBookings.filter((b: any) => b.status === 'confirmed');

    const isSpecial = (dbUser as any)?.isSpecial === true;
    const rate = isSpecial ? 88800 : 40000;

    const totalEarnings = completedBookings.length * rate;

    const thisMonthBookings = completedBookings.filter((b: any) => {
        const d = new Date(b.date || b.createdAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const thisMonthEarnings = thisMonthBookings.length * rate;

    const filteredBookings = allBookings.filter((b: any) => {
        const d = new Date(b.date || b.createdAt);
        return d.getMonth() === selectedMonth.value && d.getFullYear() === selectedMonth.year;
    }).sort((a: any, b: any) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());

    const filteredTotal = filteredBookings.filter((b: any) => b.status === 'completed').length * rate;

    const renderBooking = ({ item, index }: { item: any; index: number }) => {
        let badgeBg = '#FEF3C7';
        let badgeColor = '#92400E';
        let badgeText = "⏳ Хүлээгдэж";

        if (item.status === 'completed') {
            badgeBg = '#D1FAE5';
            badgeColor = '#065F46';
            badgeText = "✅ Дууссан";
        } else if (item.status === 'confirmed') {
            badgeBg = COLORS.goldPale;
            badgeColor = COLORS.gold;
            badgeText = "🟡 Баталгаажсан";
        } else if (item.status === 'cancelled') {
            badgeBg = '#FEE2E2';
            badgeColor = '#991B1B';
            badgeText = "❌ Цуцлагдсан";
        }

        let incomeAmount = item.status === 'completed' ? rate : 0;
        const price = incomeAmount.toLocaleString() + '₮';
        const dateStr = item.date?.split('T')[0] || item.createdAt?.split('T')[0];

        return (
            <Animated.View entering={FadeInDown.delay(index * 50).duration(400)}>
                <View style={st.bookingCard}>
                    <View style={st.bookingRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={st.bookingTitle} numberOfLines={1}>
                                👤 {item.clientName || item.userName || 'Хэрэглэгч'}
                            </Text>
                            <Text style={st.bookingDate}>
                                📅 {dateStr} {item.time}
                            </Text>
                        </View>
                        <Text style={st.bookingPrice}>{price}</Text>
                    </View>
                    <View style={st.divider} />
                    <View style={st.statusRow}>
                        <View style={[st.statusBadge, { backgroundColor: badgeBg }]}>
                            <Text style={[st.statusText, { color: badgeColor }]}>{badgeText}</Text>
                        </View>
                    </View>
                </View>
            </Animated.View>
        );
    };

    return (
        <View style={st.container}>
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
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
                    <Text style={st.headerTitle}>Орлогын тайлан</Text>
                    <TouchableScale
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            router.push('/notifications');
                        }}
                        style={st.bellContainer}
                    >
                        <Bell size={22} color={COLORS.text} />
                    </TouchableScale>
                </View>

                {error && (
                    <View style={st.errorBlock}>
                        <Text style={st.errorText}>⚠️ Мэдээлэл ачаалж чадсангүй</Text>
                        <TouchableScale onPress={() => refetch()}><Text style={st.errorAction}>Дахин оролдох</Text></TouchableScale>
                    </View>
                )}

                <ScrollView
                    contentContainerStyle={st.scrollOptions}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.gold} />}
                >
                    {isLoading ? (
                        <View style={st.statsGrid}>
                            <SkeletonRect width="48%" height={100} style={{ marginBottom: 12 }} />
                            <SkeletonRect width="48%" height={100} style={{ marginBottom: 12 }} />
                            <SkeletonRect width="48%" height={100} />
                            <SkeletonRect width="48%" height={100} />
                        </View>
                    ) : (
                        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={st.statsGrid}>
                            <View style={[st.statCard, SHADOWS.card]}>
                                <Text style={st.statLabel}>💰 Нийт орлого</Text>
                                <Text style={st.statValueGold}>{totalEarnings.toLocaleString()}₮</Text>
                            </View>
                            <View style={[st.statCard, SHADOWS.card]}>
                                <Text style={st.statLabel}>📅 Энэ сар</Text>
                                <Text style={st.statValue}>{thisMonthEarnings.toLocaleString()}₮</Text>
                            </View>
                            <View style={[st.statCard, SHADOWS.card]}>
                                <Text style={st.statLabel}>✅ Дууссан</Text>
                                <Text style={st.statValue}>{completedBookings.length}</Text>
                            </View>
                            <View style={[st.statCard, SHADOWS.card]}>
                                <Text style={st.statLabel}>⏳ Хүлээгдэж</Text>
                                <Text style={st.statValue}>{pendingBookings.length + confirmedBookings.length}</Text>
                            </View>
                        </Animated.View>
                    )}

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.filterRow} style={{ flexGrow: 0, marginBottom: 16 }}>
                        {months.map((m, i) => {
                            const isActive = m.value === selectedMonth.value && m.year === selectedMonth.year;
                            return (
                                <TouchableScale key={i} onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    setSelectedMonth(m);
                                }}>
                                    {isActive ? (
                                        <LinearGradient colors={[COLORS.goldBright, COLORS.gold]} style={[st.filterChipActive, SHADOWS.gold]}>
                                            <Text style={st.filterTextActive}>{m.label}</Text>
                                        </LinearGradient>
                                    ) : (
                                        <View style={[st.filterChipInactive, SHADOWS.card]}>
                                            <Text style={st.filterTextInactive}>{m.label}</Text>
                                        </View>
                                    )}
                                </TouchableScale>
                            );
                        })}
                    </ScrollView>

                    {isLoading ? (
                        <View style={{ paddingHorizontal: 20 }}>
                            <SkeletonRect width="100%" height={80} style={{ marginBottom: 12 }} />
                            <SkeletonRect width="100%" height={80} style={{ marginBottom: 12 }} />
                        </View>
                    ) : filteredBookings.length === 0 ? (
                        <View style={st.emptyState}>
                            <Text style={st.emptyEmoji}>📅</Text>
                            <Text style={st.emptyText}>Энэ сард уулзалт байхгүй байна</Text>
                        </View>
                    ) : (
                        <View style={{ paddingHorizontal: 20 }}>
                            {filteredBookings.map((b: any, i: number) => renderBooking({ item: b, index: i }))}
                        </View>
                    )}
                </ScrollView>

                {/* Sticky Footer */}
                <View style={st.footer}>
                    <Text style={st.footerLabel}>Сонгосон сарын нийт орлого:</Text>
                    <Text style={st.footerTotal}>{filteredTotal.toLocaleString()}₮</Text>
                </View>
            </SafeAreaView>
        </View>
    );
}

const st = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border,
    },
    backBtn: {
        width: 44, height: 44, borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.85)', borderWidth: 1, borderColor: COLORS.border,
        alignItems: 'center', justifyContent: 'center',
    },
    bellContainer: {
        width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,252,242,0.8)',
        borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: { fontFamily: SERIF, fontSize: 18, fontWeight: '700', color: COLORS.text },

    scrollOptions: { paddingBottom: 120, paddingTop: 16 },

    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 20, marginBottom: 24 },
    statCard: {
        width: '48%' as any, backgroundColor: 'rgba(255,252,242,0.92)', borderRadius: 20,
        borderWidth: 1, borderColor: COLORS.border, padding: 18, alignItems: 'center'
    },
    statLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textMid, marginBottom: 8 },
    statValueGold: { fontFamily: SERIF, fontSize: 24, fontWeight: '800', color: COLORS.gold, textAlign: 'center' },
    statValue: { fontFamily: SERIF, fontSize: 24, fontWeight: '800', color: COLORS.text, textAlign: 'center' },

    filterRow: { paddingHorizontal: 20, gap: 10 },
    filterChipActive: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
    filterTextActive: { color: '#1A0800', fontWeight: '700', fontSize: 13 },
    filterChipInactive: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: 'rgba(255,252,242,0.92)', borderWidth: 1, borderColor: COLORS.border },
    filterTextInactive: { color: COLORS.textMid, fontWeight: '600', fontSize: 13 },

    bookingCard: {
        backgroundColor: 'rgba(255,252,242,0.92)', borderRadius: 18,
        borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 10,
        ...SHADOWS.card,
    },
    bookingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    bookingTitle: { fontFamily: SERIF, fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
    bookingDate: { fontSize: 13, color: COLORS.textMid },
    bookingPrice: { fontFamily: SERIF, fontSize: 16, fontWeight: '800', color: COLORS.gold },
    divider: { height: 1, backgroundColor: COLORS.divider, marginBottom: 10 },
    statusRow: { flexDirection: 'row', justifyContent: 'flex-start' },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusText: { fontSize: 10, fontWeight: '700' },

    footer: {
        position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(255,252,242,0.98)',
        borderTopWidth: 1, borderTopColor: COLORS.border, padding: 16, paddingHorizontal: 20,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    },
    footerLabel: { fontFamily: SERIF, fontSize: 15, color: COLORS.textMid },
    footerTotal: { fontFamily: SERIF, fontSize: 20, fontWeight: '800', color: COLORS.gold },

    emptyState: { paddingVertical: 60, alignItems: 'center' },
    emptyEmoji: { fontSize: 52, marginBottom: 16 },
    emptyText: { fontFamily: SERIF, fontSize: 17, color: COLORS.textLight },

    errorBlock: {
        backgroundColor: 'rgba(220,38,38,0.06)', borderRadius: 16,
        borderWidth: 1, borderColor: 'rgba(220,38,38,0.15)',
        padding: 16, margin: 16, alignItems: 'center'
    },
    errorText: { color: '#DC2626', fontSize: 14, fontWeight: '600', marginBottom: 8 },
    errorAction: { color: COLORS.gold, fontWeight: '700' },
});
