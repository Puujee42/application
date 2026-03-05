import React from 'react';
import { View, Text } from 'react-native';
import { LucideIcon } from 'lucide-react-native';

interface StatOrbProps {
    number: string;
    label: string;
    icon: LucideIcon;
}

export default function StatOrb({ number, label, icon: Icon }: StatOrbProps) {
    return (
        <View className="items-center justify-center p-8 bg-stone-800 rounded-[3rem] border-2 border-stone-700/50 mb-6 aspect-square w-full">
            <View className="mb-4">
                <Icon size={32} color="#F59E0B" />
            </View>
            <Text className="text-3xl font-bold text-stone-50 mb-2">
                {number}
            </Text>
            <Text className="text-[10px] font-black uppercase tracking-widest text-stone-400 opacity-60 text-center">
                {label}
            </Text>

            {/* Gloss/Shine - Simplified overlay */}
            <View className="absolute inset-0 rounded-[3rem] border border-white/5 pointer-events-none" />
        </View>
    );
}
