import React, { useState, useMemo, useCallback } from 'react';
import {
    View, Text, FlatList, TextInput, TouchableOpacity,
    ActivityIndicator, Modal, KeyboardAvoidingView, Platform,
    Alert, ScrollView as RNScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Search, Zap, Filter, Calendar, Plus, X, ImageIcon,
    Trash2, Pencil, Loader2
} from 'lucide-react-native';
import { Image } from 'expo-image';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { getBlogs, createBlog, updateBlog, deleteBlog, uploadImageToCloudinary } from '../../lib/api';
import { ScrollView } from 'react-native';

interface BlogPost {
    id: string;
    _id: string;
    title: { en: string; mn: string };
    content: { en: string; mn: string };
    cover?: string;
    date: string;
    authorName?: string;
    category?: string;
}

interface FormData {
    titleMn: string;
    titleEn: string;
    contentMn: string;
    contentEn: string;
    date: string;
    imageUrl: string;
}

const emptyForm: FormData = {
    titleMn: '', titleEn: '',
    contentMn: '', contentEn: '',
    date: new Date().toISOString().split('T')[0],
    imageUrl: '',
};

const formatDate = (dateString: string) => {
    try {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    } catch (e) { return dateString; }
};

export default function BlogTabScreen() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { i18n } = useTranslation();
    const lang = (i18n.language === 'mn' ? 'mn' : 'en') as 'mn' | 'en';
    const tr = (data: { mn: string; en: string }) => data[lang] || data.en;

    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const [modalVisible, setModalVisible] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<FormData>(emptyForm);
    const [uploading, setUploading] = useState(false);

    const { data: posts, isLoading } = useQuery({
        queryKey: ['blogs'],
        queryFn: getBlogs,
    });

    const invalidateBlogs = () => queryClient.invalidateQueries({ queryKey: ['blogs'] });

    const createMutation = useMutation({
        mutationFn: createBlog,
        onSuccess: () => { invalidateBlogs(); closeModal(); },
        onError: () => Alert.alert(tr({ mn: 'Алдаа', en: 'Error' }), tr({ mn: 'Нийтлэл үүсгэхэд алдаа гарлаа', en: 'Failed to create post' })),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<FormData> }) => updateBlog(id, data),
        onSuccess: () => { invalidateBlogs(); closeModal(); },
        onError: () => Alert.alert(tr({ mn: 'Алдаа', en: 'Error' }), tr({ mn: 'Нийтлэл засахад алдаа гарлаа', en: 'Failed to update post' })),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteBlog,
        onSuccess: invalidateBlogs,
        onError: () => Alert.alert(tr({ mn: 'Алдаа', en: 'Error' }), tr({ mn: 'Устгахад алдаа гарлаа', en: 'Failed to delete post' })),
    });

    const categories = [
        { id: 'all', label: tr({ mn: 'Бүгд', en: 'All' }) },
        { id: 'wisdom', label: tr({ mn: 'Сургаал', en: 'Wisdom' }) },
        { id: 'news', label: tr({ mn: 'Мэдээ', en: 'News' }) },
        { id: 'meditation', label: tr({ mn: 'Бясалгал', en: 'Meditation' }) },
    ];

    const filteredPosts = useMemo(() => {
        return (posts || []).filter((post: BlogPost) => {
            const title = (post.title?.[lang] || post.title?.mn || '').toLowerCase();
            const content = (post.content?.[lang] || post.content?.mn || '').toLowerCase();
            const q = search.toLowerCase();
            const matchesSearch = title.includes(q) || content.includes(q);
            const matchesFilter = filter === 'all' || (post.category && post.category.toLowerCase() === filter);
            return matchesSearch && matchesFilter;
        });
    }, [posts, search, filter, lang]);

    const closeModal = useCallback(() => {
        setModalVisible(false);
        setEditingId(null);
        setForm(emptyForm);
    }, []);

    const openCreate = useCallback(() => {
        setEditingId(null);
        setForm(emptyForm);
        setModalVisible(true);
    }, []);

    const openEdit = useCallback((post: BlogPost) => {
        setEditingId(post.id || post._id);
        setForm({
            titleMn: post.title?.mn || '',
            titleEn: post.title?.en || '',
            contentMn: post.content?.mn || '',
            contentEn: post.content?.en || '',
            date: post.date || new Date().toISOString().split('T')[0],
            imageUrl: post.cover || '',
        });
        setModalVisible(true);
    }, []);

    const confirmDelete = useCallback((post: BlogPost) => {
        Alert.alert(
            tr({ mn: 'Устгах', en: 'Delete' }),
            tr({ mn: 'Энэ нийтлэлийг устгах уу?', en: 'Delete this blog post?' }),
            [
                { text: tr({ mn: 'Үгүй', en: 'Cancel' }), style: 'cancel' },
                { text: tr({ mn: 'Тийм', en: 'Delete' }), style: 'destructive', onPress: () => deleteMutation.mutate(post.id || post._id) },
            ]
        );
    }, []);

    const pickImage = async () => {
        const ImagePicker = await import('expo-image-picker');
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
        });
        if (result.canceled) return;
        const uri = result.assets[0].uri;
        setUploading(true);
        try {
            const url = await uploadImageToCloudinary(uri);
            setForm(prev => ({ ...prev, imageUrl: url }));
        } catch (e) {
            Alert.alert(tr({ mn: 'Алдаа', en: 'Error' }), tr({ mn: 'Зураг хуулахад алдаа гарлаа', en: 'Image upload failed' }));
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = () => {
        if (!form.titleMn && !form.titleEn) {
            Alert.alert(tr({ mn: 'Анхааруулга', en: 'Warning' }), tr({ mn: 'Гарчиг оруулна уу', en: 'Please enter a title' }));
            return;
        }
        if (editingId) {
            updateMutation.mutate({ id: editingId, data: form });
        } else {
            createMutation.mutate(form);
        }
    };

    const isSaving = createMutation.isPending || updateMutation.isPending;

    const renderBlogCard = ({ item, index }: { item: BlogPost; index: number }) => (
        <Animated.View entering={FadeInDown.delay(index * 80).duration(500)} className="px-6 mb-6">
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => {
                    import('expo-haptics').then(Haptics => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
                    router.push(`/blog/${item._id}`);
                }}
                onLongPress={() => {
                    import('expo-haptics').then(Haptics => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
                    Alert.alert(
                        item.title[lang] || item.title.en,
                        '',
                        [
                            { text: tr({ mn: 'Засах', en: 'Edit' }), onPress: () => openEdit(item) },
                            { text: tr({ mn: 'Устгах', en: 'Delete' }), style: 'destructive', onPress: () => confirmDelete(item) },
                            { text: tr({ mn: 'Болих', en: 'Cancel' }), style: 'cancel' },
                        ]
                    );
                }}
                className="bg-monk-surface rounded-[32px] overflow-hidden border border-monk-primary/10 shadow-xl"
                style={{ shadowColor: '#D4AF37', shadowRadius: 15, shadowOpacity: 0.1, elevation: 8 }}
            >
                {item.cover && (
                    <View className="relative">
                        <Image
                            source={{ uri: item.cover }}
                            style={{ width: '100%', height: 200 }}
                            contentFit="cover"
                            transition={500}
                        />
                        <View className="absolute bottom-0 w-full h-20" style={{ backgroundColor: 'rgba(243,239,230,0.5)', opacity: 0.5 }} />
                    </View>
                )}
                <View className="p-6 bg-monk-surface pt-5">
                    <View className="flex-row justify-between items-center mb-3">
                        {item.category && (
                            <View className="bg-monk-primary/10 px-3 py-1 rounded-full border border-monk-primary/20">
                                <Text className="text-[9px] font-bold text-monk-primary uppercase tracking-[2px]">
                                    {item.category}
                                </Text>
                            </View>
                        )}
                        <View className="flex-row items-center gap-1.5 opacity-60">
                            <Calendar size={12} color="#0F172A" />
                            <Text className="text-[10px] font-bold tracking-widest uppercase text-[#0F172A]">
                                {formatDate(item.date)}
                            </Text>
                        </View>
                    </View>
                    <Text className="text-2xl font-serif font-bold text-monk-text mb-3 leading-8 tracking-tight">
                        {item.title[lang] || item.title.en}
                    </Text>
                    <Text numberOfLines={2} className="text-monk-secondary leading-6 text-sm opacity-90">
                        {(item.content[lang] || item.content.en)?.replace(/<[^>]*>?/g, '')}
                    </Text>
                    {item.authorName && (
                        <View className="mt-5 pt-4 border-t border-monk-primary/10 flex-row items-center">
                            <Text className="text-[10px] font-bold text-monk-primary uppercase tracking-[2px]">
                                {tr({ mn: 'Зохиогч', en: 'Penned By' })}
                            </Text>
                            <Text className="text-xs font-serif font-bold text-monk-text ml-2">
                                {item.authorName}
                            </Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        </Animated.View>
    );

    return (
        <SafeAreaView className="flex-1 bg-monk-bg" edges={['top']}>
            <FlatList
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    <View className="px-6 pt-8 pb-4">
                        {/* Badge */}
                        <View className="flex-row self-start items-center gap-2 px-4 py-1.5 rounded-full border border-monk-primary/30 bg-monk-primary/10 mb-4 shadow-sm">
                            <Zap size={14} color="#D4AF37" fill="#D4AF37" />
                            <Text className="text-[10px] font-bold uppercase tracking-[3px] text-monk-primary">
                                {tr({ mn: 'Блог & Мэдээ', en: 'Blog & Wisdom' })}
                            </Text>
                        </View>

                        {/* Title */}
                        <Text className="text-4xl font-serif font-bold text-monk-text leading-tight mb-2 tracking-tight">
                            {tr({ mn: 'Өдөр тутмын', en: 'Daily' })}{' '}
                            <Text className="text-monk-primary">
                                {tr({ mn: 'Ухаарал', en: 'Wisdom' })}
                            </Text>
                        </Text>
                        <Text className="text-monk-secondary uppercase tracking-widest text-xs mb-8">
                            {tr({ mn: 'Сургаал, бясалгал, мэдлэг нийтлэлүүд', en: 'Teachings, meditation, and insights' })}
                        </Text>

                        {/* Search Bar */}
                        <View className="relative mb-6 shadow-sm">
                            <View className="absolute left-5 top-4 z-10">
                                <Search size={18} color="#D4AF37" opacity={0.7} />
                            </View>
                            <TextInput
                                placeholder={tr({ mn: 'Хайх...', en: 'Search wisdom...' })}
                                placeholderTextColor="#94A3B8"
                                value={search}
                                onChangeText={setSearch}
                                className="w-full py-4 pl-12 pr-6 rounded-2xl border border-monk-primary/20 bg-monk-surface text-[#0F172A] font-medium tracking-wide shadow-inner"
                            />
                        </View>

                        {/* Category Filter Tabs */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                            {categories.map((cat) => (
                                <TouchableOpacity
                                    key={cat.id}
                                    activeOpacity={0.8}
                                    onPress={() => {
                                        import('expo-haptics').then(Haptics => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
                                        setFilter(cat.id);
                                    }}
                                    className={`px-6 py-3 mr-3 rounded-full border transition-colors ${filter === cat.id
                                        ? 'bg-monk-primary border-monk-primary shadow-md'
                                        : 'bg-monk-surface border-monk-primary/20'
                                        }`}
                                >
                                    <Text className={`text-xs font-bold uppercase tracking-widest ${filter === cat.id
                                        ? 'text-[#0F172A]'
                                        : 'text-monk-secondary'
                                        }`}>
                                        {cat.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* Results Count */}
                        <View className="flex-row items-center gap-2 mt-4 mb-2 opacity-60 px-1">
                            <Filter size={12} color="#0F172A" />
                            <Text className="text-[10px] font-bold uppercase tracking-widest text-[#0F172A]">
                                {filteredPosts.length} {tr({ mn: 'Нийтлэл', en: 'Posts Found' })}
                            </Text>
                        </View>
                    </View>
                }
                data={filteredPosts}
                keyExtractor={(item: BlogPost) => item._id}
                renderItem={renderBlogCard}
                ListEmptyComponent={
                    isLoading ? (
                        <View className="items-center mt-12 bg-monk-surface/50 mx-6 p-10 rounded-[32px] border border-monk-primary/10">
                            <ActivityIndicator size="large" color="#D4AF37" />
                            <Text className="text-monk-primary mt-4 font-bold tracking-widest uppercase text-xs">
                                {tr({ mn: 'Ачааллаж байна...', en: 'Summoning...' })}
                            </Text>
                        </View>
                    ) : (
                        <View className="items-center mt-6 bg-monk-surface/50 mx-6 p-10 rounded-[32px] border border-monk-primary/10">
                            <Text className="text-center text-monk-secondary font-serif text-lg italic tracking-tight">
                                {tr({ mn: 'Нийтлэл олдсонгүй.', en: 'The scrolls are empty.' })}
                            </Text>
                        </View>
                    )
                }
            />

            {/* ===== FAB — Create New Post ===== */}
            <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                    import('expo-haptics').then(Haptics => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
                    openCreate();
                }}
                className="absolute bottom-28 right-6 w-16 h-16 rounded-full bg-monk-primary items-center justify-center shadow-2xl"
                style={{ shadowColor: '#D4AF37', shadowRadius: 20, shadowOpacity: 0.4, elevation: 12 }}
            >
                <Plus size={28} color="#0F172A" strokeWidth={2.5} />
            </TouchableOpacity>

            {/* ===== Create / Edit Modal ===== */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={closeModal}
            >
                <SafeAreaView className="flex-1 bg-monk-bg" edges={['top']}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        className="flex-1"
                    >
                        {/* Modal Header */}
                        <View className="flex-row items-center justify-between px-6 py-4 border-b border-monk-primary/10 bg-monk-surface">
                            <TouchableOpacity onPress={closeModal} className="p-2">
                                <X size={22} color="#0F172A" />
                            </TouchableOpacity>
                            <Text className="text-lg font-serif font-bold text-monk-text">
                                {editingId
                                    ? tr({ mn: 'Нийтлэл засах', en: 'Edit Post' })
                                    : tr({ mn: 'Шинэ нийтлэл', en: 'New Post' })}
                            </Text>
                            <TouchableOpacity
                                onPress={handleSubmit}
                                disabled={isSaving || uploading}
                                className="px-5 py-2 rounded-full bg-monk-primary"
                                style={{ opacity: (isSaving || uploading) ? 0.5 : 1 }}
                            >
                                {isSaving ? (
                                    <ActivityIndicator size="small" color="#0F172A" />
                                ) : (
                                    <Text className="text-sm font-bold text-[#0F172A]">
                                        {editingId
                                            ? tr({ mn: 'Хадгалах', en: 'Save' })
                                            : tr({ mn: 'Нийтлэх', en: 'Publish' })}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>

                        <RNScrollView
                            className="flex-1 px-6"
                            contentContainerStyle={{ paddingBottom: 40, paddingTop: 24 }}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        >
                            {/* Cover Image */}
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={pickImage}
                                className="mb-8 rounded-3xl border-2 border-dashed border-monk-primary/30 bg-monk-surface overflow-hidden"
                                style={{ height: 180 }}
                            >
                                {uploading ? (
                                    <View className="flex-1 items-center justify-center">
                                        <ActivityIndicator size="large" color="#D4AF37" />
                                        <Text className="text-monk-primary mt-3 text-xs font-bold uppercase tracking-widest">
                                            {tr({ mn: 'Хуулж байна...', en: 'Uploading...' })}
                                        </Text>
                                    </View>
                                ) : form.imageUrl ? (
                                    <Image
                                        source={{ uri: form.imageUrl }}
                                        style={{ width: '100%', height: '100%' }}
                                        contentFit="cover"
                                        transition={300}
                                    />
                                ) : (
                                    <View className="flex-1 items-center justify-center">
                                        <ImageIcon size={36} color="#D4AF37" opacity={0.5} />
                                        <Text className="text-monk-secondary mt-3 text-xs font-bold uppercase tracking-widest">
                                            {tr({ mn: 'Зураг нэмэх', en: 'Add Cover Image' })}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>

                            {/* Title MN */}
                            <View className="mb-5">
                                <Text className="text-[10px] font-bold text-monk-secondary uppercase tracking-[2px] mb-2 px-1">
                                    {tr({ mn: 'Гарчиг (MN)', en: 'Title (MN)' })}
                                </Text>
                                <TextInput
                                    value={form.titleMn}
                                    onChangeText={(v) => setForm(p => ({ ...p, titleMn: v }))}
                                    placeholder={tr({ mn: 'Монгол гарчиг...', en: 'Mongolian title...' })}
                                    placeholderTextColor="#94A3B8"
                                    className="bg-monk-surface border border-monk-primary/15 rounded-2xl px-5 py-4 text-monk-text font-medium text-base"
                                />
                            </View>

                            {/* Title EN */}
                            <View className="mb-5">
                                <Text className="text-[10px] font-bold text-monk-secondary uppercase tracking-[2px] mb-2 px-1">
                                    {tr({ mn: 'Гарчиг (EN)', en: 'Title (EN)' })}
                                </Text>
                                <TextInput
                                    value={form.titleEn}
                                    onChangeText={(v) => setForm(p => ({ ...p, titleEn: v }))}
                                    placeholder={tr({ mn: 'Англи гарчиг...', en: 'English title...' })}
                                    placeholderTextColor="#94A3B8"
                                    className="bg-monk-surface border border-monk-primary/15 rounded-2xl px-5 py-4 text-monk-text font-medium text-base"
                                />
                            </View>

                            {/* Date */}
                            <View className="mb-5">
                                <Text className="text-[10px] font-bold text-monk-secondary uppercase tracking-[2px] mb-2 px-1">
                                    {tr({ mn: 'Огноо', en: 'Date' })}
                                </Text>
                                <TextInput
                                    value={form.date}
                                    onChangeText={(v) => setForm(p => ({ ...p, date: v }))}
                                    placeholder="YYYY-MM-DD"
                                    placeholderTextColor="#94A3B8"
                                    className="bg-monk-surface border border-monk-primary/15 rounded-2xl px-5 py-4 text-monk-text font-medium text-base"
                                />
                            </View>

                            {/* Content MN */}
                            <View className="mb-5">
                                <Text className="text-[10px] font-bold text-monk-secondary uppercase tracking-[2px] mb-2 px-1">
                                    {tr({ mn: 'Агуулга (MN)', en: 'Content (MN)' })}
                                </Text>
                                <TextInput
                                    value={form.contentMn}
                                    onChangeText={(v) => setForm(p => ({ ...p, contentMn: v }))}
                                    placeholder={tr({ mn: 'Монгол агуулга...', en: 'Write in Mongolian...' })}
                                    placeholderTextColor="#94A3B8"
                                    multiline
                                    textAlignVertical="top"
                                    numberOfLines={6}
                                    className="bg-monk-surface border border-monk-primary/15 rounded-2xl px-5 py-4 text-monk-text font-medium text-base min-h-[140px]"
                                />
                            </View>

                            {/* Content EN */}
                            <View className="mb-5">
                                <Text className="text-[10px] font-bold text-monk-secondary uppercase tracking-[2px] mb-2 px-1">
                                    {tr({ mn: 'Агуулга (EN)', en: 'Content (EN)' })}
                                </Text>
                                <TextInput
                                    value={form.contentEn}
                                    onChangeText={(v) => setForm(p => ({ ...p, contentEn: v }))}
                                    placeholder={tr({ mn: 'Англи агуулга...', en: 'Write in English...' })}
                                    placeholderTextColor="#94A3B8"
                                    multiline
                                    textAlignVertical="top"
                                    numberOfLines={6}
                                    className="bg-monk-surface border border-monk-primary/15 rounded-2xl px-5 py-4 text-monk-text font-medium text-base min-h-[140px]"
                                />
                            </View>
                        </RNScrollView>
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}
