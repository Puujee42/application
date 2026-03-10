import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { RitualItem } from '../lib/data/ritualsData';
import { Colors } from '../constants/Colors';
import { useColorScheme } from 'react-native';
import TouchableScale from './ui/TouchableScale';

interface RitualCardProps {
    item: RitualItem;
}

export const RitualCard: React.FC<RitualCardProps> = ({ item }) => {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    return (
        <Link href={`/ritual/${item.id}`} asChild>
            <TouchableScale
                style={[
                    styles.card,
                    {
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                    }
                ]}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`View details for ${item.name}`}
            >
                <View style={styles.contentContainer}>
                    <Text
                        style={[styles.title, { color: colors.tint }]}
                        numberOfLines={1}
                    >
                        {item.name}
                    </Text>
                    <Text
                        style={[styles.description, { color: colors.text }]}
                        numberOfLines={2}
                    >
                        {item.desc || "Дэлгэрэнгүй мэдээлэл байхгүй байна."}
                    </Text>
                </View>

                <View style={styles.iconContainer}>
                    <Text style={{ color: colors.icon }}>→</Text>
                </View>
            </TouchableScale>
        </Link>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        marginVertical: 8,
        marginHorizontal: 16,
        borderRadius: 24,
        borderWidth: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.6)', // Glassmorphism
        borderColor: 'rgba(255, 255, 255, 0.8)',
        // Ensure touch target >= 48px
        minHeight: 80,
        // Divine shadow for depth
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 3,
    },
    contentContainer: {
        flex: 1,
        paddingRight: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: 'serif',
        marginBottom: 4,
        letterSpacing: 0.3,
        color: '#291E14',
    },
    description: {
        fontSize: 14,
        opacity: 0.8,
        lineHeight: 20,
        color: '#544636',
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFF9E6', // Subtle gold background
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.2)',
    }
});
