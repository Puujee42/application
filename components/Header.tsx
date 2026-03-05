import { View, Text, Pressable } from 'react-native';
import { Bell, User } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Header() {
    const router = useRouter();

    return (
        <SafeAreaView edges={['top']} className="bg-stone-900">
            <View className="flex-row items-center justify-between px-6 py-4">
                {/* Logo */}
                <Text className="text-2xl font-bold text-amber-500 tracking-wider">
                    MONGOL TRAIL
                </Text>

                {/* Right Icons */}
                <View className="flex-row items-center gap-4">
                    <Pressable
                        onPress={() => {
                            // TODO: Navigate to notifications when implemented
                            console.log('Notifications pressed');
                        }}
                        className="active:opacity-70"
                        style={{ minHeight: 44, minWidth: 44, justifyContent: 'center', alignItems: 'center' }}
                    >
                        <Bell size={24} color="#D6D3D1" />
                    </Pressable>

                    <Pressable
                        onPress={() => router.push('/profile')}
                        className="active:opacity-70"
                        style={{ minHeight: 44, minWidth: 44, justifyContent: 'center', alignItems: 'center' }}
                    >
                        <User size={24} color="#D6D3D1" />
                    </Pressable>
                </View>
            </View>
        </SafeAreaView>
    );
}
