import { View, Text } from 'react-native';
import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { WifiOff } from 'lucide-react-native';

export default function OfflineBanner() {
    const [isOffline, setIsOffline] = useState(false);

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener((state) => {
            const newIsOffline = !state.isConnected;
            if (isOffline && !newIsOffline) {
                // Connection restored, give haptic feedback
                import('expo-haptics').then(Haptics => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
            }
            setIsOffline(newIsOffline);
        });

        return () => unsubscribe();
    }, []);

    if (!isOffline) {
        return null;
    }

    return (
        <View className="bg-monk-primary/90 px-4 py-2 flex-row items-center justify-center border-b border-monk-primary">
            <WifiOff size={16} color="#0F172A" />
            <Text className="text-[#0F172A] ml-2 font-serif font-bold text-sm">
                You're offline. Showing cached data.
            </Text>
        </View>
    );
}
