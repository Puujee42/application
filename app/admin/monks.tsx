import React, { useState, useCallback } from 'react';
import {
    View, Text, Pressable, StyleSheet, FlatList,
    RefreshControl, Modal, TextInput, ScrollView, Alert, Switch, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, X, Plus, Trash2 } from 'lucide-react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import api from '../../lib/api';
import { COLORS, SHADOWS } from '../../design-system/theme';

const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';
const t = (data: any) => {
    if (!data) return '';
    if (typeof data === 'string') return data;
    return data.mn || data.en || '';
};

const TABS = [
    { key: 'basic', label: 'Үндсэн' },
    { key: 'details', label: 'Дэлгэрэнгүй' },
    { key: 'bio', label: 'Намтар' },
    { key: 'account', label: 'Бүртгэл' },
];

const ROLE_OPTIONS = [
    { value: 'seeker', label: 'Хэрэглэгч' },
    { value: 'monk', label: 'Лам' },
    { value: 'admin', label: 'Админ' },
];

export default function AdminMonks() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editing, setEditing] = useState<any>(null);
    const [form, setForm] = useState<any>({});
    const [activeTab, setActiveTab] = useState('basic');

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
                return api.patch(`/monks/${editing._id}`, data);
            }
            return api.post('/monks', data);
        },
        onSuccess: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            queryClient.invalidateQueries({ queryKey: ['admin-monks'] });
            queryClient.invalidateQueries({ queryKey: ['admin-data'] });
            setModalVisible(false);
            setEditing(null);
            setForm({});
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

    const openEdit = (monk: any) => {
        setEditing(monk);
        setForm({
            name: monk.name || { mn: '', en: '' },
            title: monk.title || { mn: '', en: '' },
            bio: monk.bio || { mn: '', en: '' },
            education: monk.education || { mn: '', en: '' },
            philosophy: monk.philosophy || { mn: '', en: '' },
            quote: monk.quote || { mn: '', en: '' },
            image: monk.image || '',
            phone: monk.phone || '',
            isSpecial: monk.isSpecial || false,
            isActive: monk.isActive !== false,
            yearsOfExperience: monk.yearsOfExperience || 0,
            specialties: monk.specialties || [],
            role: monk.role || 'monk',
            earnings: monk.earnings || 0,
        });
        setActiveTab('basic');
        setModalVisible(true);
    };

    const handleDelete = (id: string) => {
        Alert.alert('Устгах', 'Энэ үзмэрчийг устгахдаа итгэлтэй байна уу?', [
            { text: 'Үгүй', style: 'cancel' },
            { text: 'Устгах', style: 'destructive', onPress: () => deleteMutation.mutate(id) },
        ]);
    };

    const handleSave = () => {
        if (!form.name?.mn?.trim() && !form.name?.en?.trim()) {
            Alert.alert('Алдаа', 'Нэр оруулна уу');
            return;
        }
        saveMutation.mutate(form);
    };

    const updateField = (field: string, value: any) => {
        setForm((prev: any) => ({ ...prev, [field]: value }));
    };

    const updateNested = (field: string, subField: string, value: string) => {
        setForm((prev: any) => ({
            ...prev,
            [field]: { ...prev[field], [subField]: value }
        }));
    };

    const addSpecialty = () => {
        setForm((prev: any) => ({ ...prev, specialties: [...(prev.specialties || []), ''] }));
    };

    const updateSpecialty = (index: number, value: string) => {
        const arr = [...(form.specialties || [])];
        arr[index] = value;
        updateField('specialties', arr);
    };

    const removeSpecialty = (index: number) => {
        updateField('specialties', (form.specialties || []).filter((_: any, i: number) => i !== index));
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
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                        <Text style={st.monkName}>{t(item.name)}</Text>
                                        {item.isSpecial && (
                                            <View style={st.specialBadge}>
                                                <Text style={st.specialBadgeText}>✨ Онцгой</Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text style={st.monkSpec}>{t(item.specialization) || t(item.title)}</Text>
                                    <View style={st.activeRow}>
                                        <View style={[st.activeDot, { backgroundColor: item.isActive !== false ? COLORS.success : COLORS.error }]} />
                                        <Text style={st.activeText}>{item.isActive !== false ? 'Идэвхтэй' : 'Идэвхгүй'}</Text>
                                    </View>
                                </View>
                                <Pressable onPress={() => handleDelete(item._id)} style={st.deleteBtn}>
                                    <Text style={{ color: COLORS.error, fontSize: 16 }}>🗑</Text>
                                </Pressable>
                            </Pressable>
                        </Animated.View>
                    )}
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', paddingTop: 60 }}>
                            <Text style={{ fontSize: 40, marginBottom: 12 }}>🔮</Text>
                            <Text style={{ color: COLORS.textLight, fontFamily: SERIF }}>
                                {isLoading ? 'Уншиж байна...' : 'Үзмэрч олдсонгүй'}
                            </Text>
                        </View>
                    }
                />
            </SafeAreaView>

            {/* ─── Multi-Tab Edit Modal ─── */}
            <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
                <View style={st.modalOverlay}>
                    <View style={st.modalSheet}>
                        <View style={st.modalHandle} />
                        <Pressable onPress={() => setModalVisible(false)} style={st.modalClose}>
                            <X size={18} color={COLORS.textMid} />
                        </Pressable>

                        <Text style={st.modalTitle}>{editing ? 'Лам засах' : 'Шинэ лам нэмэх'}</Text>

                        {/* Tab Bar */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, marginBottom: 16 }} contentContainerStyle={{ gap: 6 }}>
                            {TABS.map((tab) => {
                                const isActive = activeTab === tab.key;
                                return isActive ? (
                                    <LinearGradient key={tab.key} colors={[COLORS.gold, COLORS.deepGold]} style={st.tabChip}>
                                        <Text style={st.tabTextActive}>{tab.label}</Text>
                                    </LinearGradient>
                                ) : (
                                    <Pressable key={tab.key} style={st.tabChipInactive} onPress={() => setActiveTab(tab.key)}>
                                        <Text style={st.tabTextInactive}>{tab.label}</Text>
                                    </Pressable>
                                );
                            })}
                        </ScrollView>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>

                            {/* ── BASIC ── */}
                            {activeTab === 'basic' && (
                                <View>
                                    <Text style={st.inputLabel}>Нэр (MN)</Text>
                                    <TextInput style={st.input} value={form.name?.mn || ''} onChangeText={(v) => updateNested('name', 'mn', v)} placeholder="Монгол нэр" placeholderTextColor={COLORS.textLight} />

                                    <Text style={st.inputLabel}>Name (EN)</Text>
                                    <TextInput style={st.input} value={form.name?.en || ''} onChangeText={(v) => updateNested('name', 'en', v)} placeholder="English name" placeholderTextColor={COLORS.textLight} />

                                    <Text style={st.inputLabel}>Цол (MN)</Text>
                                    <TextInput style={st.input} value={form.title?.mn || ''} onChangeText={(v) => updateNested('title', 'mn', v)} placeholder="Цол" placeholderTextColor={COLORS.textLight} />

                                    <Text style={st.inputLabel}>Title (EN)</Text>
                                    <TextInput style={st.input} value={form.title?.en || ''} onChangeText={(v) => updateNested('title', 'en', v)} placeholder="Title" placeholderTextColor={COLORS.textLight} />

                                    <Text style={st.inputLabel}>Зураг (URL)</Text>
                                    <TextInput style={st.input} value={form.image || ''} onChangeText={(v) => updateField('image', v)} placeholder="https://..." placeholderTextColor={COLORS.textLight} />
                                    {form.image ? (
                                        <Image source={{ uri: form.image }} style={{ width: 64, height: 64, borderRadius: 14, borderWidth: 2, borderColor: COLORS.gold, marginBottom: 16 }} contentFit="cover" />
                                    ) : null}

                                    <Text style={st.inputLabel}>Утас</Text>
                                    <TextInput style={st.input} value={form.phone || ''} onChangeText={(v) => updateField('phone', v)} placeholder="Утасны дугаар" keyboardType="phone-pad" placeholderTextColor={COLORS.textLight} />

                                    {/* isSpecial toggle */}
                                    <View style={st.specialRow}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={st.specialLabel}>✨ Онцгой Лам (Special Status)</Text>
                                            <Text style={st.specialDesc}>Идэвхжүүлвэл орлого 88,800₮ болно</Text>
                                        </View>
                                        <Switch
                                            value={form.isSpecial || false}
                                            onValueChange={(v) => updateField('isSpecial', v)}
                                            trackColor={{ false: '#ddd', true: COLORS.goldPale }}
                                            thumbColor={form.isSpecial ? COLORS.gold : '#f4f3f4'}
                                        />
                                    </View>

                                    {/* isActive toggle */}
                                    <View style={st.switchRow}>
                                        <Text style={st.inputLabel}>Идэвхтэй</Text>
                                        <Switch
                                            value={form.isActive !== false}
                                            onValueChange={(v) => updateField('isActive', v)}
                                            trackColor={{ false: '#ddd', true: COLORS.goldPale }}
                                            thumbColor={form.isActive ? COLORS.gold : '#f4f3f4'}
                                        />
                                    </View>
                                </View>
                            )}

                            {/* ── DETAILS ── */}
                            {activeTab === 'details' && (
                                <View>
                                    <Text style={st.inputLabel}>Туршлага (Жил)</Text>
                                    <TextInput style={st.input} value={String(form.yearsOfExperience || '')} onChangeText={(v) => updateField('yearsOfExperience', parseInt(v) || 0)} keyboardType="number-pad" placeholderTextColor={COLORS.textLight} />

                                    <Text style={st.inputLabel}>Мэргэшил (Specialties)</Text>
                                    {(form.specialties || []).map((s: string, idx: number) => (
                                        <View key={idx} style={st.specRow}>
                                            <TextInput style={[st.input, { flex: 1, marginBottom: 0 }]} value={s} onChangeText={(v) => updateSpecialty(idx, v)} placeholderTextColor={COLORS.textLight} />
                                            <Pressable onPress={() => removeSpecialty(idx)} style={st.specRemove}>
                                                <Trash2 size={16} color="#DC2626" />
                                            </Pressable>
                                        </View>
                                    ))}
                                    <Pressable onPress={addSpecialty} style={st.addSpecBtn}>
                                        <Plus size={14} color={COLORS.gold} />
                                        <Text style={st.addSpecText}>Нэмэх</Text>
                                    </Pressable>

                                    <Text style={st.inputLabel}>Боловсрол (MN)</Text>
                                    <TextInput style={[st.input, { height: 80 }]} value={form.education?.mn || ''} onChangeText={(v) => updateNested('education', 'mn', v)} multiline placeholderTextColor={COLORS.textLight} />

                                    <Text style={st.inputLabel}>Education (EN)</Text>
                                    <TextInput style={[st.input, { height: 80 }]} value={form.education?.en || ''} onChangeText={(v) => updateNested('education', 'en', v)} multiline placeholderTextColor={COLORS.textLight} />
                                </View>
                            )}

                            {/* ── BIO ── */}
                            {activeTab === 'bio' && (
                                <View>
                                    <Text style={st.inputLabel}>Намтар (MN)</Text>
                                    <TextInput style={[st.input, { height: 100 }]} value={form.bio?.mn || ''} onChangeText={(v) => updateNested('bio', 'mn', v)} multiline placeholderTextColor={COLORS.textLight} />

                                    <Text style={st.inputLabel}>Biography (EN)</Text>
                                    <TextInput style={[st.input, { height: 100 }]} value={form.bio?.en || ''} onChangeText={(v) => updateNested('bio', 'en', v)} multiline placeholderTextColor={COLORS.textLight} />

                                    <Text style={st.inputLabel}>Философи (MN)</Text>
                                    <TextInput style={[st.input, { height: 80 }]} value={form.philosophy?.mn || ''} onChangeText={(v) => updateNested('philosophy', 'mn', v)} multiline placeholderTextColor={COLORS.textLight} />

                                    <Text style={st.inputLabel}>Philosophy (EN)</Text>
                                    <TextInput style={[st.input, { height: 80 }]} value={form.philosophy?.en || ''} onChangeText={(v) => updateNested('philosophy', 'en', v)} multiline placeholderTextColor={COLORS.textLight} />

                                    <Text style={st.inputLabel}>Ишлэл (MN)</Text>
                                    <TextInput style={st.input} value={form.quote?.mn || ''} onChangeText={(v) => updateNested('quote', 'mn', v)} placeholderTextColor={COLORS.textLight} />

                                    <Text style={st.inputLabel}>Quote (EN)</Text>
                                    <TextInput style={st.input} value={form.quote?.en || ''} onChangeText={(v) => updateNested('quote', 'en', v)} placeholderTextColor={COLORS.textLight} />
                                </View>
                            )}

                            {/* ── ACCOUNT ── */}
                            {activeTab === 'account' && (
                                <View>
                                    <Text style={st.inputLabel}>Үүрэг (Role)</Text>
                                    <View style={st.roleRow}>
                                        {ROLE_OPTIONS.map((opt) => {
                                            const isActive = form.role === opt.value;
                                            return (
                                                <Pressable
                                                    key={opt.value}
                                                    style={[st.roleBtn, isActive && st.roleBtnActive]}
                                                    onPress={() => updateField('role', opt.value)}
                                                >
                                                    <Text style={[st.roleBtnText, isActive && st.roleBtnTextActive]}>{opt.label}</Text>
                                                </Pressable>
                                            );
                                        })}
                                    </View>
                                </View>
                            )}

                            {/* Save Button */}
                            <Pressable onPress={handleSave} style={{ marginTop: 20 }}>
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
    headerTitle: { fontFamily: SERIF, fontSize: 18, fontWeight: '700', color: COLORS.text },

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
    monkName: { fontFamily: SERIF, fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
    monkSpec: { fontSize: 12, color: COLORS.textLight, marginBottom: 4 },
    activeRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    activeDot: { width: 8, height: 8, borderRadius: 4 },
    activeText: { fontSize: 11, color: COLORS.textMid, fontWeight: '600' },
    specialBadge: {
        backgroundColor: 'rgba(217,119,6,0.12)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
    },
    specialBadgeText: { fontSize: 9, fontWeight: '800', color: COLORS.gold },
    deleteBtn: {
        width: 38, height: 38, borderRadius: 12, backgroundColor: '#FEE2E2',
        alignItems: 'center', justifyContent: 'center',
    },

    /* Modal */
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalSheet: {
        backgroundColor: COLORS.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28,
        paddingHorizontal: 24, paddingTop: 12, paddingBottom: 40, maxHeight: '90%',
    },
    modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: 'center', marginBottom: 20 },
    modalClose: {
        position: 'absolute', top: 16, right: 20, width: 32, height: 32, borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.8)', borderWidth: 1, borderColor: COLORS.border,
        alignItems: 'center', justifyContent: 'center', zIndex: 10,
    },
    modalTitle: { fontFamily: SERIF, fontSize: 18, fontWeight: '800', color: COLORS.text, textAlign: 'center', marginBottom: 16 },

    /* Tabs */
    tabChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    tabChipInactive: {
        paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.8)', borderWidth: 1, borderColor: COLORS.border,
    },
    tabTextActive: { fontSize: 12, fontWeight: '800', color: '#1A0800' },
    tabTextInactive: { fontSize: 12, fontWeight: '600', color: COLORS.textMid },

    /* Inputs */
    inputLabel: { fontFamily: SERIF, fontSize: 12, fontWeight: '600', color: COLORS.textMid, marginBottom: 8, marginLeft: 2 },
    input: {
        backgroundColor: COLORS.bgWarm, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border,
        paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: COLORS.text, fontWeight: '500', marginBottom: 16,
        textAlignVertical: 'top',
    },

    /* Special Row */
    specialRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: 'rgba(217,119,6,0.06)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(217,119,6,0.15)',
        padding: 16, marginBottom: 16,
    },
    specialLabel: { fontFamily: SERIF, fontSize: 13, fontWeight: '700', color: COLORS.text },
    specialDesc: { fontSize: 11, color: COLORS.textLight, marginTop: 2 },

    switchRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20,
    },

    /* Specialties */
    specRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    specRemove: {
        width: 36, height: 36, borderRadius: 10, backgroundColor: '#FEE2E2',
        alignItems: 'center', justifyContent: 'center',
    },
    addSpecBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: 'rgba(217,119,6,0.08)', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
        borderWidth: 1, borderColor: 'rgba(217,119,6,0.15)', marginBottom: 20, alignSelf: 'flex-start',
    },
    addSpecText: { fontSize: 12, fontWeight: '700', color: COLORS.gold },

    /* Role Picker */
    roleRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    roleBtn: {
        flex: 1, paddingVertical: 14, borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.8)', borderWidth: 1, borderColor: COLORS.border,
        alignItems: 'center',
    },
    roleBtnActive: { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
    roleBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.textMid },
    roleBtnTextActive: { color: '#fff' },

    /* Save */
    saveBtn: { borderRadius: 18, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
    saveBtnText: { color: '#1A0800', fontWeight: '800', fontSize: 15, letterSpacing: 1 },
});
