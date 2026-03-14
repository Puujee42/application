import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
    View, Text, TextInput, Pressable,
    StyleSheet, FlatList, RefreshControl, ScrollView, Platform, Animated as RNAnimated, Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Search, Star } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import TouchableScale from '../../components/ui/TouchableScale';
import { Monk } from '../../src/types/schema';
import api from '../../lib/api';
import { mapMonkToUI } from '../../lib/mappers';
import { COLORS, SHADOWS, FONT } from '../../design-system/theme';

// ─── CONSTANTS ────────────────────────────────────────
const FILTERS = ['Бүгд', 'Таро', 'Зурхай', 'Зөн', 'Эрчим хүч'];

const FILTER_MAP: Record<string, string[]> = {
    'Таро': ['tarot', 'тaro', 'таро'],
    'Зурхай': ['astrology', 'зурхай', 'horoscope'],
    'Зөн': ['intuition', 'зөн', 'psychic', 'divination'],
    'Эрчим хүч': ['energy', 'эрчим', 'healing', 'reiki'],
};

const BLURHASH = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

const t = (data: { mn?: string; en?: string } | string | undefined): string => {
    if (!data) return '';
    if (typeof data === 'string') return data;
    return data.mn || data.en || '';
};

// ─── SKELETON ─────────────────────────────────────────
const SkeletonCard = () => {
    const pulse = useRef(new RNAnimated.Value(0.35)).current;

    useEffect(() => {
        RNAnimated.loop(
            RNAnimated.sequence([
                RNAnimated.timing(pulse, { toValue: 0.75, duration: 900, useNativeDriver: true }),
                RNAnimated.timing(pulse, { toValue: 0.35, duration: 900, useNativeDriver: true }),
            ])
        ).start();
    }, [pulse]);

    return (
        <RNAnimated.View style={[styles.skeletonCard, { opacity: pulse }]}>
            <View style={styles.skeletonRow}>
                <View style={styles.skeletonAvatar} />
                <View style={{ flex: 1, marginLeft: 14 }}>
                    <View style={[styles.skeletonLine, { width: '60%' }]} />
                    <View style={[styles.skeletonLine, { width: '40%', marginTop: 8 }]} />
                    <View style={[styles.skeletonLine, { width: '30%', marginTop: 8 }]} />
                </View>
            </View>
            <View style={[styles.skeletonLine, { width: '100%', height: 48, marginTop: 16, borderRadius: 16 }]} />
        </RNAnimated.View>
    );
};

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

    const renderMonkCard = useCallback(({ item, index }: { item: Monk; index: number }) => {
        const uiModel = mapMonkToUI(item);

        return (
            <Animated.View entering={FadeInDown.delay(Math.min(index * 80, 320)).duration(500)}>
                <TouchableScale
                    style={styles.monkCard}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push(`/monk/${uiModel.id}`);
                    }}
                >
                    {/* Special badge */}
                    {uiModel.isSpecial && (
                        <View style={styles.specialBadge}>
                            <Text style={styles.specialBadgeText}>★ Онцлох</Text>
                        </View>
                    )}

                    {/* Top: Avatar + Info */}
                    <View style={styles.cardContent}>
                        <View style={styles.monkCardRow}>
                            <Image
                                source={{ uri: uiModel.avatarUrl }}
                                style={styles.monkAvatar}
                                contentFit="cover"
                                placeholder={BLURHASH}
                                transition={300}
                            />

                            <View style={styles.monkDetails}>
                                <Text style={styles.monkName} numberOfLines={1}>{uiModel.name}</Text>
                                <Text style={styles.monkTitle} numberOfLines={1}>{uiModel.title}</Text>

                                {/* Tag chips */}
                                {uiModel.tags.length > 0 && (
                                    <View style={styles.chipRow}>
                                        {uiModel.tags.slice(0, 2).map((sp, i) => (
                                            <View key={i} style={styles.chip}>
                                                <Text style={styles.chipText}>{sp}</Text>
                                            </View>
                                        ))}
                                    </View>
                                )}

                                {/* Rating */}
                                <View style={styles.ratingRow}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <Star key={i} size={10} color={COLORS.goldBright} fill={COLORS.goldBright} />
                                        ))}
                                    </View>
                                    <Text style={styles.ratingText}>{uiModel.rating}</Text>
                                    <Text style={styles.reviewCount}>{uiModel.experienceText}</Text>
                                </View>
                            </View>

                            <Text style={styles.monkPrice}>{uiModel.priceFormatted}</Text>
                        </View>

                        {/* CTA Button */}
                        <TouchableScale
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                router.push(`/booking/${item._id}`);
                            }}
                        >
                            <LinearGradient
                                colors={[COLORS.goldBright, COLORS.gold, COLORS.amber]}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                style={[styles.bookBtn, SHADOWS.glow]}
                            >
                                <View style={styles.btnShine} />
                                <Text style={styles.bookBtnText}>Цаг захиалах →</Text>
                            </LinearGradient>
                        </TouchableScale>
                    </View>
                </TouchableScale>
            </Animated.View>
        );
    }, [router]);

    return (
        <View style={styles.container}>
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                {/* ─── HEADER ─── */}
                <Animated.View entering={FadeInDown.delay(0).duration(500)} style={styles.header}>
                    <Text style={styles.headerTitle}>Үзмэрчид</Text>
                    <Text style={styles.headerSub}>
                        {monks ? `${monks.length} мэргэжилтэн бэлэн` : ''}
                    </Text>
                </Animated.View>

                {/* ─── SEARCH BAR ─── */}
                <Animated.View entering={FadeInDown.delay(80).duration(500)} style={styles.searchWrap}>
                    <View style={styles.searchBar}>
                        <Search size={16} color={COLORS.gold} style={{ marginRight: 8 }} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Үзмэрч хайх..."
                            placeholderTextColor={COLORS.textMute}
                            value={searchText}
                            onChangeText={setSearchText}
                        />
                    </View>
                </Animated.View>

                {/* ─── FILTER CHIPS ─── */}
                <Animated.View entering={FadeInDown.delay(160).duration(500)}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.filterScroll}
                        style={styles.filterContainer}
                    >
                        {FILTERS.map((filter) => {
                            const isActive = filter === activeFilter;
                            return isActive ? (
                                <TouchableScale
                                    key={filter}
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        setActiveFilter(filter);
                                    }}
                                >
                                    <LinearGradient
                                        colors={[COLORS.goldBright, COLORS.gold]}
                                        style={[styles.filterChipActive, SHADOWS.glow]}
                                    >
                                        <Text style={styles.filterTextActive}>{filter}</Text>
                                    </LinearGradient>
                                </TouchableScale>
                            ) : (
                                <TouchableScale
                                    key={filter}
                                    style={styles.filterChipInactive}
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        setActiveFilter(filter);
                                    }}
                                >
                                    <Text style={styles.filterTextInactive}>{filter}</Text>
                                </TouchableScale>
                            );
                        })}
                    </ScrollView>
                </Animated.View>

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
                                <Text style={styles.emptyEmoji}>📿</Text>
                                <Text style={styles.emptyTitle}>Хайлтад тохирох үзмэрч олдсонгүй</Text>
                                <Text style={styles.emptySub}>Өөр түлхүүр үгээр хайгаад үзээрэй</Text>
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
        fontFamily: FONT.display,
        fontSize: 28,
        fontWeight: '700',
        color: COLORS.text,
    },
    headerSub: {
        fontSize: 13,
        color: COLORS.textMute,
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
        backgroundColor: COLORS.surface,
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
        height: 46,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
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
        gap: 8,
    },
    filterChipActive: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
        elevation: 5,
    },
    filterChipInactive: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    filterTextActive: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1C0E00',
    },
    filterTextInactive: {
        fontSize: 12,
        fontWeight: '500',
        color: COLORS.textSub,
    },

    /* List */
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: Platform.OS === 'ios' ? 116 : 96,
    },

    /* Monk Card */
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
    specialBadge: {
        backgroundColor: 'rgba(232,184,48,0.12)',
        height: 28,
        paddingLeft: 14,
        justifyContent: 'center',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.divider,
    },
    specialBadgeText: {
        fontSize: 10,
        letterSpacing: 1,
        color: COLORS.gold,
        fontWeight: '600',
        fontFamily: FONT.display,
    },
    cardContent: {
        padding: 14,
    },
    monkCardRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 14,
    },
    monkAvatar: {
        width: 56,
        height: 56,
        borderRadius: 18,
        borderWidth: 1.5,
        borderColor: COLORS.borderMed,
        backgroundColor: COLORS.goldPale,
    },
    monkDetails: {
        flex: 1,
        marginLeft: 12,
    },
    monkName: {
        fontFamily: FONT.display,
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 2,
    },
    monkTitle: {
        fontSize: 12,
        color: COLORS.textSub,
        marginBottom: 6,
    },
    chipRow: {
        flexDirection: 'row',
        gap: 5,
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
    ratingText: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.text,
    },
    reviewCount: {
        fontSize: 11,
        color: COLORS.textMute,
    },
    monkPrice: {
        fontFamily: FONT.display,
        fontSize: 15,
        fontWeight: '800',
        color: COLORS.gold,
    },

    /* Book Button */
    bookBtn: {
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
    bookBtnText: {
        color: '#1C0E00',
        fontWeight: '800',
        fontSize: 15,
        letterSpacing: 0.5,
        fontFamily: FONT.display,
    },

    /* Skeleton */
    skeletonCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 16,
        marginBottom: 14,
        ...SHADOWS.md,
    },
    skeletonRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    skeletonAvatar: {
        width: 56,
        height: 56,
        borderRadius: 18,
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
        paddingVertical: 72,
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
});
