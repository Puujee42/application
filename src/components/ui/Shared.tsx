import React, { useEffect, useRef } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Animated } from 'react-native';
import { COLORS, SHADOWS, FONT } from '../../../design-system/theme';
import { ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

// ── D. INPUT FIELD ───────────────────────────────────────────
export const SharedInput = (props: React.ComponentProps<typeof TextInput>) => {
    const [isFocused, setIsFocused] = React.useState(false);
    return (
        <TextInput
            {...props}
            onFocus={(e) => {
                setIsFocused(true);
                props.onFocus?.(e);
            }}
            onBlur={(e) => {
                setIsFocused(false);
                props.onBlur?.(e);
            }}
            placeholderTextColor={COLORS.textMute}
            style={[
                styles.input,
                isFocused && styles.inputFocused,
                props.style
            ]}
        />
    );
};

// ── E. SECTION HEADER ────────────────────────────────────────
export const SectionHeader = ({ title, onAllPress }: { title: string, onAllPress?: () => void }) => {
    return (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {onAllPress && (
                <Pressable onPress={onAllPress} style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}>
                    <Text style={styles.sectionLink}>Бүгд →</Text>
                </Pressable>
            )}
        </View>
    );
};

// ── F. DIVIDER (iOS inset style) ─────────────────────────────
export const InsetDivider = () => <View style={styles.insetDivider} />;

// ── G. STATUS BADGE ──────────────────────────────────────────
type StatusType = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected';
export const StatusBadge = ({ status }: { status: StatusType | string }) => {
    let bg = '#FEF3C7';
    let color = '#92400E';
    let text = 'Хүлээгдэж';

    switch (status) {
        case 'confirmed':
        case 'ACCEPTED':
            bg = '#D1FAE5'; color = '#065F46'; text = 'Баталгаажсан'; break;
        case 'completed':
        case 'COMPLETED':
            bg = '#DBEAFE'; color = '#1E40AF'; text = 'Дууссан'; break;
        case 'cancelled':
        case 'CANCELLED':
            bg = '#FEE2E2'; color = '#991B1B'; text = 'Цуцлагдсан'; break;
        case 'rejected':
        case 'REJECTED':
            bg = '#FEE2E2'; color = '#991B1B'; text = 'Татгалзсан'; break;
        default: break;
    }

    return (
        <View style={[styles.badge, { backgroundColor: bg }]}>
            <Text style={[styles.badgeText, { color }]}>{text}</Text>
        </View>
    );
};

// ── H. SKELETON LOADING ──────────────────────────────────────
export const SkeletonPulse = ({ style }: { style: any }) => {
    const pulse = useRef(new Animated.Value(0.35)).current;
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, { toValue: 0.75, duration: 900, useNativeDriver: true }),
                Animated.timing(pulse, { toValue: 0.35, duration: 900, useNativeDriver: true }),
            ])
        ).start();
    }, [pulse]);
    return <Animated.View style={[style, styles.skeleton, { opacity: pulse }]} />;
};

// ── I. EMPTY STATE ───────────────────────────────────────────
export const EmptyState = ({ emoji, title, subText }: { emoji: string, title: string, subText: string }) => (
    <View style={styles.emptyState}>
        <Text style={styles.emptyEmoji}>{emoji}</Text>
        <Text style={styles.emptyTitle}>{title}</Text>
        <Text style={styles.emptySub}>{subText}</Text>
    </View>
);

// ── J. BACK BUTTON ───────────────────────────────────────────
export const BackButton = ({ onPress, style }: { onPress?: () => void, style?: any }) => {
    const router = useRouter();
    return (
        <Pressable
            onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (onPress) onPress();
                else router.back();
            }}
            style={({ pressed }) => [styles.backButton, SHADOWS.sm, style, { opacity: pressed ? 0.8 : 1 }]}
        >
            <ChevronRight size={20} color={COLORS.text} style={{ transform: [{ rotate: '180deg' }] }} />
        </Pressable>
    );
};

const styles = StyleSheet.create({
    input: {
        backgroundColor: COLORS.bgWarm,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        color: COLORS.text,
    },
    inputFocused: {
        borderColor: COLORS.borderMed,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontFamily: FONT.display,
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
    },
    sectionLink: {
        fontSize: 13,
        color: COLORS.gold,
        fontWeight: '600',
    },
    insetDivider: {
        height: 1,
        backgroundColor: COLORS.divider,
        marginLeft: 52,
    },
    badge: {
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 4,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '700',
    },
    skeleton: {
        backgroundColor: COLORS.goldPale,
    },
    emptyState: {
        paddingVertical: 72,
        alignItems: 'center',
    },
    emptyEmoji: {
        fontSize: 56,
        marginBottom: 18,
    },
    emptyTitle: {
        fontFamily: FONT.display,
        fontSize: 17,
        fontWeight: '600',
        color: COLORS.textSub,
    },
    emptySub: {
        fontSize: 13,
        color: COLORS.textMute,
        textAlign: 'center',
        marginTop: 6,
        lineHeight: 20,
    },
    backButton: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: 'center',
        justifyContent: 'center',
    }
});
