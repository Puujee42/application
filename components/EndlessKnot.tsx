import React, { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    Easing,
    cancelAnimation
} from 'react-native-reanimated';

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

export default function EndlessKnot({ size = 300 }: { size?: number }) {
    const rotation = useSharedValue(0);

    useEffect(() => {
        rotation.value = withRepeat(
            withTiming(360, {
                duration: 20000,
                easing: Easing.linear,
            }),
            -1 // Infinite repeat
        );
        return () => cancelAnimation(rotation);
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ rotate: `${rotation.value}deg` }],
        };
    });

    return (
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
            <AnimatedSvg
                viewBox="0 0 100 100"
                style={[{ width: '100%', height: '100%', opacity: 0.1 }, animatedStyle]}
            >
                {/* Knot Paths - Matching the web SVG paths */}
                <Path
                    d="M30 30 L70 30 L70 70 L30 70 Z"
                    stroke="#F59E0B"
                    strokeWidth="0.5"
                    fill="none"
                    opacity="0.5"
                />
                <Path
                    d="M30 30 Q50 10 70 30 T70 70 Q50 90 30 70 T30 30"
                    stroke="#F59E0B"
                    strokeWidth="1"
                    fill="none"
                />
                <Path
                    d="M20 50 L80 50"
                    stroke="#F59E0B"
                    strokeWidth="0.5"
                    strokeDasharray="2 2"
                    fill="none"
                />
                <Path
                    d="M50 20 L50 80"
                    stroke="#F59E0B"
                    strokeWidth="0.5"
                    strokeDasharray="2 2"
                    fill="none"
                />
                <Circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke="#F59E0B"
                    strokeWidth="0.5"
                    fill="none"
                    opacity="0.3"
                />
            </AnimatedSvg>
        </View>
    );
}
