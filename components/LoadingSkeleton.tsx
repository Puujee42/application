import { View } from 'react-native';
import { useEffect } from 'react';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    interpolate,
} from 'react-native-reanimated';

interface SkeletonProps {
    width?: number;
    height?: number;
    borderRadius?: number;
    className?: string;
}

export function Skeleton({ width = 300, height = 20, borderRadius = 8, className = '' }: SkeletonProps) {
    const shimmer = useSharedValue(0);

    useEffect(() => {
        shimmer.value = withRepeat(
            withTiming(1, { duration: 1500 }),
            -1,
            false
        );
    }, [shimmer]);

    const animatedStyle = useAnimatedStyle(() => {
        const opacity = interpolate(shimmer.value, [0, 0.5, 1], [0.3, 0.7, 0.3]);

        return { opacity };
    });

    return (
        <Animated.View
            style={[
                {
                    width,
                    height,
                    borderRadius,
                    backgroundColor: '#FFF9E6', // Soft golden glow for skeleton base
                },
                animatedStyle,
            ]}
            className={className}
        />
    );
}

export function MonkCardSkeleton() {
    return (
        <View className="bg-white/60 rounded-xl p-4 mb-3 mx-4 shadow-sm border border-white/50 backdrop-blur-md">
            <View className="flex-row items-center">
                <Skeleton width={70} height={70} borderRadius={35} />
                <View className="ml-4 flex-1">
                    <Skeleton width={200} height={18} className="mb-2" />
                    <Skeleton width={150} height={14} className="mb-2" />
                    <Skeleton width={80} height={12} />
                </View>
            </View>
        </View>
    );
}

export function BookingCardSkeleton() {
    return (
        <View className="bg-white rounded-xl mb-3 mx-4 shadow-sm overflow-hidden">
            <View className="flex-row">
                <View style={{ width: 100, height: 100, backgroundColor: '#E7E5E4' }} />
                <View className="flex-1 p-4">
                    <Skeleton width={180} height={16} className="mb-2" />
                    <Skeleton width={120} height={12} className="mb-2" />
                    <View className="flex-row justify-between mt-2">
                        <Skeleton width={60} height={20} />
                        <Skeleton width={50} height={14} />
                    </View>
                </View>
            </View>
        </View>
    );
}
