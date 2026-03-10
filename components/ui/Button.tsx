import React from 'react';
import { TouchableOpacity, ActivityIndicator, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../../design-system/theme';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    disabled?: boolean;
    icon?: React.ReactNode;
    className?: string; // For additional tailwind classes
}

export function Button({
    title,
    onPress,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    disabled = false,
    icon,
    className,
}: ButtonProps) {

    const handlePress = async () => {
        if (!disabled && !isLoading) {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onPress();
        }
    };

    const getVariantStyle = () => {
        switch (variant) {
            case 'primary':
                // Bright Warm: Amber background with soft shadow
                return 'bg-[#D97706] shadow-md shadow-amber-600/20';
            case 'secondary':
                // Cream background with soft warm border
                return 'bg-[#FFFFFF] border border-[#E8E0D5] shadow-sm';
            case 'outline':
                // Gold/Amber border, transparent bg
                return 'bg-transparent border border-[#D97706]';
            case 'ghost':
                return 'bg-transparent';
            default:
                return 'bg-[#D97706] shadow-md shadow-amber-600/20';
        }
    };

    const getSizeStyle = () => {
        switch (size) {
            case 'sm':
                return 'px-4 py-2';
            case 'md':
                return 'px-5 py-3';
            case 'lg':
                return 'px-8 py-4';
            default:
                return 'px-5 py-3';
        }
    };

    const getTextStyle = () => {
        switch (variant) {
            case 'primary':
                // Inverse text (Cream) on colored background
                return 'text-[#FDFBF7] tracking-widest uppercase text-sm';
            case 'outline':
            case 'ghost':
                // Warm amber text
                return 'text-[#D97706] tracking-widest uppercase text-sm';
            case 'secondary':
                // Deep warm brown text
                return 'text-[#291E14] tracking-wide';
            default:
                return 'text-[#FDFBF7] tracking-widest uppercase text-sm';
        }
    };

    return (
        <TouchableOpacity
            onPress={handlePress}
            disabled={disabled || isLoading}
            activeOpacity={0.8}
            className={`rounded-xl flex-row items-center justify-center ${getVariantStyle()} ${getSizeStyle()} ${disabled ? 'opacity-50' : ''
                } ${className}`}
        >
            {isLoading ? (
                <ActivityIndicator color={variant === 'secondary' ? COLORS.textMid : COLORS.gold} />
            ) : (
                <>
                    {icon && <View className="mr-2">{icon}</View>}
                    <Text className={`font-semibold text-center ${getTextStyle()} ${size === 'lg' ? 'text-lg' : 'text-base'}`}>
                        {title}
                    </Text>
                </>
            )}
        </TouchableOpacity>
    );
}
