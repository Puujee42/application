import { View, Text, TextInput, FlatList, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useState, useEffect, useRef, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, ArrowLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { getChatMessages, sendChatMessage, ChatMessage } from '../../lib/api';
import { useUserStore } from '../../store/userStore';
import { useAuthStore } from '../../store/authStore';
import TouchableScale from '../../components/ui/TouchableScale';

export default function ChatScreen() {
    const { id: bookingId } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { user: dbUser } = useUserStore();
    const { customUser } = useAuthStore();
    const [text, setText] = useState('');
    const flatListRef = useRef<FlatList>(null);

    const currentUserId = dbUser?._id || '';
    const currentUserName = (() => {
        const name = (dbUser as any)?.name;
        if (name && typeof name === 'object') return name.en || name.mn || '';
        return `${dbUser?.firstName || customUser?.firstName || ''} ${dbUser?.lastName || customUser?.lastName || ''}`.trim() || 'User';
    })();

    // Fetch messages
    const { data: messages, isLoading } = useQuery({
        queryKey: ['chat', bookingId],
        queryFn: () => getChatMessages(bookingId!),
        enabled: !!bookingId,
        refetchInterval: 3000, // Poll every 3s like parent
    });

    // Send message mutation
    const sendMutation = useMutation({
        mutationFn: (msg: string) => sendChatMessage(bookingId!, msg, currentUserName),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['chat', bookingId] });
            setText('');
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        },
    });

    const handleSend = useCallback(() => {
        const trimmed = text.trim();
        if (!trimmed || sendMutation.isPending) return;
        sendMutation.mutate(trimmed);
    }, [text, sendMutation]);

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        if (messages?.length) {
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }
    }, [messages?.length]);

    const formatTime = (dateStr: string) => {
        try {
            const d = new Date(dateStr);
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch { return ''; }
    };

    const renderMessage = useCallback(({ item }: { item: ChatMessage }) => {
        const isMe = item.senderId === currentUserId;

        return (
            <View className={`mb-2 px-4 ${isMe ? 'items-end' : 'items-start'}`}>
                {!isMe && (
                    <Text className="text-xs text-stone-400 mb-1 ml-1">{item.senderName}</Text>
                )}
                <View className={`max-w-[80%] px-4 py-3 rounded-2xl ${isMe
                    ? 'bg-monk-primary rounded-br-md'
                    : 'bg-white border border-stone-100 rounded-bl-md'
                    }`}>
                    <Text className={`${isMe ? 'text-white' : 'text-stone-800'}`}>
                        {item.text}
                    </Text>
                    <Text className={`text-[10px] mt-1 ${isMe ? 'text-white/60' : 'text-stone-400'}`}>
                        {formatTime(item.createdAt)}
                    </Text>
                </View>
            </View>
        );
    }, [currentUserId]);

    return (
        <SafeAreaView className="flex-1 bg-monk-bg" edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View className="px-4 py-3 flex-row items-center border-b border-stone-100 bg-white">
                <TouchableScale
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.back();
                    }}
                    className="p-2 rounded-full active:bg-stone-100 mr-2"
                >
                    <ArrowLeft size={22} color="#0F172A" />
                </TouchableScale>
                <View className="flex-1">
                    <Text className="text-lg font-serif font-bold text-monk-primary">Chat</Text>
                    <Text className="text-xs text-monk-secondary">Booking messages</Text>
                </View>
            </View>

            <KeyboardAvoidingView
                className="flex-1"
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={0}
            >
                {/* Messages */}
                {isLoading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color="#D4AF37" />
                    </View>
                ) : (
                    <FlatList
                        ref={flatListRef}
                        data={messages || []}
                        renderItem={renderMessage}
                        keyExtractor={(item) => item._id || item.createdAt}
                        contentContainerStyle={{ paddingVertical: 16 }}
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
                        ListEmptyComponent={
                            <View className="flex-1 items-center justify-center py-20">
                                <Text className="text-monk-secondary text-center">
                                    No messages yet. Start a conversation!
                                </Text>
                            </View>
                        }
                    />
                )}

                {/* Input */}
                <View className="px-4 py-3 bg-white border-t border-stone-100">
                    <View className="flex-row items-end gap-2">
                        <TextInput
                            value={text}
                            onChangeText={setText}
                            placeholder="Type a message..."
                            placeholderTextColor="#9CA3AF"
                            className="flex-1 bg-stone-50 rounded-2xl px-4 py-3 text-stone-800 max-h-24 border border-stone-100"
                            multiline
                            onSubmitEditing={handleSend}
                            blurOnSubmit={false}
                        />
                        <TouchableScale
                            onPress={handleSend}
                            disabled={!text.trim() || sendMutation.isPending}
                            className={`w-11 h-11 rounded-full items-center justify-center ${text.trim() ? 'bg-monk-primary active:bg-amber-700' : 'bg-stone-200'
                                }`}
                        >
                            {sendMutation.isPending ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <Send size={18} color={text.trim() ? 'white' : '#9CA3AF'} />
                            )}
                        </TouchableScale>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
