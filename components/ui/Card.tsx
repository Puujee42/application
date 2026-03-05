import { View, type ViewProps } from 'react-native';

export type CardProps = ViewProps & {
    className?: string;
};

export function Card({ className, style, ...props }: CardProps) {
    return (
        <View
            className={`bg-[#FFFFFF] rounded-xl border border-[#E8E0D5] shadow-sm shadow-amber-900/5 p-4 ${className}`}
            style={style}
            {...props}
        />
    );
}
