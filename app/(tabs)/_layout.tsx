import { Tabs } from 'expo-router';
import { Home, Sparkles, User, BookOpen } from 'lucide-react-native';
import { View, StyleSheet, Platform } from 'react-native';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#E5B22D',
                tabBarInactiveTintColor: '#888888',
                tabBarStyle: styles.tabBar,
                tabBarLabelStyle: styles.tabLabel,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Нүүр',
                    tabBarIcon: ({ color, size }) => (
                        <Home size={size} color={color} strokeWidth={1.8} />
                    ),
                }}
            />
            <Tabs.Screen
                name="blog"
                options={{
                    title: 'Блог',
                    tabBarIcon: ({ color, size }) => (
                        <BookOpen size={size} color={color} strokeWidth={1.8} />
                    ),
                }}
            />
            <Tabs.Screen
                name="monks"
                options={{
                    title: 'Үзмэрч',
                    tabBarIcon: ({ color, size }) => (
                        <Sparkles size={size} color={color} strokeWidth={1.8} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Профайл',
                    tabBarIcon: ({ color, size }) => (
                        <User size={size} color={color} strokeWidth={1.8} />
                    ),
                }}
            />
            {/* Hidden tabs — kept for expo-router but not shown in tab bar */}
            <Tabs.Screen name="about" options={{ href: null }} />
            <Tabs.Screen name="rituals" options={{ href: null }} />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: '#FFFFFF',
        borderTopWidth: 0,
        height: Platform.OS === 'ios' ? 88 : 64,
        paddingBottom: Platform.OS === 'ios' ? 28 : 8,
        paddingTop: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 8,
    },
    tabLabel: {
        fontSize: 11,
        fontWeight: '600',
        marginTop: 2,
    },
});

