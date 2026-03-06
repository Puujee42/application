import React, { useState, useCallback } from 'react';
import {
    View, Text, Pressable, StyleSheet, FlatList,
    RefreshControl, Modal, TextInput, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, X, Plus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import api from '../../lib/api';
import { COLORS, SHADOWS } from '../../design-system/theme';

const t = (data: any) => {
    if (!data) return '';
    if (typeof data === 'string') return data;
    return data.mn || data.en || '';
};

const EMPTY_FORM = { titleMn: '', titleEn: '', contentMn: '', contentEn: '' };

export default function AdminBlog() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editing, setEditing] = useState<any>(null);
    const [form, setForm] = useState(EMPTY_FORM);

    const { data: blogs, isLoading, refetch } = useQuery({
        queryKey: ['admin-blogs'],
        queryFn: async () => {
            const res = await api.get('/blogs');
            return res.data as any[];
        },
    });

    const onRefresh = useCallback(async () => {
        setRefreshing(true); await refetch(); setRefreshing(false);
    }, [refetch]);

    const saveMutation = useMutation({
        mutationFn: async (data: any) => {
            if (editing?._id) {
                return api.put('/admin/content', { ...data, id: editing.id || editing._id, type: 'blog' });
            }
            return api.post('/admin/content', { ...data, type: 'blog' });
        },
        onSuccess: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            queryClient.invalidateQueries({ queryKey: ['admin-blogs'] });
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
            return api.delete('/admin/content', { data: { id, type: 'blog' } });
        },
        onSuccess: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            queryClient.invalidateQueries({ queryKey: ['admin-blogs'] });
        },
    });

    const openNew = () => {
        setEditing(null);
        setForm(EMPTY_FORM);
        setModalVisible(true);
    };

    const openEdit = (blog: any) => {
        setEditing(blog);
        setForm({
            titleMn: blog.title?.mn || t(blog.title) || '',
            titleEn: blog.title?.en || '',
            contentMn: blog.content?.mn || t(blog.content) || '',
            contentEn: blog.content?.en || '',
        });
        setModalVisible(true);
    };

    const handleDelete = (id: string) => {
        Alert.alert('Устгах', 'Энэ нийтлэлийг устгахдаа итгэлтэй байна уу?', [
            { text: 'Үгүй', style: 'cancel' },
            { text: 'Устгах', style: 'destructive', onPress: () => deleteMutation.mutate(id) },
        ]);
    };

    const handleSave = () => {
        if (!form.titleMn.trim()) { Alert.alert('Алдаа', 'Гарчиг оруулна уу'); return; }
        saveMutation.mutate({
            titleMn: form.titleMn,
            titleEn: form.titleEn || form.titleMn,
            contentMn: form.contentMn,
            contentEn: form.contentEn || form.contentMn,
        });
    };

    return (
        <View style={st.container}>
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                <View style={st.header}>
                    <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }} style={st.backBtn}>
                        <ArrowLeft size={22} color={COLORS.text} />
                    </Pressable>
                    <Text style={st.headerTitle}>Блог удирдах</Text>
                    <View style={{ width: 44 }} />
                </View>

                <FlatList
                    data={blogs}
                    keyExtractor={(it) => it.id || it._id || Math.random().toString()}
                    contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.gold} colors={[COLORS.gold]} />}
                    renderItem={({ item, index }) => (
                        <Animated.View entering={FadeInDown.delay(index * 60).duration(400)}>
                            <Pressable style={st.blogCard} onPress={() => openEdit(item)}>
                                <View style={{ flex: 1 }}>
                                    <Text style={st.blogTitle} numberOfLines={2}>{t(item.title)}</Text>
                                    <Text style={st.blogContent} numberOfLines={2}>{t(item.content)}</Text>
                                    <Text style={st.blogDate}>
                                        {item.date ? new Date(item.date).toLocaleDateString() : ''}
                                        {item.authorName ? ` • ${item.authorName}` : ''}
                                    </Text>
                                </View>
                                <Pressable
                                    onPress={() => handleDelete(item.id || item._id)}
                                    style={st.deleteBtn}
                                >
                                    <Text style={{ color: COLORS.error, fontSize: 16 }}>🗑</Text>
                                </Pressable>
                            </Pressable>
                        </Animated.View>
                    )}
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', paddingTop: 60 }}>
                            <Text style={{ fontSize: 40, marginBottom: 12 }}>📰</Text>
                            <Text style={{ color: COLORS.textLight, fontFamily: 'Georgia' }}>
                                {isLoading ? 'Уншиж байна...' : 'Нийтлэл байхгүй байна'}
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

                        <Text style={st.modalTitle}>{editing ? 'Нийтлэл засах' : 'Шинэ нийтлэл'}</Text>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                            <Text style={st.inputLabel}>Гарчиг (МН) *</Text>
                            <TextInput
                                style={st.input}
                                value={form.titleMn}
                                onChangeText={(v) => setForm({ ...form, titleMn: v })}
                                placeholder="Монгол гарчиг"
                                placeholderTextColor={COLORS.textLight}
                            />

                            <Text style={st.inputLabel}>Гарчиг (EN)</Text>
                            <TextInput
                                style={st.input}
                                value={form.titleEn}
                                onChangeText={(v) => setForm({ ...form, titleEn: v })}
                                placeholder="English title"
                                placeholderTextColor={COLORS.textLight}
                            />

                            <Text style={st.inputLabel}>Агуулга (МН) *</Text>
                            <TextInput
                                style={[st.input, st.textarea]}
                                value={form.contentMn}
                                onChangeText={(v) => setForm({ ...form, contentMn: v })}
                                placeholder="Монгол агуулга бичнэ үү..."
                                placeholderTextColor={COLORS.textLight}
                                multiline
                                numberOfLines={6}
                                textAlignVertical="top"
                            />

                            <Text style={st.inputLabel}>Агуулга (EN)</Text>
                            <TextInput
                                style={[st.input, st.textarea]}
                                value={form.contentEn}
                                onChangeText={(v) => setForm({ ...form, contentEn: v })}
                                placeholder="English content..."
                                placeholderTextColor={COLORS.textLight}
                                multiline
                                numberOfLines={6}
                                textAlignVertical="top"
                            />

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

    /* Blog card */
    blogCard: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 18,
        borderWidth: 1, borderColor: COLORS.border, padding: 16, marginBottom: 10,
        ...SHADOWS.card,
    },
    blogTitle: { fontFamily: 'Georgia', fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
    blogContent: { fontSize: 13, color: COLORS.textLight, lineHeight: 18, marginBottom: 6 },
    blogDate: { fontSize: 11, color: COLORS.textMid },
    deleteBtn: {
        width: 38, height: 38, borderRadius: 12, backgroundColor: '#FEE2E2',
        alignItems: 'center', justifyContent: 'center', marginLeft: 10,
    },

    /* FAB */
    fab: { position: 'absolute', bottom: 30, right: 24 },
    fabGradient: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },

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
    modalTitle: { fontFamily: 'Georgia', fontSize: 18, fontWeight: '800', color: COLORS.text, textAlign: 'center', marginBottom: 24 },
    inputLabel: { fontFamily: 'Georgia', fontSize: 12, fontWeight: '600', color: COLORS.textMid, marginBottom: 8, marginLeft: 2 },
    input: {
        backgroundColor: COLORS.bgWarm, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border,
        paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: COLORS.text, fontWeight: '500', marginBottom: 16,
    },
    textarea: { minHeight: 120, lineHeight: 22 },
    saveBtn: { borderRadius: 18, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
    saveBtnText: { color: '#1A0800', fontWeight: '800', fontSize: 15, letterSpacing: 1 },
});
