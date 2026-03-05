import { Text, Pressable, View } from 'react-native';
import { useCallback, useState } from 'react';
import { useOAuth } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as Haptics from 'expo-haptics';
import Svg, { Path } from 'react-native-svg';
import { useWarmUpBrowser } from '../../hooks/useWarmUpBrowser';

// This is required to complete the OAuth flow on native platforms
WebBrowser.maybeCompleteAuthSession();

export function GoogleSignInButton() {
    // Warm up the android browser to improve UX
    useWarmUpBrowser();

    const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
    const [loading, setLoading] = useState(false);

    const onPress = useCallback(async () => {
        try {
            setLoading(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

            const { createdSessionId, setActive } = await startOAuthFlow({
                redirectUrl: Linking.createURL('/(tabs)', { scheme: 'myapp' }),
            });

            if (createdSessionId && setActive) {
                await setActive({ session: createdSessionId });
            } else {
                // Use signIn or signUp for next steps such as MFA
            }
        } catch (err) {
            console.error('OAuth error', err);
        } finally {
            setLoading(false);
        }
    }, [startOAuthFlow]);

    return (
        <Pressable
            onPress={onPress}
            disabled={loading}
            className={`flex-row items-center justify-center border border-stone-300 rounded-xl py-4 px-6 active:bg-stone-100 ${loading ? 'opacity-70' : 'opacity-100'}`}
            style={{ minHeight: 52 }}
        >
            <View className="mr-3">
                <GoogleIcon width={24} height={24} />
            </View>
            <Text className="text-stone-800 text-center font-semibold text-lg tracking-tight">
                {loading ? 'Continuing...' : 'Continue with Google'}
            </Text>
        </Pressable>
    );
}

function GoogleIcon({ width, height }: { width: number; height: number }) {
    return (
        <View style={{ width, height, justifyContent: 'center', alignItems: 'center' }}>
            {/* Minimal SVG for Google 'G' Logo using react-native-svg */}
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <Path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <Path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <Path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <Path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </Svg>
        </View>
    );
}
