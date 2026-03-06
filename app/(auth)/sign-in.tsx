import {
    View, Text, TextInput, Pressable,
    KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import { useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Eye, EyeOff } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { COLORS, SHADOWS } from '../../design-system/theme';

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
            setError('Утасны дугаар болон нууц үгээ оруулна уу');
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
            if (err.message?.includes('холбогдож')) {
                setError('Серверт холбогдож чадсангүй. Интернэт холболтоо шалгана уу.');
            } else {
                setError(err.message || 'Нэвтрэхэд алдаа гарлаа');
            }
        }
    }, [phone, password, login, fetchProfile, router]);

    return (
        <SafeAreaView style={styles.safe}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <View style={styles.container}>
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
                        <Text style={styles.cardTitle}>Нэвтрэх</Text>

                        {/* Error */}
                        {error ? (
                            <Animated.View entering={FadeInDown.duration(400)} style={styles.errorBox}>
                                <Text style={styles.errorText}>{error}</Text>
                            </Animated.View>
                        ) : null}

                        {/* Phone Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Утасны дугаар</Text>
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

                        {/* Password Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Нууц үг</Text>
                            <View style={styles.passwordRow}>
                                <TextInput
                                    value={password}
                                    onChangeText={setPassword}
                                    placeholder="Нууц үгээ оруулна уу"
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
                            <Pressable
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    // TODO: forgot password flow
                                }}
                                style={styles.forgotRow}
                            >
                                <Text style={styles.forgotText}>Нууц үг мартсан?</Text>
                            </Pressable>
                        </View>

                        {/* Sign In Button */}
                        <Pressable
                            onPress={onSignIn}
                            disabled={isLoading}
                            style={{ opacity: isLoading ? 0.7 : 1 }}
                        >
                            <LinearGradient
                                colors={[COLORS.gold, COLORS.deepGold]}
                                style={[styles.primaryBtn, SHADOWS.gold]}
                            >
                                <Text style={styles.primaryBtnText}>
                                    {isLoading ? 'Нэвтэрч байна...' : 'НЭВТРЭХ →'}
                                </Text>
                            </LinearGradient>
                        </Pressable>
                    </Animated.View>

                    {/* ─── BOTTOM SECTION ─── */}
                    <Animated.View entering={FadeInDown.delay(400).duration(700)} style={styles.bottom}>
                        <Pressable
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                router.push('/(auth)/sign-up');
                            }}
                        >
                            <Text style={styles.bottomLink}>
                                Бүртгэл байхгүй юу?{' '}
                                <Text style={styles.bottomLinkBold}>Бүртгүүлэх</Text>
                            </Text>
                        </Pressable>

                        {/* Divider */}
                        <View style={styles.dividerRow}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>эсвэл</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        {/* Google Sign In */}
                        <Pressable
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                // TODO: Google OAuth
                            }}
                            style={styles.googleBtn}
                        >
                            <Text style={styles.googleBtnText}>🌐  Google-ээр нэвтрэх</Text>
                        </Pressable>
                    </Animated.View>
                </View>
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
    container: {
        flex: 1,
        paddingHorizontal: 24,
        justifyContent: 'center',
    },

    /* Logo */
    logoSection: {
        alignItems: 'center',
        marginBottom: 28,
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
        marginBottom: 18,
    },
    label: {
        fontFamily: 'Georgia',
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.textMid,
        marginBottom: 8,
        marginLeft: 2,
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
        paddingVertical: 15,
        fontSize: 16,
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
        paddingVertical: 15,
        fontSize: 15,
        color: COLORS.text,
        fontWeight: '500',
    },
    eyeBtn: {
        paddingHorizontal: 14,
        paddingVertical: 15,
    },
    forgotRow: {
        alignItems: 'flex-end',
        marginTop: 8,
    },
    forgotText: {
        fontSize: 12,
        color: COLORS.gold,
        fontWeight: '600',
    },

    /* Primary Button */
    primaryBtn: {
        borderRadius: 18,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 6,
    },
    primaryBtnText: {
        color: '#1A0800',
        fontWeight: '800',
        fontSize: 15,
        letterSpacing: 1.5,
    },

    /* Bottom */
    bottom: {
        marginTop: 28,
        alignItems: 'center',
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
