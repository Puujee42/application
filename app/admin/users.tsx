import React, { useState, useCallback, useMemo } from 'react';
import {
    View, Text, Pressable, StyleSheet, FlatList,
    RefreshControl, Alert, TextInput, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Search } from 'lucide-react-native';
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

const ROLE_BADGES: Record<string, { label: string; bg: string; color: string }> = {
    admin: { label: 'Админ', bg: '#FEE2E2', color: '#DC2626' },
    monk: { label: 'Лам', bg: COLORS.goldPale, color: COLORS.deepGold },
};

export default function AdminUsers() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');

    const { data: adminData, isLoading, refetch } = useQuery({
        queryKey: ['admin-data'],
        queryFn: async () => {
            const res = await api.get('/admin/data');
            return res.data;
        },
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
            const res = await api.delete(`/admin/users/${id}`);
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

    const handleDelete = (user: any) => {
        if (user.role === 'admin') return;
        Alert.alert('Устгах', `${t(user.name) || user.phone || 'Хэрэглэгч'}-г устгахдаа итгэлтэй байна уу?`, [
            { text: 'Үгүй', style: 'cancel' },
            { text: 'Устгах', style: 'destructive', onPress: () => deleteMutation.mutate(user._id) },
        ]);
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
                                <View style={st.userCard}>
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
                                </View>
                            </Animated.View>
                        )}
                        ListEmptyComponent={
                            <View style={{ alignItems: 'center', paddingTop: 60 }}>
                                <Text style={{ fontSize: 40, marginBottom: 12 }}>👤</Text>
                                <Text style={{ color: COLORS.textLight, fontFamily: 'Georgia' }}>
                                    Хэрэглэгч олдсонгүй
                                </Text>
                            </View>
                        }
                    />
                )}
            </SafeAreaView>
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
    avatarText: { fontFamily: 'Georgia', fontSize: 16, fontWeight: '800', color: COLORS.deepGold },
    userName: { fontFamily: 'Georgia', fontSize: 14, fontWeight: '700', color: COLORS.text, maxWidth: '70%' },
    userSub: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
    userDate: { fontSize: 10, color: COLORS.textMid, marginTop: 2 },
    badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
    badgeText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
    deleteBtn: {
        width: 38, height: 38, borderRadius: 12, backgroundColor: '#FEE2E2',
        alignItems: 'center', justifyContent: 'center',
    },
});
