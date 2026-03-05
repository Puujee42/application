import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';

interface ExpertGuideCardProps {
    imageUrl: string;
    name: string;
    specialty: string;
    isOnline?: boolean;
    onPress: () => void;
}

export default function ExpertGuideCard({
    imageUrl,
    name,
    specialty,
    isOnline = true,
    onPress,
}: ExpertGuideCardProps) {
    return (
        <Pressable
            onPress={onPress}
            className="items-center mr-4 active:opacity-70"
            style={{ width: 100 }}
        >
            {/* Guide Photo with Border */}
            <View className="relative mb-3">
                <View
                    className="rounded-full overflow-hidden"
                    style={{
                        borderWidth: 2,
                        borderColor: '#F59E0B',
                        width: 80,
                        height: 80,
                    }}
                >
                    <Image
                        source={{ uri: imageUrl || 'https://via.placeholder.com/80' }}
                        style={{ width: '100%', height: '100%' }}
                        contentFit="cover"
                    />
                </View>

                {/* Online Badge */}
                {isOnline && (
                    <View
                        className="absolute bottom-0 right-0 bg-amber-400 rounded-full"
                        style={{
                            width: 20,
                            height: 20,
                            borderWidth: 2,
                            borderColor: '#1C1917',
                        }}
                    />
                )}
            </View>

            {/* Guide Info */}
            <Text
                className="text-stone-50 font-semibold text-sm text-center"
                numberOfLines={1}
            >
                {name}
            </Text>
            <Text
                className="text-stone-400 text-xs text-center mt-1"
                numberOfLines={1}
            >
                {specialty}
            </Text>
        </Pressable>
    );
}
