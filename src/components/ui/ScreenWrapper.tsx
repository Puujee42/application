import { View, ViewProps } from 'react-native';

export const ScreenWrapper = ({ className, children, ...props }: ViewProps) => {
    return (
        <View className={`flex-1 bg-[#FFFBF0] ${className || ''}`} {...props}>
            {children}
        </View>
    );
};
