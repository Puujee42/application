import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Platform, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, Bell, Clock } from 'lucide-react-native';
import * as Notifications from 'expo-notifications';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import TouchableScale from '../components/ui/TouchableScale';
import { COLORS, SHADOWS } from '../design-system/theme';

const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';

interface NotificationItem {
    id: string;
    title: string;
    body: string;
    date: Date;
    isScheduled: boolean;
}

export default function NotificationsScreen() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const loadNotifications = useCallback(async () => {
        try {
            // Fetch scheduled notifications (Future)
            const scheduled = await Notifications.getAllScheduledNotificationsAsync();
            const scheduledItems: NotificationItem[] = scheduled.map(req => ({
                id: req.identifier,
                title: req.content.title || 'Мэдэгдэл',
                body: req.content.body || '',
                date: (req.trigger as any)?.value ? new Date((req.trigger as any).value) :
                    (req.trigger as any)?.date ? new Date((req.trigger as any).date) : new Date(),
                isScheduled: true,
            }));

            // Fetch presented notifications (Past)
            const presented = await Notifications.getPresentedNotificationsAsync();
            const presentedItems: NotificationItem[] = presented.map(req => ({
                id: req.request.identifier,
                title: req.request.content.title || 'Мэдэгдэл',
                body: req.request.content.body || '',
                date: new Date(req.date * 1000), // convert seconds to ms
                isScheduled: false,
            }));

            // Combine and sort (closest future first, then newest past)
            const allItems = [...scheduledItems, ...presentedItems].sort((a, b) => {
                if (a.isScheduled && !b.isScheduled) return -1;
                if (!a.isScheduled && b.isScheduled) return 1;
                if (a.isScheduled && b.isScheduled) return a.date.getTime() - b.date.getTime(); // closest future first
                return b.date.getTime() - a.date.getTime(); // newest past first
            });

            setNotifications(allItems);
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    }, []);

    useEffect(() => {
        loadNotifications();
    }, [loadNotifications]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadNotifications();
        setRefreshing(false);
    }, [loadNotifications]);

    const formatTime = (date: Date) => {
        const h = date.getHours().toString().padStart(2, '0');
        const m = date.getMinutes().toString().padStart(2, '0');
        const d = date.getDate();
        const mo = date.getMonth() + 1;
        return `${mo}/${d}   ${h}:${m}`;
    };

    const renderItem = ({ item, index }: { item: NotificationItem; index: number }) => (
        <Animated.View entering={FadeInDown.delay(index * 50).duration(400)}>
            <LinearGradient
                colors={item.isScheduled ? ['#FFFBEB', '#FEF3C7'] : ['#F9FAFB', '#F3F4F6']}
                style={[st.card, item.isScheduled && st.scheduledCard]}
            >
                <View style={st.iconContainer}>
                    <Bell size={20} color={item.isScheduled ? '#D97706' : '#9CA3AF'} />
                </View>
                <View style={st.contentContainer}>
                    <Text style={[st.title, item.isScheduled ? st.scheduledText : st.pastText]}>
                        {item.title}
                    </Text>
                    <Text style={st.body} numberOfLines={2}>
                        {item.body}
                    </Text>
                    <View style={st.timeRow}>
                        <Clock size={12} color={item.isScheduled ? '#D97706' : '#9CA3AF'} />
                        <Text style={[st.timeText, item.isScheduled && { color: '#D97706' }]}>
                            {item.isScheduled ? 'Хүлээгдэж байна' : 'Ирсэн'}: {formatTime(item.date)}
                        </Text>
                    </View>
                </View>
            </LinearGradient>
        </Animated.View>
    );

    return (
        <SafeAreaView style={st.container} edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* HEADERS */}
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
                <Text style={st.headerTitle}>Мэдэгдэл</Text>
                <View style={{ width: 44 }} />
            </View>

            <FlatList
                data={notifications}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={st.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={COLORS.gold}
                        colors={[COLORS.gold]}
                    />
                }
                ListEmptyComponent={
                    <View style={st.emptyState}>
                        <View style={st.emptyIconBg}>
                            <Bell size={32} color={COLORS.gold} />
                        </View>
                        <Text style={st.emptyTitle}>Мэдэгдэл алга</Text>
                        <Text style={st.emptySub}>
                            Танд одоогоор ирээдүйд хүлээгдэж буй эсвэл ирсэн мэдэгдэл алга байна.
                        </Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const st = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border,
        backgroundColor: COLORS.bg,
    },
    backBtn: {
        width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.85)',
        borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: { fontFamily: SERIF, fontSize: 18, fontWeight: '700', color: COLORS.text },
    listContent: { padding: 20, paddingBottom: 100 },
    card: {
        flexDirection: 'row', padding: 16, borderRadius: 20, marginBottom: 12,
        borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.card,
    },
    scheduledCard: {
        borderColor: '#FDE68A',
    },
    iconContainer: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.6)',
        alignItems: 'center', justifyContent: 'center', marginRight: 12,
    },
    contentContainer: { flex: 1, justifyContent: 'center' },
    title: { fontFamily: SERIF, fontSize: 16, fontWeight: '700', marginBottom: 4 },
    scheduledText: { color: '#92400E' },
    pastText: { color: '#374151' },
    body: { fontSize: 13, color: COLORS.textMid, lineHeight: 18, marginBottom: 8 },
    timeRow: { flexDirection: 'row', alignItems: 'center' },
    timeText: { fontSize: 11, color: '#9CA3AF', fontWeight: '500', marginLeft: 4 },
    emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
    emptyIconBg: {
        width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFFBEB',
        alignItems: 'center', justifyContent: 'center', marginBottom: 20,
    },
    emptyTitle: { fontFamily: SERIF, fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
    emptySub: { fontSize: 14, color: COLORS.textMid, textAlign: 'center', paddingHorizontal: 40, lineHeight: 22 },
});
