import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRitualsStore } from '../../store/useRitualsStore';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from 'react-native';
import { ArrowLeft, CheckCircle2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ritualsApi } from '../../lib/api/ritualsApi';

export default function RitualDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { getRitualById } = useRitualsStore();

    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const insets = useSafeAreaInsets();

    const [isSimulatingBooking, setIsSimulatingBooking] = React.useState(false);
    const [bookingSuccess, setBookingSuccess] = React.useState(false);

    // We get the specific item from our Zustand Store based on URL param
    const item = getRitualById(id as string);

    if (!item) {
        return (
            <View style={[styles.centered, { backgroundColor: colors.background }]}>
                <Text style={{ color: colors.text }}>Ritual not found.</Text>
                <Pressable onPress={() => router.back()} style={styles.backButtonFallback}>
                    <Text style={{ color: colors.tint }}>Go Back</Text>
                </Pressable>
            </View>
        );
    }

    const handleSimulateRequestToRust = async () => {
        setIsSimulatingBooking(true);
        try {
            // Using the API client to communicate with the rust backend
            // For now sending dummy array just to test Rust communication
            const result = await ritualsApi.processData([108, 21, 7]);
            console.log("Response from Rust Backend:", result);
            setBookingSuccess(true);
        } catch (error) {
            console.error(error);
            // Even if Rust isn't running cleanly in this sandbox, we gracefully fail
            alert("Could not connect to local Rust service (is it running?)");
        } finally {
            setIsSimulatingBooking(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable
                    onPress={() => router.back()}
                    style={styles.backButton}
                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }} // Enhanced touch target
                    accessibilityRole="button"
                    accessibilityLabel="Go back"
                >
                    <ArrowLeft size={24} color={colors.text} />
                </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={[styles.title, { color: colors.tint }]}>{item.name}</Text>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Дэлгэрэнгүй</Text>
                    <Text style={[styles.description, { color: colors.text }]}>
                        {item.desc || "Мэдээлэл ороогүй байна."}
                    </Text>
                </View>

                {/* Rust Backend Simulation Section */}
                <View style={[styles.actionCard, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#F1F5F9', borderColor: colors.border }]}>
                    <Text style={[styles.actionTitle, { color: colors.text }]}>Засал захиалах</Text>
                    <Text style={[styles.actionDesc, { color: colors.text }]}>
                        Test connection to the Rust Backend Service.
                    </Text>

                    <Pressable
                        style={[
                            styles.primaryButton,
                            { backgroundColor: colors.tint },
                            (isSimulatingBooking || bookingSuccess) && { opacity: 0.7 }
                        ]}
                        onPress={handleSimulateRequestToRust}
                        disabled={isSimulatingBooking || bookingSuccess}
                        accessibilityRole="button"
                    >
                        {isSimulatingBooking ? (
                            <ActivityIndicator color={colors.background} />
                        ) : bookingSuccess ? (
                            <View style={styles.successRow}>
                                <CheckCircle2 size={20} color={colors.background} />
                                <Text style={[styles.buttonText, { color: colors.background, marginLeft: 8 }]}>
                                    Амжилттай
                                </Text>
                            </View>
                        ) : (
                            <Text style={[styles.buttonText, { color: colors.background }]}>
                                Захиалах (Test Rust API)
                            </Text>
                        )}
                    </Pressable>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
        // Ensure 48px touch target
        minWidth: 48,
        minHeight: 48,
        justifyContent: 'center'
    },
    backButtonFallback: {
        marginTop: 16,
        padding: 12,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginTop: 16,
        marginBottom: 32,
        letterSpacing: -0.5,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
        opacity: 0.5,
    },
    description: {
        fontSize: 18,
        lineHeight: 28,
        opacity: 0.9,
    },
    actionCard: {
        padding: 24,
        borderRadius: 24,
        borderWidth: 1,
        marginTop: 16,
    },
    actionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    actionDesc: {
        fontSize: 14,
        opacity: 0.7,
        marginBottom: 24,
        lineHeight: 20,
    },
    primaryButton: {
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 56, // Accessible touch target
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    successRow: {
        flexDirection: 'row',
        alignItems: 'center',
    }
});
