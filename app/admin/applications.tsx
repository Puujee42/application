import React, { useState, useCallback } from 'react';
import {
    View, Text, Pressable, StyleSheet, FlatList,
    RefreshControl, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Check, X } from 'lucide-react-native';
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

export default function AdminApplications() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [refreshing, setRefreshing] = useState(false);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const { data: applications, isLoading, refetch } = useQuery({
        queryKey: ['admin-applications'],
        queryFn: async () => {
            const res = await api.get('/admin/data');
            const users = res.data?.users || [];
            // Filter to pending monk applications
            return users.filter((u: any) => u.monkStatus === 'pending') as any[];
        },
    });

    const onRefresh = useCallback(async () => {
        setRefreshing(true); await refetch(); setRefreshing(false);
    }, [refetch]);

    const actionMutation = useMutation({
        mutationFn: async ({ id, action }: { id: string; action: 'approve' | 'reject' }) => {
            setProcessingId(id);
            const res = await api.patch(`/admin/applications/${id}`, { action });
            return res.data;
        },
        onSuccess: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            queryClient.invalidateQueries({ queryKey: ['admin-applications'] });
            queryClient.invalidateQueries({ queryKey: ['admin-data'] });
            queryClient.invalidateQueries({ queryKey: ['admin-monks'] });
        },
        onError: (err: any) => {
            Alert.alert('Алдаа', err?.response?.data?.message || 'Үйлдэл гүйцэтгэхэд алдаа гарлаа');
        },
        onSettled: () => setProcessingId(null),
    });

    const handleAction = (user: any, action: 'approve' | 'reject') => {
        const name = t(user.name) || user.phone || 'Хэрэглэгч';
        const msg = action === 'approve'
            ? `${name}-г лам болгохыг зөвшөөрөх үү?`
            : `${name}-ийн хүсэлтийг татгалзах уу?`;

        Alert.alert(action === 'approve' ? 'Зөвшөөрөх' : 'Татгалзах', msg, [
            { text: 'Үгүй', style: 'cancel' },
            { text: action === 'approve' ? 'Зөвшөөрөх' : 'Татгалзах', onPress: () => actionMutation.mutate({ id: user._id, action }) },
        ]);
    };

    return (
        <View style={st.container}>
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                <View style={st.header}>
                    <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }} style={st.backBtn}>
                        <ArrowLeft size={22} color={COLORS.text} />
                    </Pressable>
                    <Text style={st.headerTitle}>Лам болох хүсэлтүүд</Text>
                    <View style={{ width: 44 }} />
                </View>

                {isLoading ? (
                    <ActivityIndicator size="large" color={COLORS.gold} style={{ marginTop: 40 }} />
                ) : (
                    <FlatList
                        data={applications}
                        keyExtractor={(it) => it._id}
                        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
                        showsVerticalScrollIndicator={false}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.gold} colors={[COLORS.gold]} />}
                        renderItem={({ item, index }) => (
                            <Animated.View entering={FadeInDown.delay(index * 80).duration(400)}>
                                <View style={st.appCard}>
                                    {/* Header */}
                                    <View style={st.appHeader}>
                                        {item.image ? (
                                            <Image source={{ uri: item.image }} style={st.avatar} contentFit="cover" />
                                        ) : (
                                            <View style={[st.avatar, st.avatarFallback]}>
                                                <Text style={st.avatarText}>
                                                    {(t(item.name)?.[0] || '?').toUpperCase()}
                                                </Text>
                                            </View>
                                        )}
                                        <View style={{ flex: 1, marginLeft: 12 }}>
                                            <Text style={st.appName}>{t(item.name) || item.phone || 'Нэргүй'}</Text>
                                            <Text style={st.appTitle}>{t(item.title)}</Text>
                                        </View>
                                    </View>

                                    {/* Info chips */}
                                    <View style={st.chipRow}>
                                        {item.yearsOfExperience != null && (
                                            <View style={st.chip}>
                                                <Text style={st.chipText}>{item.yearsOfExperience} жил туршлага</Text>
                                            </View>
                                        )}
                                        <View style={st.chip}>
                                            <Text style={st.chipText}>{item.email || item.phone || ''}</Text>
                                        </View>
                                    </View>

                                    {/* Actions */}
                                    <View style={st.actionRow}>
                                        <Pressable
                                            style={[st.actionBtn, st.approveBtn]}
                                            onPress={() => handleAction(item, 'approve')}
                                            disabled={processingId === item._id}
                                        >
                                            {processingId === item._id ? (
                                                <ActivityIndicator size="small" color="#fff" />
                                            ) : (
                                                <>
                                                    <Check size={14} color="#fff" />
                                                    <Text style={st.approveBtnText}>Зөвшөөрөх</Text>
                                                </>
                                            )}
                                        </Pressable>
                                        <Pressable
                                            style={[st.actionBtn, st.rejectBtn]}
                                            onPress={() => handleAction(item, 'reject')}
                                            disabled={processingId === item._id}
                                        >
                                            <X size={14} color="#DC2626" />
                                            <Text style={st.rejectBtnText}>Татгалзах</Text>
                                        </Pressable>
                                    </View>
                                </View>
                            </Animated.View>
                        )}
                        ListEmptyComponent={
                            <View style={{ alignItems: 'center', paddingTop: 60 }}>
                                <Text style={{ fontSize: 40, marginBottom: 12 }}>✅</Text>
                                <Text style={{ color: COLORS.textLight, fontFamily: 'Georgia' }}>
                                    Хүлээгдэж буй хүсэлт алга
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

    /* App card */
    appCard: {
        backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 22,
        borderWidth: 1, borderColor: COLORS.border, padding: 18, marginBottom: 12,
        ...SHADOWS.card,
    },
    appHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    avatar: {
        width: 52, height: 52, borderRadius: 16,
        borderWidth: 1.5, borderColor: COLORS.gold,
    },
    avatarFallback: {
        backgroundColor: COLORS.goldPale, alignItems: 'center', justifyContent: 'center',
    },
    avatarText: { fontFamily: 'Georgia', fontSize: 18, fontWeight: '800', color: COLORS.deepGold },
    appName: { fontFamily: 'Georgia', fontSize: 15, fontWeight: '800', color: COLORS.text },
    appTitle: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },

    /* Chips */
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
    chip: {
        backgroundColor: 'rgba(0,0,0,0.04)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
    },
    chipText: { fontSize: 11, color: COLORS.textMid, fontWeight: '600' },

    /* Actions */
    actionRow: { flexDirection: 'row', gap: 10 },
    actionBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 6, paddingVertical: 14, borderRadius: 16,
    },
    approveBtn: { backgroundColor: '#22C55E' },
    approveBtnText: { color: '#fff', fontWeight: '800', fontSize: 11, textTransform: 'uppercase' },
    rejectBtn: { backgroundColor: 'rgba(220,38,38,0.08)' },
    rejectBtnText: { color: '#DC2626', fontWeight: '800', fontSize: 11, textTransform: 'uppercase' },
});
