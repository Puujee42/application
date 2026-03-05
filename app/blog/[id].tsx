
import { View, Text, ScrollView, useWindowDimensions, ActivityIndicator } from 'react-native';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { useQuery } from '@tanstack/react-query';
import { getBlogs } from '../../lib/api';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';

const formatDate = (dateString: string) => {
    try {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (e) {
        return dateString;
    }
};

export default function BlogDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { t, i18n } = useTranslation();
    const { width } = useWindowDimensions();

    const { data: blogs, isLoading } = useQuery({
        queryKey: ['blogs'],
        queryFn: getBlogs,
    });

    const blog = blogs?.find(b => b._id === id || b.id === id);
    const lang = (i18n.language === 'mn' ? 'mn' : 'en') as 'mn' | 'en';

    if (isLoading || !blog) {
        return (
            <ScreenWrapper>
                <SafeAreaView className="flex-1 justify-center items-center">
                    <ActivityIndicator color="#795548" size="large" />
                </SafeAreaView>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper>
            <SafeAreaView className="flex-1 relative">
                {/* Back Button */}
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="absolute top-12 left-6 z-10 bg-white/80 p-2 rounded-full"
                >
                    <ArrowLeft size={24} color="#795548" />
                </TouchableOpacity>

                <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
                    <Image
                        source={{ uri: blog.cover }}
                        style={{ width: '100%', height: 300 }}
                        contentFit="cover"
                    />

                    <View className="px-6 py-6 -mt-6 bg-monk-bg rounded-t-3xl min-h-screen">
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-xs font-bold text-monk-accent uppercase tracking-wider px-2 py-1 bg-monk-accent/10 rounded-md">
                                {blog.category}
                            </Text>
                            <Text className="text-sm text-monk-secondary font-medium">
                                {formatDate(blog.date)}
                            </Text>
                        </View>

                        <Text className="text-3xl font-serif font-bold text-monk-primary mb-6 leading-9">
                            {blog.title[lang] || blog.title.en}
                        </Text>

                        <View className="flex-row items-center mb-8 border-b border-monk-secondary/20 pb-4">
                            <View className="w-10 h-10 bg-earth-200 rounded-full mr-3 items-center justify-center">
                                <Text className="font-serif font-bold text-monk-primary text-lg">
                                    {blog.authorName?.charAt(0) || 'A'}
                                </Text>
                            </View>
                            <View>
                                <Text className="text-monk-text font-medium">{blog.authorName || 'Monk Scholar'}</Text>
                                <Text className="text-monk-secondary text-xs">Author</Text>
                            </View>
                        </View>

                        <Text className="text-lg text-monk-text leading-8 font-serif">
                            {/* Basic cleanup of HTML tags for now, proper HTML rendering would need a library */}
                            {blog.content[lang]?.replace(/<[^>]*>?/g, '') || blog.content.en?.replace(/<[^>]*>?/g, '')}
                        </Text>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </ScreenWrapper>
    );
}
