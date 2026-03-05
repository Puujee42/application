import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    Easing,
} from 'react-native-reanimated';

interface AuraOrbProps {
    size?: number;
    color?: string;
    style?: any;
}

export default function AuraOrb({ size = 200, color = '#FFD060', style }: AuraOrbProps) {
    const scale = useSharedValue(0.85);
    const opacity = useSharedValue(0.3);

    useEffect(() => {
        scale.value = withRepeat(
            withTiming(1.15, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
            -1,
            true
        );
        opacity.value = withRepeat(
            withTiming(0.6, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
            -1,
            true
        );
    }, []);

    const animStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    return (
        <Animated.View
            pointerEvents="none"
            style={[
                styles.orb,
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: color,
                    shadowColor: color,
                    shadowRadius: size * 0.4,
                    shadowOpacity: 0.5,
                    shadowOffset: { width: 0, height: 0 },
                    elevation: 0,
                },
                animStyle,
                style,
            ]}
        />
    );
}

const styles = StyleSheet.create({
    orb: {
        position: 'absolute',
    },
});
