import { Tabs } from 'expo-router';
import { Home, Sparkles, User, BookOpen, MessageCircle } from 'lucide-react-native';
import { View, Platform, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { COLORS } from '../../design-system/theme';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: COLORS.gold,
                tabBarInactiveTintColor: COLORS.textFaint,
                tabBarStyle: {
                    position: 'absolute',
                    borderTopWidth: 0,
                    height: Platform.OS === 'ios' ? 84 : 62,
                    paddingBottom: Platform.OS === 'ios' ? 26 : 6,
                    paddingTop: 8,
                    shadowColor: '#C8960C',
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 12,
                    elevation: 12,
                    backgroundColor: 'transparent',
                } as any,
                tabBarBackground: () => (
                    <BlurView
                        tint="light"
                        intensity={40}
                        style={[
                            StyleSheet.absoluteFillObject,
                            { backgroundColor: 'rgba(255, 252, 242, 0.45)' }
                        ]}
                    />
                ),
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: '600',
                    letterSpacing: 0.2,
                    marginTop: 1,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Нүүр',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={{ alignItems: 'center', paddingTop: 2 }}>
                            <Home size={22} color={color} strokeWidth={focused ? 2.1 : 1.6} />
                            {focused && (
                                <View style={{
                                    width: 4, height: 4, borderRadius: 2,
                                    backgroundColor: COLORS.gold, marginTop: 4,
                                }} />
                            )}
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="blog"
                options={{
                    title: 'Блог',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={{ alignItems: 'center', paddingTop: 2 }}>
                            <BookOpen size={22} color={color} strokeWidth={focused ? 2.1 : 1.6} />
                            {focused && (
                                <View style={{
                                    width: 4, height: 4, borderRadius: 2,
                                    backgroundColor: COLORS.gold, marginTop: 4,
                                }} />
                            )}
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="monks"
                options={{
                    title: 'Үзмэрч',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={{ alignItems: 'center', paddingTop: 2 }}>
                            <Sparkles size={22} color={color} strokeWidth={focused ? 2.1 : 1.6} />
                            {focused && (
                                <View style={{
                                    width: 4, height: 4, borderRadius: 2,
                                    backgroundColor: COLORS.gold, marginTop: 4,
                                }} />
                            )}
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="messages"
                options={{
                    title: 'Чат',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={{ alignItems: 'center', paddingTop: 2 }}>
                            <MessageCircle size={22} color={color} strokeWidth={focused ? 2.1 : 1.6} />
                            {focused && (
                                <View style={{
                                    width: 4, height: 4, borderRadius: 2,
                                    backgroundColor: COLORS.gold, marginTop: 4,
                                }} />
                            )}
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Профайл',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={{ alignItems: 'center', paddingTop: 2 }}>
                            <User size={22} color={color} strokeWidth={focused ? 2.1 : 1.6} />
                            {focused && (
                                <View style={{
                                    width: 4, height: 4, borderRadius: 2,
                                    backgroundColor: COLORS.gold, marginTop: 4,
                                }} />
                            )}
                        </View>
                    ),
                }}
            />
            {/* Hidden tabs — kept for expo-router but not shown in tab bar */}
            <Tabs.Screen name="about" options={{ href: null }} />
            <Tabs.Screen name="rituals" options={{ href: null }} />
        </Tabs>
    );
}
