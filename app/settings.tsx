import { View, Text, ScrollView, Pressable, Switch, Platform, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Globe, Bell, Info, ChevronRight, ArrowLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Constants from 'expo-constants';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';

export default function SettingsScreen() {
    const { i18n } = useTranslation();
    const router = useRouter();
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    const currentLanguage = i18n.language;

    const languages = [
        { code: 'en', name: 'English' },
        { code: 'mn', name: 'Монгол' },
        { code: 'de', name: 'Deutsch' },
    ];

    const handleLanguageChange = async (langCode: string) => {
        Haptics.selectionAsync();
        await i18n.changeLanguage(langCode);
    };

    const handleNotificationToggle = (value: boolean) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setNotificationsEnabled(value);
        // TODO: Update notification preferences in backend
    };

    const SectionHeader = ({ icon: Icon, title }: { icon: any, title: string }) => (
        <View className="flex-row items-center mb-4 px-2">
            <View className="w-8 h-8 rounded-full bg-[#D4AF37]/10 items-center justify-center border border-[#D4AF37]/20">
                <Icon size={16} color="#D4AF37" />
            </View>
            <Text className="text-xs font-bold text-[#D4AF37] uppercase tracking-[2px] ml-3">
                {title}
            </Text>
        </View>
    );

    return (
        <View className="flex-1 bg-[#FDFBF7]">
            <Stack.Screen options={{ headerShown: false }} />

            {/* Premium Header */}
            <SafeAreaView edges={['top']} className="bg-[#FDFBF7] z-10 pb-4 shadow-sm" style={{ shadowColor: '#D4AF37', shadowOpacity: 0.05, shadowRadius: 10 }}>
                <View className="px-6 py-4 flex-row items-center border-b border-[#E8E0D5]/50">
                    <TouchableOpacity
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            router.back();
                        }}
                        className="w-10 h-10 bg-white/80 rounded-full items-center justify-center border border-[#E8E0D5] shadow-sm"
                    >
                        <ArrowLeft size={20} color="#291E14" />
                    </TouchableOpacity>
                    <Text className="text-2xl font-serif font-bold text-[#291E14] ml-5 tracking-tight flex-1">
                        Settings
                    </Text>
                </View>
            </SafeAreaView>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Language Section */}
                <Animated.View entering={FadeInDown.delay(100).duration(500)} className="mt-6 px-6">
                    <SectionHeader icon={Globe} title="Language Resonance" />

                    <View className="bg-white/60 rounded-[24px] overflow-hidden border border-white/80 shadow-lg backdrop-blur-xl" style={{ shadowColor: '#D4AF37', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 3 }}>
                        {languages.map((lang, index) => (
                            <Pressable
                                key={lang.code}
                                onPress={() => handleLanguageChange(lang.code)}
                                className={`flex-row items-center justify-between px-6 py-5 ${index < languages.length - 1 ? 'border-b border-[#E8E0D5]/50' : ''
                                    }`}
                            >
                                <Text className={`text-base font-medium ${currentLanguage === lang.code ? 'text-[#291E14] font-bold' : 'text-[#A89F91]'}`}>{lang.name}</Text>
                                {currentLanguage === lang.code && (
                                    <Animated.View entering={FadeInRight.duration(300)} className="w-3 h-3 bg-[#D4AF37] rounded-full shadow-sm" style={{ shadowColor: '#D4AF37', shadowRadius: 6, shadowOpacity: 0.5 }} />
                                )}
                            </Pressable>
                        ))}
                    </View>
                </Animated.View>

                {/* Notifications Section */}
                <Animated.View entering={FadeInDown.delay(200).duration(500)} className="mt-8 px-6">
                    <SectionHeader icon={Bell} title="Aural Guidance" />

                    <View className="bg-white/60 rounded-[24px] overflow-hidden border border-white/80 shadow-lg backdrop-blur-xl px-6 py-5" style={{ shadowColor: '#D4AF37', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 3 }}>
                        <View className="flex-row items-center justify-between" style={{ minHeight: 40 }}>
                            <View className="flex-1 pr-4">
                                <Text className="text-[#291E14] font-bold text-base tracking-wide">
                                    Ceremony Whispers
                                </Text>
                                <Text className="text-[#786851] text-xs mt-1 leading-5">
                                    Receive gentle reminders before your scheduled sanctuary sessions.
                                </Text>
                            </View>
                            <Switch
                                value={notificationsEnabled}
                                onValueChange={handleNotificationToggle}
                                trackColor={{ false: 'rgba(212,175,55,0.1)', true: 'rgba(212,175,55,0.5)' }}
                                thumbColor={notificationsEnabled ? '#D4AF37' : '#FDFBF7'}
                                ios_backgroundColor="rgba(212,175,55,0.1)"
                                style={{ transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] }}
                            />
                        </View>
                    </View>
                </Animated.View>

                {/* About Section */}
                <Animated.View entering={FadeInDown.delay(300).duration(500)} className="mt-8 px-6 pb-8">
                    <SectionHeader icon={Info} title="Sanctuary Archives" />

                    <View className="bg-white/60 rounded-[24px] overflow-hidden border border-white/80 shadow-lg backdrop-blur-xl" style={{ shadowColor: '#D4AF37', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 3 }}>
                        <View className="px-6 py-5 border-b border-[#E8E0D5]/50">
                            <Text className="text-[#A89F91] text-xs uppercase tracking-[2px] font-bold">Realm Version</Text>
                            <Text className="text-[#291E14] font-serif mt-1.5 text-lg">
                                {Constants.expoConfig?.version || '1.0.0'}
                            </Text>
                        </View>

                        <Pressable
                            className="flex-row items-center justify-between px-6 py-5 border-b border-[#E8E0D5]/50 active:bg-[#FDFBF7]/80"
                        >
                            <Text className="text-[#544636] font-medium tracking-wide">Sacred Vows (Terms)</Text>
                            <ChevronRight size={18} color="#A89F91" />
                        </Pressable>

                        <Pressable
                            className="flex-row items-center justify-between px-6 py-5 border-b border-[#E8E0D5]/50 active:bg-[#FDFBF7]/80"
                        >
                            <Text className="text-[#544636] font-medium tracking-wide">Veil of Silence (Privacy)</Text>
                            <ChevronRight size={18} color="#A89F91" />
                        </Pressable>

                        <Pressable
                            className="flex-row items-center justify-between px-6 py-5 active:bg-[#FDFBF7]/80"
                        >
                            <Text className="text-[#544636] font-medium tracking-wide">Seek Counsel (Support)</Text>
                            <ChevronRight size={18} color="#A89F91" />
                        </Pressable>
                    </View>
                </Animated.View>
            </ScrollView>
        </View>
    );
}
