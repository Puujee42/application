import React from 'react';
import {
    ScrollView,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import { getMonks } from '../../lib/api';
import { useUser } from '../../lib/useClerkSafe';
import { useUserStore } from '../../store/userStore';
import { useAuthStore } from '../../store/authStore';
import { useIsAuthenticated } from '../../hooks/useIsAuthenticated';
import { Monk } from '../../src/types/schema';
import { useCallback, useState } from 'react';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SERVICES = [
    { emoji: '🃏', label: 'Таро уншилт' },
    { emoji: '♈', label: 'Зурхай' },
    { emoji: '🌙', label: 'Сарны зөн' },
    { emoji: '⚡', label: 'Эрчим хүч' },
];

const t = (data: { mn?: string; en?: string } | string | undefined): string => {
    if (!data) return '';
    if (typeof data === 'string') return data;
    return data.mn || data.en || '';
};

const formatPrice = (monk: Monk): string => {
    const price = monk.services?.[0]?.price;
    if (price) return `${price.toLocaleString()}₮`;
    return monk.isSpecial ? '88,000₮' : '50,000₮';
};

export default function HomeScreen() {
    const router = useRouter();
    const { user: clerkUser } = useUser();
    const { user: dbUser } = useUserStore();
    const { customUser } = useAuthStore();
    const isAuthenticated = useIsAuthenticated();
    const [refreshing, setRefreshing] = useState(false);

    const { data: monks, refetch } = useQuery({
        queryKey: ['monks'],
        queryFn: getMonks,
    });

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    }, [refetch]);

    const displayName = dbUser?.firstName || customUser?.firstName || clerkUser?.firstName || 'Зочин';
    const avatarUri = (dbUser as any)?.image || dbUser?.avatar || clerkUser?.imageUrl || 'https://i.pravatar.cc/150?u=self';
    const topMonks = monks?.slice(0, 5) || [];

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.flex} edges={['top']}>
                <ScrollView
                    style={styles.flex}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#E5B22D"
                            colors={['#E5B22D']}
                        />
                    }
                >
                    {/* ===== HEADER ===== */}
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <Text style={styles.greeting}>Сайн байна уу 👋</Text>
                            <Text style={styles.username}>{displayName}</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.avatarCircle}
                            activeOpacity={0.8}
                            onPress={() => router.push('/(tabs)/profile')}
                        >
                            <Image
                                source={{ uri: avatarUri }}
                                style={styles.avatarImage}
                                contentFit="cover"
                            />
                        </TouchableOpacity>
                    </View>

                    {/* ===== HERO CARD ===== */}
                    <View style={styles.heroCard}>
                        <Text style={styles.heroTitle}>
                            Асуудлынхаа шийдлийг{'\n'}олоорой
                        </Text>
                        <TouchableOpacity
                            style={styles.heroButton}
                            activeOpacity={0.8}
                            onPress={() => router.push('/(tabs)/monks')}
                        >
                            <Text style={styles.heroButtonText}>Цаг захиалах →</Text>
                        </TouchableOpacity>
                    </View>

                    {/* ===== SERVICES SECTION ===== */}
                    <Text style={styles.sectionTitle}>Үйлчилгээ</Text>
                    <View style={styles.servicesGrid}>
                        {SERVICES.map((service, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.serviceCard}
                                activeOpacity={0.7}
                                onPress={() => router.push('/(tabs)/monks')}
                            >
                                <Text style={styles.serviceEmoji}>{service.emoji}</Text>
                                <Text style={styles.serviceLabel}>{service.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* ===== TOP MONKS ===== */}
                    <Text style={styles.sectionTitle}>Шилдэг үзмэрчид</Text>
                    {topMonks.map((monk) => (
                        <View key={monk._id} style={styles.monkCard}>
                            <TouchableOpacity
                                style={styles.monkCardTop}
                                activeOpacity={0.7}
                                onPress={() => router.push(`/monk/${monk._id}`)}
                            >
                                <Image
                                    source={{ uri: monk.image || 'https://via.placeholder.com/150' }}
                                    style={styles.monkAvatar}
                                    contentFit="cover"
                                />
                                <View style={styles.monkInfo}>
                                    <Text style={styles.monkName}>{t(monk.name)}</Text>
                                    <Text style={styles.monkSubtitle}>
                                        {t(monk.title)} • {monk.yearsOfExperience || 0} жил
                                    </Text>
                                </View>
                                <Text style={styles.monkPrice}>{formatPrice(monk)}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.bookButton}
                                activeOpacity={0.8}
                                onPress={() => router.push(`/booking/${monk._id}`)}
                            >
                                <Text style={styles.bookButtonText}>Цаг захиалах →</Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const CARD_SHADOW = {
    shadowColor: '#000' as const,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFDF4' },
    flex: { flex: 1 },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
        marginBottom: 24,
    },
    headerLeft: { flex: 1 },
    greeting: { fontSize: 16, color: '#888888', marginBottom: 4 },
    username: { fontSize: 22, fontWeight: '700', color: '#333333' },
    avatarCircle: {
        width: 48, height: 48, borderRadius: 24,
        overflow: 'hidden', backgroundColor: '#F0F0F0',
    },
    avatarImage: { width: 48, height: 48 },

    heroCard: {
        backgroundColor: '#E5B22D',
        borderRadius: 20,
        padding: 28,
        marginBottom: 28,
    },
    heroTitle: {
        fontSize: 22, fontWeight: '700', color: '#FFFFFF',
        lineHeight: 32, marginBottom: 20,
    },
    heroButton: {
        alignSelf: 'flex-start',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20, paddingVertical: 12,
        borderRadius: 30,
    },
    heroButtonText: { color: '#E5B22D', fontWeight: '700', fontSize: 14 },

    sectionTitle: {
        fontSize: 20, fontWeight: '700', color: '#333333', marginBottom: 16,
    },
    servicesGrid: {
        flexDirection: 'row', flexWrap: 'wrap',
        justifyContent: 'space-between', marginBottom: 28,
    },
    serviceCard: {
        width: (SCREEN_WIDTH - 56) / 2,
        backgroundColor: '#FFFFFF', borderRadius: 20,
        paddingVertical: 24, alignItems: 'center',
        justifyContent: 'center', marginBottom: 16,
        ...CARD_SHADOW,
    },
    serviceEmoji: { fontSize: 32, marginBottom: 10 },
    serviceLabel: { fontSize: 14, fontWeight: '600', color: '#333333' },

    monkCard: {
        backgroundColor: '#FFFFFF', borderRadius: 20,
        padding: 16, marginBottom: 16,
        ...CARD_SHADOW,
    },
    monkCardTop: {
        flexDirection: 'row', alignItems: 'center', marginBottom: 14,
    },
    monkAvatar: {
        width: 52, height: 52, borderRadius: 26, backgroundColor: '#F0F0F0',
    },
    monkInfo: { flex: 1, marginLeft: 14 },
    monkName: {
        fontSize: 16, fontWeight: '700', color: '#333333', marginBottom: 3,
    },
    monkSubtitle: { fontSize: 13, color: '#888888' },
    monkPrice: { fontSize: 16, fontWeight: '700', color: '#E5B22D' },
    bookButton: {
        backgroundColor: '#E5B22D', borderRadius: 20,
        paddingVertical: 14, alignItems: 'center',
    },
    bookButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
});
