import React, { useEffect, useState } from 'react';
import {
    ScrollView, View, Text, Pressable,
    StyleSheet, RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useAuth, useUser } from '../../lib/useClerkSafe';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import {
    Calendar, Bell, BookOpen, CreditCard,
    Settings, LogOut, ChevronRight,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useUserStore } from '../../store/userStore';
import { useAuthStore } from '../../store/authStore';
import { useIsAuthenticated } from '../../hooks/useIsAuthenticated';
import api from '../../lib/api';
import { COLORS, SHADOWS } from '../../design-system/theme';

// ─── MENU ─────────────────────────────────────────────
const MENU_ITEMS = [
    { icon: Calendar, emoji: '📅', label: 'Миний захиалгууд', route: '/my-bookings' },
    { icon: Bell, emoji: '🔔', label: 'Мэдэгдэл', route: null },
    { icon: BookOpen, emoji: '📰', label: 'Блог', route: '/(tabs)/blog' },
    { icon: CreditCard, emoji: '💳', label: 'Төлбөрийн түүх', route: null },
    { icon: Settings, emoji: '⚙️', label: 'Тохиргоо', route: '/settings' },
    { icon: LogOut, emoji: '🚪', label: 'Гарах', route: 'logout', isLogout: true },
] as const;

export default function ProfileScreen() {
    const router = useRouter();
    const { isSignedIn, signOut } = useAuth();
    const { user: clerkUser } = useUser();
    const { user: dbUser, fetchProfile, isLoading } = useUserStore();
    const { isCustomAuth, customUser, logout: customLogout } = useAuthStore();
    const isAuthenticated = useIsAuthenticated();
    const [refreshing, setRefreshing] = useState(false);

    const { data: bookings } = useQuery({
        queryKey: ['profile-bookings', dbUser?._id],
        queryFn: async () => {
            if (!dbUser?._id) return [];
            const res = await api.get(`/bookings?userId=${dbUser._id}`);
            return res.data;
        },
        enabled: isAuthenticated && !!dbUser?._id,
    });

    useEffect(() => {
        if (isAuthenticated) fetchProfile();
    }, [isAuthenticated]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchProfile();
        setRefreshing(false);
    };

    const totalBookings = bookings?.length || 0;
    const completedBookings = bookings?.filter((b: any) =>
        ['completed', 'confirmed'].includes(b.status)
    ).length || 0;
    const favCount = bookings
        ? new Set(bookings.map((b: any) => b.monkId)).size
        : 0;

    const displayName =
        dbUser?.firstName || customUser?.firstName || clerkUser?.firstName || 'Зочин';
    const fullName = dbUser?.firstName
        ? `${dbUser.firstName} ${dbUser.lastName || ''}`
        : clerkUser?.fullName || displayName;
    const email =
        dbUser?.email || customUser?.email || clerkUser?.primaryEmailAddress?.emailAddress || '';
    const avatarUri =
        (dbUser as any)?.image || dbUser?.avatar || clerkUser?.imageUrl || 'https://i.pravatar.cc/150?u=self';
    const isAdmin = (dbUser as any)?.role === 'admin';

    // ── GUEST STATE ──
    if (!isAuthenticated) {
        return (
            <View style={[st.container, st.center]}>
                <SafeAreaView style={st.center} edges={['top']}>
                    <LinearGradient
                        colors={[COLORS.gold, COLORS.deepGold]}
                        style={st.avatarRing}
                    >
                        <Image
                            source={{ uri: 'https://i.pravatar.cc/150?u=self' }}
                            style={st.avatarImage}
                            contentFit="cover"
                        />
                    </LinearGradient>
                    <Text style={st.guestTitle}>Нэвтрэх</Text>
                    <Text style={st.guestSub}>
                        Цаг захиалах, түүхээ харахын тулд нэвтэрнэ үү
                    </Text>
                    <Pressable onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push('/(auth)/sign-in');
                    }}>
                        <LinearGradient colors={[COLORS.gold, COLORS.deepGold]} style={[st.guestBtn, SHADOWS.gold]}>
                            <Text style={st.guestBtnText}>НЭВТРЭХ</Text>
                        </LinearGradient>
                    </Pressable>
                    <Pressable
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            router.push('/(auth)/sign-up');
                        }}
                        style={st.guestOutlineBtn}
                    >
                        <Text style={st.guestOutlineBtnText}>БҮРТГҮҮЛЭХ</Text>
                    </Pressable>
                </SafeAreaView>
            </View>
        );
    }

    // ── MENU HANDLER ──
    const handleMenuPress = async (route: string | null, isLogout?: boolean) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (isLogout) {
            Alert.alert(
                'Гарах',
                'Та гарахдаа итгэлтэй байна уу?',
                [
                    { text: 'Үгүй', style: 'cancel' },
                    {
                        text: 'Тийм', style: 'destructive',
                        onPress: async () => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                            if (isCustomAuth) await customLogout();
                            if (isSignedIn) await signOut();
                            router.replace('/(auth)/sign-in');
                        },
                    },
                ]
            );
            return;
        }
        if (route) router.push(route as any);
    };

    return (
        <View style={st.container}>
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                <ScrollView
                    contentContainerStyle={st.scroll}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing || isLoading}
                            onRefresh={onRefresh}
                            tintColor={COLORS.gold}
                            colors={[COLORS.gold]}
                        />
                    }
                >
                    {/* ─── AVATAR ─── */}
                    <Animated.View entering={FadeInDown.delay(100).duration(600)} style={st.avatarSection}>
                        <LinearGradient
                            colors={[COLORS.gold, COLORS.deepGold]}
                            style={st.avatarRing}
                        >
                            <Image
                                source={{ uri: avatarUri }}
                                style={st.avatarImage}
                                contentFit="cover"
                            />
                        </LinearGradient>

                        <Text style={st.profileName}>{fullName}</Text>
                        <Text style={st.profileEmail}>{email}</Text>

                        <View style={st.premiumBadge}>
                            <Text style={st.premiumText}>✨ Premium гишүүн</Text>
                        </View>
                    </Animated.View>

                    {/* ─── STATISTICS ─── */}
                    <Animated.View entering={FadeInDown.delay(200).duration(600)} style={st.statsRow}>
                        <View style={st.statCard}>
                            <Text style={st.statNum}>{totalBookings}</Text>
                            <Text style={st.statLabel}>Захиалга</Text>
                        </View>
                        <View style={st.statCard}>
                            <Text style={st.statNum}>{completedBookings}</Text>
                            <Text style={st.statLabel}>Дуусгасан</Text>
                        </View>
                        <View style={st.statCard}>
                            <Text style={st.statNum}>{favCount}</Text>
                            <Text style={st.statLabel}>Дуртай</Text>
                        </View>
                    </Animated.View>

                    {/* ─── ADMIN LINK ─── */}
                    {isAdmin && (
                        <Animated.View entering={FadeInDown.delay(250).duration(600)} style={{ marginBottom: 16 }}>
                            <Pressable onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                router.push('/admin' as any);
                            }}>
                                <LinearGradient
                                    colors={[COLORS.gold, COLORS.deepGold]}
                                    style={[st.adminBtn, SHADOWS.gold]}
                                >
                                    <Text style={st.adminBtnText}>⚙️ Удирдлагын хэсэг →</Text>
                                </LinearGradient>
                            </Pressable>
                        </Animated.View>
                    )}

                    {/* ─── MENU LIST ─── */}
                    <Animated.View entering={FadeInDown.delay(300).duration(600)} style={st.menuCard}>
                        {MENU_ITEMS.map((item, idx) => {
                            const isLast = idx === MENU_ITEMS.length - 1;
                            const isLogout = 'isLogout' in item && item.isLogout;
                            return (
                                <Pressable
                                    key={item.label}
                                    style={[st.menuItem, !isLast && st.menuBorder]}
                                    onPress={() => handleMenuPress(item.route, isLogout)}
                                >
                                    <Text style={st.menuEmoji}>{item.emoji}</Text>
                                    <Text style={[st.menuLabel, isLogout && { color: COLORS.error }]}>
                                        {item.label}
                                    </Text>
                                    <ChevronRight size={16} color={isLogout ? COLORS.error : COLORS.textLight} />
                                </Pressable>
                            );
                        })}
                    </Animated.View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

// ─── STYLES ───────────────────────────────────────────
const st = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
    scroll: { paddingHorizontal: 20, paddingBottom: 110 },

    /* Guest */
    guestTitle: { fontFamily: 'Georgia', fontSize: 24, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
    guestSub: { fontSize: 14, color: COLORS.textLight, textAlign: 'center', marginBottom: 28, lineHeight: 22 },
    guestBtn: { borderRadius: 18, paddingVertical: 16, width: 280, alignItems: 'center' },
    guestBtnText: { color: '#1A0800', fontWeight: '800', fontSize: 15, letterSpacing: 1.5 },
    guestOutlineBtn: {
        borderRadius: 18, borderWidth: 1.5, borderColor: COLORS.gold,
        paddingVertical: 14, width: 280, alignItems: 'center', marginTop: 12,
    },
    guestOutlineBtnText: { color: COLORS.gold, fontWeight: '700', fontSize: 14, letterSpacing: 1.5 },

    /* Avatar */
    avatarSection: { alignItems: 'center', paddingTop: 28, marginBottom: 24 },
    avatarRing: {
        width: 86, height: 86, borderRadius: 28, padding: 3,
        alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    },
    avatarImage: { width: 80, height: 80, borderRadius: 25 },
    profileName: {
        fontFamily: 'Georgia', fontSize: 22, fontWeight: '800', color: COLORS.text, marginBottom: 4,
    },
    profileEmail: { fontSize: 13, color: COLORS.textMid, marginBottom: 14 },
    premiumBadge: {
        backgroundColor: COLORS.goldPale, borderWidth: 1, borderColor: COLORS.gold,
        borderRadius: 30, paddingHorizontal: 16, paddingVertical: 8,
    },
    premiumText: { fontSize: 13, fontWeight: '700', color: COLORS.gold },

    /* Stats */
    statsRow: {
        flexDirection: 'row', gap: 10, marginBottom: 16,
    },
    statCard: {
        flex: 1, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 18,
        borderWidth: 1, borderColor: COLORS.border, paddingVertical: 18,
        alignItems: 'center', ...SHADOWS.card,
    },
    statNum: {
        fontFamily: 'Georgia', fontSize: 24, fontWeight: '800', color: COLORS.gold, marginBottom: 4,
    },
    statLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textMid },

    /* Admin */
    adminBtn: { borderRadius: 18, paddingVertical: 16, alignItems: 'center' },
    adminBtnText: { color: '#1A0800', fontWeight: '800', fontSize: 14, letterSpacing: 0.5 },

    /* Menu */
    menuCard: {
        backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 22,
        borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden',
        ...SHADOWS.card,
    },
    menuItem: {
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 16,
    },
    menuBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
    menuEmoji: { fontSize: 18, marginRight: 14 },
    menuLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.text },
});
