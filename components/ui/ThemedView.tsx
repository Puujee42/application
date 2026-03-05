import { View, type ViewProps } from 'react-native';
import { useColorScheme } from 'nativewind';
import { Colors } from '@/constants/Colors';

export type ThemedViewProps = ViewProps & {
    lightColor?: string;
    darkColor?: string;
};

export function ThemedView({ style, lightColor, darkColor, ...otherProps }: ThemedViewProps) {
    const { colorScheme } = useColorScheme();
    const theme = colorScheme ?? 'light';
    const backgroundColor = theme === 'light' ? lightColor ?? Colors.light.background : darkColor ?? Colors.dark.background;

    return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
