import { View, ViewProps, StyleSheet } from 'react-native';

export const GlassContainer = ({ className, children, style, ...props }: ViewProps) => {
    return (
        <View
            className={`rounded-full items-center justify-center p-3 overflow-hidden ${className || ''}`}
            style={[styles.glass, style]}
            {...props}
        >
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    glass: {
        backgroundColor: 'rgba(255,251,240,0.65)',
        borderWidth: 1,
        borderColor: 'rgba(200,146,10,0.18)',
    },
});
