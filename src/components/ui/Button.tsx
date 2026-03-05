import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

export interface ButtonProps extends React.ComponentProps<typeof TouchableOpacity> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    label: string;
    icon?: React.ReactNode;
}

export const Button = ({
    variant = 'primary',
    size = 'md',
    label,
    icon,
    className,
    onPress,
    ...props
}: ButtonProps) => {

    const handlePress = (e: any) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.(e);
    };

    const sizes = {
        sm: 'px-4 py-2',
        md: 'px-6 py-4',
        lg: 'px-10 py-5',
    };

    const textBase = 'font-bold tracking-widest uppercase text-xs';
    const textStyles = {
        primary: `${textBase} text-[#1A1000]`,
        secondary: `${textBase} text-[#1A1000]`,
        outline: `${textBase} text-[#D4A020]`,
        ghost: 'font-semibold text-sm text-[#D4A020]',
    };

    if (variant === 'primary') {
        return (
            <TouchableOpacity
                onPress={handlePress}
                activeOpacity={0.85}
                {...props}
            >
                <LinearGradient
                    colors={['#D4A020', '#B8820A']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className={`flex-row items-center justify-center rounded-full ${sizes[size]} ${className || ''}`}
                    style={{
                        shadowColor: '#FFD060',
                        shadowOffset: { width: 0, height: 6 },
                        shadowOpacity: 0.4,
                        shadowRadius: 12,
                        elevation: 8,
                    }}
                >
                    {icon && <View className="mr-2">{icon}</View>}
                    <Text className={textStyles.primary}>{label}</Text>
                </LinearGradient>
            </TouchableOpacity>
        );
    }

    const variants = {
        secondary: 'bg-[#FFFBF0]/60 border border-[rgba(200,146,10,0.18)]',
        outline: 'border border-[#D4A020] bg-transparent',
        ghost: 'border-transparent bg-transparent',
    };

    return (
        <TouchableOpacity
            className={`flex-row items-center justify-center rounded-full ${variants[variant]} ${sizes[size]} ${className || ''}`}
            onPress={handlePress}
            activeOpacity={0.8}
            {...props}
        >
            {icon && <View className="mr-2">{icon}</View>}
            <Text className={textStyles[variant]}>{label}</Text>
        </TouchableOpacity>
    );
};
