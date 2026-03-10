import { View, ViewProps, StyleSheet } from 'react-native';
import { COLORS, SHADOWS } from '../../../design-system/theme';

export const Card = ({ className, children, style, ...props }: ViewProps) => {
    return (
        <View
            style={[styles.card, style]}
            {...props}
        >
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
        overflow: 'hidden',
        ...SHADOWS.md,
    },
});
