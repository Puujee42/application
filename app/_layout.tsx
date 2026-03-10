import React, { useEffect, Component } from 'react';
import { ClerkProvider, ClerkLoaded } from '@clerk/clerk-expo';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { tokenCache } from '../lib/tokenCache';
import { queryClient, asyncStoragePersister } from '../lib/queryClient';
import { initI18n } from '../lib/i18n';
import OfflineBanner from '../components/OfflineBanner';
import ErrorBoundary from '../components/ErrorBoundary';
import { ClerkAvailableContext } from '../lib/useClerkSafe';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import { COLORS } from '../design-system/theme';
import '../global.css';
import { useBookingNotifications } from '../hooks/useBookingNotifications';

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || '';
const isClerkReady = publishableKey.startsWith('pk_') && !publishableKey.includes('YOUR_KEY_HERE');

class ClerkErrorBoundary extends Component<
    { children: React.ReactNode; fallback: React.ReactNode },
    { hasError: boolean }
> {
    state = { hasError: false };
    static getDerivedStateFromError() { return { hasError: true }; }
    componentDidCatch(err: Error) {
        console.warn('Clerk initialization failed, running without auth:', err.message);
    }
    render() {
        return this.state.hasError ? this.props.fallback : this.props.children;
    }
}

function AppContent({ withAuth }: { withAuth: boolean }) {
    const colorScheme = useColorScheme();
    const router = useRouter();

    // Hook will automatically sync local notifications based on logged in user's bookings
    useBookingNotifications();

    useEffect(() => {
        // Setup 401 interceptor
        const interceptor = api.interceptors.response.use(
            (res) => res,
            async (error) => {
                if (error.response?.status === 401) {
                    const { logout } = useAuthStore.getState();
                    await logout();
                    router.replace('/(auth)/sign-in');
                }
                return Promise.reject(error);
            }
        );

        return () => {
            api.interceptors.response.eject(interceptor);
        };
    }, [router]);

    return (
        <SafeAreaProvider>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                <StatusBar style="dark" backgroundColor={COLORS.bg} />
                <OfflineBanner />
                <Stack
                    screenOptions={{
                        headerShown: false,
                        animation: 'slide_from_right',
                    }}
                >
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                    <Stack.Screen
                        name="monk/[id]"
                        options={{
                            headerShown: true,
                            headerTitle: '',
                            headerTransparent: true,
                            headerBackTitle: 'Back',
                        }}
                    />
                </Stack>
            </ThemeProvider>
        </SafeAreaProvider>
    );
}

export default function RootLayout() {
    useEffect(() => {
        initI18n();
    }, []);

    const noAuthApp = (
        <ClerkAvailableContext.Provider value={false}>
            <PersistQueryClientProvider
                client={queryClient}
                persistOptions={{ persister: asyncStoragePersister }}
            >
                <AppContent withAuth={false} />
            </PersistQueryClientProvider>
        </ClerkAvailableContext.Provider>
    );

    const authedApp = (
        <ClerkAvailableContext.Provider value={true}>
            <PersistQueryClientProvider
                client={queryClient}
                persistOptions={{ persister: asyncStoragePersister }}
            >
                <AppContent withAuth={true} />
            </PersistQueryClientProvider>
        </ClerkAvailableContext.Provider>
    );

    return (
        <ErrorBoundary>
            {isClerkReady ? (
                <ClerkErrorBoundary fallback={noAuthApp}>
                    <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
                        <ClerkLoaded>
                            {authedApp}
                        </ClerkLoaded>
                    </ClerkProvider>
                </ClerkErrorBoundary>
            ) : (
                noAuthApp
            )}
        </ErrorBoundary>
    );
}
