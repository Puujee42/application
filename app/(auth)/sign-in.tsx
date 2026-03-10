import {
    View, Text, TextInput, Pressable,
    KeyboardAvoidingView, Platform, StyleSheet, Easing,
} from 'react-native';
import { useState, useCallback, useRef, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Eye, EyeOff } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';
import * as Haptics from 'expo-haptics';
import Animated, {
    FadeInDown, FadeInUp,
    useSharedValue, useAnimatedStyle, withSpring,
    withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';
import { COLORS, SHADOWS, FONT } from '../../design-system/theme';

export default function SignInScreen() {
    const router = useRouter();
    const { login, isLoading } = useAuthStore();
    const { fetchProfile } = useUserStore();

    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    // ── Animated button scale ──
    const btnScale = useSharedValue(1);

    // ── Breathe animation for logo ──
    const breathe = useSharedValue(1);

    const logoStyle = useAnimatedStyle(() => ({
        transform: [{ scale: breathe.value }]
    }));

    const btnStyle = useAnimatedStyle(() => ({
        transform: [{ scale: btnScale.value }]
    }));

    useEffect(() => {
        breathe.value = withRepeat(
            withSequence(
                withTiming(1.04, { duration: 2800 }),
                withTiming(1, { duration: 2800 })
            ),
            -1,
            false
        );
    }, []);

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
        <SafeAreaView style={st.safe}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <View style={st.container}>
                    {/* ─── LOGO ─── */}
                    <Animated.View entering={FadeInUp.delay(100).duration(700)} style={st.logoSection}>
                        <Animated.View style={logoStyle}>
                            <LinearGradient
                                colors={[COLORS.goldBright, COLORS.gold]}
                                style={st.logoCircle}
                            >
                                <Text style={st.logoEmoji}>🔮</Text>
                            </LinearGradient>
                        </Animated.View>

                        <Text style={st.brandName}>ГЭВАБАЛ</Text>
                        <Text style={st.brandSub}>SANCTUARY</Text>

                        {/* Shimmer Line */}
                        <LinearGradient
                            colors={['transparent', COLORS.gold, 'transparent']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={st.shimmerLine}
                        />

                        <Text style={st.brandTagline}>Тавтай морил, нандин газарт</Text>
                    </Animated.View>

                    {/* ─── FORM CARD — iOS Settings grouped style ─── */}
                    <Animated.View entering={FadeInDown.delay(250).duration(700)} style={st.card}>
                        <Text style={st.cardTitle}>Нэвтрэх</Text>

                        {/* Error */}
                        {error ? (
                            <Animated.View entering={FadeInDown.duration(400)} style={st.errorBox}>
                                <Text style={st.errorText}>{error}</Text>
                            </Animated.View>
                        ) : null}

                        {/* Grouped inputs card */}
                        <View style={st.groupedCard}>
                            {/* Phone Row */}
                            <View style={st.phoneRow}>
                                <View style={st.phonePrefix}>
                                    <Text style={st.phonePrefixText}>+976</Text>
                                </View>
                                <TextInput
                                    value={phone}
                                    onChangeText={(t) => setPhone(formatPhoneNumber(t))}
                                    placeholder="99123456"
                                    placeholderTextColor={COLORS.textMute}
                                    keyboardType="phone-pad"
                                    maxLength={8}
                                    style={st.phoneInput}
                                />
                            </View>

                            {/* iOS inset divider */}
                            <View style={st.insetDivider} />

                            {/* Password Row */}
                            <View style={st.passwordRow}>
                                <TextInput
                                    value={password}
                                    onChangeText={setPassword}
                                    placeholder="Нууц үгээ оруулна уу"
                                    placeholderTextColor={COLORS.textMute}
                                    secureTextEntry={!showPassword}
                                    style={st.passwordInput}
                                />
                                <Pressable
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        setShowPassword(!showPassword);
                                    }}
                                    style={st.eyeBtn}

                                >
                                    {showPassword
                                        ? <EyeOff size={20} color={COLORS.gold} />
                                        : <Eye size={20} color={COLORS.gold} />
                                    }
                                </Pressable>
                            </View>
                        </View>

                        {/* Forgot password */}
                        <Pressable
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }}
                            style={st.forgotRow}

                        >
                            <Text style={st.forgotText}>Нууц үг мартсан?</Text>
                        </Pressable>

                        {/* Sign In Button — animated spring press */}
                        <Animated.View style={btnStyle}>
                            <Pressable
                                onPressIn={() => {
                                    btnScale.value = withSpring(0.97, { damping: 10, stiffness: 400 });
                                }}
                                onPressOut={() => {
                                    btnScale.value = withSpring(1.0, { damping: 10, stiffness: 400 });
                                }}
                                onPress={onSignIn}
                                disabled={isLoading}

                                style={{ opacity: isLoading ? 0.7 : 1 }}
                            >
                                <LinearGradient
                                    colors={[COLORS.goldBright, COLORS.gold, COLORS.amber]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={[st.primaryBtn, SHADOWS.glow]}
                                >
                                    <Text style={st.primaryBtnText}>
                                        {isLoading ? 'Нэвтэрч байна...' : 'НЭВТРЭХ →'}
                                    </Text>
                                </LinearGradient>
                            </Pressable>
                        </Animated.View>
                    </Animated.View>

                    {/* ─── BOTTOM SECTION ─── */}
                    <Animated.View entering={FadeInDown.delay(400).duration(700)} style={st.bottom}>
                        <Pressable
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                router.push('/(auth)/sign-up');
                            }}

                        >
                            <Text style={st.bottomLink}>
                                Бүртгэл байхгүй юу?{'  '}
                                <Text style={st.bottomLinkBold}>Бүртгүүлэх →</Text>
                            </Text>
                        </Pressable>

                        {/* Divider */}
                        <View style={st.dividerRow}>
                            <View style={st.dividerLine} />
                            <Text style={st.dividerText}>эсвэл</Text>
                            <View style={st.dividerLine} />
                        </View>

                        {/* Google Sign In */}
                        <Pressable
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }}
                            style={st.googleBtn}

                        >
                            <Text style={st.googleBtnText}>🌐  Google-ээр нэвтрэх</Text>
                        </Pressable>
                    </Animated.View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

// ─── STYLES ───────────────────────────────────────────
const st = StyleSheet.create({
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
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
        shadowColor: COLORS.amber,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.30,
        shadowRadius: 22,
        elevation: 10,
    },
    logoEmoji: {
        fontSize: 36,
    },
    brandName: {
        fontFamily: FONT.display,
        fontSize: 30,
        fontWeight: '900',
        color: COLORS.gold,
        letterSpacing: 7,
    },
    brandSub: {
        fontSize: 10,
        color: COLORS.textSub,
        letterSpacing: 5,
        marginTop: 2,
    },
    shimmerLine: {
        width: 80,
        height: 1.5,
        marginTop: 10,
        alignSelf: 'center',
    },
    brandTagline: {
        fontFamily: FONT.display,
        fontStyle: 'italic',
        fontSize: 12,
        color: COLORS.textMute,
        marginTop: 8,
    },

    /* Card */
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 24,
        ...SHADOWS.md,
    },
    cardTitle: {
        fontFamily: FONT.display,
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

    /* Grouped inputs (iOS Settings style) */
    groupedCard: {
        backgroundColor: COLORS.bgWarm,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: COLORS.border,
        overflow: 'hidden',
        padding: 0,
        marginBottom: 10,
    },
    phoneRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 15,
    },
    phonePrefix: {
        marginRight: 10,
    },
    phonePrefixText: {
        fontFamily: FONT.display,
        fontWeight: '700',
        fontSize: 14,
        color: COLORS.gold,
    },
    phoneInput: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        letterSpacing: 2,
        padding: 0,
    },
    insetDivider: {
        height: 1,
        backgroundColor: COLORS.divider,
        marginLeft: 52,
    },
    passwordRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 15,
    },
    passwordInput: {
        flex: 1,
        fontSize: 15,
        color: COLORS.text,
        fontWeight: '500',
        padding: 0,
    },
    eyeBtn: {
        paddingLeft: 10,
    },
    forgotRow: {
        alignItems: 'flex-end',
        marginTop: 4,
        marginBottom: 14,
    },
    forgotText: {
        fontSize: 12,
        color: COLORS.gold,
        fontWeight: '600',
    },

    /* Primary Button */
    primaryBtn: {
        borderRadius: 16,
        paddingVertical: 15,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.22)',
    },
    primaryBtnText: {
        color: '#1C0E00',
        fontFamily: FONT.display,
        fontWeight: '800',
        fontSize: 15,
        letterSpacing: 0.5,
    },

    /* Bottom */
    bottom: {
        marginTop: 28,
        alignItems: 'center',
    },
    bottomLink: {
        fontSize: 14,
        color: COLORS.textSub,
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
        backgroundColor: COLORS.divider,
    },
    dividerText: {
        marginHorizontal: 14,
        fontSize: 12,
        color: COLORS.textMute,
    },
    googleBtn: {
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: COLORS.gold,
        paddingVertical: 14,
        paddingHorizontal: 28,
        width: '100%',
        alignItems: 'center',
        backgroundColor: 'rgba(255,252,242,0.8)',
    },
    googleBtnText: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.gold,
    },
});
