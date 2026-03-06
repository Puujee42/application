import React, { useState, useMemo, useCallback } from 'react';
import {
    View, Text, TextInput, Pressable,
    StyleSheet, FlatList, RefreshControl, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Search, Star } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Monk } from '../../src/types/schema';
import api from '../../lib/api';
import { COLORS, SHADOWS } from '../../design-system/theme';

// ─── CONSTANTS ────────────────────────────────────────
const FILTERS = ['Бүгд', 'Таро', 'Зурхай', 'Зөн', 'Эрчим хүч'];

const FILTER_MAP: Record<string, string[]> = {
    'Таро': ['tarot', 'тaro', 'таро'],
    'Зурхай': ['astrology', 'зурхай', 'horoscope'],
    'Зөн': ['intuition', 'зөн', 'psychic', 'divination'],
    'Эрчим хүч': ['energy', 'эрчим', 'healing', 'reiki'],
};

const BLURHASH = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

// ─── HELPERS ──────────────────────────────────────────
const t = (data: { mn?: string; en?: string } | string | undefined): string => {
    if (!data) return '';
    if (typeof data === 'string') return data;
    return data.mn || data.en || '';
};

const formatPrice = (monk: Monk): string => {
    const price = monk.services?.[0]?.price;
    if (price) return `${price.toLocaleString()}₮`;
    return monk.isSpecial ? '888,000₮' : '50,000₮';
};

// ─── SKELETON ─────────────────────────────────────────
const SkeletonCard = () => (
    <View style={styles.skeletonCard}>
        <View style={styles.skeletonRow}>
            <View style={styles.skeletonAvatar} />
            <View style={{ flex: 1, marginLeft: 14 }}>
                <View style={[styles.skeletonLine, { width: '60%' }]} />
                <View style={[styles.skeletonLine, { width: '40%', marginTop: 8 }]} />
                <View style={[styles.skeletonLine, { width: '30%', marginTop: 8 }]} />
            </View>
        </View>
        <View style={[styles.skeletonLine, { width: '100%', height: 44, marginTop: 16, borderRadius: 18 }]} />
    </View>
);

// ─── MAIN SCREEN ──────────────────────────────────────
export default function MonksScreen() {
    const router = useRouter();
    const [activeFilter, setActiveFilter] = useState('Бүгд');
    const [searchText, setSearchText] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    const { data: monks, isLoading, refetch } = useQuery({
        queryKey: ['monks'],
        queryFn: async () => {
            const res = await api.get('/monks');
            return res.data as Monk[];
        },
    });

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    }, [refetch]);

    // ── Real-time filter with useMemo ──
    const filteredMonks = useMemo(() => {
        if (!monks) return [];
        let result = monks;

        // Category filter
        if (activeFilter !== 'Бүгд') {
            const keywords = FILTER_MAP[activeFilter] || [];
            result = result.filter((monk) => {
                const specialties = monk.specialties?.map(s => s.toLowerCase()) || [];
                const title = t(monk.title).toLowerCase();
                return keywords.some(kw =>
                    specialties.some(s => s.includes(kw)) || title.includes(kw)
                );
            });
        }

        // Search text filter
        if (searchText.trim()) {
            const query = searchText.toLowerCase().trim();
            result = result.filter((monk) => {
                const name = t(monk.name).toLowerCase();
                const title = t(monk.title).toLowerCase();
                return name.includes(query) || title.includes(query);
            });
        }

        return result;
    }, [monks, activeFilter, searchText]);

    // ── Render monk card ──
    const renderMonkCard = useCallback(({ item, index }: { item: Monk; index: number }) => (
        <Animated.View entering={FadeInDown.delay(index * 80).duration(500)}>
            <Pressable
                style={styles.monkCard}
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(`/monk/${item._id}`);
                }}
            >
                {/* Top: Avatar + Info */}
                <View style={styles.monkCardRow}>
                    <View style={styles.avatarWrap}>
                        <Image
                            source={{ uri: item.image || 'https://via.placeholder.com/150' }}
                            style={styles.monkAvatar}
                            contentFit="cover"
                            placeholder={BLURHASH}
                            transition={300}
                        />
                        {item.isSpecial && (
                            <LinearGradient
                                colors={[COLORS.gold, COLORS.deepGold]}
                                style={styles.specialBadge}
                            >
                                <Text style={styles.specialBadgeText}>✨</Text>
                            </LinearGradient>
                        )}
                    </View>

                    <View style={styles.monkDetails}>
                        <Text style={styles.monkName} numberOfLines={1}>{t(item.name)}</Text>
                        <Text style={styles.monkTitle} numberOfLines={1}>{t(item.title)}</Text>
                        <View style={styles.ratingRow}>
                            <Star size={13} color={COLORS.gold} fill={COLORS.gold} />
                            <Text style={styles.ratingText}>4.9</Text>
                            <Text style={styles.reviewCount}>
                                ({item.yearsOfExperience || 0} жил)
                            </Text>
                        </View>
                    </View>

                    <Text style={styles.monkPrice}>{formatPrice(item)}</Text>
                </View>

                {/* CTA Button */}
                <Pressable
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        router.push(`/booking/${item._id}`);
                    }}
                >
                    <LinearGradient
                        colors={[COLORS.gold, COLORS.deepGold]}
                        style={[styles.bookBtn, SHADOWS.gold]}
                    >
                        <Text style={styles.bookBtnText}>Цаг захиалах →</Text>
                    </LinearGradient>
                </Pressable>
            </Pressable>
        </Animated.View>
    ), [router]);

    return (
        <View style={styles.container}>
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                {/* ─── HEADER ─── */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Үзмэрчид</Text>
                    <Text style={styles.headerSub}>
                        {monks ? `${monks.length} үзмэрч` : ''}
                    </Text>
                </View>

                {/* ─── SEARCH BAR ─── */}
                <View style={styles.searchWrap}>
                    <View style={styles.searchBar}>
                        <Search size={20} color={COLORS.gold} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Үзмэрч хайх..."
                            placeholderTextColor={COLORS.textLight}
                            value={searchText}
                            onChangeText={setSearchText}
                        />
                    </View>
                </View>

                {/* ─── FILTER CHIPS ─── */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterScroll}
                    style={styles.filterContainer}
                >
                    {FILTERS.map((filter) => {
                        const isActive = filter === activeFilter;
                        return isActive ? (
                            <LinearGradient
                                key={filter}
                                colors={[COLORS.gold, COLORS.deepGold]}
                                style={styles.filterChip}
                            >
                                <Pressable
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        setActiveFilter(filter);
                                    }}
                                >
                                    <Text style={styles.filterTextActive}>{filter}</Text>
                                </Pressable>
                            </LinearGradient>
                        ) : (
                            <Pressable
                                key={filter}
                                style={styles.filterChipInactive}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    setActiveFilter(filter);
                                }}
                            >
                                <Text style={styles.filterTextInactive}>{filter}</Text>
                            </Pressable>
                        );
                    })}
                </ScrollView>

                {/* ─── MONK LIST ─── */}
                {isLoading ? (
                    <View style={styles.listContent}>
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                    </View>
                ) : (
                    <FlatList
                        data={filteredMonks}
                        keyExtractor={(item) => item._id || ''}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                tintColor={COLORS.gold}
                                colors={[COLORS.gold]}
                            />
                        }
                        renderItem={renderMonkCard}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyEmoji}>🔮</Text>
                                <Text style={styles.emptyText}>
                                    Хайлтад тохирох үзмэрч олдсонгүй
                                </Text>
                            </View>
                        }
                    />
                )}
            </SafeAreaView>
        </View>
    );
}

// ─── STYLES ───────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },

    /* Header */
    header: {
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 12,
    },
    headerTitle: {
        fontFamily: 'Georgia',
        fontSize: 26,
        fontWeight: '800',
        color: COLORS.text,
    },
    headerSub: {
        fontSize: 13,
        color: COLORS.textLight,
        marginTop: 2,
    },

    /* Search */
    searchWrap: {
        paddingHorizontal: 20,
        marginBottom: 14,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.85)',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 13,
        borderWidth: 1,
        borderColor: COLORS.border,
        ...SHADOWS.card,
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        fontSize: 15,
        color: COLORS.text,
        fontWeight: '500',
    },

    /* Filters */
    filterContainer: {
        marginBottom: 14,
        maxHeight: 48,
    },
    filterScroll: {
        paddingHorizontal: 20,
        gap: 10,
    },
    filterChip: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 30,
    },
    filterChipInactive: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    filterTextActive: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1A0800',
    },
    filterTextInactive: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textMid,
    },

    /* List */
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 110,
    },

    /* Monk Card */
    monkCard: {
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 22,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 16,
        marginBottom: 14,
        ...SHADOWS.card,
    },
    monkCardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    avatarWrap: {
        position: 'relative',
    },
    monkAvatar: {
        width: 60,
        height: 60,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: COLORS.gold,
        backgroundColor: COLORS.goldPale,
    },
    specialBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        width: 22,
        height: 22,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
    },
    specialBadgeText: {
        fontSize: 11,
    },
    monkDetails: {
        flex: 1,
        marginLeft: 14,
    },
    monkName: {
        fontFamily: 'Georgia',
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 2,
    },
    monkTitle: {
        fontSize: 13,
        color: COLORS.textLight,
        marginBottom: 6,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingText: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.text,
        marginLeft: 4,
    },
    reviewCount: {
        fontSize: 12,
        color: COLORS.textLight,
        marginLeft: 6,
    },
    monkPrice: {
        fontFamily: 'Georgia',
        fontSize: 16,
        fontWeight: '800',
        color: COLORS.gold,
    },

    /* Book Button */
    bookBtn: {
        borderRadius: 18,
        paddingVertical: 13,
        alignItems: 'center',
    },
    bookBtnText: {
        color: '#1A0800',
        fontWeight: '800',
        fontSize: 14,
        letterSpacing: 0.5,
    },

    /* Skeleton */
    skeletonCard: {
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 22,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 16,
        marginBottom: 14,
    },
    skeletonRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    skeletonAvatar: {
        width: 60,
        height: 60,
        borderRadius: 20,
        backgroundColor: COLORS.goldPale,
    },
    skeletonLine: {
        height: 14,
        borderRadius: 7,
        backgroundColor: COLORS.goldPale,
    },

    /* Empty */
    emptyContainer: {
        alignItems: 'center',
        paddingTop: 80,
    },
    emptyEmoji: {
        fontSize: 48,
        marginBottom: 16,
    },
    emptyText: {
        fontFamily: 'Georgia',
        fontSize: 16,
        color: COLORS.textLight,
        fontStyle: 'italic',
        textAlign: 'center',
    },
});
