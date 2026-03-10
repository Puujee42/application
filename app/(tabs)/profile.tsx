import React, { useEffect, useState } from 'react';
import {
    ScrollView, View, Text, Pressable,
    StyleSheet, RefreshControl, Alert, Platform, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useAuth, useUser } from '../../lib/useClerkSafe';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import TouchableScale from '../../components/ui/TouchableScale';
import { useUserStore } from '../../store/userStore';
import { useAuthStore } from '../../store/authStore';
import { useIsAuthenticated } from '../../hooks/useIsAuthenticated';
import api from '../../lib/api';
import { COLORS, SHADOWS, FONT } from '../../design-system/theme';

interface MenuItem {
    emoji: string;
    label: string;
    sub?: string;
    route?: string | null;
    isLogout?: boolean;
    red?: boolean;
    bg?: string | [string, string];
}

export default function ProfileScreen() {
    const router = useRouter();
    const { isSignedIn, signOut } = useAuth();
    const { user: clerkUser } = useUser();
    const { user: dbUser, fetchProfile } = useUserStore();
    const { isCustomAuth, logout } = useAuthStore();
    const isAuthenticated = useIsAuthenticated();
    const [refreshing, setRefreshing] = useState(false);

    const isMonk = dbUser?.role === 'monk';
    const isAdmin = dbUser?.role === 'admin';
    const userId = dbUser?._id;

    const { data: bookings, refetch, error } = useQuery({
        queryKey: ['profile-bookings', userId, isMonk],
        queryFn: async () => {
            if (!userId) return [];
            const param = isMonk ? `monkId=${userId}` : `userId=${userId}`;
            const res = await api.get(`/bookings?${param}`);
            const data = Array.isArray(res.data) ? res.data : (res.data?.bookings || []);
            return data;
        },
        enabled: isAuthenticated && !!userId,
    });

    useEffect(() => {
        if (isAuthenticated) fetchProfile();
    }, [isAuthenticated]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchProfile();
        await refetch();
        setRefreshing(false);
    };

    const completedBookings = bookings?.filter((b: any) => b.status === 'completed') || [];
    const totalBookings = isMonk ? completedBookings.length : (bookings?.length || 0);
    const favCount = bookings && !isMonk ? new Set(bookings.map((b: any) => b.monkId)).size : 0;

    // Fallback earnings check
    const rate = (dbUser as any)?.isSpecial ? 88800 : 40000;
    const earnings = completedBookings.length * rate;

    const displayName = dbUser?.firstName || clerkUser?.firstName || 'Зочин';
    const fullName = dbUser?.firstName
        ? `${dbUser.firstName} ${dbUser.lastName || ''}`.trim()
        : clerkUser?.fullName || displayName;
    const email = dbUser?.email || clerkUser?.primaryEmailAddress?.emailAddress || '';
    const avatarUri = (dbUser as any)?.image || dbUser?.avatar || clerkUser?.imageUrl || 'https://i.pravatar.cc/150?u=self';

    if (!isAuthenticated) {
        return (
            <View style={[st.container, st.center]}>
                <SafeAreaView style={st.center} edges={['top']}>
                    <Text style={st.guestTitle}>Нэвтрэх</Text>
                    <Text style={st.guestSub}>Цаг захиалах, түүхээ харахын тулд нэвтэрнэ үү</Text>
                    <TouchableScale onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push('/(auth)/sign-in');
                    }} >
                        <LinearGradient colors={[COLORS.goldBright, COLORS.gold, COLORS.amber]} style={[st.guestBtn, SHADOWS.glow]}>
                            <Text style={st.guestBtnText}>НЭВТРЭХ</Text>
                        </LinearGradient>
                    </TouchableScale>
                    <TouchableScale onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push('/(auth)/sign-up');
                    }} style={st.guestOutlineBtn}>
                        <Text style={st.guestOutlineBtnText}>БҮРТГҮҮЛЭХ</Text>
                    </TouchableScale>
                </SafeAreaView>
            </View>
        );
    }

    const handleMenuPress = async (item: MenuItem) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (item.isLogout) {
            Alert.alert('Гарах', 'Та гарахдаа итгэлтэй байна уу?', [
                { text: 'Үгүй', style: 'cancel' },
                {
                    text: 'Тийм', style: 'destructive',
                    onPress: async () => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                        if (isCustomAuth) await logout();
                        if (isSignedIn) await signOut();
                        router.replace('/(auth)/sign-in');
                    },
                },
            ]);
            return;
        }
        if (item.route) router.push(item.route as any);
    };

    const renderGroup = (items: MenuItem[], delay: number) => (
        <Animated.View entering={FadeInDown.delay(delay).duration(500)} style={st.sectionCard}>
            {items.map((item, idx) => {
                const isLast = idx === items.length - 1;
                const isGradient = Array.isArray(item.bg);

                return (
                    <React.Fragment key={item.label}>
                        <TouchableScale style={st.menuItem} onPress={() => handleMenuPress(item)}>
                            {isGradient ? (
                                <LinearGradient colors={item.bg as [string, string]} style={st.menuIconBg}>
                                    <Text style={st.menuEmoji}>{item.emoji}</Text>
                                </LinearGradient>
                            ) : (
                                <View style={[st.menuIconBg, { backgroundColor: item.bg as string }]}>
                                    <Text style={st.menuEmoji}>{item.emoji}</Text>
                                </View>
                            )}
                            <View style={st.menuTextCol}>
                                <Text style={[st.menuLabel, item.red && { color: COLORS.error }]}>{item.label}</Text>
                                {!!item.sub && <Text style={st.menuSub}>{item.sub}</Text>}
                            </View>
                            <ChevronRight size={16} color={COLORS.textFaint} />
                        </TouchableScale>
                        {!isLast && <View style={st.menuDivider} />}
                    </React.Fragment>
                );
            })}
        </Animated.View>
    );

    let badgeText = "✨ Premium";
    let badgeBg: string | undefined = COLORS.goldPale;
    let badgeColor: string | undefined = COLORS.gold;

    if (isAdmin) {
        badgeText = "🛡️ Админ";
        badgeBg = '#6D28D9';
        badgeColor = '#FFFFFF';
    } else if (isMonk) {
        badgeText = "🔮 Үзмэрч";
        badgeBg = COLORS.goldPale;
        badgeColor = COLORS.gold;
    }

    // ── Menu Groups ──
    const group1: MenuItem[] = isMonk ? [
        { emoji: '📅', label: 'Миний уулзалтууд', route: '/my-bookings', bg: ['#FFF3C4', '#FFE08A'] },
        { emoji: '⏰', label: 'Цагийн хуваарь', route: '/manage-schedule', bg: ['#FFF3C4', '#FFE08A'] } // reused yellow bg
    ] : [
        { emoji: '📅', label: 'Миний захиалгууд', sub: `${totalBookings} идэвхтэй`, route: '/my-bookings', bg: ['#FFF3C4', '#FFE08A'] },
        { emoji: '❤️', label: 'Дуртай үзмэрчид', sub: `${favCount} нэмсэн`, route: '/(tabs)/monks', bg: ['#FFE4E8', '#FFCCD4'] }
    ];

    const group2: MenuItem[] = [
        { emoji: '🔔', label: 'Мэдэгдэл', route: '/notifications', bg: ['#E0F2FE', '#BAE6FD'] },
        { emoji: '💳', label: 'Төлбөрийн түүх', route: null, bg: ['#DCFCE7', '#A7F3D0'] },
        { emoji: '⚙️', label: 'Тохиргоо', route: '/settings', bg: '#F3F4F6' },
    ];
    if (isAdmin) {
        group2.unshift({ emoji: '🛡️', label: 'Удирдлагын самбар', route: '/admin', bg: ['#F3E8FF', '#E9D5FF'] });
    }
    if (isMonk) {
        group2.push({ emoji: '⚙️', label: 'Профайл засах', route: '/edit-monk-profile', bg: '#F3F4F6' });
        group2.unshift({ emoji: '💰', label: 'Орлогын тайлан', route: '/monk-dashboard', bg: ['#E0F2FE', '#BAE6FD'] });
    }

    const group3: MenuItem[] = [
        { emoji: '🚪', label: 'Гарах', route: 'logout', isLogout: true, red: true, bg: ['#FEE2E2', '#FECACA'] }
    ];

    return (
        <View style={st.container}>
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                <ScrollView contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.gold} />}
                >
                    {/* Header */}
                    <Animated.View entering={FadeInDown.delay(0).duration(500)} style={st.header}>
                        <View style={st.avatarContainer}>
                            <LinearGradient colors={[COLORS.goldBright, COLORS.gold, COLORS.amber]} style={st.avatarRing}>
                                <Image source={{ uri: avatarUri }} style={st.avatarImage} contentFit="cover" />
                            </LinearGradient>
                            <View style={st.checkmarkBadge}>
                                <Text style={st.checkmarkText}>✓</Text>
                            </View>
                        </View>
                        <Text style={st.userName}>{fullName}</Text>
                        <View style={[st.roleBadge, { backgroundColor: badgeBg }]}>
                            <Text style={[st.roleText, { color: badgeColor }]}>{badgeText}</Text>
                        </View>
                    </Animated.View>

                    {/* Stats */}
                    <Animated.View entering={FadeInDown.delay(80).duration(500)} style={st.statsDoubleRow}>
                        <View style={[st.statCard, SHADOWS.md]}>
                            <Text style={st.statNum}>{totalBookings}</Text>
                            <Text style={st.statLabel}>{isMonk ? 'Уулзалт' : 'Захиалга'}</Text>
                        </View>
                        <View style={[st.statCard, SHADOWS.md]}>
                            <Text style={st.statNum}>{isMonk ? `${earnings.toLocaleString()}₮` : favCount}</Text>
                            <Text style={st.statLabel}>{isMonk ? 'Орлого' : 'Үзмэрч'}</Text>
                        </View>
                        {isMonk && (
                            <View style={[st.statCard, SHADOWS.md]}>
                                <Text style={st.statNum}>{(dbUser as any)?.rating || '—'}</Text>
                                <Text style={st.statLabel}>Үнэлгээ</Text>
                            </View>
                        )}
                    </Animated.View>

                    {/* Menu */}
                    <View style={st.menuContainer}>
                        {renderGroup(group1, 160)}
                        {renderGroup(group2, 240)}
                        {renderGroup(group3, 320)}
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const st = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scroll: { paddingBottom: Platform.OS === 'ios' ? 116 : 96 },

    guestTitle: { fontFamily: FONT.display, fontSize: 28, fontWeight: '700', color: COLORS.text, marginTop: 24, marginBottom: 8 },
    guestSub: { fontSize: 15, color: COLORS.textSub, marginBottom: 32 },
    guestBtn: { borderRadius: 16, paddingVertical: 15, paddingHorizontal: 40, width: 240, alignItems: 'center', marginBottom: 14 },
    guestBtnText: { color: '#1C0E00', fontWeight: '800', fontSize: 15, letterSpacing: 0.5, fontFamily: FONT.display },
    guestOutlineBtn: { borderRadius: 16, paddingVertical: 14, paddingHorizontal: 40, width: 240, alignItems: 'center', backgroundColor: 'rgba(255,252,242,0.8)', borderWidth: 1.5, borderColor: COLORS.gold },
    guestOutlineBtnText: { color: COLORS.gold, fontWeight: '700', fontSize: 14 },

    header: { alignItems: 'center', marginTop: 30, marginBottom: 24 },
    avatarContainer: { position: 'relative', marginBottom: 14 },
    avatarRing: { padding: 3, borderRadius: 26 },
    avatarImage: { width: 44, height: 44, borderRadius: 22 },
    checkmarkBadge: { position: 'absolute', bottom: -4, right: -4, backgroundColor: COLORS.goldBright, borderRadius: 8, width: 24, height: 24, borderWidth: 2, borderColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' },
    checkmarkText: { fontSize: 12, color: '#1C0E00', fontWeight: 'bold' },
    userName: { fontFamily: FONT.display, fontSize: 22, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
    roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, flexDirection: 'row', alignItems: 'center' },
    roleText: { fontSize: 11, fontWeight: '700' },

    statsDoubleRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 24 },
    statCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, paddingVertical: 20, alignItems: 'center' },
    statNum: { fontFamily: FONT.display, fontSize: 26, fontWeight: '800', color: COLORS.gold, marginBottom: 4 },
    statLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.3, color: COLORS.textSub },

    menuContainer: { paddingHorizontal: 20, gap: 20 },
    sectionCard: { backgroundColor: COLORS.surface, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden', ...SHADOWS.md },
    menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 },
    menuIconBg: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    menuEmoji: { fontSize: 16 },
    menuTextCol: { flex: 1 },
    menuLabel: { fontSize: 15, fontWeight: '500', color: COLORS.text },
    menuSub: { fontSize: 12, color: COLORS.textMute, marginTop: 1 },
    menuDivider: { height: 1, backgroundColor: COLORS.divider, marginLeft: 52 },
});
