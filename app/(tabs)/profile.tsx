import React, { useEffect, useState } from 'react';
import {
    ScrollView,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useQuery } from '@tanstack/react-query';
import {
    Sparkles,
    ShoppingBag,
    Bell,
    BookOpen,
    CreditCard,
    Settings,
    LogOut,
    ChevronRight,
} from 'lucide-react-native';
import { useUserStore } from '../../store/userStore';
import { useAuthStore } from '../../store/authStore';
import { useIsAuthenticated } from '../../hooks/useIsAuthenticated';
import api from '../../lib/api';
import * as Haptics from 'expo-haptics';

const MENU_ITEMS = [
    { icon: ShoppingBag, label: 'Миний захиалгууд', route: '/my-bookings', color: '#333333' },
    { icon: Bell, label: 'Мэдэгдэл', route: null, color: '#333333' },
    { icon: BookOpen, label: 'Блог', route: '/(tabs)/blog', color: '#333333' },
    { icon: CreditCard, label: 'Төлбөр', route: null, color: '#333333' },
    { icon: Settings, label: 'Тохиргоо', route: '/settings', color: '#333333' },
    { icon: LogOut, label: 'Гарах', route: 'logout', color: '#EF4444' },
];

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
    const uniqueMonks = bookings
        ? new Set(bookings.map((b: any) => b.monkId)).size
        : 0;

    const displayName =
        dbUser?.firstName || customUser?.firstName || clerkUser?.firstName || 'Зочин';
    const email =
        dbUser?.email || customUser?.email || clerkUser?.primaryEmailAddress?.emailAddress || '';
    const avatarUri =
        (dbUser as any)?.image || dbUser?.avatar || clerkUser?.imageUrl || 'https://i.pravatar.cc/150?u=self';

    if (!isAuthenticated) {
        return (
            <View style={styles.container}>
                <SafeAreaView style={[styles.flex, styles.centerContent]} edges={['top']}>
                    <View style={styles.guestAvatar}>
                        <Text style={styles.guestAvatarText}>👤</Text>
                    </View>
                    <Text style={styles.guestTitle}>Нэвтрэх</Text>
                    <Text style={styles.guestSubtitle}>
                        Цаг захиалах, түүхээ харахын тулд нэвтэрнэ үү
                    </Text>
                    <TouchableOpacity
                        style={styles.signInButton}
                        activeOpacity={0.8}
                        onPress={() => router.push('/(auth)/sign-in')}
                    >
                        <Text style={styles.signInButtonText}>Нэвтрэх</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.signUpButton}
                        activeOpacity={0.8}
                        onPress={() => router.push('/(auth)/sign-up')}
                    >
                        <Text style={styles.signUpButtonText}>Бүртгүүлэх</Text>
                    </TouchableOpacity>
                </SafeAreaView>
            </View>
        );
    }

    const handleMenuPress = async (route: string | null) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (route === 'logout') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            if (isCustomAuth) await customLogout();
            if (isSignedIn) await signOut();
            router.replace('/(auth)/sign-in');
            return;
        }
        if (route) router.push(route as any);
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.flex} edges={['top']}>
                <ScrollView
                    style={styles.flex}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing || isLoading}
                            onRefresh={onRefresh}
                            tintColor="#E5B22D"
                            colors={['#E5B22D']}
                        />
                    }
                >
                    {/* ===== AVATAR SECTION ===== */}
                    <View style={styles.avatarSection}>
                        <View style={styles.avatarBorder}>
                            <Image
                                source={{ uri: avatarUri }}
                                style={styles.avatarImage}
                                contentFit="cover"
                            />
                        </View>
                        <Text style={styles.profileName}>{displayName}</Text>
                        <Text style={styles.profileEmail}>{email}</Text>

                        <View style={styles.premiumBadge}>
                            <Sparkles size={14} color="#E5B22D" />
                            <Text style={styles.premiumText}>Premium гишүүн</Text>
                        </View>
                    </View>

                    {/* ===== STATS CARD ===== */}
                    <View style={styles.statsCard}>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{totalBookings}</Text>
                            <Text style={styles.statLabel}>Захиалга</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{completedBookings}</Text>
                            <Text style={styles.statLabel}>Дууссан</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{uniqueMonks}</Text>
                            <Text style={styles.statLabel}>Үзмэрч</Text>
                        </View>
                    </View>

                    {/* ===== MENU OPTIONS ===== */}
                    <View style={styles.menuCard}>
                        {MENU_ITEMS.map((item, index) => {
                            const Icon = item.icon;
                            const isLast = index === MENU_ITEMS.length - 1;
                            const isLogout = item.label === 'Гарах';

                            return (
                                <TouchableOpacity
                                    key={item.label}
                                    style={[
                                        styles.menuItem,
                                        !isLast && styles.menuItemBorder,
                                    ]}
                                    activeOpacity={0.6}
                                    onPress={() => handleMenuPress(item.route)}
                                >
                                    <Icon size={20} color={item.color} strokeWidth={1.8} />
                                    <Text style={[
                                        styles.menuLabel,
                                        isLogout && styles.menuLabelLogout,
                                    ]}>
                                        {item.label}
                                    </Text>
                                    <ChevronRight size={18} color="#CCCCCC" strokeWidth={1.5} />
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const CARD_SHADOW = {
    shadowColor: '#000' as const,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFDF4' },
    flex: { flex: 1 },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },
    centerContent: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },

    // Guest state
    guestAvatar: {
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: '#F0F0F0', alignItems: 'center',
        justifyContent: 'center', marginBottom: 20,
    },
    guestAvatarText: { fontSize: 36 },
    guestTitle: {
        fontSize: 24, fontWeight: '700', color: '#333333', marginBottom: 8,
    },
    guestSubtitle: {
        fontSize: 14, color: '#888888', textAlign: 'center',
        marginBottom: 28, lineHeight: 22,
    },
    signInButton: {
        backgroundColor: '#E5B22D', borderRadius: 20,
        paddingVertical: 16, width: '100%',
        alignItems: 'center', marginBottom: 12,
    },
    signInButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
    signUpButton: {
        backgroundColor: '#FFFFFF', borderRadius: 20,
        paddingVertical: 16, width: '100%',
        alignItems: 'center', borderWidth: 1.5, borderColor: '#E5B22D',
    },
    signUpButtonText: { color: '#E5B22D', fontWeight: '700', fontSize: 16 },

    // Avatar section
    avatarSection: { alignItems: 'center', paddingTop: 32, marginBottom: 28 },
    avatarBorder: {
        width: 104, height: 104, borderRadius: 52,
        borderWidth: 3, borderColor: '#E5B22D',
        padding: 3, marginBottom: 16,
    },
    avatarImage: { width: '100%', height: '100%', borderRadius: 48 },
    profileName: {
        fontSize: 24, fontWeight: '700', color: '#333333', marginBottom: 4,
    },
    profileEmail: { fontSize: 14, color: '#888888', marginBottom: 16 },

    premiumBadge: {
        flexDirection: 'row', alignItems: 'center',
        borderWidth: 1.5, borderColor: '#E5B22D',
        borderRadius: 30, paddingHorizontal: 16, paddingVertical: 8, gap: 8,
    },
    premiumText: { fontSize: 13, fontWeight: '600', color: '#E5B22D' },

    // Stats
    statsCard: {
        flexDirection: 'row', backgroundColor: '#FFFFFF',
        borderRadius: 20, padding: 20,
        marginBottom: 20, alignItems: 'center',
        ...CARD_SHADOW,
    },
    statItem: { flex: 1, alignItems: 'center' },
    statNumber: {
        fontSize: 24, fontWeight: '800', color: '#E5B22D', marginBottom: 4,
    },
    statLabel: { fontSize: 12, color: '#888888', fontWeight: '500' },
    statDivider: { width: 1, height: 36, backgroundColor: '#F0F0F0' },

    // Menu
    menuCard: {
        backgroundColor: '#FFFFFF', borderRadius: 20,
        overflow: 'hidden', ...CARD_SHADOW,
    },
    menuItem: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 20, paddingVertical: 18,
    },
    menuItemBorder: { borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
    menuLabel: {
        flex: 1, fontSize: 15, fontWeight: '500',
        color: '#333333', marginLeft: 16,
    },
    menuLabelLogout: { color: '#EF4444' },
});
