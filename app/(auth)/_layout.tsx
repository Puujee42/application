import { Stack, useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { NavigationGuard } from '../../src/components/NavigationGuard';

export default function AuthLayout() {
    const { isSignedIn, isLoaded } = useAuth();
    const { isCustomAuth, customToken } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if ((isLoaded && isSignedIn) || (isCustomAuth && customToken)) {
            router.replace('/(tabs)');
        }
    }, [isSignedIn, isLoaded, isCustomAuth, customToken]);

    return (
        <Stack
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_bottom',
            }}
        >
            <Stack.Screen name="sign-in" />
            <Stack.Screen name="sign-up" />
            <Stack.Screen name="phone-login" />
            <Stack.Screen name="phone-signup" />
        </Stack>
    );
}

