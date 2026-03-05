import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X, Phone, Eye, EyeOff } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';

export default function PhoneSignupScreen() {
    const router = useRouter();
    const { signup, isLoading } = useAuthStore();
    const { fetchProfile } = useUserStore();

    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    const formatPhoneNumber = (text: string) => {
        const digits = text.replace(/\D/g, '');
        if (digits.length <= 8) {
            return digits;
        }
        return digits.slice(0, 8);
    };

    const validateForm = () => {
        if (!phone || phone.length < 8) {
            setError('Please enter a valid 8-digit phone number');
            return false;
        }
        if (!password || password.length < 6) {
            setError('Password must be at least 6 characters');
            return false;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return false;
        }
        if (email && !email.includes('@')) {
            setError('Please enter a valid email address');
            return false;
        }
        return true;
    };

    const onSignUp = useCallback(async () => {
        if (!validateForm()) return;

        setError('');

        try {
            const formattedPhone = `+976${phone}`;
            await signup(formattedPhone, password, { email: email || undefined });
            await fetchProfile();
            router.replace('/(tabs)');
        } catch (err: any) {
            setError(err.message || 'Sign up failed');
        }
    }, [phone, email, password, confirmPassword, signup, fetchProfile, router]);

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
                    <Text className="text-lg font-semibold text-stone-800">Create Account</Text>
                    <View style={{ width: 44 }} />
                </View>

                <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false}>
                    <View className="items-center mb-6">
                        <View className="w-16 h-16 bg-amber-100 rounded-full items-center justify-center mb-4">
                            <Phone size={32} color="#D97706" />
                        </View>
                        <Text className="text-3xl font-bold text-stone-800 mb-2">
                            Join us
                        </Text>
                        <Text className="text-stone-600 text-center">
                            Create an account with your phone number
                        </Text>
                    </View>

                    {error ? (
                        <View className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                            <Text className="text-red-600">{error}</Text>
                        </View>
                    ) : null}

                    <View className="mb-4">
                        <Text className="text-stone-700 font-medium mb-2">Phone Number *</Text>
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

                    <View className="mb-4">
                        <Text className="text-stone-700 font-medium mb-2">Email (Optional)</Text>
                        <TextInput
                            value={email}
                            onChangeText={setEmail}
                            placeholder="your@email.com"
                            autoCapitalize="none"
                            keyboardType="email-address"
                            className="bg-white border border-stone-300 rounded-xl px-4 py-4 text-stone-800"
                            style={{ minHeight: 52 }}
                        />
                    </View>

                    <View className="mb-4">
                        <Text className="text-stone-700 font-medium mb-2">Password *</Text>
                        <View className="flex-row items-center bg-white border border-stone-300 rounded-xl overflow-hidden">
                            <TextInput
                                value={password}
                                onChangeText={setPassword}
                                placeholder="At least 6 characters"
                                secureTextEntry={!showPassword}
                                className="flex-1 px-4 py-4 text-stone-800"
                                style={{ minHeight: 52 }}
                            />
                            <Pressable
                                onPress={() => setShowPassword(!showPassword)}
                                className="px-4"
                            >
                                {showPassword ? (
                                    <EyeOff size={20} color="#78716C" />
                                ) : (
                                    <Eye size={20} color="#78716C" />
                                )}
                            </Pressable>
                        </View>
                    </View>

                    <View className="mb-6">
                        <Text className="text-stone-700 font-medium mb-2">Confirm Password *</Text>
                        <TextInput
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            placeholder="Confirm your password"
                            secureTextEntry={!showPassword}
                            className="bg-white border border-stone-300 rounded-xl px-4 py-4 text-stone-800"
                            style={{ minHeight: 52 }}
                        />
                    </View>

                    <Pressable
                        onPress={onSignUp}
                        disabled={isLoading}
                        className={`rounded-xl py-4 px-6 ${isLoading ? 'bg-amber-400' : 'bg-amber-600 active:bg-amber-700'}`}
                        style={{ minHeight: 52 }}
                    >
                        <Text className="text-white text-center font-semibold text-lg">
                            {isLoading ? 'Creating account...' : 'Create Account'}
                        </Text>
                    </Pressable>

                    <Pressable
                        onPress={() => router.push('/(auth)/phone-login')}
                        className="mt-4 py-3"
                        style={{ minHeight: 44 }}
                    >
                        <Text className="text-center text-stone-600">
                            Already have an account?{' '}
                            <Text className="text-amber-600 font-semibold">Sign In</Text>
                        </Text>
                    </Pressable>

                    <View className="mt-6 pt-6 border-t border-stone-200 mb-8">
                        <Pressable
                            onPress={() => router.push('/(auth)/sign-up')}
                            className="py-3"
                            style={{ minHeight: 44 }}
                        >
                            <Text className="text-center text-stone-500">
                                Sign up with email instead
                            </Text>
                        </Pressable>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
