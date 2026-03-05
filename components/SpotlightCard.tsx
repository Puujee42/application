import React from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { LucideIcon } from 'lucide-react-native';

interface SpotlightCardProps {
    title: string;
    desc: string;
    icon: LucideIcon;
    onPress?: () => void;
    // We'll stick to the Stone/Amber theme, so color props are optional overrides
    // but the component handles the "spotlight" look via styling
}

export default function SpotlightCard({ title, desc, icon: Icon, onPress }: SpotlightCardProps) {
    return (
        <Pressable
            onPress={onPress}
            className="bg-white/60 rounded-[32px] p-6 mb-4 border border-white/80 relative overflow-hidden active:bg-[#FDFBF7] shadow-lg backdrop-blur-2xl"
            style={Platform.select({
                ios: {
                    shadowColor: '#D4AF37',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 15,
                },
                android: {
                    elevation: 5,
                },
            })}
        >
            {/* Background "Highlight" effect (simplified for mobile perf) */}
            <View className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/10 rounded-full -mr-16 -mt-16 blur-2xl" />

            <View className="flex-row items-start justify-between mb-4">
                <View className="w-12 h-12 rounded-2xl bg-[#FFF9E6] items-center justify-center border border-[#D4AF37]/20 shadow-sm">
                    <Icon size={24} color="#D4AF37" />
                </View>
            </View>

            <Text className="text-xl font-serif font-bold text-[#291E14] mb-2 leading-tight tracking-wide">
                {title}
            </Text>

            <View className="h-[2px] w-10 bg-[#D4AF37] mb-3 opacity-60 rounded-full" />

            <Text className="text-[#544636] text-[15px] leading-relaxed">
                {desc}
            </Text>
        </Pressable>
    );
}
