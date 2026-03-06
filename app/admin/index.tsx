import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useUserStore } from '../../store/userStore';
import api from '../../lib/api';
import { COLORS, SHADOWS } from '../../design-system/theme';

export default function AdminDashboard() {
    const router = useRouter();
    const { user: dbUser } = useUserStore();

    // Role gate
    useEffect(() => {
        if (dbUser && (dbUser as any)?.role !== 'admin') {
            router.replace('/(tabs)');
        }
    }, [dbUser]);

    const { data: adminData, isLoading } = useQuery({
        queryKey: ['admin-data'],
        queryFn: async () => {
            const res = await api.get('/admin/data');
            return res.data;
        },
    });

    const allBookings = adminData?.bookings || [];
    const todayStr = new Date().toISOString().split('T')[0];
    const todayBookings = allBookings.filter((b: any) => b.date?.startsWith(todayStr));

    const pendingApps = (adminData?.users || []).filter((u: any) => u.monkStatus === 'pending');

    const stats = [
        { label: 'Хэрэглэгч', value: adminData?.stats?.totalUsers || 0, emoji: '👤' },
        { label: 'Нийт захиалга', value: adminData?.stats?.totalBookings || allBookings.length, emoji: '📋' },
        { label: 'Үзмэрч', value: adminData?.stats?.totalMonks || 0, emoji: '🔮' },
        { label: 'Хүсэлтүүд', value: pendingApps.length, emoji: '📝' },
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
                {/* Header */}
                <View style={st.header}>
                    <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }} style={st.backBtn}>
                        <ArrowLeft size={22} color={COLORS.text} />
                    </Pressable>
                    <Text style={st.headerTitle}>Удирдлагын самбар</Text>
                    <View style={{ width: 44 }} />
                </View>

                <ScrollView contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false}>
                    {isLoading ? (
                        <ActivityIndicator size="large" color={COLORS.gold} style={{ marginTop: 40 }} />
                    ) : (
                        <>
                            {/* Stats Grid */}
                            <Animated.View entering={FadeInDown.delay(100).duration(500)} style={st.statsGrid}>
                                {stats.map((s, i) => (
                                    <View key={i} style={st.statCard}>
                                        <Text style={st.statEmoji}>{s.emoji}</Text>
                                        <Text style={st.statNum}>{s.value}</Text>
                                        <Text style={st.statLabel}>{s.label}</Text>
                                    </View>
                                ))}
                            </Animated.View>

                            {/* Menu */}
                            <Animated.View entering={FadeInDown.delay(250).duration(500)} style={st.menuCard}>
                                {menuItems.map((item, idx) => (
                                    <Pressable
                                        key={item.label}
                                        style={[st.menuItem, idx < menuItems.length - 1 && st.menuBorder]}
                                        onPress={() => {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            router.push(item.route as any);
                                        }}
                                    >
                                        <Text style={st.menuEmoji}>{item.emoji}</Text>
                                        <Text style={st.menuLabel}>{item.label}</Text>
                                        {(item as any).badge > 0 && (
                                            <View style={{ backgroundColor: '#DC2626', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2, marginRight: 8 }}>
                                                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>{(item as any).badge}</Text>
                                            </View>
                                        )}
                                        <LinearGradient colors={[COLORS.gold, COLORS.deepGold]} style={st.menuArrow}>
                                            <Text style={st.menuArrowText}>→</Text>
                                        </LinearGradient>
                                    </Pressable>
                                ))}
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
    scroll: { paddingHorizontal: 20, paddingBottom: 40 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 12,
    },
    backBtn: {
        width: 44, height: 44, borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.85)', borderWidth: 1, borderColor: COLORS.border,
        alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: { fontFamily: 'Georgia', fontSize: 18, fontWeight: '700', color: COLORS.text },

    /* Stats */
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
    statCard: {
        width: '48%' as any, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 20,
        borderWidth: 1, borderColor: COLORS.border, padding: 18, alignItems: 'center',
        ...SHADOWS.card,
    },
    statEmoji: { fontSize: 28, marginBottom: 6 },
    statNum: { fontFamily: 'Georgia', fontSize: 28, fontWeight: '800', color: COLORS.gold, marginBottom: 2 },
    statLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textMid },

    /* Menu */
    menuCard: {
        backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 22,
        borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden', ...SHADOWS.card,
    },
    menuItem: {
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 18,
    },
    menuBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
    menuEmoji: { fontSize: 22, marginRight: 14 },
    menuLabel: { flex: 1, fontFamily: 'Georgia', fontSize: 15, fontWeight: '700', color: COLORS.text },
    menuArrow: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    menuArrowText: { color: '#1A0800', fontWeight: '800', fontSize: 16 },
});
