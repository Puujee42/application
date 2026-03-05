import { View, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type ScreenWrapperProps = ViewProps & {
    className?: string;
    bg?: string;
};

export function ScreenWrapper({ className, bg, style, children, ...props }: ScreenWrapperProps) {
    const insets = useSafeAreaInsets();

    return (
        <View
            className={`flex-1 bg-monk-bg dark:bg-stone-950 ${className}`}
            style={[
                {
                    paddingTop: insets.top,
                    paddingBottom: insets.bottom,
                    paddingLeft: insets.left,
                    paddingRight: insets.right
                },
                style
            ]}
            {...props}
        >
            {children}
        </View>
    );
}
