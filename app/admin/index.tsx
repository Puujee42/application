import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useUserStore } from '../../store/userStore';
import api from '../../lib/api';
import { COLORS, SHADOWS, FONT } from '../../design-system/theme';

export default function AdminDashboard() {
    const router = useRouter();
    const { user: dbUser } = useUserStore();

    useEffect(() => {
        if (dbUser && (dbUser as any)?.role !== 'admin') {
            router.replace('/(tabs)');
        }
    }, [dbUser]);

    const { data: adminData, isLoading, error, refetch } = useQuery({
        queryKey: ['admin-data', dbUser?._id],
        queryFn: async () => {
            const res = await api.get(`/admin/data?userId=${dbUser?._id}`);
            return res.data;
        },
        enabled: !!dbUser?._id,
    });

    const allBookings = adminData?.bookings || [];
    const completedBookings = allBookings.filter((b: any) => b.status === 'completed');
    const todayStr = new Date().toISOString().split('T')[0];
    const todayBookings = allBookings.filter((b: any) =>
        (b.date || b.createdAt || '').startsWith(todayStr)
    );
    const totalRevenue = adminData?.stats?.totalRevenue ||
        completedBookings.reduce((sum: number, b: any) => sum + (b.amount || b.price || 0), 0);
    const todayRevenue = todayBookings
        .filter((b: any) => b.status === 'completed')
        .reduce((sum: number, b: any) => sum + (b.amount || b.price || 0), 0);
    const pendingApps = (adminData?.users || []).filter((u: any) => u.monkStatus === 'pending');

    const stats = [
        { label: 'Хэрэглэгч', value: adminData?.stats?.totalUsers || 0, emoji: '👤' },
        { label: 'Нийт захиалга', value: allBookings.length, emoji: '📋' },
        { label: 'Өнөөдрийн захиалга', value: todayBookings.length, emoji: '✅' },
        { label: 'Үзмэрч', value: adminData?.stats?.totalMonks || 0, emoji: '🔮' },
        { label: 'Нийт орлого', value: `${totalRevenue.toLocaleString()}₮`, emoji: '💰', isGold: true },
        { label: 'Хүсэлтүүд', value: pendingApps.length, emoji: '📝', hasBadge: pendingApps.length > 0 },
    ];

    const menuItems = [
        { label: 'Захиалга удирдах', emoji: '📋', route: '/admin/bookings' },
        { label: 'Хэрэглэгч удирдах', emoji: '👤', route: '/admin/users' },
        { label: 'Лам болох хүсэлтүүд', emoji: '📝', route: '/admin/applications', badge: pendingApps.length },
        { label: 'Үзмэрч удирдах', emoji: '🔮', route: '/admin/monks' },
        { label: 'Блог удирдах', emoji: '📰', route: '/admin/blog' },
    ];

    return (
        <View style={st.container}>
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                <View style={st.header}>
                    <Pressable
                        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}
                        style={st.backBtn}

                    >
                        <ArrowLeft size={22} color={COLORS.text} />
                    </Pressable>
                    <Text style={st.headerTitle}>Удирдлагын самбар</Text>
                    <View style={{ width: 38 }} />
                </View>

                {error && (
                    <View style={st.errorBlock}>
                        <Text style={st.errorText}>⚠️ Мэдээлэл ачаалж чадсангүй</Text>
                        <Text style={{ color: '#DC2626', marginBottom: 8 }}>{(error as Error).message}</Text>
                        <Pressable onPress={() => refetch()} >
                            <Text style={st.errorAction}>Дахин оролдох</Text>
                        </Pressable>
                    </View>
                )}

                <ScrollView contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false}>
                    {isLoading ? (
                        <ActivityIndicator size="large" color={COLORS.gold} style={{ marginTop: 40 }} />
                    ) : (
                        <>
                            <Animated.View entering={FadeInDown.delay(100).duration(500)} style={st.statsGrid}>
                                {stats.map((s, i) => {
                                    if (s.isGold) {
                                        return (
                                            <LinearGradient key={i} colors={['rgba(255,243,196,0.9)', 'rgba(255,232,160,0.6)']} style={[st.statCard, st.statCardGold, SHADOWS.glow]}>
                                                <Text style={st.statEmoji}>{s.emoji}</Text>
                                                <Text style={[st.statNum, { color: '#1C0E00' }]}>{s.value}</Text>
                                                <Text style={[st.statLabel, { color: '#B87A08', fontWeight: '800' }]}>{s.label}</Text>
                                            </LinearGradient>
                                        );
                                    }
                                    return (
                                        <View key={i} style={[st.statCard, SHADOWS.md]}>
                                            <Text style={st.statEmoji}>{s.emoji}</Text>
                                            <Text style={st.statNum}>{s.value}</Text>
                                            <Text style={st.statLabel}>{s.label}</Text>
                                            {s.hasBadge && (
                                                <View style={st.redDot} />
                                            )}
                                        </View>
                                    );
                                })}
                            </Animated.View>

                            <Animated.View entering={FadeInDown.delay(200).duration(500)} style={st.menuCard}>
                                {menuItems.map((item, idx) => (
                                    <View key={item.label}>
                                        <Pressable
                                            style={st.menuItem}

                                            onPress={() => {
                                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                router.push(item.route as any);
                                            }}
                                        >
                                            <Text style={st.menuEmoji}>{item.emoji}</Text>
                                            <Text style={st.menuLabel}>{item.label}</Text>
                                            {(item as any).badge > 0 && (
                                                <View style={st.countBadge}>
                                                    <Text style={st.countWhite}>{(item as any).badge}</Text>
                                                </View>
                                            )}
                                            <LinearGradient colors={[COLORS.goldBright, COLORS.gold]} style={st.menuArrow}>
                                                <Text style={st.menuArrowText}>→</Text>
                                            </LinearGradient>
                                        </Pressable>
                                        {idx < menuItems.length - 1 && <View style={st.menuDivider} />}
                                    </View>
                                ))}
                            </Animated.View>

                            <Animated.View entering={FadeInDown.delay(300).duration(500)} style={st.revenueSection}>
                                <Text style={st.revenueTitle}>📊 Орлогын тойм</Text>

                                <View style={st.revenueCard}>
                                    <View style={st.revRow}>
                                        <Text style={st.revLabel}>Өнөөдрийн орлого:</Text>
                                        <Text style={st.revValue}>{todayRevenue.toLocaleString()}₮</Text>
                                    </View>
                                    <View style={st.revDivider} />
                                    <View style={st.revRow}>
                                        <Text style={st.revLabel}>Нийт дууссан захиалга:</Text>
                                        <Text style={st.revValue}>{completedBookings.length}</Text>
                                    </View>
                                    <View style={st.revDivider} />
                                    <View style={st.revRow}>
                                        <Text style={st.revLabel}>Дундаж захиалгын дүн:</Text>
                                        <Text style={st.revValue}>
                                            {completedBookings.length > 0
                                                ? Math.round(totalRevenue / completedBookings.length).toLocaleString() + "₮"
                                                : "—"}
                                        </Text>
                                    </View>
                                </View>
                            </Animated.View>
                        </>
                    )}
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const st = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    scroll: { paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 116 : 96, paddingTop: 10 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 12,
    },
    backBtn: {
        width: 38, height: 38, borderRadius: 12,
        backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
        alignItems: 'center', justifyContent: 'center',
        ...SHADOWS.sm,
    },
    headerTitle: { fontFamily: FONT.display, fontSize: 18, fontWeight: '700', color: COLORS.text },

    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
    statCard: {
        width: '48%' as any, backgroundColor: COLORS.surface, borderRadius: 20,
        borderWidth: 1, borderColor: COLORS.border, padding: 20, alignItems: 'center',
    },
    statCardGold: {
        borderColor: COLORS.goldBright, borderWidth: 1,
    },
    statEmoji: { fontSize: 30, marginBottom: 8 },
    statNum: { fontFamily: FONT.display, fontSize: 30, fontWeight: '800', color: COLORS.gold, marginBottom: 4 },
    statLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textSub, textAlign: 'center' },
    redDot: { position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: '#DC2626' },

    menuCard: {
        backgroundColor: COLORS.surface, borderRadius: 20,
        borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden', ...SHADOWS.md,
        marginBottom: 24,
    },
    menuItem: {
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 16,
    },
    menuDivider: { height: 1, backgroundColor: COLORS.divider, marginLeft: 54 },
    menuEmoji: { fontSize: 22, marginRight: 14 },
    menuLabel: { flex: 1, fontFamily: FONT.display, fontSize: 16, fontWeight: '700', color: COLORS.text },
    countBadge: { backgroundColor: '#DC2626', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2, marginRight: 8 },
    countWhite: { color: '#fff', fontSize: 11, fontWeight: '800' },
    menuArrow: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    menuArrowText: { color: '#1C0E00', fontWeight: '800', fontSize: 16 },

    revenueSection: { marginTop: 10, marginBottom: 20 },
    revenueTitle: { fontFamily: FONT.display, fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 14, marginLeft: 4 },
    revenueCard: {
        backgroundColor: COLORS.surface, borderRadius: 20,
        borderWidth: 1, borderColor: COLORS.border, padding: 18, ...SHADOWS.md,
    },
    revRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
    revDivider: { height: 1, backgroundColor: COLORS.divider },
    revLabel: { fontSize: 14, color: COLORS.textSub, fontWeight: '500' },
    revValue: { fontFamily: FONT.display, fontSize: 16, fontWeight: '800', color: COLORS.gold },

    errorBlock: {
        backgroundColor: 'rgba(220,38,38,0.06)', borderRadius: 16,
        borderWidth: 1, borderColor: 'rgba(220,38,38,0.15)',
        padding: 16, margin: 16, alignItems: 'center'
    },
    errorText: { color: '#DC2626', fontSize: 14, fontWeight: '600', marginBottom: 8 },
    errorAction: { color: COLORS.gold, fontWeight: '700' },
});
