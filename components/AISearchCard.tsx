import React, { useEffect } from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withRepeat,
    withTiming,
    withSequence,
    Easing
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function AISearchCard() {
    const router = useRouter();
    const scale = useSharedValue(1);
    const pulseValue = useSharedValue(0.4);

    useEffect(() => {
        pulseValue.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
                withTiming(0.4, { duration: 1500, easing: Easing.inOut(Easing.ease) })
            ),
            -1, // infinite
            true // reverse
        );
    }, []);

    const handlePressIn = () => {
        scale.value = withSpring(0.96, { damping: 15, stiffness: 200 });
    };

    const handlePressOut = () => {
        scale.value = withSpring(1, { damping: 15, stiffness: 200 });
    };

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
            ...Platform.select({
                ios: {
                    shadowOpacity: pulseValue.value,
                },
                android: {
                    elevation: pulseValue.value * 12,
                }
            })
        };
    });

    return (
        <View className="px-6 my-4">
            {/* Section Title */}
            <Text className="text-xl font-bold text-stone-100 mb-3">
                AI Trail Planner
            </Text>

            {/* AI Search Card */}
            <AnimatedPressable
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={() => {
                    // TODO: Navigate to AI chat when implemented
                    console.log('AI Trail Planner pressed');
                }}
                className="bg-stone-800 rounded-2xl p-5 flex-row items-center"
                style={[
                    {
                        borderWidth: 2,
                        borderColor: '#F59E0B',
                        ...Platform.select({
                            ios: {
                                shadowColor: '#F59E0B',
                                shadowOffset: { width: 0, height: 0 },
                                shadowRadius: 10,
                            },
                        }),
                    },
                    animatedStyle
                ]}
            >
                {/* Sparkles Icon */}
                <View className="mr-4">
                    <Sparkles size={32} color="#FBBF24" fill="#FBBF24" />
                </View>

                {/* Text Content */}
                <View className="flex-1">
                    <Text className="text-stone-50 text-lg font-semibold">
                        Ask our AI where to go next
                    </Text>
                    <Text className="text-stone-400 text-sm mt-1">
                        Personalized adventure planning
                    </Text>
                </View>
            </AnimatedPressable>
        </View>
    );
}
