import { View, Text, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import ExpertGuideCard from './ExpertGuideCard';

interface Guide {
    _id: string;
    name: string | { en: string; mn: string; de?: string };
    specialization?: string | { en: string; mn: string; de?: string };
    imageUrl?: string;
}

interface GuideCarouselProps {
    data: Guide[];
    t_db: (data: any) => string;
}

export default function GuideCarousel({ data, t_db }: GuideCarouselProps) {
    const router = useRouter();

    if (!data || data.length === 0) {
        return null;
    }

    return (
        <View className="my-4">
            {/* Section Title */}
            <Text className="text-xl font-bold text-stone-100 px-6 mb-3">
                Expert Local Guides
            </Text>

            {/* Horizontal Scroll */}
            <FlatList
                data={data}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 24 }}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                    <ExpertGuideCard
                        imageUrl={item.imageUrl || 'https://via.placeholder.com/80'}
                        name={t_db(item.name)}
                        specialty={t_db(item.specialization) || 'Spiritual Guide'}
                        isOnline={true}
                        onPress={() => router.push(`/monk/${item._id}`)}
                    />
                )}
            />
        </View>
    );
}
