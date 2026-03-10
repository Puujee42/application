import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, RefreshControl, ActivityIndicator, Platform, Pressable, FlatList, TouchableOpacity, Animated as RNAnimated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, MessageCircle, Video } from 'lucide-react-native';
import api from '../lib/api';
import { useUserStore } from '../store/userStore';
import * as Haptics from 'expo-haptics';
import { useIsAuthenticated } from '../hooks/useIsAuthenticated';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import TouchableScale from '../components/ui/TouchableScale';
import { COLORS, SHADOWS, FONT } from '../design-system/theme';

interface Booking {
    _id: string;
    monkId?: string;
    monkName?: string;
    clientName?: string;
    userName?: string;
    date: string;
    time?: string;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected';
    serviceName?: any;
    amount?: number;
    price?: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: 'Хүлээгдэж', color: '#92400E', bg: '#FEF3C7' },
    confirmed: { label: 'Баталгаажсан', color: '#065F46', bg: '#D1FAE5' },
    completed: { label: 'Дууссан', color: '#1E40AF', bg: '#DBEAFE' },
    cancelled: { label: 'Цуцлагдсан', color: '#991B1B', bg: '#FEE2E2' },
    rejected: { label: 'Татгалзсан', color: '#991B1B', bg: '#FEE2E2' },
};

function SkeletonCard() {
    const pulse = useRef(new RNAnimated.Value(0.35)).current;

    useEffect(() => {
        RNAnimated.loop(
            RNAnimated.sequence([
                RNAnimated.timing(pulse, { toValue: 0.75, duration: 900, useNativeDriver: true }),
                RNAnimated.timing(pulse, { toValue: 0.35, duration: 900, useNativeDriver: true })
            ])
        ).start();
    }, [pulse]);

    return (
        <RNAnimated.View style={[st.card, { opacity: pulse, paddingVertical: 24 }]}>
            <View style={{ width: '60%', height: 16, backgroundColor: COLORS.goldPale, borderRadius: 8, marginBottom: 12 }} />
            <View style={{ width: '40%', height: 12, backgroundColor: COLORS.goldPale, borderRadius: 6, marginBottom: 16 }} />
            <View style={{ width: '80%', height: 12, backgroundColor: COLORS.goldPale, borderRadius: 6 }} />
        </RNAnimated.View>
    );
}

export default function MyBookingsScreen() {
    const router = useRouter();
    const isAuthenticated = useIsAuthenticated();
    const { user: dbUser } = useUserStore();
    const [refreshing, setRefreshing] = useState(false);

    const userId = dbUser?._id?.toString() || dbUser?.clerkId;
    const isMonk = dbUser?.role === 'monk';

    const { data: bookings, isLoading, error, refetch } = useQuery({
        queryKey: ['bookings', userId, isMonk],
        queryFn: async () => {
            if (!userId) return [];
            const param = isMonk ? `monkId=${userId}` : `userId=${userId}`;
            const res = await api.get(`/bookings?${param}`);
            const data = Array.isArray(res.data) ? res.data : (res.data?.bookings || []);
            return data.sort((a: Booking, b: Booking) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
            );
        },
        enabled: !!userId && isAuthenticated,
    });

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    }, [refetch]);

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return `${d.getFullYear()} оны ${d.getMonth() + 1}-р сарын ${d.getDate()}`;
    };

    if (!isAuthenticated) {
        return (
            <View style={st.container}>
                <Stack.Screen options={{ headerShown: false }} />
                <SafeAreaView edges={['top']} style={st.center}>
                    <Text style={st.unauthText}>Нэвтрэх шаардлагатай</Text>
                    <TouchableScale onPress={() => router.push('/(auth)/sign-in')} >
                        <LinearGradient colors={[COLORS.goldBright, COLORS.gold, COLORS.amber]} style={[st.primaryBtn, SHADOWS.glow]}>
                            <Text style={st.primaryBtnText}>НЭВТРЭХ</Text>
                        </LinearGradient>
                    </TouchableScale>
                </SafeAreaView>
            </View>
        );
    }

    const renderBooking = ({ item, index }: { item: Booking; index: number }) => {
        const config = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
        const displayName = isMonk ? (item.clientName || item.userName || 'Хэрэглэгч') : (item.monkName || 'Үзмэрч');
        const serviceName = item.serviceName?.mn || item.serviceName?.en || item.serviceName || 'Үйлчилгээ';

        return (
            <Animated.View entering={FadeInDown.delay(Math.min(index * 80, 320)).duration(400)}>
                <View style={st.card}>
                    <View style={st.cardHeader}>
                        <View style={{ flex: 1 }}>
                            <Text style={st.cardTitle} numberOfLines={1}>{displayName}</Text>
                            <Text style={st.cardSub}>{serviceName}</Text>
                        </View>
                        <View style={[st.statusBadge, { backgroundColor: config.bg }]}>
                            <Text style={[st.statusText, { color: config.color }]}>{config.label}</Text>
                        </View>
                    </View>

                    <View style={st.divider} />

                    <View style={st.cardBody}>
                        <View style={{ flex: 1 }}>
                            <Text style={st.dateText}>{formatDate(item.date)} {item.time ? `• ${item.time} цаг` : ''}</Text>
                        </View>
                        {(item.amount || item.price) ? (
                            <Text style={st.priceText}>
                                {((item.amount || item.price) as number).toLocaleString()}₮
                            </Text>
                        ) : null}
                    </View>

                    {item.status === 'confirmed' && (
                        <View style={st.actionRow}>
                            <TouchableScale
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    router.push(`/chat/${item._id}`);
                                }}

                                style={st.chatBtn}
                            >
                                <MessageCircle size={16} color={COLORS.gold} />
                                <Text style={st.chatBtnText}>ЧАТ</Text>
                            </TouchableScale>

                            <TouchableScale
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                    router.push(`/live-session/${item._id}`);
                                }}

                                style={{ flex: 1 }}
                            >
                                <LinearGradient colors={[COLORS.goldBright, COLORS.gold, COLORS.amber]} style={[st.callBtn, SHADOWS.glow]}>
                                    <View style={st.btnShine} />
                                    <Video size={16} color="#1C0E00" />
                                    <Text style={st.callBtnText}>ДУУДЛАГА</Text>
                                </LinearGradient>
                            </TouchableScale>
                        </View>
                    )}
                </View>
            </Animated.View>
        );
    };

    return (
        <View style={st.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <SafeAreaView edges={['top']} style={{ flex: 1 }}>
                <View style={st.header}>
                    <TouchableScale
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            router.back();
                        }}
                        style={st.backBtn}

                    >
                        <ArrowLeft size={22} color={COLORS.text} />
                    </TouchableScale>
                    <Text style={st.headerTitle}>
                        {isMonk ? 'Миний уулзалтууд' : 'Миний захиалгууд'}
                    </Text>
                    <View style={{ width: 38 }} />
                </View>

                {error && (
                    <View style={st.errorBlock}>
                        <Text style={st.errorText}>⚠️ Мэдээлэл ачаалж чадсангүй</Text>
                        <TouchableScale onPress={() => refetch()} >
                            <Text style={st.errorAction}>Дахин оролдох</Text>
                        </TouchableScale>
                    </View>
                )}

                {isLoading ? (
                    <View style={{ padding: 20 }}>
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                    </View>
                ) : !bookings || bookings.length === 0 ? (
                    <View style={st.emptyState}>
                        <Text style={st.emptyEmoji}>📅</Text>
                        <Text style={st.emptyTitle}>Идэвхтэй уулзалт алга</Text>
                        <Text style={st.emptySub}>Шинэ захиалга үүсгэх эсвэл дараа шалгана уу</Text>
                    </View>
                ) : (
                    <FlatList
                        data={bookings}
                        keyExtractor={(item) => item._id}
                        renderItem={renderBooking}
                        contentContainerStyle={st.listContent}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.gold} />
                        }
                    />
                )}
            </SafeAreaView>
        </View>
    );
}

const st = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 12,
        borderBottomWidth: 1, borderBottomColor: COLORS.divider,
        backgroundColor: COLORS.bg,
    },
    backBtn: {
        width: 38, height: 38, borderRadius: 12,
        backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
        alignItems: 'center', justifyContent: 'center',
        ...SHADOWS.sm,
    },
    headerTitle: { fontFamily: FONT.display, fontSize: 22, fontWeight: '700', color: COLORS.text },

    unauthText: { fontFamily: FONT.display, fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 20 },
    primaryBtn: { borderRadius: 16, paddingVertical: 15, paddingHorizontal: 32, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' },
    primaryBtnText: { color: '#1C0E00', fontWeight: '800', fontSize: 15, letterSpacing: 0.5, fontFamily: FONT.display },

    listContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: Platform.OS === 'ios' ? 116 : 96 },

    card: {
        backgroundColor: COLORS.surface, borderRadius: 20,
        borderWidth: 1, borderColor: COLORS.border, padding: 18, marginBottom: 14, overflow: 'hidden',
        ...SHADOWS.md, elevation: 4,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    cardTitle: { fontFamily: FONT.display, fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
    cardSub: { fontSize: 13, color: COLORS.textSub },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 4 },
    statusText: { fontSize: 11, fontWeight: '700' },

    divider: { height: 1, backgroundColor: COLORS.divider, marginVertical: 14 },

    cardBody: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    dateText: { fontSize: 13, color: COLORS.textMute },
    priceText: { fontFamily: FONT.display, fontSize: 15, fontWeight: '800', color: COLORS.gold },

    actionRow: { flexDirection: 'row', gap: 10, marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: COLORS.divider },
    chatBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        backgroundColor: COLORS.surface, borderRadius: 16, paddingVertical: 14,
        borderWidth: 1.5, borderColor: COLORS.gold,
    },
    chatBtnText: { color: COLORS.gold, fontSize: 13, fontWeight: '700' },
    callBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        borderRadius: 16, paddingVertical: 14, minWidth: 120,
    },
    btnShine: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 16,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)'
    },
    callBtnText: { color: '#1C0E00', fontSize: 13, fontWeight: '800', fontFamily: FONT.display, letterSpacing: 0.5 },

    emptyState: { paddingVertical: 72, alignItems: 'center' },
    emptyEmoji: { fontSize: 56, marginBottom: 18 },
    emptyTitle: { fontFamily: FONT.display, fontSize: 17, fontWeight: '600', color: COLORS.textSub },
    emptySub: { fontSize: 13, color: COLORS.textMute, textAlign: 'center', marginTop: 6, lineHeight: 20 },

    errorBlock: {
        backgroundColor: 'rgba(220,38,38,0.06)', borderRadius: 16,
        borderWidth: 1, borderColor: 'rgba(220,38,38,0.15)',
        padding: 16, margin: 16, alignItems: 'center'
    },
    errorText: { color: '#DC2626', fontSize: 14, fontWeight: '600', marginBottom: 8 },
    errorAction: { color: COLORS.gold, fontWeight: '700' },
});
