import React, { useEffect, Component } from 'react';
import { ClerkProvider, ClerkLoaded } from '@clerk/clerk-expo';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { Stack } from 'expo-router';
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
import '../global.css';
import { AuthSync } from '../src/components/AuthSync';

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || '';
const isClerkReady = publishableKey.startsWith('pk_') && !publishableKey.includes('YOUR_KEY_HERE');

// ── Catches Clerk init errors (invalid key, network) → falls back to no-auth ──
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
    return (
        <SafeAreaProvider>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                {withAuth && <AuthSync />}
                <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
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
