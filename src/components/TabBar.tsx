import React, { useEffect } from 'react';
import { View, Pressable, Platform, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

function TabItem({ isFocused, options, route, onPress, onLongPress }: any) {
    const scale = useSharedValue(isFocused ? 1 : 0.9);
    const opacity = useSharedValue(isFocused ? 1 : 0.6);

    useEffect(() => {
        scale.value = withSpring(isFocused ? 1 : 0.9, { damping: 15, stiffness: 300 });
        opacity.value = withTiming(isFocused ? 1 : 0.6, { duration: 200 });
    }, [isFocused]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isFocused ? 0.3 : 0,
        shadowRadius: 8,
        elevation: isFocused ? 5 : 0,
    }));

    const renderIcon = () => {
        if (typeof options.tabBarIcon === 'function') {
            return options.tabBarIcon({
                focused: isFocused,
                color: isFocused ? '#D4AF37' : '#94A3B8',
                size: 24
            });
        }
        return null;
    };

    return (
        <Pressable
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarButtonTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            className="flex-1 items-center justify-center py-3 rounded-full"
        >
            <Animated.View className={`items-center justify-center p-3 rounded-full ${isFocused ? "bg-[#D4AF37]/20 border border-[#D4AF37]/30 shadow-lg" : "bg-transparent"}`} style={animatedStyle}>
                {renderIcon()}
            </Animated.View>
        </Pressable>
    );
}

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    if (!state || !descriptors || !navigation) return null;

    return (
        <View
            className="absolute left-8 right-8 bg-white/10 rounded-full flex-row p-1 shadow-2xl border border-white/20"
            style={styles.tabbar}
        >
            {state.routes.map((route, index) => {
                const descriptor = descriptors[route.key];
                if (!descriptor) return null;
                const { options } = descriptor;
                const isFocused = state.index === index;

                const onPress = () => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    const event = navigation.emit({
                        type: 'tabPress',
                        target: route.key,
                        canPreventDefault: true,
                    });

                    if (!isFocused && !event.defaultPrevented) {
                        navigation.navigate(route.name, route.params);
                    }
                };

                const onLongPress = () => {
                    Haptics.selectionAsync();
                    navigation.emit({
                        type: 'tabLongPress',
                        target: route.key,
                    });
                };

                return (
                    <TabItem
                        key={route.key}
                        isFocused={isFocused}
                        options={options}
                        route={route}
                        onPress={onPress}
                        onLongPress={onLongPress}
                    />
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    tabbar: {
        bottom: Platform.OS === 'ios' ? 32 : 16,
        elevation: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
    }
});
