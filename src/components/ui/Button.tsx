import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { COLORS, SHADOWS, FONT } from '../../../design-system/theme';

export interface ButtonProps extends Omit<React.ComponentProps<typeof Pressable>, 'style'> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    label: string;
    icon?: React.ReactNode;
    className?: string;
    style?: import('react-native').StyleProp<import('react-native').ViewStyle>;
}

export const Button = ({
    variant = 'primary',
    size = 'md',
    label,
    icon,
    className,
    style,
    onPress,
    onPressIn,
    onPressOut,
    ...props
}: ButtonProps) => {

    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }]
        };
    });

    const handlePressIn = (e: any) => {
        scale.value = withSpring(0.97, {
            damping: 30,
            stiffness: 400,
        });
        onPressIn?.(e);
    };

    const handlePressOut = (e: any) => {
        scale.value = withSpring(1.0, {
            damping: 30,
            stiffness: 400,
        });
        onPressOut?.(e);
    };

    const handlePress = (e: any) => {
        if (variant === 'primary') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } else {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onPress?.(e);
    };

    if (variant === 'primary') {
        return (
            <Animated.View style={[animatedStyle, style]}>
                <Pressable
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    onPress={handlePress}
                    style={styles.primaryBtnWrapper}
                    {...props}
                >
                    {({ pressed }) => (
                        <View style={{ opacity: pressed ? 0.80 : 1 }}>
                            <LinearGradient
                                colors={[COLORS.goldBright, COLORS.gold, COLORS.amber]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={[styles.primaryGradient, SHADOWS.glow]}
                            >
                                {icon && <View style={styles.iconContainer}>{icon}</View>}
                                <Text style={styles.primaryText}>{label}</Text>
                            </LinearGradient>
                        </View>
                    )}
                </Pressable>
            </Animated.View>
        );
    }

    if (variant === 'outline') {
        return (
            <Animated.View style={[animatedStyle, style]}>
                <Pressable
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    onPress={handlePress}
                    style={({ pressed }) => [
                        styles.outlineBtn,
                        { opacity: pressed ? 0.80 : 1 }
                    ]}
                    {...props}
                >
                    {icon && <View style={styles.iconContainer}>{icon}</View>}
                    <Text style={styles.outlineText}>{label}</Text>
                </Pressable>
            </Animated.View>
        );
    }

    // Default catch for secondary/ghost
    return (
        <Animated.View style={[animatedStyle, style]}>
            <Pressable
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={handlePress}
                style={({ pressed }) => [
                    styles.secondaryBtn,
                    { opacity: pressed ? 0.80 : 1 }
                ]}
                {...props}
            >
                {icon && <View style={styles.iconContainer}>{icon}</View>}
                <Text style={styles.secondaryText}>{label}</Text>
            </Pressable>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    primaryBtnWrapper: {
        // Wrapper for shadow if necessary
    },
    primaryGradient: {
        borderRadius: 16,
        paddingVertical: 15,
        paddingHorizontal: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.22)',
    },
    primaryText: {
        color: '#1C0E00',
        fontFamily: FONT.display,
        fontWeight: '800',
        fontSize: 15,
        letterSpacing: 0.5,
    },
    outlineBtn: {
        borderWidth: 1.5,
        borderColor: COLORS.gold,
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    outlineText: {
        color: COLORS.gold,
        fontWeight: '700',
        fontSize: 14,
    },
    secondaryBtn: {
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 24,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryText: {
        color: COLORS.textSub,
        fontWeight: '600',
        fontSize: 14,
    },
    iconContainer: {
        marginRight: 8,
    }
});
