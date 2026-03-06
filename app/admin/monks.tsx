import React, { useState, useCallback } from 'react';
import {
    View, Text, Pressable, StyleSheet, FlatList,
    RefreshControl, Modal, TextInput, ScrollView, Alert, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, X, Plus } from 'lucide-react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import api from '../../lib/api';
import { COLORS, SHADOWS } from '../../design-system/theme';

const t = (data: any) => {
    if (!data) return '';
    if (typeof data === 'string') return data;
    return data.mn || data.en || '';
};

const EMPTY_FORM = { name: '', specialization: '', price: '', isActive: true };

export default function AdminMonks() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editing, setEditing] = useState<any>(null);
    const [form, setForm] = useState(EMPTY_FORM);

    const { data: monks, isLoading, refetch } = useQuery({
        queryKey: ['admin-monks'],
        queryFn: async () => {
            const res = await api.get('/monks');
            return res.data as any[];
        },
    });

    const onRefresh = useCallback(async () => {
        setRefreshing(true); await refetch(); setRefreshing(false);
    }, [refetch]);

    const saveMutation = useMutation({
        mutationFn: async (data: any) => {
            if (editing?._id) {
                // Website uses PATCH /monks/:id for updates
                return api.patch(`/monks/${editing._id}`, data);
            }
            return api.post('/monks', data);
        },
        onSuccess: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            queryClient.invalidateQueries({ queryKey: ['admin-monks'] });
            setModalVisible(false);
            setEditing(null);
            setForm(EMPTY_FORM);
        },
        onError: () => {
            Alert.alert('Алдаа', 'Хадгалахад алдаа гарлаа');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await api.patch(`/monks/${id}`, { role: 'user', monkStatus: 'rejected' });
            return res.data;
        },
        onSuccess: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            queryClient.invalidateQueries({ queryKey: ['admin-monks'] });
        },
    });

    const openNew = () => {
        setEditing(null);
        setForm(EMPTY_FORM);
        setModalVisible(true);
    };

    const openEdit = (monk: any) => {
        setEditing(monk);
        setForm({
            name: t(monk.name) || '',
            specialization: t(monk.specialization) || '',
            price: monk.services?.[0]?.price?.toString() || '',
            isActive: monk.isActive !== false,
        });
        setModalVisible(true);
    };

    const handleDelete = (id: string) => {
        Alert.alert('Устгах', 'Энэ үзмэрчийг устгахдаа итгэлтэй байна уу?', [
            { text: 'Үгүй', style: 'cancel' },
            { text: 'Устгах', style: 'destructive', onPress: () => deleteMutation.mutate(id) },
        ]);
    };

    const handleSave = () => {
        if (!form.name.trim()) { Alert.alert('Алдаа', 'Нэр оруулна уу'); return; }
        saveMutation.mutate({
            name: { mn: form.name, en: form.name },
            specialization: { mn: form.specialization, en: form.specialization },
            price: form.price ? Number(form.price) : undefined,
            isActive: form.isActive,
        });
    };

    return (
        <View style={st.container}>
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                <View style={st.header}>
                    <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }} style={st.backBtn}>
                        <ArrowLeft size={22} color={COLORS.text} />
                    </Pressable>
                    <Text style={st.headerTitle}>Үзмэрч удирдах</Text>
                    <View style={{ width: 44 }} />
                </View>

                <FlatList
                    data={monks}
                    keyExtractor={(it) => it._id || Math.random().toString()}
                    contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.gold} colors={[COLORS.gold]} />}
                    renderItem={({ item, index }) => (
                        <Animated.View entering={FadeInDown.delay(index * 60).duration(400)}>
                            <Pressable style={st.monkCard} onPress={() => openEdit(item)}>
                                <Image
                                    source={{ uri: item.image || 'https://via.placeholder.com/100' }}
                                    style={st.monkAvatar}
                                    contentFit="cover"
                                />
                                <View style={{ flex: 1, marginLeft: 14 }}>
                                    <Text style={st.monkName}>{t(item.name)}</Text>
                                    <Text style={st.monkSpec}>{t(item.specialization) || t(item.title)}</Text>
                                    <View style={st.activeRow}>
                                        <View style={[st.activeDot, { backgroundColor: item.isActive !== false ? COLORS.success : COLORS.error }]} />
                                        <Text style={st.activeText}>{item.isActive !== false ? 'Идэвхтэй' : 'Идэвхгүй'}</Text>
                                    </View>
                                </View>
                                <Pressable
                                    onPress={() => handleDelete(item._id)}
                                    style={st.deleteBtn}
                                >
                                    <Text style={{ color: COLORS.error, fontSize: 16 }}>🗑</Text>
                                </Pressable>
                            </Pressable>
                        </Animated.View>
                    )}
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', paddingTop: 60 }}>
                            <Text style={{ fontSize: 40, marginBottom: 12 }}>🔮</Text>
                            <Text style={{ color: COLORS.textLight, fontFamily: 'Georgia' }}>
                                {isLoading ? 'Уншиж байна...' : 'Үзмэрч олдсонгүй'}
                            </Text>
                        </View>
                    }
                />

                {/* FAB */}
                <Pressable onPress={openNew} style={st.fab}>
                    <LinearGradient colors={[COLORS.gold, COLORS.deepGold]} style={[st.fabGradient, SHADOWS.gold]}>
                        <Plus size={28} color="#1A0800" strokeWidth={2.5} />
                    </LinearGradient>
                </Pressable>
            </SafeAreaView>

            {/* Edit/Add Modal */}
            <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
                <View style={st.modalOverlay}>
                    <View style={st.modalSheet}>
                        <View style={st.modalHandle} />
                        <Pressable onPress={() => setModalVisible(false)} style={st.modalClose}>
                            <X size={18} color={COLORS.textMid} />
                        </Pressable>

                        <Text style={st.modalTitle}>{editing ? 'Засах' : 'Шинэ үзмэрч нэмэх'}</Text>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                            <Text style={st.inputLabel}>Нэр *</Text>
                            <TextInput style={st.input} value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} placeholder="Нэр оруулна уу" placeholderTextColor={COLORS.textLight} />

                            <Text style={st.inputLabel}>Ангилал</Text>
                            <TextInput style={st.input} value={form.specialization} onChangeText={(v) => setForm({ ...form, specialization: v })} placeholder="Таро, Зурхай гэх мэт" placeholderTextColor={COLORS.textLight} />

                            <Text style={st.inputLabel}>Үнэ (₮)</Text>
                            <TextInput style={st.input} value={form.price} onChangeText={(v) => setForm({ ...form, price: v })} placeholder="50000" keyboardType="number-pad" placeholderTextColor={COLORS.textLight} />

                            <View style={st.switchRow}>
                                <Text style={st.inputLabel}>Идэвхтэй</Text>
                                <Switch
                                    value={form.isActive}
                                    onValueChange={(v) => setForm({ ...form, isActive: v })}
                                    trackColor={{ false: '#ddd', true: COLORS.goldPale }}
                                    thumbColor={form.isActive ? COLORS.gold : '#f4f3f4'}
                                />
                            </View>

                            <Pressable onPress={handleSave}>
                                <LinearGradient colors={[COLORS.gold, COLORS.deepGold]} style={[st.saveBtn, SHADOWS.gold]}>
                                    <Text style={st.saveBtnText}>
                                        {saveMutation.isPending ? 'Хадгалж байна...' : 'ХАДГАЛАХ'}
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
        width: 44, height: 44, borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.85)', borderWidth: 1, borderColor: COLORS.border,
        alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: { fontFamily: 'Georgia', fontSize: 18, fontWeight: '700', color: COLORS.text },

    /* Card */
    monkCard: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 18,
        borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 10,
        ...SHADOWS.card,
    },
    monkAvatar: {
        width: 52, height: 52, borderRadius: 16,
        borderWidth: 1.5, borderColor: COLORS.gold, backgroundColor: COLORS.goldPale,
    },
    monkName: { fontFamily: 'Georgia', fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
    monkSpec: { fontSize: 12, color: COLORS.textLight, marginBottom: 4 },
    activeRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    activeDot: { width: 8, height: 8, borderRadius: 4 },
    activeText: { fontSize: 11, color: COLORS.textMid, fontWeight: '600' },
    deleteBtn: {
        width: 38, height: 38, borderRadius: 12, backgroundColor: '#FEE2E2',
        alignItems: 'center', justifyContent: 'center',
    },

    /* FAB */
    fab: { position: 'absolute', bottom: 30, right: 24 },
    fabGradient: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },

    /* Modal */
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalSheet: {
        backgroundColor: COLORS.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28,
        paddingHorizontal: 24, paddingTop: 12, paddingBottom: 40, maxHeight: '80%',
    },
    modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: 'center', marginBottom: 20 },
    modalClose: {
        position: 'absolute', top: 16, right: 20, width: 32, height: 32, borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.8)', borderWidth: 1, borderColor: COLORS.border,
        alignItems: 'center', justifyContent: 'center', zIndex: 10,
    },
    modalTitle: { fontFamily: 'Georgia', fontSize: 18, fontWeight: '800', color: COLORS.text, textAlign: 'center', marginBottom: 24 },
    inputLabel: { fontFamily: 'Georgia', fontSize: 12, fontWeight: '600', color: COLORS.textMid, marginBottom: 8, marginLeft: 2 },
    input: {
        backgroundColor: COLORS.bgWarm, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border,
        paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: COLORS.text, fontWeight: '500', marginBottom: 16,
    },
    switchRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20,
    },
    saveBtn: { borderRadius: 18, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
    saveBtnText: { color: '#1A0800', fontWeight: '800', fontSize: 15, letterSpacing: 1 },
});
