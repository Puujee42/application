import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { ArrowRight, Calendar, Sparkles } from 'lucide-react-native';
import { useRouter } from 'expo-router';

// Helper type matching API response
interface BlogPost {
    id: string;
    _id: string;
    title: { en: string; mn: string };
    content: { en: string; mn: string };
    cover?: string;
    date: string;
    authorName?: string;
}

interface BlogCardProps {
    post: BlogPost;
    lang: 'en' | 'mn';
}

export default function BlogCard({ post, lang }: BlogCardProps) {
    const router = useRouter();

    const title = post.title?.[lang] || post.title?.mn || "No Title";
    const content = post.content?.[lang] || post.content?.mn || "";
    // Limit content preview length
    const previewContent = content.length > 100 ? content.substring(0, 100) + '...' : content;

    return (
        <Pressable
            onPress={() => router.push(`/blog/${post.id}`)}
            className="bg-stone-800/60 rounded-[2.5rem] border border-white/5 p-6 mb-6 overflow-hidden active:bg-stone-800"
        >
            <View className="flex-row justify-between items-start mb-4">
                {/* Icon or Avatar */}
                <View className="p-3 rounded-2xl bg-amber-500/10">
                    {post.cover ? (
                        <Image
                            source={{ uri: post.cover }}
                            style={{ width: 24, height: 24, borderRadius: 12 }}
                            contentFit="cover"
                        />
                    ) : (
                        <Sparkles size={24} color="#F59E0B" />
                    )}
                </View>

                {/* Date Badge */}
                <View className="flex-row items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5">
                    <Calendar size={12} color="#F59E0B" />
                    <Text className="text-[10px] font-bold uppercase tracking-widest text-stone-400 opacity-80">
                        {new Date(post.date).toLocaleDateString()}
                    </Text>
                </View>
            </View>

            <View className="mb-4">
                <Text className="text-xl font-bold text-stone-50 mb-2 leading-tight" numberOfLines={2}>
                    {title}
                </Text>
                {post.authorName && (
                    <Text className="text-xs font-bold text-stone-400/70 uppercase tracking-wide">
                        By {post.authorName}
                    </Text>
                )}
            </View>

            <Text className="text-sm text-stone-400 leading-relaxed mb-6" numberOfLines={3}>
                {previewContent}
            </Text>

            <View className="mt-auto pt-4 border-t border-white/5">
                <View className="flex-row items-center justify-center gap-2 py-3 rounded-2xl border border-white/10">
                    <Text className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
                        {lang === 'mn' ? 'УНШИХ' : 'READ MORE'}
                    </Text>
                    <ArrowRight size={14} color="white" />
                </View>
            </View>
        </Pressable>
    );
}
