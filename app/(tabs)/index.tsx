import React, { useCallback, useState, useRef } from 'react';
import {
    ScrollView, View, Text, Pressable,
    StyleSheet, Dimensions, RefreshControl, Platform, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { getMonks, getRecentConversations } from '../../lib/api';
import { Bell, Star } from 'lucide-react-native';
import { useUser } from '../../lib/useClerkSafe';
import { useUserStore } from '../../store/userStore';
import { useAuthStore } from '../../store/authStore';
import { useIsAuthenticated } from '../../hooks/useIsAuthenticated';
import { Monk } from '../../src/types/schema';
import { COLORS, SHADOWS, FONT } from '../../design-system/theme';
import * as Haptics from 'expo-haptics';
import Reanimated, { FadeInDown } from 'react-native-reanimated';
import TouchableScale from '../../components/ui/TouchableScale';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SERVICES = [
    { emoji: '🃏', label: 'Таро уншилт' },
    { emoji: '♈', label: 'Зурхай' },
    { emoji: '🌙', label: 'Сарны зөн' },
    { emoji: '⚡', label: 'Эрчим хүч' },
];

const t = (data: { mn?: string; en?: string } | string | undefined): string => {
    if (!data) return '';
    if (typeof data === 'string') return data;
    return data.mn || data.en || '';
};

const formatPrice = (monk: Monk): string => {
    const price = monk.services?.[0]?.price;
    if (price) return `${price.toLocaleString()}₮`;
    return monk.isSpecial ? '88,000₮' : '50,000₮';
};

const ReanimatedPressable = Reanimated.createAnimatedComponent(Pressable);

export default function HomeScreen() {
    const router = useRouter();
    const { user: clerkUser } = useUser();
    const { user: dbUser } = useUserStore();
    const { customUser } = useAuthStore();
    const isAuthenticated = useIsAuthenticated();
    const [refreshing, setRefreshing] = useState(false);

    const { data: monks, refetch, isLoading } = useQuery({
        queryKey: ['monks'],
        queryFn: getMonks,
    });
    
    // Fetch recent conversations for the new "Top chatting with" section
    const { data: recentChats, refetch: refetchChats } = useQuery({
        queryKey: ['recent-conversations'],
        queryFn: getRecentConversations,
        enabled: !!dbUser || !!customUser || !!clerkUser,
    });

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([refetch(), refetchChats()]);
        setRefreshing(false);
    }, [refetch, refetchChats]);

    const displayName = dbUser?.firstName || customUser?.firstName || clerkUser?.firstName || 'Зочин';
    const avatarUri = (dbUser as any)?.image || dbUser?.avatar || clerkUser?.imageUrl || 'https://i.pravatar.cc/150?u=self';

    const topMonks = monks?.slice(0, 5) || [];

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.flex} edges={['top']}>
                <ScrollView
                    style={styles.flex}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    showsHorizontalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={COLORS.gold}
                            colors={[COLORS.gold]}
                        />
                    }
                >
                    {/* ===== HEADER ===== */}
                    <Reanimated.View entering={FadeInDown.delay(0).duration(500)} style={styles.header}>
                        <View style={styles.headerLeft}>
                            <Text style={styles.greeting}>Сайн байна уу 👋</Text>
                            <Text style={styles.username}>{displayName}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            <Pressable
                                style={styles.bellContainer}

                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    router.push('/notifications');
                                }}
                            >
                                <Bell size={22} color={COLORS.text} strokeWidth={2} />
                            </Pressable>
                            <Pressable
                                style={styles.avatarContainer}

                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    router.push('/(tabs)/profile');
                                }}
                            >
                                <Image
                                    source={{ uri: avatarUri }}
                                    style={styles.avatarImage}
                                    contentFit="cover"
                                />
                            </Pressable>
                        </View>
                    </Reanimated.View>

                    {/* ===== HERO BANNER ===== */}
                    <Reanimated.View entering={FadeInDown.delay(80).duration(500)}>
                        <TouchableScale
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                router.push('/(tabs)/monks');
                            }}
                        >
                            <LinearGradient
                                colors={[COLORS.amber, COLORS.gold, COLORS.goldMid, COLORS.goldBright]}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                style={styles.heroBanner}
                            >
                                {/* Shine streak */}
                                <View style={styles.heroShine} />
                                {/* Bubble */}
                                <View style={styles.heroBubble} />
                                {/* Watermark */}
                                <Text style={styles.heroWatermark}>🔮</Text>

                                <Text style={styles.heroTitle}>
                                    Асуудлынхаа шийдлийг{'\n'}олоорой
                                </Text>
                                <Text style={styles.heroSub}>
                                    Мэргэжлийн үзмэрчидтэй холбогдоорой
                                </Text>
                                <View style={styles.heroCTA}>
                                    <Text style={styles.heroCTAText}>Цаг захиалах</Text>
                                </View>
                            </LinearGradient>
                        </TouchableScale>
                    </Reanimated.View>

                    {/* ===== RECENT CHATS (REPLACED SERVICES) ===== */}
                    <Reanimated.View entering={FadeInDown.delay(160).duration(500)}>
                        <Text style={styles.sectionTitle}>Сүүлд чатласан</Text>
                        
                        {!recentChats || recentChats.length === 0 ? (
                            <View style={[styles.serviceCard, { width: '100%', flexDirection: 'row', alignItems: 'center', marginBottom: 28, padding: 20 }]}>
                                <View style={[styles.serviceIconBg, { marginBottom: 0, marginRight: 16 }]}>
                                    <Text style={styles.serviceEmoji}>💬</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.monkName, { fontSize: 13, marginBottom: 4 }]}>Одоогоор чат алга байна</Text>
                                    <Text style={[styles.monkSubtitle, { marginBottom: 0, fontSize: 11 }]}>Аль нэг үзмэрчийн профайл руу орж зурвас бичээрэй.</Text>
                                </View>
                            </View>
                        ) : (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 28, marginHorizontal: -20, paddingHorizontal: 20 }} contentContainerStyle={{ paddingRight: 40, gap: 12 }}>
                                {recentChats.slice(0, 4).map((chat, index) => (
                                    <TouchableScale
                                        key={chat.partnerId}
                                        style={{ width: 140, backgroundColor: COLORS.surface, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, padding: 16, alignItems: 'center', ...SHADOWS.sm }}
                                        onPress={() => {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            router.push(`/messages/${chat.partnerId}`);
                                        }}
                                    >
                                        <Image
                                            source={{ uri: chat.partner?.image || 'https://via.placeholder.com/150' }}
                                            style={{ width: 64, height: 64, borderRadius: 32, marginBottom: 12, borderWidth: 2, borderColor: COLORS.goldPale, backgroundColor: '#f3f4f6' }}
                                            contentFit="cover"
                                        />
                                        {chat.partner?.isSpecial && (
                                            <View style={{ position: 'absolute', top: 12, right: 12, width: 16, height: 16, borderRadius: 8, backgroundColor: COLORS.gold, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.surface }}>
                                                <Star size={8} color="#FFF" fill="#FFF" />
                                            </View>
                                        )}
                                        <Text style={[styles.monkName, { textAlign: 'center', marginBottom: 4, fontSize: 13 }]} numberOfLines={1}>{chat.partner?.name || 'Unknown'}</Text>
                                        <Text style={[styles.monkSubtitle, { textAlign: 'center', marginBottom: 0, fontSize: 11 }]} numberOfLines={1}>
                                            {chat.lastMessage.text ? chat.lastMessage.text : '📷 Зураг'}
                                        </Text>
                                    </TouchableScale>
                                ))}
                            </ScrollView>
                        )}
                    </Reanimated.View>

                    {/* ===== TOP MONKS ===== */}
                    <Reanimated.View entering={FadeInDown.delay(240).duration(500)}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Шилдэг үзмэрчид</Text>
                            <Pressable
                                onPress={() => router.push('/(tabs)/monks')}

                            >
                                <Text style={styles.seeAll}>Бүгд →</Text>
                            </Pressable>
                        </View>

                        {isLoading && (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyText}>Уншиж байна...</Text>
                            </View>
                        )}

                        {!isLoading && topMonks.length === 0 && (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyEmoji}>📿</Text>
                                <Text style={styles.emptyTitle}>Одоогоор үзмэрч алга</Text>
                                <Text style={styles.emptySub}>Тун удахгүй нэмэгдэх болно</Text>
                            </View>
                        )}

                        {topMonks.map((monk, idx) => (
                            <Reanimated.View key={monk._id} entering={FadeInDown.delay(240 + Math.min(idx * 80, 320)).duration(500)}>
                                <TouchableScale
                                    style={styles.monkCard}
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        router.push(`/monk/${monk._id}`);
                                    }}
                                >
                                    {/* Special stripe */}
                                    {monk.isSpecial && (
                                        <View style={styles.specialStripe}>
                                            <View style={styles.specialDot} />
                                            <Text style={styles.specialText}>Онцлох үзмэрч</Text>
                                        </View>
                                    )}

                                    <View style={styles.monkContent}>
                                        <View style={styles.monkCardTop}>
                                            <Image
                                                source={{ uri: monk.image || 'https://via.placeholder.com/150' }}
                                                style={styles.monkAvatar}
                                                contentFit="cover"
                                            />
                                            <View style={styles.monkInfo}>
                                                <Text style={styles.monkName}>{t(monk.name)}</Text>
                                                <Text style={styles.monkSubtitle}>
                                                    {t(monk.title)} • {monk.yearsOfExperience || 0} жил
                                                </Text>
                                                {/* Tag chips */}
                                                {monk.specialties && monk.specialties.length > 0 && (
                                                    <View style={styles.chipRow}>
                                                        {monk.specialties.slice(0, 2).map((sp, i) => (
                                                            <View key={i} style={styles.chip}>
                                                                <Text style={styles.chipText}>{sp}</Text>
                                                            </View>
                                                        ))}
                                                    </View>
                                                )}
                                                {/* Rating */}
                                                <View style={styles.ratingRow}>
                                                    <Star size={10} color={COLORS.goldBright} fill={COLORS.goldBright} />
                                                    <Text style={styles.ratingNum}>{(monk as any).rating || '—'}</Text>
                                                </View>
                                            </View>
                                            <Text style={styles.monkPrice}>{formatPrice(monk)}</Text>
                                        </View>

                                        <TouchableScale
                                            onPress={() => {
                                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                router.push(`/booking/${monk._id}`);
                                            }}
                                            style={styles.bookButtonContainer}
                                        >
                                            <LinearGradient
                                                colors={[COLORS.goldBright, COLORS.gold, COLORS.amber]}
                                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                                style={[styles.bookButton, SHADOWS.glow]}
                                            >
                                                <View style={styles.btnShine} />
                                                <Text style={styles.bookButtonText}>Цаг захиалах →</Text>
                                            </LinearGradient>
                                        </TouchableScale>
                                    </View>
                                </TouchableScale>
                            </Reanimated.View>
                        ))}
                    </Reanimated.View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    flex: { flex: 1 },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: Platform.OS === 'ios' ? 116 : 96,
    },

    /* Header */
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
        marginBottom: 24,
    },
    headerLeft: { flex: 1 },
    greeting: {
        fontSize: 13,
        color: COLORS.textMute,
        fontWeight: '500',
        marginBottom: 4,
    },
    username: {
        fontSize: 24,
        fontWeight: '800',
        fontFamily: FONT.display,
        color: COLORS.text,
    },
    bellContainer: {
        width: 38, height: 38, borderRadius: 12, backgroundColor: COLORS.surface,
        borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center',
        ...SHADOWS.sm,
    },
    avatarContainer: {
        width: 44, height: 44, borderRadius: 14,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: COLORS.borderMed,
        ...SHADOWS.sm,
    },
    avatarImage: { width: '100%', height: '100%' },

    /* Hero Banner */
    heroBanner: {
        borderRadius: 22,
        padding: 22,
        marginBottom: 28,
        position: 'relative',
        overflow: 'hidden',
        ...SHADOWS.lg,
        elevation: 8,
    },
    heroShine: {
        position: 'absolute',
        top: 0,
        left: '-20%',
        width: '40%',
        height: '100%',
        backgroundColor: 'rgba(255,255,255,0.10)',
        transform: [{ skewX: '-15deg' }],
    },
    heroBubble: {
        position: 'absolute',
        right: -30,
        bottom: -30,
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: 'rgba(255,255,255,0.07)',
    },
    heroWatermark: {
        position: 'absolute',
        right: 14,
        top: 10,
        fontSize: 56,
        opacity: 0.12,
    },
    heroTitle: {
        fontSize: 19,
        fontWeight: '800',
        color: '#FFFBEC',
        fontFamily: FONT.display,
        lineHeight: 27,
        marginBottom: 6,
    },
    heroSub: {
        fontSize: 12,
        color: 'rgba(255,248,220,0.70)',
        marginBottom: 18,
    },
    heroCTA: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255,252,242,0.92)',
        borderRadius: 22,
        paddingHorizontal: 18,
        paddingVertical: 9,
    },
    heroCTAText: {
        color: COLORS.amber,
        fontWeight: '800',
        fontSize: 13,
    },

    /* Section */
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        fontFamily: FONT.display,
        color: COLORS.text,
        marginBottom: 14,
    },
    seeAll: {
        fontSize: 13,
        color: COLORS.gold,
        fontWeight: '600',
        marginBottom: 14,
    },

    /* Service cards (2x2 grid) */
    servicesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 28,
    },
    serviceCard: {
        width: (SCREEN_WIDTH - 56) / 2,
        backgroundColor: COLORS.surface,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingVertical: 18,
        paddingHorizontal: 14,
        alignItems: 'center',
        marginBottom: 12,
        ...SHADOWS.sm,
        elevation: 2,
        overflow: 'hidden',
    },
    serviceIconBg: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 9,
    },
    serviceEmoji: { fontSize: 24 },
    serviceLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.textSub,
    },

    /* Monk cards */
    monkCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 0,
        overflow: 'hidden',
        marginBottom: 14,
        ...SHADOWS.md,
        elevation: 4,
    },
    specialStripe: {
        height: 28,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.divider,
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 14,
        gap: 5,
    },
    specialDot: {
        width: 4, height: 4, borderRadius: 2,
        backgroundColor: COLORS.gold,
    },
    specialText: {
        fontSize: 10,
        color: COLORS.gold,
        letterSpacing: 1,
        fontWeight: '600',
        fontFamily: FONT.display,
    },
    monkContent: {
        padding: 14,
    },
    monkCardTop: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 14,
    },
    monkAvatar: {
        width: 56, height: 56, borderRadius: 16,
        borderWidth: 1.5,
        borderColor: COLORS.borderMed,
        backgroundColor: COLORS.goldPale,
    },
    monkInfo: { flex: 1, marginLeft: 12 },
    monkName: {
        fontSize: 15,
        fontWeight: '700',
        fontFamily: FONT.display,
        color: COLORS.text,
        marginBottom: 2,
    },
    monkSubtitle: {
        fontSize: 12,
        color: COLORS.textSub,
        marginBottom: 6,
    },
    chipRow: {
        flexDirection: 'row',
        gap: 6,
        marginBottom: 6,
    },
    chip: {
        backgroundColor: 'rgba(200,150,12,0.09)',
        borderRadius: 6,
        paddingHorizontal: 7,
        paddingVertical: 2,
    },
    chipText: {
        fontSize: 10,
        color: COLORS.gold,
        fontWeight: '600',
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingNum: {
        fontSize: 11,
        fontWeight: '700',
        color: COLORS.text,
    },
    monkPrice: {
        fontFamily: FONT.display,
        fontSize: 15,
        fontWeight: '800',
        color: COLORS.gold,
    },
    bookButtonContainer: {
        width: '100%',
    },
    bookButton: {
        borderRadius: 16,
        paddingVertical: 15,
        alignItems: 'center',
        elevation: 8,
    },
    btnShine: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.22)',
    },
    bookButtonText: {
        color: '#1C0E00',
        fontWeight: '800',
        fontSize: 15,
        letterSpacing: 0.5,
        fontFamily: FONT.display,
    },

    /* Empty state */
    emptyState: {
        paddingVertical: 72,
        alignItems: 'center',
    },
    emptyEmoji: {
        fontSize: 56,
        marginBottom: 18,
    },
    emptyTitle: {
        fontFamily: FONT.display,
        fontSize: 17,
        fontWeight: '600',
        color: COLORS.textSub,
    },
    emptySub: {
        fontSize: 13,
        color: COLORS.textMute,
        textAlign: 'center',
        marginTop: 6,
        lineHeight: 20,
    },
    emptyText: {
        color: COLORS.textMute,
    }
});
