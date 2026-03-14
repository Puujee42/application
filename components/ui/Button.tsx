import React from 'react';
import { ActivityIndicator, Text, View, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../design-system/theme';
import TouchableScale from './TouchableScale';
import { Colors } from '../../constants/Colors';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    disabled?: boolean;
    icon?: React.ReactNode;
    className?: string;
    style?: any;
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
    style,
}: ButtonProps) {

    const handlePress = async () => {
        if (!disabled && !isLoading) {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onPress();
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
                return 'text-sanctuary-surfaceSolid tracking-widest uppercase text-sm font-bold shadow-sm shadow-black/20';
            case 'outline':
            case 'ghost':
                return 'text-sanctuary-goldDeep tracking-widest uppercase text-sm font-semibold';
            case 'secondary':
                return 'text-sanctuary-text tracking-wide font-medium';
            default:
                return 'text-sanctuary-surfaceSolid tracking-widest uppercase text-sm font-bold';
        }
    };

    const renderContent = () => {
        if (isLoading) {
            return <ActivityIndicator color={variant === 'primary' ? '#FFF' : Colors.sanctuary.goldDeep} />;
        }
        return (
            <View className="flex-row items-center justify-center">
                {icon && <View className="mr-2">{icon}</View>}
                <Text className={`text-center ${getTextStyle()} ${size === 'lg' ? 'text-lg' : 'text-base'}`}>
                    {title}
                </Text>
            </View>
        );
    };

    const baseStyle = [styles.buttonBase, style];

    if (variant === 'primary') {
        return (
            <TouchableScale
                onPress={handlePress}
                disabled={disabled || isLoading}
                className={`${disabled ? 'opacity-50' : ''} ${className || ''}`}
                style={baseStyle}
                scaleTo={0.94}
            >
                <LinearGradient
                    colors={['#FEF08A', '#FACC15']} // Bright Divine Yellow to Main Divine Yellow
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[StyleSheet.absoluteFill, styles.gradientBg]}
                />
                <View className={`${getSizeStyle()} items-center justify-center`}>
                    {renderContent()}
                </View>
            </TouchableScale>
        );
    }

    return (
        <TouchableScale
            onPress={handlePress}
            disabled={disabled || isLoading}
            className={`items-center justify-center ${getSizeStyle()} ${disabled ? 'opacity-50' : ''} ${className || ''}`}
            style={[
                baseStyle,
                variant === 'secondary' && styles.secondary,
                variant === 'outline' && styles.outline,
                variant === 'ghost' && styles.ghost,
            ]}
            scaleTo={0.96}
        >
            {renderContent()}
        </TouchableScale>
    );
}

const styles = StyleSheet.create({
    buttonBase: {
        borderRadius: 15,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    gradientBg: {
        borderRadius: 15,
    },
    secondary: {
        backgroundColor: '#FFFFFF', // Pure White
        borderWidth: 1,
        borderColor: 'rgba(250, 204, 21, 0.4)',
        shadowColor: 'rgba(250, 204, 21, 0.2)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#FACC15',
    },
    ghost: {
        backgroundColor: 'transparent',
    }
});
