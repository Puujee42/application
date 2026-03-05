import { View, Text, Pressable, Platform } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function AISearchCard() {
    const router = useRouter();

    return (
        <View className="px-6 my-4">
            {/* Section Title */}
            <Text className="text-xl font-bold text-stone-100 mb-3">
                AI Trail Planner
            </Text>

            {/* AI Search Card */}
            <Pressable
                onPress={() => {
                    // TODO: Navigate to AI chat when implemented
                    console.log('AI Trail Planner pressed');
                }}
                className="bg-stone-800 rounded-2xl p-5 flex-row items-center active:opacity-90"
                style={{
                    borderWidth: 2,
                    borderColor: '#F59E0B',
                    ...Platform.select({
                        ios: {
                            shadowColor: '#F59E0B',
                            shadowOffset: { width: 0, height: 0 },
                            shadowOpacity: 0.4,
                            shadowRadius: 8,
                        },
                        android: {
                            elevation: 8,
                        },
                    }),
                }}
            >
                {/* Sparkles Icon */}
                <View className="mr-4">
                    <Sparkles size={32} color="#FBBF24" fill="#FBBF24" />
                </View>

                {/* Text Content */}
                <View className="flex-1">
                    <Text className="text-stone-50 text-lg font-semibold">
                        Ask our AI where to go next
                    </Text>
                    <Text className="text-stone-400 text-sm mt-1">
                        Personalized adventure planning
                    </Text>
                </View>
            </Pressable>
        </View>
    );
}
