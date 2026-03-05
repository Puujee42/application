import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, useWindowDimensions, StyleSheet } from 'react-native';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { GlassContainer } from '../../src/components/ui/GlassContainer';
import { useQuery } from '@tanstack/react-query';
import { getMonks } from '../../lib/api';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Star, Calendar, Sparkles, Navigation } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedScrollHandler, useSharedValue, useAnimatedStyle, interpolate, FadeInDown, FadeInUp } from 'react-native-reanimated';

export default function MonkDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { t, i18n } = useTranslation();
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const lang = (i18n.language === 'mn' ? 'mn' : 'en') as 'mn' | 'en';

    const { data: monks, isLoading } = useQuery({
        queryKey: ['monks'],
        queryFn: getMonks,
    });

    const monk = monks?.find(m => m._id === id || m._id?.toString() === id);

    const scrollY = useSharedValue(0);

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollY.value = event.contentOffset.y;
        },
    });

    if (isLoading || !monk) {
        return (
            <ScreenWrapper>
                <View className="flex-1 justify-center items-center bg-[#FDFBF7]">
                    <ActivityIndicator color="#D4AF37" size="large" />
                </View>
            </ScreenWrapper>
        );
    }

    const HEADER_HEIGHT = height * 0.65;

    const imageAnimatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                {
                    translateY: interpolate(
                        scrollY.value,
                        [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
                        [-HEADER_HEIGHT / 2, 0, HEADER_HEIGHT * 0.75],
                        'clamp'
                    )
                },
                {
                    scale: interpolate(
                        scrollY.value,
                        [-HEADER_HEIGHT, 0],
                        [2, 1],
                        'clamp'
                    )
                }
            ],
            opacity: interpolate(
                scrollY.value,
                [0, HEADER_HEIGHT * 0.8],
                [1, 0],
                'clamp'
            )
        };
    });

    const headerAnimatedStyle = useAnimatedStyle(() => {
        return {
            opacity: interpolate(
                scrollY.value,
                [HEADER_HEIGHT * 0.5, HEADER_HEIGHT * 0.8],
                [0, 1],
                'clamp'
            ),
            transform: [
                {
                    translateY: interpolate(
                        scrollY.value,
                        [HEADER_HEIGHT * 0.5, HEADER_HEIGHT * 0.8],
                        [-20, 0],
                        'clamp'
                    )
                }
            ]
        };
    });

    return (
        <ScreenWrapper className="bg-[#FDFBF7]">
            <View className="flex-1 relative bg-[#FDFBF7]">

                {/* Immersive Parallax Header Background Image */}
                <View style={[StyleSheet.absoluteFill, { height: HEADER_HEIGHT, backgroundColor: '#FFF9E6' }]}>
                    <Animated.View style={[{ width: '100%', height: '100%' }, imageAnimatedStyle]}>
                        <Image
                            source={{ uri: monk.image }}
                            style={{ width: '100%', height: '100%', opacity: 0.85 }}
                            contentFit="cover"
                            transition={600}
                        />
                        {/* Luminous Shadow gradient overlay */}
                        <View className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#FDFBF7] via-[#FDFBF7]/90 to-transparent" />
                    </Animated.View>
                </View>

                {/* Sticky Header (appears on scroll) */}
                <Animated.View
                    style={[
                        { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 40, paddingTop: insets.top, backgroundColor: 'rgba(253, 251, 247, 0.95)' },
                        headerAnimatedStyle
                    ]}
                    className="flex-row items-center justify-center pb-4 border-b border-[#E8E0D5]/50 backdrop-blur-3xl shadow-sm"
                >
                    <Text className="text-lg font-serif font-bold text-[#291E14]">{monk.name[lang] || monk.name.en}</Text>
                </Animated.View>

                {/* Floating Back Button (Frosted effect) */}
                <TouchableOpacity
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.back();
                    }}
                    style={{ position: 'absolute', top: insets.top + 8, left: 24, zIndex: 50 }}
                >
                    <GlassContainer className="w-12 h-12 p-0 rounded-full bg-white/60 border border-[#E8E0D5] shadow-sm">
                        <ArrowLeft size={24} color="#291E14" />
                    </GlassContainer>
                </TouchableOpacity>

                {/* Scrollable Content */}
                <Animated.ScrollView
                    contentContainerStyle={{ paddingTop: HEADER_HEIGHT - 100, paddingBottom: 120 }}
                    showsVerticalScrollIndicator={false}
                    onScroll={scrollHandler}
                    scrollEventThrottle={16}
                >
                    <View className="bg-[#FDFBF7] rounded-t-[40px] px-8 pt-10 min-h-screen">

                        {/* Title Badge overlay */}
                        <Animated.View entering={FadeInDown.delay(200).duration(800)} className="absolute -top-6 left-8">
                            <View className="bg-white/80 border border-[#D4AF37]/40 px-6 py-2 rounded-full backdrop-blur-xl shadow-sm">
                                <Text className="text-[10px] font-bold text-[#A89F91] uppercase tracking-[4px]">
                                    {monk.title[lang] || monk.title.en}
                                </Text>
                            </View>
                        </Animated.View>

                        <Animated.View entering={FadeInDown.delay(300).duration(800)} className="mb-4 mt-2">
                            <Text className="text-[40px] font-serif font-bold text-[#291E14] tracking-tight leading-[48px] mb-2 shadow-sm" style={{ textShadowColor: 'rgba(212, 175, 55, 0.1)', textShadowRadius: 10 }}>
                                {monk.name[lang] || monk.name.en}
                            </Text>

                            {monk.isSpecial && (
                                <View className="flex-row items-center mt-1">
                                    <Sparkles size={16} color="#D4AF37" />
                                    <Text className="text-[10px] font-bold text-[#D4AF37] ml-2 uppercase tracking-[3px]">Master Guide</Text>
                                </View>
                            )}
                        </Animated.View>

                        <Animated.View entering={FadeInDown.delay(400).duration(800)} className="flex-row gap-3 mt-4 flex-wrap mb-10">
                            {monk.specialties?.map((s, i) => (
                                <View key={`${i}-${s}`} className="bg-white/60 border border-[#D4AF37]/20 px-5 py-2 rounded-full shadow-sm">
                                    <Text className="text-xs font-bold tracking-wider text-[#A89F91] uppercase">{s}</Text>
                                </View>
                            ))}
                        </Animated.View>

                        {/* Visual Stats Row */}
                        <Animated.View entering={FadeInDown.delay(500).duration(800)} className="flex-row justify-between items-center mb-12 bg-white/80 p-8 rounded-[32px] border border-white backdrop-blur-xl shadow-lg" style={{ shadowColor: '#D4AF37', shadowRadius: 20, shadowOpacity: 0.1, elevation: 5 }}>
                            <View className="items-center flex-1">
                                <Text className="text-[32px] font-serif font-bold text-[#291E14] mb-1">{monk.yearsOfExperience}+</Text>
                                <Text className="text-[10px] text-[#A89F91] uppercase tracking-[3px] font-bold">Years</Text>
                            </View>
                            <View className="w-[1px] h-16 bg-gradient-to-b from-transparent via-[#E8E0D5] to-transparent" />
                            <View className="items-center flex-1">
                                <Text className="text-[32px] font-serif font-bold text-[#291E14] mb-1">1k+</Text>
                                <Text className="text-[10px] text-[#A89F91] uppercase tracking-[3px] font-bold">Seekers</Text>
                            </View>
                            <View className="w-[1px] h-16 bg-gradient-to-b from-transparent via-[#E8E0D5] to-transparent" />
                            <View className="items-center flex-1">
                                <Text className="text-[32px] font-serif font-bold text-[#291E14] mb-1">4.9</Text>
                                <View className="flex-row items-center mt-1">
                                    <Star size={10} color="#D4AF37" fill="#D4AF37" className="mr-1" />
                                    <Text className="text-[10px] text-[#A89F91] uppercase tracking-[3px] font-bold">Rating</Text>
                                </View>
                            </View>
                        </Animated.View>

                        <Animated.View entering={FadeInDown.delay(600).duration(800)}>
                            <View className="flex-row items-center mb-6">
                                <View className="h-4 w-1 bg-[#D4AF37] rounded-full mr-3" />
                                <Text className="text-xl font-serif font-bold text-[#291E14]">The Journey</Text>
                            </View>
                            <Text className="text-[#544636] leading-8 text-[15px] mb-10 font-serif">
                                {monk.bio?.[lang] || monk.bio?.en}
                            </Text>
                        </Animated.View>

                        <View className="h-32" /> {/* Spacer for bottom button */}
                    </View>
                </Animated.ScrollView>

                {/* Floating "Book Session" Glass Button */}
                <Animated.View
                    entering={FadeInUp.delay(800).duration(1000).springify()}
                    style={{ position: 'absolute', bottom: 40, left: 24, right: 24, zIndex: 50 }}
                >
                    <TouchableOpacity
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            router.push(`/booking/${monk._id}`);
                        }}
                        activeOpacity={0.9}
                    >
                        <GlassContainer className="flex-row items-center justify-between bg-white/60 p-2 pl-8 rounded-full border border-white backdrop-blur-3xl shadow-2xl" style={{ shadowColor: '#D4AF37', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 30 }}>
                            <Text className="text-[#291E14] font-bold text-[13px] uppercase tracking-[4px]">
                                Book a Session
                            </Text>
                            <View className="w-14 h-14 bg-[#D4AF37] rounded-full items-center justify-center shadow-lg" style={{ shadowColor: '#D4AF37', shadowOpacity: 0.4, shadowRadius: 10 }}>
                                <Navigation size={22} color="#FDFBF7" style={{ transform: [{ rotate: '45deg' }], marginLeft: -2, marginTop: 2 }} />
                            </View>
                        </GlassContainer>
                    </TouchableOpacity>
                </Animated.View>

            </View>
        </ScreenWrapper>
    );
}