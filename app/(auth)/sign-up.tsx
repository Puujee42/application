import {
    View, Text, TextInput, Pressable,
    KeyboardAvoidingView, Platform, ScrollView, StyleSheet,
} from 'react-native';
import { useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Eye, EyeOff, Calendar } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { COLORS, SHADOWS } from '../../design-system/theme';

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
            setError('Нэрээ оруулна уу');
            return false;
        }
        if (!lastName.trim()) {
            setError('Овгоо оруулна уу');
            return false;
        }
        if (!phone || phone.length < 8) {
            setError('8 оронтой утасны дугаар оруулна уу');
            return false;
        }
        if (!password || password.length < 6) {
            setError('Нууц үг хамгийн багадаа 6 тэмдэгт байна');
            return false;
        }
        if (password !== confirmPassword) {
            setError('Нууц үг таарахгүй байна');
            return false;
        }
        if (email && !email.includes('@')) {
            setError('Зөв имэйл хаяг оруулна уу');
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
            setError(err.message || 'Бүртгэхэд алдаа гарлаа');
        }
    }, [phone, email, firstName, lastName, dateOfBirth, zodiacYear, password, confirmPassword, signup, fetchProfile, router]);

    return (
        <SafeAreaView style={styles.safe}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={styles.scroll}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* ─── LOGO ─── */}
                    <Animated.View entering={FadeInUp.delay(100).duration(700)} style={styles.logoSection}>
                        <LinearGradient
                            colors={[COLORS.gold, COLORS.deepGold]}
                            style={styles.logoCircle}
                        >
                            <Text style={styles.logoEmoji}>🔮</Text>
                        </LinearGradient>

                        <Text style={styles.brandName}>ГЭВАБАЛ</Text>
                        <Text style={styles.brandSub}>SANCTUARY</Text>
                        <Text style={styles.brandTagline}>Тавтай морил, нандин газарт</Text>
                    </Animated.View>

                    {/* ─── FORM CARD ─── */}
                    <Animated.View entering={FadeInDown.delay(250).duration(700)} style={styles.card}>
                        <Text style={styles.cardTitle}>Бүртгүүлэх</Text>

                        {/* Error */}
                        {error ? (
                            <Animated.View entering={FadeInDown.duration(400)} style={styles.errorBox}>
                                <Text style={styles.errorText}>{error}</Text>
                            </Animated.View>
                        ) : null}

                        {/* Name Fields */}
                        <View style={styles.nameRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>Овог *</Text>
                                <TextInput
                                    value={lastName}
                                    onChangeText={setLastName}
                                    placeholder="Овог"
                                    placeholderTextColor={COLORS.textLight}
                                    autoCapitalize="words"
                                    style={styles.textInput}
                                />
                            </View>
                            <View style={{ width: 12 }} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>Нэр *</Text>
                                <TextInput
                                    value={firstName}
                                    onChangeText={setFirstName}
                                    placeholder="Нэр"
                                    placeholderTextColor={COLORS.textLight}
                                    autoCapitalize="words"
                                    style={styles.textInput}
                                />
                            </View>
                        </View>

                        {/* Phone */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Утасны дугаар *</Text>
                            <View style={styles.phoneRow}>
                                <View style={styles.phonePrefix}>
                                    <Text style={styles.phonePrefixText}>+976</Text>
                                </View>
                                <TextInput
                                    value={phone}
                                    onChangeText={(t) => setPhone(formatPhoneNumber(t))}
                                    placeholder="99123456"
                                    placeholderTextColor={COLORS.textLight}
                                    keyboardType="phone-pad"
                                    maxLength={8}
                                    style={styles.phoneInput}
                                />
                            </View>
                        </View>

                        {/* Email */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Имэйл (заавал биш)</Text>
                            <TextInput
                                value={email}
                                onChangeText={setEmail}
                                placeholder="your@email.com"
                                placeholderTextColor={COLORS.textLight}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                style={styles.textInput}
                            />
                        </View>

                        {/* Date of Birth */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Төрсөн огноо (заавал биш)</Text>
                            <View style={styles.dateRow}>
                                <View style={styles.dateIcon}>
                                    <Calendar size={18} color={COLORS.gold} />
                                </View>
                                <TextInput
                                    value={dateOfBirth}
                                    onChangeText={(t) => setDateOfBirth(formatDateInput(t))}
                                    placeholder="YYYY-MM-DD"
                                    placeholderTextColor={COLORS.textLight}
                                    keyboardType="number-pad"
                                    maxLength={10}
                                    style={styles.dateInput}
                                />
                            </View>
                        </View>

                        {/* Zodiac Year */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Жилийн амьтан (заавал биш)</Text>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ paddingRight: 20 }}
                                style={{ marginTop: 4 }}
                            >
                                {ZODIAC_ANIMALS.map((animal) => {
                                    const isSelected = zodiacYear === animal.en;
                                    return (
                                        <Pressable
                                            key={animal.en}
                                            onPress={() => {
                                                Haptics.selectionAsync();
                                                setZodiacYear(isSelected ? '' : animal.en);
                                            }}
                                            style={[
                                                styles.zodiacChip,
                                                isSelected && styles.zodiacChipActive,
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.zodiacChipText,
                                                    isSelected && styles.zodiacChipTextActive,
                                                ]}
                                            >
                                                {animal.mn}
                                            </Text>
                                        </Pressable>
                                    );
                                })}
                            </ScrollView>
                        </View>

                        {/* Password */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Нууц үг *</Text>
                            <View style={styles.passwordRow}>
                                <TextInput
                                    value={password}
                                    onChangeText={setPassword}
                                    placeholder="Хамгийн багадаа 6 тэмдэгт"
                                    placeholderTextColor={COLORS.textLight}
                                    secureTextEntry={!showPassword}
                                    style={styles.passwordInput}
                                />
                                <Pressable
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        setShowPassword(!showPassword);
                                    }}
                                    style={styles.eyeBtn}
                                >
                                    {showPassword
                                        ? <EyeOff size={20} color={COLORS.gold} />
                                        : <Eye size={20} color={COLORS.gold} />
                                    }
                                </Pressable>
                            </View>
                        </View>

                        {/* Confirm Password */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Нууц үг давтах *</Text>
                            <TextInput
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                placeholder="Нууц үгээ дахин оруулна уу"
                                placeholderTextColor={COLORS.textLight}
                                secureTextEntry={!showPassword}
                                style={styles.textInput}
                            />
                        </View>

                        {/* Sign Up Button */}
                        <Pressable
                            onPress={onSignUp}
                            disabled={isLoading}
                            style={{ opacity: isLoading ? 0.7 : 1, marginTop: 6 }}
                        >
                            <LinearGradient
                                colors={[COLORS.gold, COLORS.deepGold]}
                                style={[styles.primaryBtn, SHADOWS.gold]}
                            >
                                <Text style={styles.primaryBtnText}>
                                    {isLoading ? 'Бүртгэж байна...' : 'БҮРТГҮҮЛЭХ →'}
                                </Text>
                            </LinearGradient>
                        </Pressable>
                    </Animated.View>

                    {/* ─── BOTTOM SECTION ─── */}
                    <Animated.View entering={FadeInDown.delay(400).duration(700)} style={styles.bottom}>
                        <Pressable
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                router.push('/(auth)/sign-in');
                            }}
                        >
                            <Text style={styles.bottomLink}>
                                Бүртгэлтэй юу?{' '}
                                <Text style={styles.bottomLinkBold}>Нэвтрэх</Text>
                            </Text>
                        </Pressable>

                        {/* Divider */}
                        <View style={styles.dividerRow}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>эсвэл</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        {/* Google Sign Up */}
                        <Pressable
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                // TODO: Google OAuth
                            }}
                            style={styles.googleBtn}
                        >
                            <Text style={styles.googleBtnText}>🌐  Google-ээр бүртгүүлэх</Text>
                        </Pressable>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

// ─── STYLES ───────────────────────────────────────────
const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },
    scroll: {
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 40,
    },

    /* Logo */
    logoSection: {
        alignItems: 'center',
        marginBottom: 22,
    },
    logoCircle: {
        width: 76,
        height: 76,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
    },
    logoEmoji: {
        fontSize: 36,
    },
    brandName: {
        fontFamily: 'Georgia',
        fontSize: 28,
        fontWeight: '900',
        color: COLORS.gold,
        letterSpacing: 6,
    },
    brandSub: {
        fontSize: 10,
        color: COLORS.textLight,
        letterSpacing: 5,
        marginTop: 2,
    },
    brandTagline: {
        fontFamily: 'Georgia',
        fontStyle: 'italic',
        fontSize: 12,
        color: COLORS.textMid,
        marginTop: 8,
    },

    /* Card */
    card: {
        backgroundColor: 'rgba(255,255,255,0.92)',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 24,
        ...SHADOWS.card,
    },
    cardTitle: {
        fontFamily: 'Georgia',
        fontSize: 22,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 20,
        textAlign: 'center',
    },

    /* Error */
    errorBox: {
        backgroundColor: '#FEE2E2',
        borderWidth: 1,
        borderColor: '#FCA5A5',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
    },
    errorText: {
        color: COLORS.error,
        fontSize: 13,
        textAlign: 'center',
        fontWeight: '500',
    },

    /* Inputs */
    inputGroup: {
        marginBottom: 16,
    },
    nameRow: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    label: {
        fontFamily: 'Georgia',
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.textMid,
        marginBottom: 8,
        marginLeft: 2,
    },
    textInput: {
        backgroundColor: COLORS.bgWarm,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        color: COLORS.text,
        fontWeight: '500',
    },
    phoneRow: {
        flexDirection: 'row',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: COLORS.border,
        overflow: 'hidden',
    },
    phonePrefix: {
        backgroundColor: 'rgba(200,146,10,0.08)',
        paddingHorizontal: 16,
        justifyContent: 'center',
        borderRightWidth: 1,
        borderRightColor: COLORS.border,
    },
    phonePrefixText: {
        fontFamily: 'Georgia',
        fontWeight: '700',
        fontSize: 14,
        color: COLORS.gold,
    },
    phoneInput: {
        flex: 1,
        backgroundColor: COLORS.bgWarm,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        letterSpacing: 2,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: COLORS.border,
        overflow: 'hidden',
    },
    dateIcon: {
        backgroundColor: 'rgba(200,146,10,0.08)',
        paddingHorizontal: 14,
        paddingVertical: 14,
        borderRightWidth: 1,
        borderRightColor: COLORS.border,
    },
    dateInput: {
        flex: 1,
        backgroundColor: COLORS.bgWarm,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.text,
        letterSpacing: 2,
    },
    passwordRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.bgWarm,
        overflow: 'hidden',
    },
    passwordInput: {
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        color: COLORS.text,
        fontWeight: '500',
    },
    eyeBtn: {
        paddingHorizontal: 14,
        paddingVertical: 14,
    },

    /* Zodiac */
    zodiacChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: 'rgba(255,255,255,0.6)',
        marginRight: 8,
    },
    zodiacChipActive: {
        backgroundColor: COLORS.goldPale,
        borderColor: COLORS.gold,
        ...SHADOWS.gold,
    },
    zodiacChipText: {
        fontSize: 11,
        fontWeight: '600',
        color: COLORS.textLight,
        letterSpacing: 1,
    },
    zodiacChipTextActive: {
        color: COLORS.deepGold,
        fontWeight: '700',
    },

    /* Primary Button */
    primaryBtn: {
        borderRadius: 18,
        paddingVertical: 16,
        alignItems: 'center',
    },
    primaryBtnText: {
        color: '#1A0800',
        fontWeight: '800',
        fontSize: 15,
        letterSpacing: 1.5,
    },

    /* Bottom */
    bottom: {
        marginTop: 24,
        alignItems: 'center',
        paddingBottom: 20,
    },
    bottomLink: {
        fontSize: 14,
        color: COLORS.textMid,
    },
    bottomLinkBold: {
        color: COLORS.gold,
        fontWeight: '700',
    },
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 18,
        width: '100%',
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: COLORS.border,
    },
    dividerText: {
        marginHorizontal: 14,
        fontSize: 12,
        color: COLORS.textLight,
    },
    googleBtn: {
        borderRadius: 18,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        paddingVertical: 14,
        paddingHorizontal: 28,
        width: '100%',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.7)',
    },
    googleBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textMid,
    },
});
