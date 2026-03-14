import { View, Text, TextInput, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Image as RNImage } from 'react-native';
import { useState, useEffect, useRef, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, ArrowLeft, ImagePlus, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { getDirectMessages, sendDirectMessage, DirectMessage, getMonkById, uploadImageToCloudinary } from '../../lib/api';
import { useUserStore } from '../../store/userStore';
import TouchableScale from '../../components/ui/TouchableScale';

export default function DirectMessageScreen() {
    const { monkId } = useLocalSearchParams<{ monkId: string }>();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { user: dbUser } = useUserStore();
    
    const [text, setText] = useState('');
    const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    const currentUserId = dbUser?._id?.toString() || '';

    // Fetch conversation partner details (the Monk or user)
    const { data: monk } = useQuery({
        queryKey: ['monk', monkId],
        queryFn: () => getMonkById(monkId!),
        enabled: !!monkId,
    });

    const partnerNameObj = monk?.name;
    const partnerNameStr = typeof partnerNameObj === 'string' 
        ? partnerNameObj 
        : (partnerNameObj?.mn || partnerNameObj?.en || "Chat");

    // Fetch messages
    const { data: messages, isLoading } = useQuery({
        queryKey: ['direct-messages', monkId],
        queryFn: () => getDirectMessages(monkId!),
        enabled: !!monkId && !!currentUserId,
        refetchInterval: 3000,
    });

    // Send message mutation
    const sendMutation = useMutation({
        mutationFn: async ({ text, imageUrl }: { text: string; imageUrl?: string }) => {
            return sendDirectMessage(monkId!, text, imageUrl);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['direct-messages', monkId] });
            queryClient.invalidateQueries({ queryKey: ['recent-conversations'] });
            setText('');
            setSelectedImageUri(null);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        },
        onError: (err) => {
            console.error("Message send failed:", err);
            alert("Зурвас илгээхэд алдаа гарлаа");
        }
    });

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            alert('Зураг оруулахын тулд зөвшөөрөл шаардлагатай!');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            setSelectedImageUri(result.assets[0].uri);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    };

    const handleSend = async () => {
        const trimmed = text.trim();
        if ((!trimmed && !selectedImageUri) || sendMutation.isPending || isUploading) return;
        
        let uploadedImageUrl = undefined;
        
        if (selectedImageUri) {
            try {
                setIsUploading(true);
                uploadedImageUrl = await uploadImageToCloudinary(selectedImageUri);
            } catch (e) {
                console.error("Cloudinary upload error:", e);
                alert("Зураг хуулахад алдаа гарлаа");
                setIsUploading(false);
                return;
            } finally {
                setIsUploading(false);
            }
        }

        sendMutation.mutate({ text: trimmed, imageUrl: uploadedImageUrl });
    };

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

    const renderMessage = useCallback(({ item }: { item: DirectMessage }) => {
        const isMe = item.senderId === currentUserId;

        return (
            <View className={`mb-4 px-4 ${isMe ? 'items-end' : 'items-start'}`}>
                <View className={`max-w-[80%] rounded-2xl overflow-hidden ${isMe
                    ? 'bg-amber-600 rounded-tr-sm'
                    : 'bg-white border border-stone-100 rounded-tl-sm shadow-sm'
                    }`}>
                    
                    {item.imageUrl && (
                        <View className="w-full">
                            <Image 
                                source={{ uri: item.imageUrl }} 
                                style={{ width: 220, height: 220, backgroundColor: isMe ? '#d97706' : '#f5f5f4' }}
                                contentFit="cover"
                            />
                        </View>
                    )}
                    
                    {item.text ? (
                        <View className="px-4 py-3">
                            <Text className={`${isMe ? 'text-white' : 'text-stone-800'}`}>
                                {item.text}
                            </Text>
                            <Text className={`text-[10px] mt-1 text-right ${isMe ? 'text-white/70' : 'text-stone-400'}`}>
                                {formatTime(item.createdAt)}
                            </Text>
                        </View>
                    ) : (
                        <View className="px-3 py-1 bg-black/40 w-full absolute bottom-0">
                            <Text className={`text-[10px] text-right text-white`}>
                                {formatTime(item.createdAt)}
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        );
    }, [currentUserId]);

    return (
        <SafeAreaView className="flex-1 bg-[#FDFBF7]" edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View className="px-4 py-3 flex-row items-center border-b border-stone-200/60 bg-white/90 shadow-sm z-10" style={{ elevation: 2 }}>
                <TouchableScale
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.back();
                    }}
                    className="p-2 rounded-full active:bg-stone-100 mr-2"
                >
                    <ArrowLeft size={22} color="#291E14" />
                </TouchableScale>
                <View className="flex-row items-center flex-1">
                    {monk?.image ? (
                        <Image source={{ uri: monk.image }} style={{ width: 36, height: 36, borderRadius: 18, marginRight: 10, backgroundColor: '#f3f4f6' }} contentFit="cover" />
                    ) : (
                        <View className="w-9 h-9 rounded-full bg-amber-100 items-center justify-center mr-2">
                            <Text className="text-amber-800 font-bold">{partnerNameStr.charAt(0)}</Text>
                        </View>
                    )}
                    <View>
                        <Text className="text-lg font-serif font-bold text-[#291E14]">{partnerNameStr}</Text>
                        {monk?.isSpecial && <Text className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">Мастер Үзмэрч</Text>}
                    </View>
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
                        contentContainerStyle={{ paddingVertical: 16, paddingBottom: 24 }}
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View className="flex-1 items-center justify-center py-24 px-8">
                                <View className="w-16 h-16 rounded-full bg-amber-50 items-center justify-center mb-4">
                                    <Text className="text-2xl">👋</Text>
                                </View>
                                <Text className="text-[#544636] text-center font-serif text-base">
                                    {partnerNameStr}-тай хийх таны харилцаа эндээс эхэлнэ
                                </Text>
                            </View>
                        }
                    />
                )}

                {/* Input Area */}
                <View className="bg-white border-t border-stone-200/50 pt-2 pb-4 px-3 shadow-lg" style={{ elevation: 15 }}>
                    
                    {/* Selected Image Preview */}
                    {selectedImageUri && (
                        <View className="mb-3 px-2">
                            <View className="relative self-start">
                                <RNImage 
                                    source={{ uri: selectedImageUri }} 
                                    style={{ width: 100, height: 100, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' }} 
                                />
                                {isUploading && (
                                    <View className="absolute inset-0 bg-black/40 rounded-xl items-center justify-center">
                                        <ActivityIndicator color="white" />
                                    </View>
                                )}
                                <TouchableScale 
                                    onPress={() => !isUploading && setSelectedImageUri(null)}
                                    className="absolute -top-2 -right-2 bg-red-500 w-6 h-6 rounded-full items-center justify-center border-2 border-white shadow-sm"
                                >
                                    <X size={12} color="white" strokeWidth={3} />
                                </TouchableScale>
                            </View>
                        </View>
                    )}

                    <View className="flex-row items-end gap-2">
                        <TouchableScale
                            onPress={pickImage}
                            disabled={isUploading}
                            className="p-3 rounded-full bg-stone-100 self-end mb-1"
                        >
                            <ImagePlus size={22} color="#544636" />
                        </TouchableScale>

                        <TextInput
                            value={text}
                            onChangeText={setText}
                            placeholder="Зурвас бичих..."
                            placeholderTextColor="#9CA3AF"
                            className="flex-1 bg-stone-50 rounded-2xl px-4 py-3 pb-3 text-stone-800 max-h-28 min-h-[46px] border border-stone-200/60"
                            multiline
                            editable={!isUploading}
                        />

                        <TouchableScale
                            onPress={handleSend}
                            disabled={isUploading || (!text.trim() && !selectedImageUri)}
                            className={`w-11 h-11 rounded-full items-center justify-center self-end mb-1 ${
                                (text.trim() || selectedImageUri) && !isUploading 
                                    ? 'bg-amber-600' 
                                    : 'bg-stone-200'
                            }`}
                        >
                            {sendMutation.isPending || isUploading ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <Send size={18} color={(text.trim() || selectedImageUri) ? 'white' : '#9CA3AF'} style={{ marginLeft: 3 }} />
                            )}
                        </TouchableScale>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
