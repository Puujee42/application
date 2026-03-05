import { Text, type TextProps, StyleSheet } from 'react-native';
import { useColorScheme } from 'nativewind';

import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';

export type ThemedTextProps = TextProps & {
    lightColor?: string;
    darkColor?: string;
    type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({
    style,
    lightColor,
    darkColor,
    type = 'default',
    ...rest
}: ThemedTextProps) {
    const { colorScheme } = useColorScheme();
    const theme = colorScheme ?? 'light';
    const color = theme === 'light' ? lightColor ?? Colors.light.text : darkColor ?? Colors.dark.text;

    return (
        <Text
            style={[
                { color },
                type === 'default' ? styles.default : undefined,
                type === 'title' ? styles.title : undefined,
                type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
                type === 'subtitle' ? styles.subtitle : undefined,
                type === 'link' ? styles.link : undefined,
                style,
            ]}
            {...rest}
        />
    );
}

const styles = StyleSheet.create({
    default: {
        fontSize: Typography.size.base,
        lineHeight: Typography.lineHeight.normal * Typography.size.base,
    },
    defaultSemiBold: {
        fontSize: Typography.size.base,
        lineHeight: Typography.lineHeight.normal * Typography.size.base,
        fontWeight: '600',
    },
    title: {
        fontSize: Typography.size['3xl'],
        fontWeight: 'bold',
        lineHeight: 36,
        fontFamily: Typography.family.serif,
    },
    subtitle: {
        fontSize: Typography.size.xl,
        fontWeight: 'bold',
        fontFamily: Typography.family.serif,
    },
    link: {
        lineHeight: 30,
        fontSize: Typography.size.base,
        color: '#D4A020',
    },
});
