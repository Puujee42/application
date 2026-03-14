import { View, Text, TextInput, Pressable, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { useUserStore } from '../store/userStore';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, Save, Camera } from 'lucide-react-native';
import { Image } from 'expo-image';
import { COLORS, SHADOWS } from '../design-system/theme';
import api, { uploadImageToCloudinary } from '../lib/api';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ScrollView } from 'react-native';

const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';

export default function EditMonkProfileScreen() {
    const router = useRouter();
    const { user: dbUser, fetchProfile } = useUserStore();

    const [form, setForm] = useState({
        nameMn: (dbUser as any)?.name?.mn || '',
        nameEn: (dbUser as any)?.name?.en || '',
        titleMn: (dbUser as any)?.title?.mn || '',
        titleEn: (dbUser as any)?.title?.en || '',
        bioMn: (dbUser as any)?.bio?.mn || '',
        bioEn: (dbUser as any)?.bio?.en || '',
        educationMn: (dbUser as any)?.education?.mn || '',
        educationEn: (dbUser as any)?.education?.en || '',
        philosophyMn: (dbUser as any)?.philosophy?.mn || '',
        philosophyEn: (dbUser as any)?.philosophy?.en || '',
        specialties: ((dbUser as any)?.specialties || []).join(', '),
        yearsOfExperience: (dbUser as any)?.yearsOfExperience?.toString() || '',
        video: (dbUser as any)?.video || '',
        phone: dbUser?.phone || '',
    });

    const [avatarUri, setAvatarUri] = useState<string | null>(dbUser?.avatar || (dbUser as any)?.image || null);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSave = async () => {
        if (!form.nameMn.trim()) {
            setError('Монгол нэрээ оруулна уу');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const payload = {
                name: { mn: form.nameMn.trim(), en: form.nameEn.trim() || form.nameMn.trim() },
                title: { mn: form.titleMn.trim(), en: form.titleEn.trim() },
                bio: { mn: form.bioMn.trim(), en: form.bioEn.trim() },
                education: { mn: form.educationMn.trim(), en: form.educationEn.trim() },
                philosophy: { mn: form.philosophyMn.trim(), en: form.philosophyEn.trim() },
                specialties: form.specialties.split(',').map((s: string) => s.trim()).filter(Boolean),
                yearsOfExperience: parseInt(form.yearsOfExperience) || 0,
                video: form.video.trim(),
                phone: form.phone.trim(),
                ...(avatarUri && { avatar: avatarUri, image: avatarUri }),
            };

            await api.patch(`/monks/${dbUser?._id}`, payload);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await fetchProfile(); // Refresh profile data globally
            router.back();
        } catch (err: any) {
            console.error('Failed to update monk profile:', err);
            setError(err.response?.data?.message || 'Профайл шинэчлэхэд алдаа гарлаа');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePickImage = async () => {
        try {
            const hasPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!hasPermission.granted) {
                setError('Зураг оруулах эрх шаардлагатай');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsUploading(true);
                setError(null);
                const uploadedUrl = await uploadImageToCloudinary(result.assets[0].uri);
                setAvatarUri(uploadedUrl);
            }
        } catch (err) {
            console.error('Image picker/upload error:', err);
            setError('Зураг хуулахад алдаа гарлаа');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFBEB' }} edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />
            {/* HEADERS */}
            <Animated.View entering={FadeInDown.springify().damping(14)} style={st.header}>
                <Pressable
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.back();
                    }}
                    style={({ pressed }) => [st.backBtn, { opacity: pressed ? 0.7 : 1 }]}
                >
                    <ArrowLeft size={22} color={COLORS.text} />
                </Pressable>
                <Text style={st.headerTitle}>Профайл засах</Text>
                <Pressable
                    onPress={handleSave}
                    disabled={isLoading}
                    style={({ pressed }) => [st.saveBtn, { opacity: pressed || isLoading ? 0.7 : 1 }]}
                >
                    {isLoading ? <ActivityIndicator size="small" color="#fff" /> : <Save size={20} color="#fff" />}
                </Pressable>
            </Animated.View>

            <ScrollView
                style={{ flex: 1, paddingHorizontal: 16 }}
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {error && (
                    <View style={st.errorBox}>
                        <Text style={st.errorText}>{error}</Text>
                    </View>
                )}

                <Animated.View entering={FadeInDown.delay(100).springify().damping(14)} style={{ alignItems: 'center', marginBottom: 20, marginTop: 10 }}>
                    <Pressable
                        onPress={handlePickImage}
                        disabled={isUploading}
                        style={({ pressed }) => [st.avatarContainer, { opacity: pressed || isUploading ? 0.7 : 1 }]}
                    >
                        <Image
                            source={{ uri: avatarUri || 'https://ui-avatars.com/api/?name=Monk&background=FDE68A&color=D97706' }}
                            style={{ width: 110, height: 110, borderRadius: 55 }}
                            contentFit="cover"
                        />
                        {isUploading && (
                            <View style={[StyleSheet.absoluteFill, st.uploadOverlay]}>
                                <ActivityIndicator color="#fff" />
                            </View>
                        )}
                        <View style={st.cameraIconContainer}>
                            <Camera size={16} color="#451a03" />
                        </View>
                    </Pressable>
                    <Text style={st.avatarLabel}>Зураг солих</Text>
                </Animated.View>

                <View>
                    <Text style={st.sectionTitle}>Ерөнхий мэдээлэл</Text>
                    <Animated.View entering={FadeInDown.delay(200).springify().damping(14)} style={st.card}>
                        <View style={st.inputGroup}>
                            <Text style={st.label}>Нэр (Монгол) *</Text>
                            <TextInput
                                style={st.input}
                                value={form.nameMn}
                                onChangeText={(v) => setForm(p => ({ ...p, nameMn: v }))}
                                placeholder="Өөрийн нэр..."
                                placeholderTextColor={COLORS.textMute}
                            />
                        </View>
                        <View style={st.divider} />
                        <View style={st.inputGroup}>
                            <Text style={st.label}>Нэр (Англи)</Text>
                            <TextInput
                                style={st.input}
                                value={form.nameEn}
                                onChangeText={(v) => setForm(p => ({ ...p, nameEn: v }))}
                                placeholder="Your name..."
                                placeholderTextColor={COLORS.textMute}
                            />
                        </View>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(300).springify().damping(14)} style={st.card}>
                        <View style={st.inputGroup}>
                            <Text style={st.label}>Цол (Монгол)</Text>
                            <TextInput
                                style={st.input}
                                value={form.titleMn}
                                onChangeText={(v) => setForm(p => ({ ...p, titleMn: v }))}
                                placeholder="Жишээ: Зурхайч..."
                                placeholderTextColor={COLORS.textMute}
                            />
                        </View>
                        <View style={st.divider} />
                        <View style={st.inputGroup}>
                            <Text style={st.label}>Цол (Англи)</Text>
                            <TextInput
                                style={st.input}
                                value={form.titleEn}
                                onChangeText={(v) => setForm(p => ({ ...p, titleEn: v }))}
                                placeholder="e.g. Astrologer..."
                                placeholderTextColor={COLORS.textMute}
                            />
                        </View>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(400).springify().damping(14)} style={st.card}>
                        <View style={[st.inputGroup, { paddingBottom: 16 }]}>
                            <Text style={st.label}>Намтар (Монгол)</Text>
                            <TextInput
                                style={[st.input, st.textArea]}
                                value={form.bioMn}
                                onChangeText={(v) => setForm(p => ({ ...p, bioMn: v }))}
                                placeholder="Өөрийн тухай товч..."
                                placeholderTextColor={COLORS.textMute}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                            />
                        </View>
                        <View style={st.divider} />
                        <View style={[st.inputGroup, { paddingBottom: 16 }]}>
                            <Text style={st.label}>Намтар (Англи)</Text>
                            <TextInput
                                style={[st.input, st.textArea]}
                                value={form.bioEn}
                                onChangeText={(v) => setForm(p => ({ ...p, bioEn: v }))}
                                placeholder="Brief bio..."
                                placeholderTextColor={COLORS.textMute}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                            />
                        </View>
                    </Animated.View>

                    <Text style={st.sectionTitle}>Боловсрол & Философи</Text>
                    <Animated.View entering={FadeInDown.delay(500).springify().damping(14)} style={st.card}>
                        <View style={[st.inputGroup, { paddingBottom: 16 }]}>
                            <Text style={st.label}>Боловсрол (Монгол)</Text>
                            <TextInput
                                style={[st.input, st.textArea]}
                                value={form.educationMn}
                                onChangeText={(v) => setForm(p => ({ ...p, educationMn: v }))}
                                placeholder="Боловсрол..."
                                placeholderTextColor={COLORS.textMute}
                                multiline
                                numberOfLines={3}
                                textAlignVertical="top"
                            />
                        </View>
                        <View style={st.divider} />
                        <View style={[st.inputGroup, { paddingBottom: 16 }]}>
                            <Text style={st.label}>Боловсрол (Англи)</Text>
                            <TextInput
                                style={[st.input, st.textArea]}
                                value={form.educationEn}
                                onChangeText={(v) => setForm(p => ({ ...p, educationEn: v }))}
                                placeholder="Education..."
                                placeholderTextColor={COLORS.textMute}
                                multiline
                                numberOfLines={3}
                                textAlignVertical="top"
                            />
                        </View>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(600).springify().damping(14)} style={st.card}>
                        <View style={[st.inputGroup, { paddingBottom: 16 }]}>
                            <Text style={st.label}>Философи (Монгол)</Text>
                            <TextInput
                                style={[st.input, st.textArea]}
                                value={form.philosophyMn}
                                onChangeText={(v) => setForm(p => ({ ...p, philosophyMn: v }))}
                                placeholder="Өмгөөлөх философи..."
                                placeholderTextColor={COLORS.textMute}
                                multiline
                                numberOfLines={3}
                                textAlignVertical="top"
                            />
                        </View>
                        <View style={st.divider} />
                        <View style={[st.inputGroup, { paddingBottom: 16 }]}>
                            <Text style={st.label}>Философи (Англи)</Text>
                            <TextInput
                                style={[st.input, st.textArea]}
                                value={form.philosophyEn}
                                onChangeText={(v) => setForm(p => ({ ...p, philosophyEn: v }))}
                                placeholder="Philosophy..."
                                placeholderTextColor={COLORS.textMute}
                                multiline
                                numberOfLines={3}
                                textAlignVertical="top"
                            />
                        </View>
                    </Animated.View>

                    <Text style={st.sectionTitle}>Дадлага & Нэмэлт</Text>
                    <Animated.View entering={FadeInDown.delay(700).springify().damping(14)} style={st.card}>
                        <View style={st.inputGroup}>
                            <Text style={st.label}>Мэргэшсэн чиглэлүүд</Text>
                            <TextInput
                                style={st.input}
                                value={form.specialties}
                                onChangeText={(v) => setForm(p => ({ ...p, specialties: v }))}
                                placeholder="Зурхай, засал, ... (таслалаар)"
                                placeholderTextColor={COLORS.textMute}
                            />
                        </View>
                        <View style={st.divider} />
                        <View style={st.inputGroup}>
                            <Text style={st.label}>Танилцуулгын Видео Линк</Text>
                            <TextInput
                                style={st.input}
                                value={form.video}
                                onChangeText={(v) => setForm(p => ({ ...p, video: v }))}
                                placeholder="https://youtube.com/..."
                                placeholderTextColor={COLORS.textMute}
                                autoCapitalize="none"
                            />
                        </View>
                        <View style={st.divider} />
                        <View style={st.inputGroup}>
                            <Text style={st.label}>Туршлага (Жил)</Text>
                            <TextInput
                                style={st.input}
                                value={form.yearsOfExperience}
                                onChangeText={(v) => setForm(p => ({ ...p, yearsOfExperience: v.replace(/[^0-9]/g, '') }))}
                                placeholder="0"
                                placeholderTextColor={COLORS.textMute}
                                keyboardType="number-pad"
                            />
                        </View>
                        <View style={st.divider} />
                        <View style={st.inputGroup}>
                            <Text style={st.label}>Утасны дугаар</Text>
                            <TextInput
                                style={st.input}
                                value={form.phone}
                                onChangeText={(v) => setForm(p => ({ ...p, phone: v }))}
                                placeholder="9911..."
                                placeholderTextColor={COLORS.textMute}
                                keyboardType="phone-pad"
                            />
                        </View>
                    </Animated.View>
                </View>
            </ScrollView>
        </SafeAreaView >
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
    saveBtn: {
        width: 44, height: 44, borderRadius: 14, backgroundColor: COLORS.gold, alignItems: 'center', justifyContent: 'center',
        ...SHADOWS.glow,
    },
    headerTitle: { fontFamily: SERIF, fontSize: 18, fontWeight: '700', color: COLORS.text },
    errorBox: {
        backgroundColor: '#FEF2F2', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#FECACA', marginBottom: 20,
    },
    errorText: { color: '#DC2626', fontSize: 14, textAlign: 'center', fontWeight: '600' },
    avatarContainer: {
        width: 110, height: 110, borderRadius: 55, backgroundColor: 'rgba(255, 255, 255, 0.6)',
        borderWidth: 3, borderColor: COLORS.gold, ...SHADOWS.glow, marginBottom: 12,
        alignItems: 'center', justifyContent: 'center'
    },
    avatar: { width: '100%', height: '100%', borderRadius: 55 },
    uploadOverlay: { backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 55, alignItems: 'center', justifyContent: 'center' },
    cameraIconContainer: {
        position: 'absolute', bottom: 0, right: 0, backgroundColor: COLORS.bg,
        width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
        borderWidth: 2, borderColor: '#FFFBEB'
    },
    avatarLabel: { fontFamily: SERIF, fontSize: 14, fontWeight: '600', color: COLORS.textSub },
    sectionTitle: { fontSize: 13, fontWeight: '800', color: COLORS.textSub, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12, marginLeft: 6, marginTop: 10 },
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: 24, padding: 6, marginBottom: 24,
        borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm,
    },
    inputGroup: { paddingHorizontal: 12, paddingTop: 14, paddingBottom: 6 },
    label: { fontSize: 11, fontWeight: '700', color: COLORS.textMute, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
    input: { fontFamily: SERIF, fontSize: 16, color: COLORS.text, padding: 0 },
    textArea: { height: 100 },
    divider: { height: 1, backgroundColor: COLORS.border, marginHorizontal: 12, marginVertical: 4 },
});
