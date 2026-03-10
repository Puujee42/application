import React from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring
} from 'react-native-reanimated';

const ReanimatedPressable = Animated.createAnimatedComponent(Pressable);

interface TouchableScaleProps extends PressableProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle> | any;
    scaleTo?: number;
}

export default function TouchableScale({
    children,
    onPress,
    onPressIn,
    onPressOut,
    style,
    scaleTo = 0.96,
    ...props
}: TouchableScaleProps) {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }]
    }));

    const handlePressIn = (e: any) => {
        scale.value = withSpring(scaleTo, { damping: 15, stiffness: 200 });
        if (onPressIn) onPressIn(e);
    };

    const handlePressOut = (e: any) => {
        scale.value = withSpring(1, { damping: 15, stiffness: 200 });
        if (onPressOut) onPressOut(e);
    };

    return (
        <ReanimatedPressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={onPress}
            style={[style, animatedStyle]}
            {...props}
        >
            {children}
        </ReanimatedPressable>
    );
}
