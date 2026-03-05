import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X, Phone } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';

export default function PhoneLoginScreen() {
    const router = useRouter();
    const { login, isLoading } = useAuthStore();
    const { fetchProfile } = useUserStore();

    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const formatPhoneNumber = (text: string) => {
        // Remove non-digits
        const digits = text.replace(/\D/g, '');
        // Format as Mongolian phone number
        if (digits.length <= 8) {
            return digits;
        }
        return digits.slice(0, 8);
    };

    const onSignIn = useCallback(async () => {
        if (!phone || !password) {
            setError('Please enter phone number and password');
            return;
        }

        setError('');

        try {
            // Format phone with +976 prefix for Mongolian numbers
            const formattedPhone = phone.startsWith('+') ? phone : `+976${phone}`;
            await login(formattedPhone, password);
            // Fetch full profile after login
            await fetchProfile();
            router.replace('/(tabs)');
        } catch (err: any) {
            console.error('Login error:', err);
            if (err.message?.includes('Cannot connect to server')) {
                setError('Cannot connect to server. Make sure the backend is running.');
            } else {
                setError(err.message || 'Sign in failed');
            }
        }
    }, [phone, password, login, fetchProfile, router]);

    return (
        <SafeAreaView className="flex-1 bg-stone-50">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                {/* Header */}
                <View className="flex-row items-center justify-between px-4 py-2">
                    <Pressable
                        onPress={() => router.back()}
                        className="p-2 -ml-2"
                        style={{ minWidth: 44, minHeight: 44 }}
                    >
                        <X size={24} color="#44403C" />
                    </Pressable>
                    <Text className="text-lg font-semibold text-stone-800">Sign In with Phone</Text>
                    <View style={{ width: 44 }} />
                </View>

                {/* Form */}
                <View className="flex-1 px-6 pt-8">
                    <View className="items-center mb-6">
                        <View className="w-16 h-16 bg-amber-100 rounded-full items-center justify-center mb-4">
                            <Phone size={32} color="#D97706" />
                        </View>
                        <Text className="text-3xl font-bold text-stone-800 mb-2">
                            Welcome back
                        </Text>
                        <Text className="text-stone-600 text-center">
                            Sign in with your phone number to continue
                        </Text>
                    </View>

                    {error ? (
                        <View className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                            <Text className="text-red-600">{error}</Text>
                        </View>
                    ) : null}

                    <View className="mb-4">
                        <Text className="text-stone-700 font-medium mb-2">Phone Number</Text>
                        <View className="flex-row items-center bg-white border border-stone-300 rounded-xl overflow-hidden">
                            <View className="bg-stone-100 px-4 py-4 border-r border-stone-300">
                                <Text className="text-stone-600 font-medium">+976</Text>
                            </View>
                            <TextInput
                                value={phone}
                                onChangeText={(text) => setPhone(formatPhoneNumber(text))}
                                placeholder="99123456"
                                keyboardType="phone-pad"
                                maxLength={8}
                                className="flex-1 px-4 py-4 text-stone-800"
                                style={{ minHeight: 52 }}
                            />
                        </View>
                    </View>

                    <View className="mb-6">
                        <Text className="text-stone-700 font-medium mb-2">Password</Text>
                        <TextInput
                            value={password}
                            onChangeText={setPassword}
                            placeholder="Enter your password"
                            secureTextEntry
                            className="bg-white border border-stone-300 rounded-xl px-4 py-4 text-stone-800"
                            style={{ minHeight: 52 }}
                        />
                    </View>

                    <Pressable
                        onPress={onSignIn}
                        disabled={isLoading}
                        className={`rounded-xl py-4 px-6 ${isLoading ? 'bg-amber-400' : 'bg-amber-600 active:bg-amber-700'}`}
                        style={{ minHeight: 52 }}
                    >
                        <Text className="text-white text-center font-semibold text-lg">
                            {isLoading ? 'Signing in...' : 'Sign In'}
                        </Text>
                    </Pressable>

                    <Pressable
                        onPress={() => router.push('/(auth)/phone-signup')}
                        className="mt-4 py-3"
                        style={{ minHeight: 44 }}
                    >
                        <Text className="text-center text-stone-600">
                            Don't have an account?{' '}
                            <Text className="text-amber-600 font-semibold">Sign Up</Text>
                        </Text>
                    </Pressable>

                    <View className="mt-6 pt-6 border-t border-stone-200">
                        <Pressable
                            onPress={() => router.push('/(auth)/sign-in')}
                            className="py-3"
                            style={{ minHeight: 44 }}
                        >
                            <Text className="text-center text-stone-500">
                                Sign in with email instead
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
