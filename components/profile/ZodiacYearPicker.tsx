import { View, Text, Pressable, ScrollView } from 'react-native';
import { useState, useRef, useEffect } from 'react';

export const ZODIAC_ANIMALS = [
    { key: 'rat', mn: 'Хулгана', en: 'Rat', emoji: '🐀' },
    { key: 'ox', mn: 'Үхэр', en: 'Ox', emoji: '🐂' },
    { key: 'tiger', mn: 'Бар', en: 'Tiger', emoji: '🐅' },
    { key: 'rabbit', mn: 'Туулай', en: 'Rabbit', emoji: '🐇' },
    { key: 'dragon', mn: 'Луу', en: 'Dragon', emoji: '🐉' },
    { key: 'snake', mn: 'Могой', en: 'Snake', emoji: '🐍' },
    { key: 'horse', mn: 'Морь', en: 'Horse', emoji: '🐎' },
    { key: 'sheep', mn: 'Хонь', en: 'Sheep', emoji: '🐑' },
    { key: 'monkey', mn: 'Бич', en: 'Monkey', emoji: '🐒' },
    { key: 'rooster', mn: 'Тахиа', en: 'Rooster', emoji: '🐓' },
    { key: 'dog', mn: 'Нохой', en: 'Dog', emoji: '🐕' },
    { key: 'pig', mn: 'Гахай', en: 'Pig', emoji: '🐖' },
];

export function getZodiacByKey(key: string) {
    return ZODIAC_ANIMALS.find((z) => z.key === key);
}

export function getZodiacByYear(year: number) {
    const baseYear = 1900; // Rat year
    const index = (year - baseYear) % 12;
    const normalizedIndex = index < 0 ? index + 12 : index;
    return ZODIAC_ANIMALS[normalizedIndex];
}

interface ZodiacYearPickerProps {
    value?: string;
    onChange: (value: string) => void;
    language?: 'mn' | 'en';
}

export function ZodiacYearPicker({ value, onChange, language = 'mn' }: ZodiacYearPickerProps) {
    const scrollViewRef = useRef<ScrollView>(null);
    const [selectedIndex, setSelectedIndex] = useState(
        value ? ZODIAC_ANIMALS.findIndex((z) => z.key === value) : -1
    );

    useEffect(() => {
        if (selectedIndex >= 0 && scrollViewRef.current) {
            // Scroll to center the selected item
            const itemWidth = 100;
            const offset = selectedIndex * itemWidth - 100; // offset to center
            scrollViewRef.current.scrollTo({ x: Math.max(0, offset), animated: true });
        }
    }, []);

    const handleSelect = (index: number) => {
        setSelectedIndex(index);
        onChange(ZODIAC_ANIMALS[index].key);
    };

    return (
        <View className="bg-white rounded-xl border border-stone-200 overflow-hidden">
            <ScrollView
                ref={scrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 8, paddingVertical: 12 }}
            >
                {ZODIAC_ANIMALS.map((zodiac, index) => (
                    <Pressable
                        key={zodiac.key}
                        onPress={() => handleSelect(index)}
                        className={`items-center justify-center mx-1 px-3 py-3 rounded-xl ${
                            selectedIndex === index
                                ? 'bg-amber-100 border-2 border-amber-500'
                                : 'bg-stone-50 border border-stone-200'
                        }`}
                        style={{ minWidth: 80 }}
                    >
                        <Text className="text-3xl mb-1">{zodiac.emoji}</Text>
                        <Text
                            className={`text-sm font-medium ${
                                selectedIndex === index ? 'text-amber-700' : 'text-stone-600'
                            }`}
                        >
                            {language === 'mn' ? zodiac.mn : zodiac.en}
                        </Text>
                    </Pressable>
                ))}
            </ScrollView>
        </View>
    );
}

export function ZodiacDisplay({ zodiacKey, size = 'medium' }: { zodiacKey?: string; size?: 'small' | 'medium' | 'large' }) {
    if (!zodiacKey) return null;

    const zodiac = getZodiacByKey(zodiacKey);
    if (!zodiac) return null;

    const sizeClasses = {
        small: 'w-8 h-8 text-lg',
        medium: 'w-12 h-12 text-2xl',
        large: 'w-16 h-16 text-4xl',
    };

    return (
        <View className={`${sizeClasses[size].split(' ').slice(0, 2).join(' ')} bg-amber-50 rounded-full items-center justify-center border border-amber-200`}>
            <Text className={sizeClasses[size].split(' ')[2]}>{zodiac.emoji}</Text>
        </View>
    );
}
