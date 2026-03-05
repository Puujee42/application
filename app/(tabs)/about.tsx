import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Users, Globe, Lock, Zap, Orbit } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import SpotlightCard from '../../components/SpotlightCard';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';

export default function AboutScreen() {
    const { t, i18n } = useTranslation();
    const lang = (i18n.language === 'mn' ? 'mn' : 'en') as 'mn' | 'en';

    const tr = (data: { mn: string; en: string }) => data[lang] || data.en;

    const cards = [
        {
            title: tr({ mn: 'Мэргэжлийн Баг', en: 'Expert Guidance' }),
            desc: tr({ mn: 'Туршлагатай зурхайч, лам нар танд үйлчилнэ.', en: 'Experienced masters guiding your path.' }),
            icon: Users,
        },
        {
            title: tr({ mn: 'Цаг Хугацаа', en: 'Anytime Access' }),
            desc: tr({ mn: 'Дэлхийн хаанаас ч холбогдох боломжтой.', en: 'Connect instantly from anywhere on Earth.' }),
            icon: Globe,
        },
        {
            title: tr({ mn: 'Нууцлал', en: 'Full Privacy' }),
            desc: tr({ mn: 'Таны мэдээлэл бүрэн хамгаалагдана.', en: 'Your sessions are strictly confidential.' }),
            icon: Lock,
        },
        {
            title: tr({ mn: 'Хялбар Шийдэл', en: 'Seamless Tech' }),
            desc: tr({ mn: 'Цахим төлбөр, хялбар захиалгын систем.', en: 'Effortless booking & secure payments.' }),
            icon: Zap,
        },
    ];

    return (
        <ScreenWrapper className="bg-[#FDFBF7]">
            <SafeAreaView className="flex-1 bg-[#FDFBF7]" edges={['top']}>
                <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
                    {/* Hero Section */}
                    <Animated.View
                        entering={FadeInDown.delay(100).duration(800)}
                        className="items-center py-10"
                    >
                        <View className="flex-row items-center gap-2 px-5 py-2.5 rounded-full border border-[#D4AF37]/50 bg-[#FFF9E6] mb-8 shadow-sm">
                            <Orbit size={14} color="#D4AF37" />
                            <Text className="text-[10px] font-bold uppercase tracking-[4px] text-[#D4AF37]">
                                {tr({ mn: 'Бидний түүх', en: 'Our Story' })}
                            </Text>
                        </View>

                        <Text className="text-5xl font-serif font-bold text-[#291E14] text-center leading-tight mb-2 tracking-tight">
                            {tr({ mn: 'Өв Соёл', en: 'Heritage' })}
                        </Text>
                        <Text className="text-5xl font-serif font-light italic text-[#D4AF37] text-center leading-tight mb-8" style={{ textShadowColor: 'rgba(212, 175, 55, 0.2)', textShadowRadius: 10 }}>
                            {tr({ mn: '& Технологи', en: '& Future' })}
                        </Text>

                        <Text className="text-lg text-[#544636] text-center font-light leading-relaxed mb-10 px-2 font-serif">
                            {tr({
                                mn: 'Эртний мэргэн ухааныг орчин үеийн технологитой хослуулан, хүн бүрт хүртээмжтэй түгээх нь бидний зорилго.',
                                en: 'Bridging ancient wisdom with modern technology to bring clarity to the digital age.'
                            })}
                        </Text>
                    </Animated.View>

                    {/* Cards */}
                    <View className="gap-5">
                        {cards.map((card, index) => (
                            <Animated.View
                                key={index}
                                entering={FadeInDown.delay(300 + index * 100).duration(600)}
                            >
                                <SpotlightCard
                                    title={card.title}
                                    desc={card.desc}
                                    icon={card.icon}
                                />
                            </Animated.View>
                        ))}
                    </View>

                    {/* Mission Section */}
                    <View className="py-24 items-center">
                        <Text className="text-3xl font-serif font-bold text-[#291E14] text-center mb-2">
                            {tr({ mn: 'Бидний Эрхэм', en: 'Our Noble' })}
                        </Text>
                        <Text className="text-3xl font-serif font-light italic text-[#D4AF37] text-center mb-10">
                            {tr({ mn: 'Зорилго', en: 'Mission' })}
                        </Text>

                        <Text className="text-lg text-[#544636] text-center leading-relaxed mb-10 font-serif">
                            {tr({
                                mn: 'Бид Монголын Бурхан шашны олон зуун жилийн түүхтэй зан үйл, сургаал номлолыг цаг хугацаа, орон зайнаас үл хамааран хүн бүрт хүртээмжтэй болгохыг зорьдог.',
                                en: 'We aim to make centuries-old Mongolian Buddhist rituals accessible to everyone, transcending the barriers of time and space.'
                            })}
                        </Text>

                        <View className="pl-6 border-l-[3px] border-[#D4AF37]/40 py-2">
                            <Text className="text-xl font-serif font-medium italic text-[#786851]">
                                "{tr({ mn: 'Мэргэн ухаан таны гарт.', en: 'Wisdom in your hands.' })}"
                            </Text>
                        </View>

                        {/* Stats */}
                        <View className="flex-row gap-5 mt-16 w-full">
                            <View className="flex-1 p-6 rounded-3xl border border-white/80 bg-white/60 items-center shadow-lg backdrop-blur-xl" style={{ shadowColor: '#D4AF37', shadowRadius: 15, shadowOpacity: 0.1, elevation: 5 }}>
                                <Text className="text-[40px] font-serif font-bold text-[#D4AF37] mb-2 shadow-sm">120<Text className="text-2xl text-[#D4AF37]/80">+</Text></Text>
                                <Text className="text-[10px] font-bold uppercase tracking-[3px] text-[#A89F91]">
                                    {tr({ mn: 'Багш нар', en: 'Masters' })}
                                </Text>
                            </View>
                            <View className="flex-1 p-6 rounded-3xl border border-white/80 bg-white/60 items-center shadow-lg backdrop-blur-xl" style={{ shadowColor: '#D4AF37', shadowRadius: 15, shadowOpacity: 0.1, elevation: 5 }}>
                                <Text className="text-[40px] font-serif font-bold text-[#D4AF37] mb-2 shadow-sm">5K<Text className="text-2xl text-[#D4AF37]/80">+</Text></Text>
                                <Text className="text-[10px] font-bold uppercase tracking-[3px] text-[#A89F91]">
                                    {tr({ mn: 'Хэрэглэгч', en: 'Seekers' })}
                                </Text>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </ScreenWrapper>
    );
}
