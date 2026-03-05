import React, { useRef } from 'react';
import { View, Text, ScrollView, Animated as RNAnimated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Infinity, Star, BookOpen, Eye, Sparkles } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import EndlessKnot from '../components/EndlessKnot';
import StatOrb from '../components/StatOrb';

export default function MissionScreen() {
    const router = useRouter();

    const stats = [
        { number: "24/7", label: "Daily Guide", icon: Star },
        { number: "108+", label: "Ancient Teachings", icon: BookOpen },
        { number: "50+", label: "Masters", icon: Eye },
        { number: "∞", label: "Endless Wisdom", icon: Infinity },
    ];

    return (
        <SafeAreaView className="flex-1 bg-stone-900" edges={['top']}>
            <View className="absolute inset-0 items-center justify-center opacity-30 pointer-events-none">
                <EndlessKnot size={600} />
            </View>

            {/* Header */}
            <View className="px-6 py-4 flex-row items-center z-10">
                <ArrowLeft
                    size={24}
                    color="#D6D3D1"
                    onPress={() => router.back()}
                />
            </View>

            <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 60 }}>
                {/* Hero Section */}
                <Animated.View
                    entering={FadeInUp.delay(200).duration(800)}
                    className="items-center py-16"
                >
                    <View className="flex-row items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/20 bg-stone-800/30 mb-8 backdrop-blur-sm">
                        <Infinity size={14} color="#818CF8" />
                        <Text className="text-[10px] font-black tracking-[0.4em] uppercase text-indigo-400 opacity-80">
                            BEYOND TIME
                        </Text>
                    </View>

                    <Text className="text-5xl font-bold text-stone-50 text-center leading-none tracking-tight mb-2">
                        Transcending
                    </Text>
                    <Text className="text-5xl font-light italic text-transparent text-center leading-none tracking-tight mb-8" style={{ color: '#F59E0B' }}>
                        Everywhere
                    </Text>

                    <Text className="text-2xl font-serif font-light text-stone-400 text-center leading-relaxed">
                        Distributing the light of inner wisdom.
                    </Text>
                </Animated.View>

                {/* Mission Statement */}
                <View className="py-20">
                    <Text className="text-[10px] font-black uppercase tracking-[0.5em] text-indigo-400 mb-6 flex-row items-center">
                        OUR MISSION
                    </Text>
                    <Text className="text-4xl font-bold text-stone-50 leading-tight mb-6">
                        Planting Seeds of Wisdom
                    </Text>
                    <View className="w-24 h-[1px] bg-amber-500 mb-8" />
                    <Text className="text-xl font-medium italic text-stone-400 leading-relaxed">
                        We breathe life into ancient lineage through digital ethers, bringing the stillness of the monastery directly to your side.
                    </Text>
                </View>

                {/* Stat Orbs Grid */}
                <View className="flex-row flex-wrap justify-between">
                    {stats.map((stat, i) => (
                        <View key={i} style={{ width: '48%' }}>
                            <Animated.View entering={FadeInDown.delay(i * 100 + 400)}>
                                <StatOrb {...stat} />
                            </Animated.View>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
