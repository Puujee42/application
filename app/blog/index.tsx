import React, { useState } from 'react';
import { View, Text, FlatList, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Search, Zap, Filter } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import api from '../../lib/api';
import { ScrollView } from 'react-native';
import BlogCard from '../../components/BlogCard';

// Helper type matching API response
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

export default function BlogListScreen() {
    const router = useRouter();
    const { t, i18n } = useTranslation();
    const lang = i18n.language === 'mn' ? 'mn' : 'en';
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState('all');

    const { data: posts, isLoading } = useQuery({
        queryKey: ['blogs'],
        queryFn: async () => {
            const res = await api.get('/blogs'); // Ensure this points to your Next.js API
            return res.data as BlogPost[];
        },
    });

    const filteredPosts = posts?.filter(post => {
        const title = (post.title?.[lang] || post.title?.mn || "").toLowerCase();
        const content = (post.content?.[lang] || post.content?.mn || "").toLowerCase();
        const q = search.toLowerCase();
        const matchesSearch = title.includes(q) || content.includes(q);
        const matchesFilter = filter === 'all' || (post.category && post.category.toLowerCase() === filter);
        return matchesSearch && matchesFilter;
    }) || [];

    const categories = [
        { id: 'all', label: lang === 'mn' ? 'Бүгд' : 'All' },
        { id: 'wisdom', label: lang === 'mn' ? 'Сургаал' : 'Wisdom' },
        { id: 'news', label: lang === 'mn' ? 'Мэдээ' : 'News' },
        { id: 'meditation', label: lang === 'mn' ? 'Бясалгал' : 'Meditation' },
    ];

    return (
        <SafeAreaView className="flex-1 bg-stone-900" edges={['top']}>
            {/* Header */}
            <View className="px-6 py-4 flex-row items-center mb-4">
                <ArrowLeft
                    size={24}
                    color="#D6D3D1"
                    onPress={() => router.back()}
                />
            </View>

            <FlatList
                className="flex-1 px-6"
                contentContainerStyle={{ paddingBottom: 40 }}
                ListHeaderComponent={
                    <View className="mb-8">
                        {/* Badge */}
                        <View className="flex-row self-start items-center gap-2 px-4 py-2 rounded-full border border-amber-500/30 bg-amber-500/10 mb-6">
                            <Zap size={14} color="#F59E0B" fill="#F59E0B" />
                            <Text className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500">
                                {lang === 'mn' ? 'Блог & Мэдээ' : 'Blog & Wisdom'}
                            </Text>
                        </View>

                        {/* Title */}
                        <Text className="text-5xl font-black tracking-tighter text-stone-50 leading-none mb-8">
                            {lang === 'mn' ? 'Өдөр тутмын' : 'Daily'} <Text className="text-amber-500">{lang === 'mn' ? 'Ухаарал' : 'Wisdom'}</Text>.
                        </Text>

                        {/* Search Bar */}
                        <View className="relative mb-8">
                            <View className="absolute left-4 top-4 z-10">
                                <Search size={20} color="#78716C" />
                            </View>
                            <TextInput
                                placeholder={lang === 'mn' ? "Хайх..." : "Search posts..."}
                                placeholderTextColor="#78716C"
                                value={search}
                                onChangeText={setSearch}
                                className="w-full py-4 pl-12 pr-6 rounded-[2rem] border border-white/10 bg-white/5 text-stone-50 text-base font-medium focus:border-amber-500"
                            />
                        </View>

                        {/* Filter Tabs */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-8">
                            {categories.map((cat) => (
                                <Text
                                    key={cat.id}
                                    onPress={() => setFilter(cat.id)}
                                    className={`px-6 py-3 mr-3 rounded-2xl text-[10px] font-black uppercase tracking-widest overflow-hidden ${filter === cat.id
                                        ? 'bg-amber-500 text-stone-900'
                                        : 'bg-white/5 text-stone-400 border border-white/5'
                                        }`}
                                >
                                    {cat.label}
                                </Text>
                            ))}
                        </ScrollView>

                        {/* Results Count */}
                        <View className="flex-row items-center gap-2 mb-4 opacity-40">
                            <Filter size={14} color="#A8A29E" />
                            <Text className="text-xs font-black uppercase tracking-widest text-stone-400">
                                {filteredPosts.length} {lang === 'mn' ? 'Нийтлэл' : 'Posts Found'}
                            </Text>
                        </View>
                    </View>
                }
                data={filteredPosts}
                keyExtractor={(item) => item._id}
                renderItem={({ item, index }) => (
                    <Animated.View entering={FadeInDown.delay(index * 100).duration(600)}>
                        <BlogCard post={item} lang={lang} />
                    </Animated.View>
                )}
                ListEmptyComponent={
                    isLoading ? (
                        <ActivityIndicator size="large" color="#F59E0B" className="mt-10" />
                    ) : (
                        <Text className="text-center text-stone-500 mt-10 italic">
                            {lang === 'mn' ? "Нийтлэл олдсонгүй." : "No posts found."}
                        </Text>
                    )
                }
            />
        </SafeAreaView>
    );
}
