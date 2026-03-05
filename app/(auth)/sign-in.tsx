import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Phone, Eye, EyeOff } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';

export default function SignInScreen() {
    const router = useRouter();
    const { login, isLoading } = useAuthStore();
    const { fetchProfile } = useUserStore();

    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    const formatPhoneNumber = (text: string) => {
        const digits = text.replace(/\D/g, '');
        return digits.length <= 8 ? digits : digits.slice(0, 8);
    };

    const onSignIn = useCallback(async () => {
        if (!phone || !password) {
            setError('Please enter phone number and password');
            return;
        }

        setError('');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        try {
            const formattedPhone = phone.startsWith('+') ? phone : `+976${phone}`;
            await login(formattedPhone, password);
            await fetchProfile();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.replace('/(tabs)');
        } catch (err: any) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            if (err.message?.includes('Cannot connect to server')) {
                setError('Cannot connect to server. Make sure the backend is running.');
            } else {
                setError(err.message || 'Sign in failed');
            }
        }
    }, [phone, password, login, fetchProfile, router]);

    return (
        <ScreenWrapper className="bg-[#0F172A]">
            <SafeAreaView className="flex-1 bg-[#0F172A]">
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    className="flex-1"
                >
                    {/* Header */}
                    <View className="flex-row items-center px-6 py-4 border-b border-[#D4AF37]/20 bg-[#0F172A]/80 backdrop-blur-md">
                        <Pressable
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                router.back();
                            }}
                            className="bg-white/10 p-2 rounded-full mr-4 border border-[#D4AF37]/30"
                            style={{ minWidth: 44, minHeight: 44 }}
                        >
                            <ArrowLeft size={24} color="#D4AF37" />
                        </Pressable>
                        <Text className="text-xl font-serif font-bold text-white tracking-widest">Sign In</Text>
                    </View>

                    {/* Form */}
                    <View className="flex-1 px-6 pt-10">
                        <Animated.View entering={FadeInDown.delay(100).duration(800)} className="items-center mb-10">
                            <View className="w-20 h-20 bg-white/5 rounded-full items-center justify-center mb-6 border border-[#D4AF37]/30 shadow-lg" style={{ shadowColor: '#D4AF37', shadowRadius: 15, shadowOpacity: 0.2 }}>
                                <Phone size={36} color="#D4AF37" />
                            </View>
                            <Text className="text-4xl font-serif font-bold text-white mb-2 tracking-tight">
                                Welcome back
                            </Text>
                            <Text className="text-slate-400 text-center font-serif tracking-widest uppercase text-xs">
                                Enter your credentials to continue
                            </Text>
                        </Animated.View>

                        {error ? (
                            <Animated.View entering={FadeInDown} className="bg-red-900/30 border border-red-500/50 rounded-2xl p-4 mb-6 backdrop-blur-sm">
                                <Text className="text-red-400 text-center font-medium">{error}</Text>
                            </Animated.View>
                        ) : null}

                        <Animated.View entering={FadeInDown.delay(200).duration(800)} className="mb-5">
                            <Text className="text-slate-300 font-bold uppercase tracking-[2px] text-[10px] mb-3 ml-1">Phone Number</Text>
                            <View className="flex-row items-center bg-white/5 border border-[#D4AF37]/20 rounded-2xl overflow-hidden backdrop-blur-md">
                                <View className="bg-black/20 px-5 py-5 border-r border-[#D4AF37]/20">
                                    <Text className="text-[#D4AF37] font-bold">+976</Text>
                                </View>
                                <TextInput
                                    value={phone}
                                    onChangeText={(text) => setPhone(formatPhoneNumber(text))}
                                    placeholder="99123456"
                                    placeholderTextColor="#64748B"
                                    keyboardType="phone-pad"
                                    maxLength={8}
                                    className="flex-1 px-5 py-5 text-white font-bold tracking-widest"
                                    style={{ minHeight: 60 }}
                                />
                            </View>
                        </Animated.View>

                        <Animated.View entering={FadeInDown.delay(300).duration(800)} className="mb-10">
                            <Text className="text-slate-300 font-bold uppercase tracking-[2px] text-[10px] mb-3 ml-1">Password</Text>
                            <View className="flex-row items-center bg-white/5 border border-[#D4AF37]/20 rounded-2xl overflow-hidden backdrop-blur-md">
                                <TextInput
                                    value={password}
                                    onChangeText={setPassword}
                                    placeholder="Enter your password"
                                    placeholderTextColor="#64748B"
                                    secureTextEntry={!showPassword}
                                    className="flex-1 px-5 py-5 text-white font-bold tracking-wider"
                                    style={{ minHeight: 60 }}
                                />
                                <Pressable
                                    onPress={() => setShowPassword(!showPassword)}
                                    className="px-5 py-5"
                                >
                                    {showPassword ? (
                                        <EyeOff size={22} color="#D4AF37" />
                                    ) : (
                                        <Eye size={22} color="#D4AF37" />
                                    )}
                                </Pressable>
                            </View>
                        </Animated.View>

                        <Animated.View entering={FadeInDown.delay(400).duration(800)}>
                            <Pressable
                                onPress={onSignIn}
                                disabled={isLoading}
                                className={`rounded-2xl py-5 px-6 border ${isLoading ? 'bg-white/10 border-[#D4AF37]/30' : 'bg-[#D4AF37]/10 border-[#D4AF37] active:bg-[#D4AF37]/20'}`}
                                style={{ minHeight: 60 }}
                            >
                                <Text className="text-[#D4AF37] text-center font-bold text-sm tracking-[3px] uppercase">
                                    {isLoading ? 'Authenticating...' : 'Sign In'}
                                </Text>
                            </Pressable>
                        </Animated.View>

                        <Animated.View entering={FadeInDown.delay(500).duration(800)}>
                            <Pressable
                                onPress={() => router.push('/(auth)/sign-up')}
                                className="mt-8 py-4"
                                style={{ minHeight: 44 }}
                            >
                                <Text className="text-center text-slate-400 font-serif">
                                    Don't have an account?{' '}
                                    <Text className="text-[#D4AF37] font-bold">Sign Up</Text>
                                </Text>
                            </Pressable>
                        </Animated.View>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </ScreenWrapper>
    );
}
