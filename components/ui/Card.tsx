import { View, type ViewProps, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors } from '../../constants/Colors';

export type CardProps = ViewProps & {
    className?: string;
    intensity?: number;
};

export function Card({ className, style, intensity = 40, children, ...props }: CardProps) {
    return (
        <BlurView
            intensity={intensity}
            tint="light"
            style={[
                styles.card,
                style
            ]}
            className={`overflow-hidden ${className || ''}`}
            {...props}
        >
            <View className="p-4" style={styles.inner}>
                {children}
            </View>
        </BlurView>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(200, 146, 10, 0.14)',
        backgroundColor: 'rgba(255, 252, 242, 0.55)', // sanctuary.surface
        shadowColor: 'rgba(200, 146, 10, 0.2)', // Amber tint shadow
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 3,
    },
    inner: {
        flex: 1,
    }
});
