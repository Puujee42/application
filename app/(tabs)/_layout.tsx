import { Tabs } from 'expo-router';
import { Home, Sparkles, User, BookOpen } from 'lucide-react-native';
import { View, Platform } from 'react-native';
import { COLORS } from '../../design-system/theme';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: COLORS.gold,
                tabBarInactiveTintColor: COLORS.textFaint,
                tabBarStyle: {
                    backgroundColor: 'rgba(253,250,242,0.95)',
                    ...((Platform.OS === 'web' || Platform.OS === 'ios') && { backdropFilter: 'blur(20px)' }),
                    borderTopWidth: 0,
                    height: Platform.OS === 'ios' ? 84 : 62,
                    paddingBottom: Platform.OS === 'ios' ? 26 : 6,
                    paddingTop: 8,
                    shadowColor: '#B87A08',
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.07,
                    shadowRadius: 12,
                    elevation: 12,
                } as any,
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
