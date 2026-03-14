import React, { useState, useCallback, useMemo } from 'react';
import {
    View, Text, Pressable, StyleSheet, FlatList,
    RefreshControl, Modal, TextInput, ScrollView, Alert, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, X, Search, RefreshCw } from 'lucide-react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import api from '../../lib/api';
import { useUserStore } from '../../store/userStore';
import { COLORS, SHADOWS, FONT } from '../../design-system/theme';

const t = (data: any) => {
    if (!data) return '';
    if (typeof data === 'string') return data;
    return data.mn || data.en || '';
};

const STATUS_CONFIG: Record<string, { label: string; emoji: string; bg: string; color: string }> = {
    active: { label: 'Идэвхтэй', emoji: '🟢', bg: '#D1FAE5', color: '#065F46' },
    pending: { label: 'Хүлээгдэж', emoji: '🟡', bg: '#FEF3C7', color: '#92400E' },
    rejected: { label: 'Татгалзсан', emoji: '🔴', bg: '#FEE2E2', color: '#991B1B' },
    inactive: { label: 'Идэвхгүй', emoji: '⚪', bg: '#F3F4F6', color: '#6B7280' },
};

export default function AdminServices() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { user: dbUser } = useUserStore();
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [editing, setEditing] = useState<any>(null);
    const [form, setForm] = useState<any>({});
    const [syncing, setSyncing] = useState(false);

    const { data: services, isLoading, refetch } = useQuery({
        queryKey: ['admin-services', dbUser?._id],
        queryFn: async () => {
            const res = await api.get(`/admin/data?userId=${dbUser?._id}`);
            return (res.data?.services || []) as any[];
        },
        enabled: !!dbUser?._id,
    });

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    }, [refetch]);

    const filteredServices = useMemo(() => {
        if (!services) return [];
        if (!search.trim()) return services;
        const q = search.toLowerCase();
        return services.filter((s: any) =>
            (t(s.name) || '').toLowerCase().includes(q) ||
            (t(s.title) || '').toLowerCase().includes(q) ||
            (s.type || '').toLowerCase().includes(q)
        );
    }, [services, search]);

    // Approve/Reject mutation
    const statusMutation = useMutation({
        mutationFn: async ({ id, action }: { id: string; action: 'approve' | 'reject' }) => {
            const res = await api.patch(`/admin/services/${id}`, { action });
            return res.data;
        },
        onSuccess: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            queryClient.invalidateQueries({ queryKey: ['admin-services'] });
            queryClient.invalidateQueries({ queryKey: ['admin-data'] });
        },
        onError: (err: any) => {
            Alert.alert('Алдаа', err?.response?.data?.message || 'Статус өөрчлөхөд алдаа гарлаа');
        },
    });

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const res = await api.put(`/admin/services/${id}`, data);
            return res.data;
        },
        onSuccess: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            queryClient.invalidateQueries({ queryKey: ['admin-services'] });
            queryClient.invalidateQueries({ queryKey: ['admin-data'] });
            setModalVisible(false);
            setEditing(null);
        },
        onError: () => {
            Alert.alert('Алдаа', 'Хадгалахад алдаа гарлаа');
        },
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await api.delete(`/admin/services/${id}`, { data: {} });
            return res.data;
        },
        onSuccess: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            queryClient.invalidateQueries({ queryKey: ['admin-services'] });
            queryClient.invalidateQueries({ queryKey: ['admin-data'] });
        },
        onError: () => {
            Alert.alert('Алдаа', 'Устгахад алдаа гарлаа');
        },
    });

    const handleSyncServices = async () => {
        Alert.alert(
            'Sync Services',
            'Бүх үйлчилгээг бүх ламд хуваарилах уу?',
            [
                { text: 'Үгүй', style: 'cancel' },
                {
                    text: 'Тийм',
                    onPress: async () => {
                        setSyncing(true);
                        try {
                            const res = await api.post('/admin/sync-services');
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            Alert.alert('Амжилттай', res.data?.message || 'Синхрончлогдлоо');
                            queryClient.invalidateQueries({ queryKey: ['admin-services'] });
                            queryClient.invalidateQueries({ queryKey: ['admin-data'] });
                        } catch (err: any) {
                            Alert.alert('Алдаа', err?.response?.data?.message || 'Синхрончлоход алдаа гарлаа');
                        } finally {
                            setSyncing(false);
                        }
                    },
                },
            ]
        );
    };

    const openEdit = (service: any) => {
        setEditing(service);
        setForm({
            name: service.name || { mn: '', en: '' },
            title: service.title || { mn: '', en: '' },
            desc: service.desc || { mn: '', en: '' },
            subtitle: service.subtitle || { mn: '', en: '' },
            quote: service.quote || { mn: '', en: '' },
            type: service.type || '',
            price: service.price || 0,
            duration: service.duration || '',
            image: service.image || '',
        });
        setModalVisible(true);
    };

    const handleDelete = (service: any) => {
        const id = service.id || service._id;
        Alert.alert('Устгах', `${t(service.name)} үйлчилгээг устгах уу?`, [
            { text: 'Үгүй', style: 'cancel' },
            { text: 'Устгах', style: 'destructive', onPress: () => deleteMutation.mutate(id) },
        ]);
    };

    const handleSave = () => {
        if (!editing) return;
        const id = editing.id || editing._id;
        updateMutation.mutate({ id, data: form });
    };

    const updateField = (field: string, value: any) => {
        setForm((prev: any) => ({ ...prev, [field]: value }));
    };

    const updateNested = (field: string, subField: string, value: string) => {
        setForm((prev: any) => ({
            ...prev,
            [field]: { ...prev[field], [subField]: value },
        }));
    };

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
                    <Text style={st.headerTitle}>Үйлчилгээ удирдах</Text>
                    <Pressable
                        onPress={handleSyncServices}
                        style={[st.backBtn, syncing && { opacity: 0.5 }]}
                        disabled={syncing}
                    >
                        {syncing ? (
                            <ActivityIndicator size="small" color={COLORS.gold} />
                        ) : (
                            <RefreshCw size={18} color={COLORS.gold} />
                        )}
                    </Pressable>
                </View>

                {/* Sync info bar */}
                <Pressable onPress={handleSyncServices} disabled={syncing}>
                    <View style={st.syncBar}>
                        <RefreshCw size={14} color={COLORS.amber} />
                        <Text style={st.syncBarText}>
                            {syncing ? 'Синхрончилж байна...' : 'Бүх үйлчилгээг бүх ламд синхрончлох'}
                        </Text>
                    </View>
                </Pressable>

                {/* Search */}
                <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
                    <View style={st.searchContainer}>
                        <Search size={16} color={COLORS.gold} style={{ marginRight: 8 }} />
                        <TextInput
                            style={st.searchInput}
                            placeholder="Үйлчилгээ хайх..."
                            placeholderTextColor={COLORS.textMute}
                            value={search}
                            onChangeText={setSearch}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        {search.length > 0 && (
                            <Pressable onPress={() => setSearch('')} hitSlop={10}>
                                <X size={16} color={COLORS.textMute} />
                            </Pressable>
                        )}
                    </View>
                </View>

                {isLoading ? (
                    <ActivityIndicator size="large" color={COLORS.gold} style={{ marginTop: 40 }} />
                ) : (
                    <FlatList
                        data={filteredServices}
                        keyExtractor={(it) => it.id || it._id || Math.random().toString()}
                        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 116 : 96 }}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.gold} />
                        }
                        renderItem={({ item, index }) => {
                            const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.active;
                            return (
                                <Animated.View entering={FadeInDown.delay(Math.min(index * 60, 300)).duration(400)}>
                                    <Pressable style={st.serviceCard} onPress={() => openEdit(item)}>
                                        <View style={st.cardTop}>
                                            {item.image ? (
                                                <Image source={{ uri: item.image }} style={st.serviceImage} contentFit="cover" />
                                            ) : (
                                                <View style={[st.serviceImage, st.imageFallback]}>
                                                    <Text style={{ fontSize: 24 }}>🔮</Text>
                                                </View>
                                            )}
                                            <View style={{ flex: 1, marginLeft: 12 }}>
                                                <Text style={st.serviceName} numberOfLines={1}>{t(item.name) || t(item.title)}</Text>
                                                <Text style={st.serviceType}>{item.type || 'Monk Service'}</Text>
                                                <View style={st.priceRow}>
                                                    <Text style={st.servicePrice}>
                                                        {item.price ? `${Number(item.price).toLocaleString()}₮` : 'Үнэгүй'}
                                                    </Text>
                                                    {item.duration && (
                                                        <Text style={st.serviceDuration}>• {item.duration}</Text>
                                                    )}
                                                </View>
                                            </View>
                                            <View style={[st.statusBadge, { backgroundColor: cfg.bg }]}>
                                                <Text style={[st.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                                            </View>
                                        </View>

                                        {/* Action buttons */}
                                        <View style={st.cardActions}>
                                            {item.status !== 'active' && (
                                                <Pressable
                                                    style={[st.actionChip, { backgroundColor: '#D1FAE5' }]}
                                                    onPress={() => statusMutation.mutate({ id: item.id || item._id, action: 'approve' })}
                                                >
                                                    <Text style={[st.actionChipText, { color: '#065F46' }]}>✅ Идэвхжүүлэх</Text>
                                                </Pressable>
                                            )}
                                            {item.status === 'active' && (
                                                <Pressable
                                                    style={[st.actionChip, { backgroundColor: '#FEF3C7' }]}
                                                    onPress={() => statusMutation.mutate({ id: item.id || item._id, action: 'reject' })}
                                                >
                                                    <Text style={[st.actionChipText, { color: '#92400E' }]}>⏸ Зогсоох</Text>
                                                </Pressable>
                                            )}
                                            <Pressable
                                                style={[st.actionChip, { backgroundColor: '#FEE2E2' }]}
                                                onPress={() => handleDelete(item)}
                                            >
                                                <Text style={[st.actionChipText, { color: '#991B1B' }]}>🗑 Устгах</Text>
                                            </Pressable>
                                        </View>
                                    </Pressable>
                                </Animated.View>
                            );
                        }}
                        ListEmptyComponent={
                            <View style={{ alignItems: 'center', paddingTop: 60 }}>
                                <Text style={{ fontSize: 40, marginBottom: 12 }}>🔮</Text>
                                <Text style={{ color: COLORS.textSub, fontFamily: FONT.display }}>
                                    Үйлчилгээ олдсонгүй
                                </Text>
                            </View>
                        }
                    />
                )}
            </SafeAreaView>

            {/* Edit Modal */}
            <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
                <View style={st.modalOverlay}>
                    <View style={st.modalSheet}>
                        <View style={st.modalHandle} />
                        <Pressable onPress={() => setModalVisible(false)} style={st.modalClose}>
                            <X size={18} color={COLORS.textMid} />
                        </Pressable>

                        <Text style={st.modalTitle}>Үйлчилгээ засах</Text>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
                            <Text style={st.inputLabel}>Нэр (MN)</Text>
                            <TextInput style={st.input} value={form.name?.mn || ''} onChangeText={(v) => updateNested('name', 'mn', v)} placeholder="Монгол нэр" placeholderTextColor={COLORS.textMute} />

                            <Text style={st.inputLabel}>Name (EN)</Text>
                            <TextInput style={st.input} value={form.name?.en || ''} onChangeText={(v) => updateNested('name', 'en', v)} placeholder="English name" placeholderTextColor={COLORS.textMute} />

                            <Text style={st.inputLabel}>Гарчиг (MN)</Text>
                            <TextInput style={st.input} value={form.title?.mn || ''} onChangeText={(v) => updateNested('title', 'mn', v)} placeholder="Монгол гарчиг" placeholderTextColor={COLORS.textMute} />

                            <Text style={st.inputLabel}>Title (EN)</Text>
                            <TextInput style={st.input} value={form.title?.en || ''} onChangeText={(v) => updateNested('title', 'en', v)} placeholder="English title" placeholderTextColor={COLORS.textMute} />

                            <Text style={st.inputLabel}>Тайлбар (MN)</Text>
                            <TextInput style={[st.input, { height: 80 }]} value={form.desc?.mn || ''} onChangeText={(v) => updateNested('desc', 'mn', v)} multiline placeholder="Тайлбар" placeholderTextColor={COLORS.textMute} />

                            <Text style={st.inputLabel}>Description (EN)</Text>
                            <TextInput style={[st.input, { height: 80 }]} value={form.desc?.en || ''} onChangeText={(v) => updateNested('desc', 'en', v)} multiline placeholder="Description" placeholderTextColor={COLORS.textMute} />

                            <View style={st.twoCol}>
                                <View style={{ flex: 1 }}>
                                    <Text style={st.inputLabel}>Үнэ (₮)</Text>
                                    <TextInput style={st.input} value={String(form.price || '')} onChangeText={(v) => updateField('price', parseInt(v) || 0)} keyboardType="number-pad" placeholderTextColor={COLORS.textMute} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={st.inputLabel}>Хугацаа</Text>
                                    <TextInput style={st.input} value={form.duration || ''} onChangeText={(v) => updateField('duration', v)} placeholder="30 min" placeholderTextColor={COLORS.textMute} />
                                </View>
                            </View>

                            <Text style={st.inputLabel}>Зураг (URL)</Text>
                            <TextInput style={st.input} value={form.image || ''} onChangeText={(v) => updateField('image', v)} placeholder="https://..." placeholderTextColor={COLORS.textMute} />
                            {form.image ? (
                                <Image source={{ uri: form.image }} style={{ width: 64, height: 64, borderRadius: 14, borderWidth: 2, borderColor: COLORS.gold, marginBottom: 16 }} contentFit="cover" />
                            ) : null}

                            <Pressable onPress={handleSave} style={{ marginTop: 12 }}>
                                <LinearGradient colors={[COLORS.gold, COLORS.deepGold]} style={[st.saveBtn, SHADOWS.gold]}>
                                    <Text style={st.saveBtnText}>
                                        {updateMutation.isPending ? 'Хадгалж байна...' : 'ХАДГАЛАХ'}
                                    </Text>
                                </LinearGradient>
                            </Pressable>
                        </ScrollView>
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

    syncBar: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: COLORS.goldPale, borderRadius: 14,
        paddingVertical: 10, paddingHorizontal: 16, borderWidth: 1, borderColor: COLORS.border,
        marginHorizontal: 20, marginBottom: 12,
    },
    syncBarText: { fontSize: 12, color: COLORS.amber, fontWeight: '700' },

    searchContainer: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: COLORS.bgWarm, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border,
        paddingHorizontal: 16, height: 46,
    },
    searchInput: { flex: 1, fontSize: 15, color: COLORS.text, height: '100%' },

    serviceCard: {
        backgroundColor: COLORS.surface, borderRadius: 20,
        borderWidth: 1, borderColor: COLORS.border, padding: 16, marginBottom: 12,
        ...SHADOWS.md,
    },
    cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
    serviceImage: {
        width: 52, height: 52, borderRadius: 14,
        borderWidth: 1.5, borderColor: COLORS.gold, backgroundColor: COLORS.goldPale,
    },
    imageFallback: { alignItems: 'center', justifyContent: 'center' },
    serviceName: { fontFamily: FONT.display, fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
    serviceType: { fontSize: 11, color: COLORS.textSub, marginBottom: 4 },
    priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    servicePrice: { fontFamily: FONT.display, fontSize: 14, fontWeight: '800', color: COLORS.gold },
    serviceDuration: { fontSize: 12, color: COLORS.textMute },
    statusBadge: {
        paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
    },
    statusText: { fontSize: 10, fontWeight: '700' },

    cardActions: {
        flexDirection: 'row', gap: 8, marginTop: 12, paddingTop: 12,
        borderTopWidth: 1, borderTopColor: COLORS.divider,
    },
    actionChip: {
        flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center',
    },
    actionChipText: { fontSize: 11, fontWeight: '700' },

    /* Modal */
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalSheet: {
        backgroundColor: COLORS.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28,
        paddingHorizontal: 24, paddingTop: 12, paddingBottom: 40, maxHeight: '90%',
    },
    modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.borderMed, alignSelf: 'center', marginBottom: 20 },
    modalClose: {
        position: 'absolute', top: 16, right: 20, width: 32, height: 32, borderRadius: 16,
        backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
        alignItems: 'center', justifyContent: 'center', zIndex: 10,
    },
    modalTitle: { fontFamily: FONT.display, fontSize: 18, fontWeight: '800', color: COLORS.text, textAlign: 'center', marginBottom: 20 },

    inputLabel: { fontFamily: FONT.display, fontSize: 12, fontWeight: '600', color: COLORS.textMid, marginBottom: 8, marginLeft: 2 },
    input: {
        backgroundColor: COLORS.bgWarm, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border,
        paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: COLORS.text, fontWeight: '500', marginBottom: 16,
        textAlignVertical: 'top',
    },
    twoCol: { flexDirection: 'row', gap: 12 },

    saveBtn: { borderRadius: 18, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
    saveBtnText: { color: '#1A0800', fontWeight: '800', fontSize: 15, letterSpacing: 1 },
});
