import { View, Text, FlatList, Pressable, RefreshControl, TouchableOpacity } from 'react-native';
import { useState, useCallback, memo, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Heart, ArrowLeft, HeartOff, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import api from '../lib/api';
import { useFavoritesStore } from '../store/favorites';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';

interface Monk {
    _id: string;
    name: { mn: string; en: string };
    image?: string;
    title?: { mn: string; en: string };
    specialties?: string[];
}

const FavoriteMonkCard = memo(
    ({ monk, index, onPress, onRemove }: { monk: Monk; index: number; onPress: () => void; onRemove: () => void }) => {
        const { i18n } = useTranslation();
        const lang = i18n.language === 'mn' ? 'mn' : 'en';

        const name = typeof monk.name === 'string' ? monk.name : (monk.name?.[lang] || monk.name?.en || 'Monk');
        const title = monk.title ? (typeof monk.title === 'string' ? monk.title : (monk.title?.[lang] || monk.title?.en || '')) : '';

        return (
            <Animated.View
                entering={FadeInDown.delay(index * 100).duration(500)}
                layout={Layout.springify()}
            >
                <Pressable
                    onPress={onPress}
                    className="bg-white/60 rounded-[24px] mb-4 mx-6 overflow-hidden border border-white/80 shadow-md backdrop-blur-xl"
                    style={{ shadowColor: '#D4AF37', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 3 }}
                >
                    <View className="flex-row items-center p-4">
                        <Image
                            source={{ uri: monk.image || 'https://via.placeholder.com/100' }}
                            style={{ width: 80, height: 80, borderRadius: 20, borderWidth: 2, borderColor: '#D4AF37' }}
                            contentFit="cover"
                            transition={300}
                        />
                        <View className="flex-1 ml-4 justify-center">
                            <Text className="text-xl font-serif font-bold text-[#291E14] mb-1 tracking-wide" numberOfLines={1}>
                                {name}
                            </Text>
                            {title ? (
                                <Text className="text-monk-primary text-xs uppercase tracking-[2px] font-bold mb-1.5" numberOfLines={1}>
                                    {title}
                                </Text>
                            ) : null}
                            {monk.specialties?.length ? (
                                <Text className="text-[#786851] text-xs tracking-wider font-medium" numberOfLines={1}>
                                    {monk.specialties.slice(0, 2).join(' • ')}
                                </Text>
                            ) : null}
                        </View>
                        <TouchableOpacity
                            onPress={onRemove}
                            className="w-12 h-12 rounded-full items-center justify-center bg-red-50 border border-red-100 shadow-sm"
                            
                        >
                            <Heart size={20} color="#EF4444" fill="#EF4444" />
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Animated.View>
        );
    }
);

FavoriteMonkCard.displayName = 'FavoriteMonkCard';

export default function FavoritesScreen() {
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);
    const { monks: favoriteMonkIds, removeFavorite } = useFavoritesStore();

    const { data: monks, refetch } = useQuery({
        queryKey: ['monks'],
        queryFn: async () => {
            const res = await api.get('/monks');
            return res.data as Monk[];
        },
    });

    const favoriteMonks = useMemo(() => {
        if (!monks) return [];
        return monks.filter((monk) => favoriteMonkIds.includes(monk._id));
    }, [monks, favoriteMonkIds]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    }, [refetch]);

    const handleRemove = useCallback(
        (id: string) => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            removeFavorite(id);
        },
        [removeFavorite]
    );

    return (
        <View className="flex-1 bg-[#FDFBF7]">
            <Stack.Screen options={{ headerShown: false }} />

            {/* Premium Header */}
            <SafeAreaView edges={['top']} className="bg-[#FDFBF7] z-10 pb-4 shadow-sm" style={{ shadowColor: '#D4AF37', shadowOpacity: 0.05, shadowRadius: 10 }}>
                <View className="px-6 py-4 flex-row items-center">
                    <TouchableOpacity
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            router.back();
                        }}
                        className="w-10 h-10 bg-white/80 rounded-full items-center justify-center border border-[#E8E0D5] shadow-sm"
                    >
                        <ArrowLeft size={20} color="#291E14" />
                    </TouchableOpacity>
                    <Text className="text-2xl font-serif font-bold text-[#291E14] ml-5 tracking-tight flex-1">
                        Sanctuary Stars
                    </Text>
                    <Sparkles size={24} color="#D4AF37" />
                </View>
            </SafeAreaView>

            <FlatList
                data={favoriteMonks}
                renderItem={({ item, index }) => (
                    <FavoriteMonkCard
                        monk={item}
                        index={index}
                        onPress={() => {
                            Haptics.selectionAsync();
                            router.push(`/monk/${item._id}`);
                        }}
                        onRemove={() => handleRemove(item._id)}
                    />
                )}
                keyExtractor={(item) => item._id}
                contentContainerStyle={{ paddingVertical: 16, paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4AF37" colors={['#D4AF37']} />
                }
                ListEmptyComponent={
                    <Animated.View entering={FadeInDown.duration(600)} className="flex-1 items-center justify-center py-32 px-10">
                        <View className="w-24 h-24 bg-[#FFF9E6] rounded-full items-center justify-center mb-6 border border-[#D4AF37]/20 shadow-sm">
                            <HeartOff size={40} color="#D4AF37" opacity={0.8} strokeWidth={1.5} />
                        </View>
                        <Text className="text-2xl font-serif font-bold text-[#291E14] mb-3 text-center tracking-tight">
                            Empty Sanctuary
                        </Text>
                        <Text className="text-[#786851] text-center mb-8 leading-6">
                            Wander the paths and find guides whose light resonates with your spirit.
                        </Text>
                        <TouchableOpacity
                            
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                router.push('/(tabs)');
                            }}
                            className="bg-monk-primary rounded-full py-4 px-10 shadow-lg border border-monk-primary/50"
                            style={{ shadowColor: '#D4AF37', shadowRadius: 20, shadowOpacity: 0.3 }}
                        >
                            <Text className="text-white font-bold text-xs tracking-widest uppercase">
                                Begin Your Journey
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>
                }
                removeClippedSubviews={true}
                maxToRenderPerBatch={10}
                windowSize={5}
            />
        </View>
    );
}
