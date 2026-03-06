import React, { useState, useCallback, useMemo } from 'react';
import {
    View, Text, Pressable, StyleSheet, FlatList,
    RefreshControl, Modal, ScrollView, Alert, TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, X, Search } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import api from '../../lib/api';
import { COLORS, SHADOWS } from '../../design-system/theme';

const FILTERS = ['Бүгд', 'Өнөөдөр', 'Энэ долоо хоног'];

const STATUS_CONFIG: Record<string, { label: string; emoji: string; bg: string; color: string }> = {
    pending: { label: 'Хүлээгдэж буй', emoji: '🟡', bg: '#FEF3C7', color: '#92400E' },
    confirmed: { label: 'Баталгаажсан', emoji: '🟢', bg: '#D1FAE5', color: '#065F46' },
    completed: { label: 'Дууссан', emoji: '🔵', bg: '#DBEAFE', color: '#1E40AF' },
    cancelled: { label: 'Цуцлагдсан', emoji: '🔴', bg: '#FEE2E2', color: '#991B1B' },
};

const t = (data: any) => {
    if (!data) return '';
    if (typeof data === 'string') return data;
    return data.mn || data.en || '';
};

export default function AdminBookings() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [activeFilter, setActiveFilter] = useState('Бүгд');
    const [searchQuery, setSearchQuery] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<any>(null);
    const [modalVisible, setModalVisible] = useState(false);

    const { data: bookings, isLoading, refetch } = useQuery({
        queryKey: ['admin-bookings-all'],
        queryFn: async () => {
            const res = await api.get('/admin/data');
            return (res.data?.bookings || []) as any[];
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string; status: string }) => {
            const res = await api.patch(`/bookings/${id}`, { status });
            return res.data;
        },
        onSuccess: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            queryClient.invalidateQueries({ queryKey: ['admin-bookings-all'] });
            setModalVisible(false);
        },
        onError: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Алдаа', 'Статус шинэчлэхэд алдаа гарлаа');
        },
    });

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    }, [refetch]);

    const filteredBookings = useMemo(() => {
        if (!bookings) return [];
        let result = bookings;

        // 1. Text Search Filter (Name, Email, Phone)
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            result = result.filter((b: any) => {
                const nameMatch = (b.userName || '').toLowerCase().includes(q);
                const emailMatch = (b.userEmail || '').toLowerCase().includes(q);
                // Assume phone might be named phone, phoneNumber, userPhone, etc. or embedded in booking data
                const phoneMatch = (b.userPhone || b.phone || '').toLowerCase().includes(q);
                return nameMatch || emailMatch || phoneMatch;
            });
        }

        // 2. Date Filter
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        if (activeFilter === 'Өнөөдөр') {
            result = result.filter((b: any) => b.date?.startsWith(todayStr));
        } else if (activeFilter === 'Энэ долоо хоног') {
            const weekAgo = new Date(now);
            weekAgo.setDate(now.getDate() - 7);
            result = result.filter((b: any) => new Date(b.date) >= weekAgo);
        }

        return result;
    }, [bookings, activeFilter, searchQuery]);

    const renderBooking = useCallback(({ item, index }: { item: any; index: number }) => {
        const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
        const serviceNameT = item.serviceName ? t(item.serviceName) : 'Үйлчилгээ тодорхойгүй';

        return (
            <Animated.View entering={FadeInDown.delay(index * 60).duration(400)}>
                <Pressable
                    style={st.bookingCard}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedBooking(item);
                        setModalVisible(true);
                    }}
                >
                    <View style={st.bookingTop}>
                        <View style={{ flex: 1 }}>
                            {/* Who booked who */}
                            <Text style={st.bookingName}>
                                {item.userName || item.userEmail || 'Хэрэглэгч'} ➔ {t(item.monkName) || 'Үзмэрч'}
                            </Text>
                            <Text style={st.bookingDate}>
                                {item.date?.split('T')[0]} • {item.time}
                            </Text>
                        </View>
                        <View style={[st.statusBadge, { backgroundColor: cfg.bg }]}>
                            <Text style={{ fontSize: 10 }}>{cfg.emoji}</Text>
                            <Text style={[st.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                        </View>
                    </View>
                    <Text style={st.bookingMonk}>✨ {serviceNameT}</Text>
                </Pressable>
            </Animated.View>
        );
    }, []);

    return (
        <View style={st.container}>
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                <View style={st.header}>
                    <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }} style={st.backBtn}>
                        <ArrowLeft size={22} color={COLORS.text} />
                    </Pressable>
                    <Text style={st.headerTitle}>Захиалга удирдах</Text>
                    <View style={{ width: 44 }} />
                </View>

                {/* Search Bar */}
                <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
                    <View style={st.searchContainer}>
                        <Search size={20} color={COLORS.textLight} style={{ marginLeft: 16, marginRight: 8 }} />
                        <TextInput
                            style={st.searchInput}
                            placeholder="Нэр, утас, имэйлээр хайх..."
                            placeholderTextColor={COLORS.textLight}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        {searchQuery.length > 0 && (
                            <Pressable onPress={() => setSearchQuery('')} style={{ padding: 10 }}>
                                <X size={18} color={COLORS.textMid} />
                            </Pressable>
                        )}
                    </View>
                </View>

                {/* Filters */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 10, marginBottom: 14 }}>
                    {FILTERS.map((f) => {
                        const isActive = f === activeFilter;
                        return isActive ? (
                            <LinearGradient key={f} colors={[COLORS.gold, COLORS.deepGold]} style={st.filterChip}>
                                <Pressable onPress={() => setActiveFilter(f)}>
                                    <Text style={st.filterTextActive}>{f}</Text>
                                </Pressable>
                            </LinearGradient>
                        ) : (
                            <Pressable key={f} style={st.filterChipInactive} onPress={() => setActiveFilter(f)}>
                                <Text style={st.filterTextInactive}>{f}</Text>
                            </Pressable>
                        );
                    })}
                </ScrollView>

                <FlatList
                    data={filteredBookings}
                    keyExtractor={(it) => it._id || Math.random().toString()}
                    contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.gold} colors={[COLORS.gold]} />
                    }
                    renderItem={renderBooking}
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', paddingTop: 60 }}>
                            <Text style={{ fontSize: 40, marginBottom: 12 }}>📋</Text>
                            <Text style={{ color: COLORS.textLight, fontFamily: 'Georgia' }}>
                                {isLoading ? 'Уншиж байна...' : 'Захиалга байхгүй байна'}
                            </Text>
                        </View>
                    }
                />
            </SafeAreaView>

            {/* Bottom Sheet Modal */}
            <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
                <View style={st.modalOverlay}>
                    <View style={st.modalSheet}>
                        <View style={st.modalHandle} />
                        <Pressable onPress={() => setModalVisible(false)} style={st.modalClose}>
                            <X size={18} color={COLORS.textMid} />
                        </Pressable>

                        <Text style={st.modalTitle}>Дэлгэрэнгүй & Статус</Text>

                        <View style={st.modalDetails}>
                            <View style={st.detailRow}>
                                <Text style={st.detailLabel}>Хэрэглэгч:</Text>
                                <Text style={st.detailValue}>{selectedBooking?.userName || 'Тодорхойгүй'}</Text>
                            </View>
                            {selectedBooking?.userEmail && (
                                <View style={st.detailRow}>
                                    <Text style={st.detailLabel}>Арга хэмжээ:</Text>
                                    <Text style={st.detailValue}>{selectedBooking.userEmail}</Text>
                                </View>
                            )}
                            <View style={st.detailRow}>
                                <Text style={st.detailLabel}>Үзмэрч:</Text>
                                <Text style={st.detailValue}>{t(selectedBooking?.monkName) || 'Тодорхойгүй'}</Text>
                            </View>
                            <View style={st.detailRow}>
                                <Text style={st.detailLabel}>Үйлчилгээ:</Text>
                                <Text style={st.detailValue}>{selectedBooking?.serviceName ? t(selectedBooking.serviceName) : 'Тодорхойгүй'}</Text>
                            </View>
                            <View style={st.detailRow}>
                                <Text style={st.detailLabel}>Цаг:</Text>
                                <Text style={st.detailValue}>
                                    {selectedBooking?.date?.split('T')[0]} • {selectedBooking?.time}
                                </Text>
                            </View>
                        </View>

                        {(['confirmed', 'completed', 'cancelled'] as const).map((status) => {
                            const cfg = STATUS_CONFIG[status];
                            return (
                                <Pressable
                                    key={status}
                                    onPress={() => {
                                        if (selectedBooking?._id) {
                                            updateMutation.mutate({ id: selectedBooking._id, status });
                                        }
                                    }}
                                    style={[st.statusOption, { borderColor: cfg.color }]}
                                >
                                    <Text style={{ fontSize: 16 }}>{cfg.emoji}</Text>
                                    <Text style={[st.statusOptionText, { color: cfg.color }]}>{cfg.label}</Text>
                                </Pressable>
                            );
                        })}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const st = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
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

    /* Search Bar */
    searchContainer: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.85)',
        borderWidth: 1, borderColor: COLORS.border,
        borderRadius: 16, height: 48,
    },
    searchInput: { flex: 1, fontSize: 15, color: COLORS.text, height: '100%' },

    /* Filters */
    filterChip: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 30 },
    filterChipInactive: {
        paddingHorizontal: 20, paddingVertical: 10, borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.8)', borderWidth: 1, borderColor: COLORS.border,
    },
    filterTextActive: { fontSize: 13, fontWeight: '700', color: '#1A0800' },
    filterTextInactive: { fontSize: 13, fontWeight: '600', color: COLORS.textMid },

    /* Booking card */
    bookingCard: {
        backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 18,
        borderWidth: 1, borderColor: COLORS.border, padding: 16, marginBottom: 10,
        ...SHADOWS.card,
    },
    bookingTop: { flexDirection: 'row', alignItems: 'center' },
    bookingName: { fontFamily: 'Georgia', fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
    bookingDate: { fontSize: 12, color: COLORS.textLight },
    bookingMonk: { fontSize: 13, color: COLORS.textMid, marginTop: 8 },
    statusBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12,
    },
    statusText: { fontSize: 11, fontWeight: '700' },

    /* Modal */
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalSheet: {
        backgroundColor: COLORS.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28,
        paddingHorizontal: 24, paddingTop: 12, paddingBottom: 40,
    },
    modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: 'center', marginBottom: 20 },
    modalClose: {
        position: 'absolute', top: 16, right: 20, width: 32, height: 32, borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.8)', borderWidth: 1, borderColor: COLORS.border,
        alignItems: 'center', justifyContent: 'center', zIndex: 10,
    },
    modalTitle: { fontFamily: 'Georgia', fontSize: 18, fontWeight: '800', color: COLORS.text, textAlign: 'center', marginBottom: 16 },
    modalDetails: { backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: COLORS.border },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
    detailLabel: { fontSize: 13, color: COLORS.textMid, fontWeight: '500' },
    detailValue: { fontSize: 13, color: COLORS.text, fontWeight: '600', maxWidth: '70%', textAlign: 'right' },
    statusOption: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        borderWidth: 1.5, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 20, marginBottom: 10,
        backgroundColor: 'rgba(255,255,255,0.8)',
    },
    statusOptionText: { fontSize: 15, fontWeight: '700' },
});
