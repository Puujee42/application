
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getMonks } from '../../lib/api';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Star } from 'lucide-react-native';

export default function MonkListScreen() {
    const router = useRouter();
    const { t, i18n } = useTranslation();
    const lang = (i18n.language === 'mn' ? 'mn' : 'en') as 'mn' | 'en';

    const { data: monks, isLoading } = useQuery({
        queryKey: ['monks'],
        queryFn: getMonks,
    });

    if (isLoading) {
        return (
            <ScreenWrapper>
                <SafeAreaView className="flex-1 justify-center items-center">
                    <ActivityIndicator color="#795548" size="large" />
                    <Text className="text-monk-secondary mt-4">Finding masters...</Text>
                </SafeAreaView>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper>
            <SafeAreaView className="flex-1">
                {/* Header with Back Button */}
                <View className="px-6 pt-4 pb-4 flex-row items-center">
                    <TouchableOpacity onPress={() => router.back()} className="bg-white/50 p-2 rounded-full mr-4">
                        <ArrowLeft size={24} color="#795548" />
                    </TouchableOpacity>
                    <View>
                        <Text className="text-2xl font-serif text-monk-primary font-bold">Our Monks</Text>
                        <Text className="text-monk-secondary text-xs">Guided by wisdom</Text>
                    </View>
                </View>

                <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
                    {monks?.map((monk) => (
                        <TouchableOpacity
                            key={monk._id?.toString() || monk.name.en}
                            
                            onPress={() => router.push(`/monk/${monk._id}`)}
                            className="mb-6"
                        >
                            <View className="p-0 overflow-hidden border-monk-secondary/20 bg-white rounded-[24px] shadow-xl border border-white/10">
                                <View className="flex-row">
                                    <Image
                                        source={{ uri: monk.image }}
                                        style={{ width: 100, height: 120 }}
                                        contentFit="cover"
                                    />
                                    <View className="flex-1 p-3 justify-center">
                                        <View className="flex-row justify-between items-start">
                                            <View>
                                                <Text className="text-xs font-bold text-monk-accent uppercase tracking-wider mb-1">
                                                    {monk.title[lang] || monk.title.en}
                                                </Text>
                                                <Text className="text-lg font-serif font-bold text-monk-primary mb-1">
                                                    {monk.name[lang] || monk.name.en}
                                                </Text>
                                            </View>
                                            {monk.isSpecial && <Star size={16} color="#D4AF37" fill="#D4AF37" />}
                                        </View>

                                        <Text numberOfLines={2} className="text-stone-500 text-xs leading-4 mb-2">
                                            {monk.bio[lang] || monk.bio.en}
                                        </Text>

                                        <View className="flex-row flex-wrap gap-1">
                                            {monk.specialties?.slice(0, 2).map((b, i) => (
                                                <View key={i} className="bg-earth-100 px-2 py-0.5 rounded-sm">
                                                    <Text className="text-[10px] text-monk-primary">{b}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </SafeAreaView>
        </ScreenWrapper>
    );
}
