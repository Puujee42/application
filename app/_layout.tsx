import { useEffect } from 'react';
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
import '../global.css';
import { AuthSync } from '../src/components/AuthSync';

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
    throw new Error('Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY');
}

export default function RootLayout() {
    const colorScheme = useColorScheme();

    useEffect(() => {
        initI18n();
    }, []);

    return (
        <ErrorBoundary>
            <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
                <ClerkLoaded>
                    <PersistQueryClientProvider
                        client={queryClient}
                        persistOptions={{ persister: asyncStoragePersister }}
                    >
                        <SafeAreaProvider>
                            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                                <AuthSync />
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
                                <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
                            </ThemeProvider>
                        </SafeAreaProvider>
                    </PersistQueryClientProvider>
                </ClerkLoaded>
            </ClerkProvider>
        </ErrorBoundary>
    );
}
