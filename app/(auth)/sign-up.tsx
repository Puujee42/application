import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Phone, Eye, EyeOff, User, Calendar } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';

const ZODIAC_ANIMALS = [
    { mn: 'Хулгана', en: 'Mouse' },
    { mn: 'Үхэр', en: 'Ox' },
    { mn: 'Бар', en: 'Tiger' },
    { mn: 'Туулай', en: 'Rabbit' },
    { mn: 'Луу', en: 'Dragon' },
    { mn: 'Могой', en: 'Snake' },
    { mn: 'Морь', en: 'Horse' },
    { mn: 'Хонь', en: 'Sheep' },
    { mn: 'Мич', en: 'Monkey' },
    { mn: 'Тахиа', en: 'Rooster' },
    { mn: 'Нохой', en: 'Dog' },
    { mn: 'Гахай', en: 'Pig' },
];

export default function SignUpScreen() {
    const router = useRouter();
    const { signup, isLoading } = useAuthStore();
    const { fetchProfile } = useUserStore();

    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [zodiacYear, setZodiacYear] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    const formatPhoneNumber = (text: string) => {
        const digits = text.replace(/\D/g, '');
        return digits.length <= 8 ? digits : digits.slice(0, 8);
    };

    const formatDateInput = (text: string) => {
        const digits = text.replace(/\D/g, '');
        if (digits.length <= 4) return digits;
        if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
        return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
    };

    const validateForm = () => {
        if (!firstName.trim()) {
            setError('Please enter your first name');
            return false;
        }
        if (!lastName.trim()) {
            setError('Please enter your last name');
            return false;
        }
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
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        try {
            const formattedPhone = `+976${phone}`;
            await signup(formattedPhone, password, {
                email: email || undefined,
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                dateOfBirth: dateOfBirth || undefined,
                zodiacYear: zodiacYear || undefined,
            });
            await fetchProfile();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.replace('/(tabs)');
        } catch (err: any) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setError(err.message || 'Sign up failed');
        }
    }, [phone, email, firstName, lastName, dateOfBirth, zodiacYear, password, confirmPassword, signup, fetchProfile, router]);

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
                        <Text className="text-xl font-serif font-bold text-white tracking-widest">Create Account</Text>
                    </View>

                    <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                        <Animated.View entering={FadeInDown.delay(100).duration(800)} className="items-center mb-8">
                            <View className="w-20 h-20 bg-white/5 rounded-full items-center justify-center mb-6 border border-[#D4AF37]/30 shadow-lg" style={{ shadowColor: '#D4AF37', shadowRadius: 15, shadowOpacity: 0.2 }}>
                                <User size={36} color="#D4AF37" />
                            </View>
                            <Text className="text-4xl font-serif font-bold text-white mb-2 tracking-tight">
                                Join us
                            </Text>
                            <Text className="text-slate-400 text-center font-serif tracking-widest uppercase text-xs">
                                Create your account to get started
                            </Text>
                        </Animated.View>

                        {error ? (
                            <Animated.View entering={FadeInDown} className="bg-red-900/30 border border-red-500/50 rounded-2xl p-4 mb-6 backdrop-blur-sm">
                                <Text className="text-red-400 text-center font-medium">{error}</Text>
                            </Animated.View>
                        ) : null}

                        <Animated.View entering={FadeInDown.delay(200).duration(800)}>
                            {/* Name Fields */}
                            <View className="flex-row gap-4 mb-6">
                                <View className="flex-1">
                                    <Text className="text-slate-300 font-bold uppercase tracking-[2px] text-[10px] mb-3 ml-1">First Name *</Text>
                                    <TextInput
                                        value={firstName}
                                        onChangeText={setFirstName}
                                        placeholder="Нэр"
                                        placeholderTextColor="#64748B"
                                        autoCapitalize="words"
                                        className="bg-white/5 border border-[#D4AF37]/20 rounded-2xl px-5 py-5 text-white font-bold tracking-wider backdrop-blur-md"
                                        style={{ minHeight: 60 }}
                                    />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-slate-300 font-bold uppercase tracking-[2px] text-[10px] mb-3 ml-1">Last Name *</Text>
                                    <TextInput
                                        value={lastName}
                                        onChangeText={setLastName}
                                        placeholder="Овог"
                                        placeholderTextColor="#64748B"
                                        autoCapitalize="words"
                                        className="bg-white/5 border border-[#D4AF37]/20 rounded-2xl px-5 py-5 text-white font-bold tracking-wider backdrop-blur-md"
                                        style={{ minHeight: 60 }}
                                    />
                                </View>
                            </View>

                            {/* Phone */}
                            <View className="mb-6">
                                <Text className="text-slate-300 font-bold uppercase tracking-[2px] text-[10px] mb-3 ml-1">Phone Number *</Text>
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
                            </View>

                            {/* Email */}
                            <View className="mb-6">
                                <Text className="text-slate-300 font-bold uppercase tracking-[2px] text-[10px] mb-3 ml-1">Email (Optional)</Text>
                                <TextInput
                                    value={email}
                                    onChangeText={setEmail}
                                    placeholder="your@email.com"
                                    placeholderTextColor="#64748B"
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    className="bg-white/5 border border-[#D4AF37]/20 rounded-2xl px-5 py-5 text-white font-bold tracking-wider backdrop-blur-md"
                                    style={{ minHeight: 60 }}
                                />
                            </View>
                        </Animated.View>

                        <Animated.View entering={FadeInDown.delay(300).duration(800)}>
                            {/* Date of Birth */}
                            <View className="mb-6">
                                <Text className="text-slate-300 font-bold uppercase tracking-[2px] text-[10px] mb-3 ml-1">Date of Birth (Optional)</Text>
                                <View className="flex-row items-center bg-white/5 border border-[#D4AF37]/20 rounded-2xl overflow-hidden backdrop-blur-md">
                                    <View className="bg-black/20 p-5 py-5 border-r border-[#D4AF37]/20">
                                        <Calendar size={22} color="#D4AF37" />
                                    </View>
                                    <TextInput
                                        value={dateOfBirth}
                                        onChangeText={(text) => setDateOfBirth(formatDateInput(text))}
                                        placeholder="YYYY-MM-DD"
                                        placeholderTextColor="#64748B"
                                        keyboardType="number-pad"
                                        maxLength={10}
                                        className="flex-1 px-5 py-5 text-white font-bold tracking-widest"
                                        style={{ minHeight: 60 }}
                                    />
                                </View>
                            </View>

                            {/* Zodiac Year */}
                            <View className="mb-8">
                                <Text className="text-slate-300 font-bold uppercase tracking-[2px] text-[10px] mb-3 ml-1">Zodiac Year (Optional)</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-2" contentContainerStyle={{ paddingRight: 20 }}>
                                    {ZODIAC_ANIMALS.map((animal) => {
                                        const isSelected = zodiacYear === animal.en;
                                        return (
                                            <Pressable
                                                key={animal.en}
                                                onPress={() => {
                                                    Haptics.selectionAsync();
                                                    setZodiacYear(isSelected ? '' : animal.en);
                                                }}
                                                className={`px-6 py-3 mr-3 rounded-full border ${isSelected
                                                    ? 'bg-[#D4AF37]/20 border-[#D4AF37]'
                                                    : 'bg-white/5 border-[#D4AF37]/20'
                                                    }`}
                                                style={isSelected ? { shadowColor: '#D4AF37', shadowRadius: 10, shadowOpacity: 0.3 } : {}}
                                            >
                                                <Text className={`text-xs font-bold tracking-widest uppercase ${isSelected
                                                    ? 'text-[#D4AF37]'
                                                    : 'text-slate-400'
                                                    }`}>
                                                    {animal.mn}
                                                </Text>
                                            </Pressable>
                                        );
                                    })}
                                </ScrollView>
                            </View>
                        </Animated.View>

                        <Animated.View entering={FadeInDown.delay(400).duration(800)}>
                            {/* Password */}
                            <View className="mb-6">
                                <Text className="text-slate-300 font-bold uppercase tracking-[2px] text-[10px] mb-3 ml-1">Password *</Text>
                                <View className="flex-row items-center bg-white/5 border border-[#D4AF37]/20 rounded-2xl overflow-hidden backdrop-blur-md">
                                    <TextInput
                                        value={password}
                                        onChangeText={setPassword}
                                        placeholder="At least 6 characters"
                                        placeholderTextColor="#64748B"
                                        secureTextEntry={!showPassword}
                                        className="flex-1 px-5 py-5 text-white font-bold tracking-wider"
                                        style={{ minHeight: 60 }}
                                    />
                                    <Pressable
                                        onPress={() => setShowPassword(!showPassword)}
                                        className="p-5"
                                    >
                                        {showPassword ? (
                                            <EyeOff size={22} color="#D4AF37" />
                                        ) : (
                                            <Eye size={22} color="#D4AF37" />
                                        )}
                                    </Pressable>
                                </View>
                            </View>

                            {/* Confirm Password */}
                            <View className="mb-10">
                                <Text className="text-slate-300 font-bold uppercase tracking-[2px] text-[10px] mb-3 ml-1">Confirm Password *</Text>
                                <TextInput
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    placeholder="Confirm your password"
                                    placeholderTextColor="#64748B"
                                    secureTextEntry={!showPassword}
                                    className="bg-white/5 border border-[#D4AF37]/20 rounded-2xl px-5 py-5 text-white font-bold tracking-wider backdrop-blur-md"
                                    style={{ minHeight: 60 }}
                                />
                            </View>
                        </Animated.View>

                        <Animated.View entering={FadeInDown.delay(500).duration(800)}>
                            <Pressable
                                onPress={onSignUp}
                                disabled={isLoading}
                                className={`rounded-2xl py-5 px-6 border ${isLoading ? 'bg-white/10 border-[#D4AF37]/30' : 'bg-[#D4AF37]/10 border-[#D4AF37] active:bg-[#D4AF37]/20'}`}
                                style={{ minHeight: 60 }}
                            >
                                <Text className="text-[#D4AF37] text-center font-bold text-sm tracking-[3px] uppercase">
                                    {isLoading ? 'Creating account...' : 'Create Account'}
                                </Text>
                            </Pressable>

                            <Pressable
                                onPress={() => router.push('/(auth)/sign-in')}
                                className="mt-8 py-4 mb-10"
                                style={{ minHeight: 44 }}
                            >
                                <Text className="text-center text-slate-400 font-serif">
                                    Already have an account?{' '}
                                    <Text className="text-[#D4AF37] font-bold">Sign In</Text>
                                </Text>
                            </Pressable>
                        </Animated.View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </ScreenWrapper>
    );
}
