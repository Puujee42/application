import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { MessageCircle, Star } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { getRecentConversations } from '../../lib/api';
import { useUserStore } from '../../store/userStore';
import { useAuthStore } from '../../store/authStore';
import { useUser } from '../../lib/useClerkSafe';
import { COLORS, SHADOWS, FONT } from '../../design-system/theme';
import TouchableScale from '../../components/ui/TouchableScale';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function MessagesTabScreen() {
    const router = useRouter();
    const { user: clerkUser } = useUser();
    const { user: dbUser } = useUserStore();
    const { customUser } = useAuthStore();

    const { data: recentChats, isLoading, refetch } = useQuery({
        queryKey: ['recent-conversations'],
        queryFn: getRecentConversations,
        enabled: !!dbUser || !!customUser || !!clerkUser,
    });

    const formatTime = (dateStr: string) => {
        try {
            const d = new Date(dateStr);
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch { return ''; }
    };

    return (
        <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                {/* Header */}
                <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20 }}>
                    <Text style={{ fontSize: 24, fontWeight: '800', fontFamily: FONT.display, color: COLORS.text }}>
                        Зурвас
                    </Text>
                </View>

                {isLoading ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator color={COLORS.gold} size="large" />
                    </View>
                ) : !recentChats || recentChats.length === 0 ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 }}>
                        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.goldPale, justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
                            <MessageCircle size={40} color={COLORS.gold} />
                        </View>
                        <Text style={{ fontSize: 18, fontWeight: '700', fontFamily: FONT.display, color: COLORS.text, marginBottom: 8, textAlign: 'center' }}>
                            Одоогоор зурвас алга
                        </Text>
                        <Text style={{ fontSize: 13, color: COLORS.textMute, textAlign: 'center', lineHeight: 20 }}>
                            Та аль нэг үзмэрчийн профайл руу орж шууд зурвас бичин харилцах боломжтой.
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={recentChats}
                        keyExtractor={(item) => item.partnerId}
                        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
                        showsVerticalScrollIndicator={false}
                        refreshing={isLoading}
                        onRefresh={refetch}
                        renderItem={({ item, index }) => (
                            <Animated.View entering={FadeInDown.delay(index * 100).duration(500)}>
                                <TouchableScale
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        router.push(`/messages/${item.partnerId}`);
                                    }}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        backgroundColor: COLORS.surface,
                                        borderRadius: 20,
                                        padding: 16,
                                        marginBottom: 12,
                                        borderWidth: 1,
                                        borderColor: COLORS.border,
                                        ...SHADOWS.sm
                                    }}
                                >
                                    <View style={{ position: 'relative', marginRight: 16 }}>
                                        <Image
                                            source={{ uri: item.partner?.image || 'https://via.placeholder.com/150' }}
                                            style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.goldPale }}
                                            contentFit="cover"
                                        />
                                        {item.partner?.isSpecial && (
                                            <View style={{ position: 'absolute', bottom: -2, right: -2, width: 20, height: 20, borderRadius: 10, backgroundColor: COLORS.gold, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.surface }}>
                                                <Star size={10} color="#FFF" fill="#FFF" />
                                            </View>
                                        )}
                                    </View>
                                    
                                    <View style={{ flex: 1 }}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                            <Text style={{ fontSize: 16, fontWeight: '700', fontFamily: FONT.display, color: COLORS.text }} numberOfLines={1}>
                                                {item.partner?.name || 'Unknown'}
                                            </Text>
                                            <Text style={{ fontSize: 11, color: COLORS.textMute }}>
                                                {formatTime(item.lastMessage.createdAt)}
                                            </Text>
                                        </View>
                                        <Text style={{ fontSize: 13, color: COLORS.textSub }} numberOfLines={1}>
                                            {item.lastMessage.senderId === (dbUser?._id?.toString() || '') ? 'Та: ' : ''}
                                            {item.lastMessage.text ? item.lastMessage.text : '📷 Зураг'}
                                        </Text>
                                    </View>
                                </TouchableScale>
                            </Animated.View>
                        )}
                    />
                )}
            </SafeAreaView>
        </View>
    );
}
