import { View, Text, Pressable, ImageBackground } from 'react-native';

interface HeroFeatureCardProps {
    imageUrl: string;
    title: string;
    badge: string;
    onPress?: () => void;
}

export default function HeroFeatureCard({ imageUrl, title, badge, onPress }: HeroFeatureCardProps) {
    return (
        <Pressable
            onPress={onPress}
            className="mx-6 my-4 rounded-2xl overflow-hidden active:opacity-90"
            style={{ height: 280 }}
        >
            <ImageBackground
                source={{ uri: imageUrl }}
                style={{ flex: 1 }}
                resizeMode="cover"
            >
                {/* Amber overlay */}
                <View className="flex-1 bg-amber-900/60 justify-end p-6">
                    {/* Title */}
                    <Text className="text-3xl font-bold text-stone-50 mb-4">
                        {title}
                    </Text>

                    {/* Badge */}
                    <View className="self-start">
                        <View className="bg-amber-500 rounded-full px-6 py-2">
                            <Text className="text-stone-900 font-semibold text-sm">
                                {badge}
                            </Text>
                        </View>
                    </View>
                </View>
            </ImageBackground>
        </Pressable>
    );
}
