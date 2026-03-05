import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    StyleSheet,
    FlatList,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { X, Search, Star } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Monk } from '../../src/types/schema';
import api from '../../lib/api';
import { useCallback } from 'react';
import { ScrollView } from 'react-native';

const FILTERS = ['Бүгд', 'Таро', 'Зурхай', 'Зөн'];

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

export default function SearchScreen() {
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

    const filteredMonks = useMemo(() => {
        if (!monks) return [];
        let result = monks;

        // Filter by category
        if (activeFilter !== 'Бүгд') {
            const filterMap: Record<string, string[]> = {
                'Таро': ['tarot', 'тaro', 'таро'],
                'Зурхай': ['astrology', 'зурхай', 'horoscope'],
                'Зөн': ['intuition', 'зөн', 'psychic', 'divination'],
            };
            const keywords = filterMap[activeFilter] || [];
            result = result.filter((monk) => {
                const specialties = monk.specialties?.map(s => s.toLowerCase()) || [];
                const title = t(monk.title).toLowerCase();
                return keywords.some(kw =>
                    specialties.some(s => s.includes(kw)) || title.includes(kw)
                );
            });
        }

        // Filter by search text
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

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.flex} edges={['top']}>
                {/* ===== HEADER ===== */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.closeButton}
                        activeOpacity={0.7}
                        onPress={() => router.back()}
                    >
                        <X size={20} color="#333333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Үзмэрчид</Text>
                    <View style={styles.headerSpacer} />
                </View>

                {/* ===== SEARCH BAR ===== */}
                <View style={styles.searchContainer}>
                    <View style={styles.searchBar}>
                        <Search size={20} color="#888888" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Үзмэрч хайх..."
                            placeholderTextColor="#888888"
                            value={searchText}
                            onChangeText={setSearchText}
                        />
                    </View>
                </View>

                {/* ===== FILTER CHIPS ===== */}
                <View style={styles.filterContainer}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.filterScroll}
                    >
                        {FILTERS.map((filter) => {
                            const isActive = filter === activeFilter;
                            return (
                                <TouchableOpacity
                                    key={filter}
                                    style={[
                                        styles.filterChip,
                                        isActive ? styles.filterChipActive : styles.filterChipInactive,
                                    ]}
                                    activeOpacity={0.7}
                                    onPress={() => setActiveFilter(filter)}
                                >
                                    <Text style={[
                                        styles.filterText,
                                        isActive ? styles.filterTextActive : styles.filterTextInactive,
                                    ]}>
                                        {filter}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* ===== MONK LIST ===== */}
                <FlatList
                    data={filteredMonks}
                    keyExtractor={(item) => item._id || ''}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#E5B22D"
                            colors={['#E5B22D']}
                        />
                    }
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.monkCard}
                            activeOpacity={0.8}
                            onPress={() => router.push(`/monk/${item._id}`)}
                        >
                            {/* Top row: avatar + info + rating */}
                            <View style={styles.monkCardRow}>
                                <Image
                                    source={{ uri: item.image || 'https://via.placeholder.com/150' }}
                                    style={styles.monkAvatar}
                                    contentFit="cover"
                                />
                                <View style={styles.monkDetails}>
                                    <Text style={styles.monkName}>{t(item.name)}</Text>
                                    <Text style={styles.monkTitle}>{t(item.title)}</Text>
                                    <View style={styles.ratingRow}>
                                        <Star size={14} color="#E5B22D" fill="#E5B22D" />
                                        <Text style={styles.ratingText}>4.9</Text>
                                        <Text style={styles.reviewCount}>
                                            ({item.yearsOfExperience || 0} жил)
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* Bottom row: price + CTA */}
                            <View style={styles.monkCardBottom}>
                                <View>
                                    <Text style={styles.sessionLabel}>Нэг сесс</Text>
                                    <Text style={styles.monkPrice}>{formatPrice(item)}</Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.bookButton}
                                    activeOpacity={0.8}
                                    onPress={() => router.push(`/booking/${item._id}`)}
                                >
                                    <Text style={styles.bookButtonText}>Цаг захиалах →</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>
                                {isLoading ? 'Уншиж байна...' : 'Үзмэрч олдсонгүй'}
                            </Text>
                        </View>
                    }
                />
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

    header: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 12,
    },
    closeButton: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: '#F0F0F0',
        alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: { fontSize: 22, fontWeight: '700', color: '#333333' },
    headerSpacer: { width: 40 },

    searchContainer: { paddingHorizontal: 20, marginBottom: 16 },
    searchBar: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#FFFFFF', borderRadius: 20,
        paddingHorizontal: 16, paddingVertical: 14,
        ...CARD_SHADOW,
    },
    searchInput: { flex: 1, marginLeft: 12, fontSize: 15, color: '#333333' },

    filterContainer: { marginBottom: 16 },
    filterScroll: { paddingHorizontal: 20, gap: 10 },
    filterChip: {
        paddingHorizontal: 20, paddingVertical: 10,
        borderRadius: 30, borderWidth: 1.5,
    },
    filterChipActive: { backgroundColor: '#E5B22D', borderColor: '#E5B22D' },
    filterChipInactive: { backgroundColor: '#FFFFFF', borderColor: '#E5B22D' },
    filterText: { fontSize: 14, fontWeight: '600' },
    filterTextActive: { color: '#FFFFFF' },
    filterTextInactive: { color: '#E5B22D' },

    listContent: { paddingHorizontal: 20, paddingBottom: 100 },

    monkCard: {
        backgroundColor: '#FFFFFF', borderRadius: 20,
        padding: 16, marginBottom: 14,
        ...CARD_SHADOW,
    },
    monkCardRow: {
        flexDirection: 'row', alignItems: 'center', marginBottom: 16,
    },
    monkAvatar: {
        width: 56, height: 56, borderRadius: 28, backgroundColor: '#F0F0F0',
    },
    monkDetails: { flex: 1, marginLeft: 14 },
    monkName: {
        fontSize: 16, fontWeight: '700', color: '#333333', marginBottom: 2,
    },
    monkTitle: { fontSize: 13, color: '#888888', marginBottom: 6 },
    ratingRow: { flexDirection: 'row', alignItems: 'center' },
    ratingText: {
        fontSize: 14, fontWeight: '700', color: '#333333', marginLeft: 4,
    },
    reviewCount: { fontSize: 12, color: '#888888', marginLeft: 6 },

    monkCardBottom: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between',
        borderTopWidth: 1, borderTopColor: '#F5F5F5', paddingTop: 14,
    },
    sessionLabel: { fontSize: 12, color: '#888888', marginBottom: 2 },
    monkPrice: { fontSize: 20, fontWeight: '800', color: '#333333' },
    bookButton: {
        backgroundColor: '#E5B22D',
        paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20,
    },
    bookButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },

    emptyContainer: { alignItems: 'center', paddingTop: 60 },
    emptyText: { fontSize: 16, color: '#888888', fontStyle: 'italic' },
});
