import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
    View, Text, Pressable, StyleSheet, FlatList,
    RefreshControl, Modal, ScrollView, Alert, TextInput, Platform, ActivityIndicator, Animated as RNAnimated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, X, Search } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import api from '../../lib/api';
import { COLORS, SHADOWS, FONT } from '../../design-system/theme';
import { useUserStore } from '../../store/userStore';

const FILTERS = ['Бүгд', 'Өнөөдөр', 'Энэ долоо хоног'];

const STATUS_CONFIG: Record<string, { label: string; emoji: string; bg: string; color: string }> = {
    pending: { label: 'Хүлээгдэж', emoji: '🟡', bg: '#FEF3C7', color: '#92400E' },
    confirmed: { label: 'Баталгаажсан', emoji: '🟢', bg: '#D1FAE5', color: '#065F46' },
    completed: { label: 'Дууссан', emoji: '🔵', bg: '#DBEAFE', color: '#1E40AF' },
    cancelled: { label: 'Цуцлагдсан', emoji: '🔴', bg: '#FEE2E2', color: '#991B1B' },
    rejected: { label: 'Татгалзсан', emoji: '🔴', bg: '#FEE2E2', color: '#991B1B' },
};

const t = (data: any) => {
    if (!data) return '';
    if (typeof data === 'string') return data;
    return data.mn || data.en || '';
};

function SkeletonRect({ width, height, style }: any) {
    const pulse = useRef(new RNAnimated.Value(0.35)).current;
    useEffect(() => {
        RNAnimated.loop(
            RNAnimated.sequence([
                RNAnimated.timing(pulse, { toValue: 0.75, duration: 900, useNativeDriver: true }),
                RNAnimated.timing(pulse, { toValue: 0.35, duration: 900, useNativeDriver: true })
            ])
        ).start();
    }, [pulse]);
    return (
        <RNAnimated.View style={[{ width, height, backgroundColor: COLORS.goldPale, borderRadius: 8, opacity: pulse }, style]} />
    );
}

export default function AdminBookings() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { user: dbUser } = useUserStore();
    const [activeFilter, setActiveFilter] = useState('Бүгд');
    const [searchQuery, setSearchQuery] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<any>(null);
    const [modalVisible, setModalVisible] = useState(false);

    const { data: adminData, isLoading, error, refetch } = useQuery({
        queryKey: ['admin-data', dbUser?._id],
        queryFn: async () => {
            const res = await api.get(`/admin/data?userId=${dbUser?._id}`);
            return res.data;
        },
        enabled: !!dbUser?._id,
    });

    const bookings = adminData?.bookings || [];
    const completed = bookings.filter((b: any) => b.status === 'completed');
    const totalRevenue = adminData?.stats?.totalRevenue || completed.reduce((sum: number, b: any) => sum + (b.amount || b.price || 0), 0);

    const updateMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string; status: string }) => {
            const res = await api.patch(`/bookings/${id}`, { status });
            return res.data;
        },
        onSuccess: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            queryClient.invalidateQueries({ queryKey: ['admin-data'] });
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

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            result = result.filter((b: any) => {
                const nameMatch = (b.userName || b.clientName || '').toLowerCase().includes(q);
                const emailMatch = (b.userEmail || '').toLowerCase().includes(q);
                const phoneMatch = (b.userPhone || b.phone || '').toLowerCase().includes(q);
                return nameMatch || emailMatch || phoneMatch;
            });
        }

        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        if (activeFilter === 'Өнөөдөр') {
            result = result.filter((b: any) =>
                (b.date || '').startsWith(todayStr) || (b.createdAt || '').startsWith(todayStr)
            );
        } else if (activeFilter === 'Энэ долоо хоног') {
            const weekAgo = new Date(now);
            weekAgo.setDate(now.getDate() - 7);
            result = result.filter((b: any) => new Date(b.date || b.createdAt) >= weekAgo);
        }

        return result.sort((a: any, b: any) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());
    }, [bookings, activeFilter, searchQuery]);

    const renderBooking = useCallback(({ item, index }: { item: any; index: number }) => {
        const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
        const serviceNameT = item.serviceName ? t(item.serviceName) : 'Үйлчилгээ тодорхойгүй';

        const displayName = item.userName || item.clientName || 'Хэрэглэгч';
        const initial = displayName.charAt(0).toUpperCase();

        let badgeBg = '#FEF3C7';
        let badgeColor = '#92400E';
        if (item.status === 'completed') { badgeBg = '#DBEAFE'; badgeColor = '#1E40AF'; }

        return (
            <Animated.View entering={FadeInDown.delay(Math.min(index * 80, 320)).duration(400)}>
                <Pressable
                    style={st.bookingCard}

                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedBooking(item);
                        setModalVisible(true);
                    }}
                >
                    <View style={st.bookingTop}>
                        <LinearGradient colors={[COLORS.goldPale, COLORS.goldSoft]} style={st.avatarCircle}>
                            <Text style={st.avatarInitial}>{initial}</Text>
                        </LinearGradient>
                        <View style={{ flex: 1 }}>
                            <Text style={st.bookingName}>{displayName}</Text>
                            <Text style={st.bookingMonk}>➔ {t(item.monkName) || 'Үзмэрч'}</Text>
                        </View>
                        <View style={[st.statusBadge, { backgroundColor: cfg.bg }]}>
                            <Text style={[st.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                        </View>
                    </View>
                    <View style={st.divider} />
                    <View style={st.bookingBottom}>
                        <Text style={st.bookingDate}>
                            📅 {item.date?.split('T')[0]} {item.time} • {serviceNameT}
                        </Text>
                        <Text style={[st.bookingPrice, { color: badgeColor, backgroundColor: badgeBg }]}>
                            {(item.amount || item.price || 0) > 0 ? `${(item.amount || item.price).toLocaleString()}₮` : 'Үнэгүй'}
                        </Text>
                    </View>
                </Pressable>
            </Animated.View>
        );
    }, []);

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
                    <Text style={st.headerTitle}>Захиалга удирдах</Text>
                    <View style={{ width: 38 }} />
                </View>

                {/* Stats Bar */}
                <View style={st.statsBar}>
                    <Text style={st.statsBarText}>
                        Нийт: {bookings.length}  |  Дууссан: {completed.length}  |  Орлого: {totalRevenue.toLocaleString()}₮
                    </Text>
                </View>

                {error && (
                    <View style={st.errorBlock}>
                        <Text style={st.errorText}>⚠️ Мэдээлэл ачаалж чадсангүй</Text>
                        <Pressable onPress={() => refetch()}><Text style={st.errorAction}>Дахин оролдох</Text></Pressable>
                    </View>
                )}

                <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
                    <View style={st.searchContainer}>
                        <Search size={16} color={COLORS.gold} style={{ marginRight: 8 }} />
                        <TextInput
                            style={st.searchInput}
                            placeholder="Нэр, утас, имэйлээр хайх..."
                            placeholderTextColor={COLORS.textMute}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        {searchQuery.length > 0 && (
                            <Pressable onPress={() => setSearchQuery('')} hitSlop={10} >
                                <X size={16} color={COLORS.textMute} />
                            </Pressable>
                        )}
                    </View>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 10, marginBottom: 14 }} style={{ flexGrow: 0 }}>
                    {FILTERS.map((f) => {
                        const isActive = f === activeFilter;
                        return isActive ? (
                            <Pressable key={f} onPress={() => setActiveFilter(f)} >
                                <LinearGradient colors={[COLORS.goldBright, COLORS.gold]} style={[st.filterChipActive, SHADOWS.glow]}>
                                    <Text style={st.filterTextActive}>{f}</Text>
                                </LinearGradient>
                            </Pressable>
                        ) : (
                            <Pressable key={f} style={st.filterChipInactive} onPress={() => setActiveFilter(f)} >
                                <Text style={st.filterTextInactive}>{f}</Text>
                            </Pressable>
                        );
                    })}
                </ScrollView>

                {isLoading ? (
                    <View style={{ padding: 20 }}>
                        <SkeletonRect width="100%" height={100} style={{ marginBottom: 14 }} />
                        <SkeletonRect width="100%" height={100} style={{ marginBottom: 14 }} />
                        <SkeletonRect width="100%" height={100} style={{ marginBottom: 14 }} />
                    </View>
                ) : (
                    <FlatList
                        data={filteredBookings}
                        keyExtractor={(it) => it._id || Math.random().toString()}
                        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 116 : 96 }}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.gold} />
                        }
                        renderItem={renderBooking}
                        ListEmptyComponent={
                            <View style={st.emptyState}>
                                <Text style={st.emptyEmoji}>📋</Text>
                                <Text style={st.emptyText}>Захиалга байхгүй байна</Text>
                            </View>
                        }
                    />
                )}
            </SafeAreaView>

            {/* Bottom Sheet Modal */}
            <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
                <View style={st.modalOverlay}>
                    <View style={st.modalSheet}>
                        <View style={st.modalHandle} />
                        <Pressable onPress={() => setModalVisible(false)} style={st.modalClose} >
                            <X size={18} color={COLORS.textMid} />
                        </Pressable>

                        <Text style={st.modalTitle}>Дэлгэрэнгүй & Статус</Text>

                        <View style={st.modalDetails}>
                            <View style={st.detailRow}>
                                <Text style={st.detailLabel}>Хэрэглэгч:</Text>
                                <Text style={st.detailValue}>{selectedBooking?.userName || selectedBooking?.clientName || 'Тодорхойгүй'}</Text>
                            </View>
                            {selectedBooking?.userEmail && (
                                <View style={st.detailRow}>
                                    <Text style={st.detailLabel}>Имэйл:</Text>
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
                            <View style={st.detailRowFilled}>
                                <Text style={st.detailLabelBold}>💰 Захиалгын дүн:</Text>
                                <Text style={st.detailValueGold}>
                                    {(selectedBooking?.amount || selectedBooking?.price || 0).toLocaleString()}₮
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
        width: 38, height: 38, borderRadius: 12,
        backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
        alignItems: 'center', justifyContent: 'center',
        ...SHADOWS.sm,
    },
    headerTitle: { fontFamily: FONT.display, fontSize: 18, fontWeight: '700', color: COLORS.text },

    statsBar: {
        flexDirection: 'row', backgroundColor: COLORS.goldPale, borderRadius: 14,
        paddingVertical: 10, paddingHorizontal: 16, borderWidth: 1, borderColor: COLORS.border,
        marginHorizontal: 20, marginBottom: 12, alignItems: 'center', justifyContent: 'center'
    },
    statsBarText: { fontSize: 12, color: COLORS.amber, fontWeight: '700' },

    searchContainer: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: COLORS.bgWarm, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border,
        paddingHorizontal: 16, height: 46,
    },
    searchInput: { flex: 1, fontSize: 15, color: COLORS.text, height: '100%' },

    filterChipActive: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, elevation: 5 },
    filterChipInactive: {
        paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
        backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    },
    filterTextActive: { fontSize: 12, fontWeight: '700', color: '#1C0E00' },
    filterTextInactive: { fontSize: 12, fontWeight: '500', color: COLORS.textSub },

    bookingCard: {
        backgroundColor: COLORS.surface, borderRadius: 20,
        borderWidth: 1, borderColor: COLORS.border, padding: 16, marginBottom: 14, overflow: 'hidden',
        ...SHADOWS.md, elevation: 4,
    },
    bookingTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    avatarCircle: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    avatarInitial: { fontFamily: FONT.display, fontSize: 18, fontWeight: '800', color: COLORS.gold },
    bookingName: { fontFamily: FONT.display, fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
    bookingMonk: { fontSize: 12, color: COLORS.textSub, marginTop: 2 },
    divider: { height: 1, backgroundColor: COLORS.divider, marginVertical: 14 },
    bookingBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    bookingDate: { fontSize: 12, color: COLORS.textMute, flex: 1, marginRight: 8 },
    bookingPrice: { fontFamily: FONT.display, fontSize: 13, fontWeight: '800', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
    statusBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
    },
    statusText: { fontSize: 11, fontWeight: '700' },

    emptyState: { paddingVertical: 72, alignItems: 'center' },
    emptyEmoji: { fontSize: 56, marginBottom: 18 },
    emptyText: { fontFamily: FONT.display, fontSize: 17, fontWeight: '600', color: COLORS.textSub },

    errorBlock: {
        backgroundColor: 'rgba(220,38,38,0.06)', borderRadius: 16,
        borderWidth: 1, borderColor: 'rgba(220,38,38,0.15)',
        padding: 16, margin: 16, alignItems: 'center'
    },
    errorText: { color: '#DC2626', fontSize: 14, fontWeight: '600', marginBottom: 8 },
    errorAction: { color: COLORS.gold, fontWeight: '700' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalSheet: {
        backgroundColor: COLORS.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28,
        paddingHorizontal: 24, paddingTop: 12, paddingBottom: 40,
    },
    modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.borderMed, alignSelf: 'center', marginBottom: 20 },
    modalClose: {
        position: 'absolute', top: 16, right: 20, width: 32, height: 32, borderRadius: 16,
        backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
        alignItems: 'center', justifyContent: 'center', zIndex: 10,
    },
    modalTitle: { fontFamily: FONT.display, fontSize: 18, fontWeight: '800', color: COLORS.text, textAlign: 'center', marginBottom: 16 },
    modalDetails: { backgroundColor: COLORS.bgWarm, borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: COLORS.border },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
    detailRowFilled: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, marginTop: 8, borderTopWidth: 1, borderTopColor: COLORS.divider, paddingTop: 12 },
    detailLabelBold: { fontSize: 14, color: COLORS.text, fontWeight: '700' },
    detailValueGold: { fontFamily: FONT.display, fontSize: 16, color: COLORS.gold, fontWeight: '800' },
    detailLabel: { fontSize: 13, color: COLORS.textSub, fontWeight: '500' },
    detailValue: { fontSize: 13, color: COLORS.text, fontWeight: '600', maxWidth: '70%', textAlign: 'right' },
    statusOption: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        borderWidth: 1.5, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 20, marginBottom: 10,
        backgroundColor: COLORS.surface,
    },
    statusOptionText: { fontSize: 15, fontWeight: '700' },
});
