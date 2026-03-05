import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withDelay,
    Easing,
} from 'react-native-reanimated';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const PARTICLE_COUNT = 18;

function randomBetween(min: number, max: number) {
    return Math.random() * (max - min) + min;
}

function Particle({ index }: { index: number }) {
    const startX = randomBetween(0, SCREEN_W);
    const size = randomBetween(3, 7);
    const duration = randomBetween(6000, 12000);
    const delay = randomBetween(0, 4000);
    const drift = randomBetween(-40, 40);
    const isGlow = Math.random() > 0.5;

    const translateY = useSharedValue(SCREEN_H + 20);
    const translateX = useSharedValue(0);
    const opacity = useSharedValue(0);

    useEffect(() => {
        translateY.value = withDelay(
            delay,
            withRepeat(
                withTiming(-20, { duration, easing: Easing.linear }),
                -1,
                false
            )
        );
        translateX.value = withDelay(
            delay,
            withRepeat(
                withTiming(drift, { duration: duration * 0.6, easing: Easing.inOut(Easing.sin) }),
                -1,
                true
            )
        );
        opacity.value = withDelay(
            delay,
            withRepeat(
                withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
                -1,
                true
            )
        );
    }, []);

    const animStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: translateY.value },
            { translateX: translateX.value },
        ],
        opacity: opacity.value * 0.7,
    }));

    return (
        <Animated.View
            style={[
                {
                    position: 'absolute',
                    left: startX,
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: isGlow ? '#FFD060' : '#D4A020',
                },
                animStyle,
            ]}
        />
    );
}

export default function GoldParticles() {
    return (
        <View style={styles.container} pointerEvents="none">
            {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
                <Particle key={i} index={i} />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
        zIndex: 999,
    },
});
