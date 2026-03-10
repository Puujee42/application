import React, { useState, useCallback, useMemo } from 'react';
import {
    View, Text, Pressable, StyleSheet, FlatList,
    RefreshControl, Alert, TextInput, ActivityIndicator,
    Modal, ScrollView, Switch, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Search, X } from 'lucide-react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useUserStore } from '../../store/userStore';
import api from '../../lib/api';
import { COLORS, SHADOWS } from '../../design-system/theme';

const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';
const t = (data: any) => {
    if (!data) return '';
    if (typeof data === 'string') return data;
    return data.mn || data.en || '';
};

const ROLE_BADGES: Record<string, { label: string; bg: string; color: string }> = {
    admin: { label: 'Админ', bg: '#FEE2E2', color: '#DC2626' },
    monk: { label: 'Лам', bg: COLORS.goldPale, color: COLORS.deepGold },
};

const ROLE_OPTIONS = [
    { value: 'seeker', label: 'Хэрэглэгч' },
    { value: 'monk', label: 'Лам' },
    { value: 'admin', label: 'Админ' },
];

const EDIT_TABS = [
    { key: 'basic', label: 'Үндсэн' },
    { key: 'account', label: 'Бүртгэл & Эрх' },
];

export default function AdminUsers() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { user: dbUser } = useUserStore();
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');

    // Edit modal state
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [editForm, setEditForm] = useState<any>({});
    const [editTab, setEditTab] = useState('basic');

    const { data: adminData, isLoading, error, refetch } = useQuery({
        queryKey: ['admin-data', dbUser?._id],
        queryFn: async () => {
            const res = await api.get(`/admin/data?userId=${dbUser?._id}`);
            return res.data;
        },
        enabled: !!dbUser?._id,
    });

    const users = useMemo(() => {
        const all = (adminData?.users || []) as any[];
        if (!search.trim()) return all;
        const q = search.toLowerCase();
        return all.filter((u: any) =>
            (t(u.name) || '').toLowerCase().includes(q) ||
            (u.email || '').toLowerCase().includes(q) ||
            (u.phone || '').includes(q)
        );
    }, [adminData?.users, search]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true); await refetch(); setRefreshing(false);
    }, [refetch]);

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await api.delete(`/admin/users/${id}?userId=${dbUser?._id}`);
            return res.data;
        },
        onSuccess: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            queryClient.invalidateQueries({ queryKey: ['admin-data'] });
        },
        onError: () => {
            Alert.alert('Алдаа', 'Устгахад алдаа гарлаа');
        },
    });

    const saveMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const res = await api.patch(`/admin/users/${id}?userId=${dbUser?._id}`, data);
            return res.data;
        },
        onSuccess: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            queryClient.invalidateQueries({ queryKey: ['admin-data'] });
            setEditModalVisible(false);
            setEditingUser(null);
        },
        onError: () => {
            Alert.alert('Алдаа', 'Хадгалахад алдаа гарлаа');
        },
    });

    const handleDelete = (user: any) => {
        if (user.role === 'admin') return;
        Alert.alert('Устгах', `${t(user.name) || user.phone || 'Хэрэглэгч'}-г устгахдаа итгэлтэй байна уу?`, [
            { text: 'Үгүй', style: 'cancel' },
            { text: 'Устгах', style: 'destructive', onPress: () => deleteMutation.mutate(user._id) },
        ]);
    };

    const openEdit = (user: any) => {
        setEditingUser(user);
        let name = { mn: '', en: '' };
        if (typeof user.name === 'string') {
            name = { mn: user.name, en: user.name };
        } else if (user.name) {
            name = { mn: user.name.mn || '', en: user.name.en || '' };
        }
        setEditForm({
            name,
            phone: user.phone || '',
            email: user.email || '',
            karma: user.karma || 0,
            totalMerits: user.totalMerits || 0,
            earnings: user.earnings || 0,
            role: user.role || 'seeker',
        });
        setEditTab('basic');
        setEditModalVisible(true);
    };

    const handleSaveUser = () => {
        if (!editingUser) return;
        saveMutation.mutate({ id: editingUser._id, data: editForm });
    };

    const updateField = (field: string, value: any) => {
        setEditForm((prev: any) => ({ ...prev, [field]: value }));
    };

    const updateNested = (field: string, subField: string, value: string) => {
        setEditForm((prev: any) => ({
            ...prev,
            [field]: { ...prev[field], [subField]: value }
        }));
    };

    return (
        <View style={st.container}>
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                <View style={st.header}>
                    <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }} style={st.backBtn}>
                        <ArrowLeft size={22} color={COLORS.text} />
                    </Pressable>
                    <Text style={st.headerTitle}>Хэрэглэгч ({users.length})</Text>
                    <View style={{ width: 44 }} />
                </View>

                {/* Search */}
                <View style={st.searchBox}>
                    <Search size={16} color={COLORS.textLight} />
                    <TextInput
                        style={st.searchInput}
                        placeholder="Хэрэглэгч хайх..."
                        placeholderTextColor={COLORS.textLight}
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>

                {isLoading ? (
                    <ActivityIndicator size="large" color={COLORS.gold} style={{ marginTop: 40 }} />
                ) : (
                    <FlatList
                        data={users}
                        keyExtractor={(it) => it._id}
                        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
                        showsVerticalScrollIndicator={false}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.gold} colors={[COLORS.gold]} />}
                        renderItem={({ item, index }) => (
                            <Animated.View entering={FadeInDown.delay(index * 40).duration(350)}>
                                <Pressable style={st.userCard} onPress={() => openEdit(item)}>
                                    {item.image ? (
                                        <Image source={{ uri: item.image }} style={st.avatar} contentFit="cover" />
                                    ) : (
                                        <View style={[st.avatar, st.avatarFallback]}>
                                            <Text style={st.avatarText}>
                                                {(t(item.name)?.[0] || item.phone?.[0] || 'U').toUpperCase()}
                                            </Text>
                                        </View>
                                    )}
                                    <View style={{ flex: 1, marginLeft: 12 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                            <Text style={st.userName} numberOfLines={1}>{t(item.name) || item.phone || 'Нэргүй'}</Text>
                                            {ROLE_BADGES[item.role] && (
                                                <View style={[st.badge, { backgroundColor: ROLE_BADGES[item.role].bg }]}>
                                                    <Text style={[st.badgeText, { color: ROLE_BADGES[item.role].color }]}>
                                                        {ROLE_BADGES[item.role].label}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                        <Text style={st.userSub} numberOfLines={1}>{item.email || item.phone || ''}</Text>
                                        <Text style={st.userDate}>
                                            {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}
                                        </Text>
                                    </View>
                                    {item.role !== 'admin' && (
                                        <Pressable onPress={() => handleDelete(item)} style={st.deleteBtn}>
                                            <Text style={{ color: COLORS.error, fontSize: 16 }}>🗑</Text>
                                        </Pressable>
                                    )}
                                </Pressable>
                            </Animated.View>
                        )}
                        ListEmptyComponent={
                            <View style={{ alignItems: 'center', paddingTop: 60 }}>
                                <Text style={{ fontSize: 40, marginBottom: 12 }}>👤</Text>
                                <Text style={{ color: COLORS.textLight, fontFamily: SERIF }}>
                                    Хэрэглэгч олдсонгүй
                                </Text>
                            </View>
                        }
                    />
                )}
            </SafeAreaView>

            {/* ─── User Edit Modal ─── */}
            <Modal visible={editModalVisible} transparent animationType="slide" onRequestClose={() => setEditModalVisible(false)}>
                <View style={st.modalOverlay}>
                    <View style={st.modalSheet}>
                        <View style={st.modalHandle} />
                        <Pressable onPress={() => setEditModalVisible(false)} style={st.modalClose}>
                            <X size={18} color={COLORS.textMid} />
                        </Pressable>

                        <Text style={st.modalTitle}>Хэрэглэгч засах</Text>

                        {/* Tab Bar */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, marginBottom: 16 }} contentContainerStyle={{ gap: 6 }}>
                            {EDIT_TABS.map((tab) => {
                                const isActive = editTab === tab.key;
                                return isActive ? (
                                    <LinearGradient key={tab.key} colors={[COLORS.gold, COLORS.deepGold]} style={st.tabChip}>
                                        <Text style={st.tabTextActive}>{tab.label}</Text>
                                    </LinearGradient>
                                ) : (
                                    <Pressable key={tab.key} style={st.tabChipInactive} onPress={() => setEditTab(tab.key)}>
                                        <Text style={st.tabTextInactive}>{tab.label}</Text>
                                    </Pressable>
                                );
                            })}
                        </ScrollView>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>

                            {/* BASIC */}
                            {editTab === 'basic' && (
                                <View>
                                    <Text style={st.inputLabel}>Нэр (MN)</Text>
                                    <TextInput style={st.input} value={editForm.name?.mn || ''} onChangeText={(v) => updateNested('name', 'mn', v)} placeholder="Монгол нэр" placeholderTextColor={COLORS.textLight} />

                                    <Text style={st.inputLabel}>Name (EN)</Text>
                                    <TextInput style={st.input} value={editForm.name?.en || ''} onChangeText={(v) => updateNested('name', 'en', v)} placeholder="English name" placeholderTextColor={COLORS.textLight} />

                                    <Text style={st.inputLabel}>Утас</Text>
                                    <TextInput style={st.input} value={editForm.phone || ''} onChangeText={(v) => updateField('phone', v)} keyboardType="phone-pad" placeholderTextColor={COLORS.textLight} />

                                    <Text style={st.inputLabel}>Имэйл</Text>
                                    <TextInput style={st.input} value={editForm.email || ''} onChangeText={(v) => updateField('email', v)} keyboardType="email-address" autoCapitalize="none" placeholderTextColor={COLORS.textLight} />
                                </View>
                            )}

                            {/* ACCOUNT */}
                            {editTab === 'account' && (
                                <View>
                                    <Text style={st.inputLabel}>Karma</Text>
                                    <TextInput style={st.input} value={String(editForm.karma || '')} onChangeText={(v) => updateField('karma', parseInt(v) || 0)} keyboardType="number-pad" placeholderTextColor={COLORS.textLight} />

                                    <Text style={st.inputLabel}>Total Merits</Text>
                                    <TextInput style={st.input} value={String(editForm.totalMerits || '')} onChangeText={(v) => updateField('totalMerits', parseInt(v) || 0)} keyboardType="number-pad" placeholderTextColor={COLORS.textLight} />

                                    <Text style={st.inputLabel}>Earnings (₮)</Text>
                                    <TextInput style={st.input} value={String(editForm.earnings || '')} onChangeText={(v) => updateField('earnings', parseInt(v) || 0)} keyboardType="number-pad" placeholderTextColor={COLORS.textLight} />

                                    <Text style={st.inputLabel}>Үүрэг (Role)</Text>
                                    <View style={st.roleRow}>
                                        {ROLE_OPTIONS.map((opt) => {
                                            const isActive = editForm.role === opt.value;
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

                            {/* Save */}
                            <Pressable onPress={handleSaveUser} style={{ marginTop: 20 }}>
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

    /* Search */
    searchBox: {
        flexDirection: 'row', alignItems: 'center',
        marginHorizontal: 20, marginBottom: 16, paddingHorizontal: 14, paddingVertical: 12,
        backgroundColor: COLORS.bgWarm, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border,
    },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 14, color: COLORS.text },

    /* Card */
    userCard: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 18,
        borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 8,
        ...SHADOWS.card,
    },
    avatar: {
        width: 44, height: 44, borderRadius: 22,
        borderWidth: 1, borderColor: COLORS.border,
    },
    avatarFallback: {
        backgroundColor: COLORS.goldPale, alignItems: 'center', justifyContent: 'center',
    },
    avatarText: { fontFamily: SERIF, fontSize: 16, fontWeight: '800', color: COLORS.deepGold },
    userName: { fontFamily: SERIF, fontSize: 14, fontWeight: '700', color: COLORS.text, maxWidth: '70%' },
    userSub: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
    userDate: { fontSize: 10, color: COLORS.textMid, marginTop: 2 },
    badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
    badgeText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
    deleteBtn: {
        width: 38, height: 38, borderRadius: 12, backgroundColor: '#FEE2E2',
        alignItems: 'center', justifyContent: 'center',
    },

    /* Modal */
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalSheet: {
        backgroundColor: COLORS.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28,
        paddingHorizontal: 24, paddingTop: 12, paddingBottom: 40, maxHeight: '85%',
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
    },

    /* Role */
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
