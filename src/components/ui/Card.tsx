import { View, ViewProps, StyleSheet } from 'react-native';

export const Card = ({ className, children, style, ...props }: ViewProps) => {
    return (
        <View
            className={`rounded-[24px] border overflow-hidden ${className || ''}`}
            style={[styles.card, style]}
            {...props}
        >
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'rgba(255,251,240,0.55)',
        borderColor: 'rgba(200,146,10,0.18)',
        borderWidth: 1,
        shadowColor: '#B8820A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 4,
    },
});
