import React, { useState, useEffect, useMemo } from 'react';
import {
    View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator,
    Alert, Platform, Switch, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Save, Ban, Clock, Calendar as CalendarIcon, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Calendar } from 'react-native-calendars';

import { useUserStore } from '../store/userStore';
import api from '../lib/api';
import TouchableScale from '../components/ui/TouchableScale';
import { COLORS, SHADOWS } from '../design-system/theme';

const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';
const DAYS_EN = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAYS_MN = ["Даваа", "Мягмар", "Лхагва", "Пүрэв", "Баасан", "Бямба", "Ням"];
const ALL_24_SLOTS = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);

interface BlockedSlot {
    id: string;
    date: string;
    time: string;
}

interface ScheduleDay {
    day: string;
    start: string;
    end: string;
    active: boolean;
    slots?: string[];
}

export default function ManageScheduleScreen() {
    const router = useRouter();
    const { user: dbUser } = useUserStore();

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [schedule, setSchedule] = useState<ScheduleDay[]>([]);
    const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);

    const [selectedBlockDate, setSelectedBlockDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [isDatePickerVisible, setDatePickerVisible] = useState(false);

    useEffect(() => {
        if (!dbUser || dbUser.role !== 'monk') {
            router.replace('/(tabs)');
            return;
        }
        fetchScheduleData();
    }, [dbUser]);

    const fetchScheduleData = async () => {
        setIsLoading(true);
        try {
            const res = await api.get(`/monks/${dbUser?._id}`);
            const data = res.data;
            if (data.schedule) {
                setSchedule(data.schedule);
            } else {
                setSchedule(DAYS_EN.map(d => ({ day: d, start: "00:00", end: "24:00", active: false, slots: [] })));
            }
            if (data.blockedSlots) {
                setBlockedSlots(data.blockedSlots);
            }
        } catch (error) {
            console.error('Error fetching schedule:', error);
            Alert.alert('Алдаа', 'Цагийн хуваарь ачааллахад алдаа гарлаа.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!dbUser) return;
        setIsSaving(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        try {
            await api.patch(`/monks/${dbUser._id}/schedule`, {
                schedule,
                blockedSlots
            });
            Alert.alert('Амжилттай', 'Цагийн хуваарь амжилттай хадгалагдлаа', [
                { text: 'ОК', onPress: () => router.back() }
            ]);
        } catch (error) {
            console.error('Error saving schedule:', error);
            Alert.alert('Алдаа', 'Цагийн хуваарь хадгалахад алдаа гарлаа.');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleDayActive = (day: string) => {
        setSchedule(prev => prev.map(s => {
            if (s.day === day) {
                const isActive = !s.active;
                return {
                    ...s,
                    active: isActive,
                    slots: isActive && (!s.slots || s.slots.length === 0) ? [...ALL_24_SLOTS] : s.slots
                };
            }
            return s;
        }));
    };

    const toggleWeeklySlot = (day: string, time: string) => {
        setSchedule(prev => prev.map(s => {
            if (s.day === day) {
                const slots = s.slots || [];
                const newSlots = slots.includes(time) ? slots.filter(t => t !== time) : [...slots, time];
                return { ...s, slots: newSlots };
            }
            return s;
        }));
    };

    const toggleBlockSlot = (time: string) => {
        const exists = blockedSlots.find(b => b.date === selectedBlockDate && b.time === time);
        if (exists) {
            setBlockedSlots(blockedSlots.filter(b => b.id !== exists.id));
        } else {
            setBlockedSlots([...blockedSlots, { id: Date.now().toString() + Math.random().toString(), date: selectedBlockDate, time }]);
        }
    };

    const toggleBlockWholeDay = () => {
        const isAllBlocked = ALL_24_SLOTS.every(time => blockedSlots.some(b => b.date === selectedBlockDate && b.time === time));
        if (isAllBlocked) {
            setBlockedSlots(blockedSlots.filter(b => b.date !== selectedBlockDate));
        } else {
            const newBlocks = ALL_24_SLOTS
                .filter(time => !blockedSlots.some(b => b.date === selectedBlockDate && b.time === time))
                .map(time => ({ id: Date.now().toString() + Math.random().toString(), date: selectedBlockDate, time }));
            setBlockedSlots([...blockedSlots, ...newBlocks]);
        }
    };

    const isWholeDayBlocked = useMemo(() => {
        return ALL_24_SLOTS.every(time => blockedSlots.some(b => b.date === selectedBlockDate && b.time === time));
    }, [blockedSlots, selectedBlockDate]);

    return (
        <SafeAreaView style={st.container} edges={['top']}>
            <View style={st.header}>
                <TouchableScale
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.back();
                    }}
                    style={st.backBtn}
                >
                    <ArrowLeft size={22} color={COLORS.text} />
                </TouchableScale>
                <Text style={st.headerTitle}>Хуваарь удирдах</Text>
                <TouchableScale
                    onPress={handleSave}
                    disabled={isSaving || isLoading}
                    style={[st.saveBtn, (isSaving || isLoading) && { opacity: 0.5 }]}
                >
                    {isSaving ? <ActivityIndicator size="small" color="#fff" /> : <Save size={20} color="#fff" />}
                </TouchableScale>
            </View>

            {isLoading ? (
                <View style={st.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.gold} />
                </View>
            ) : (
                <ScrollView contentContainerStyle={st.contentContainer} showsVerticalScrollIndicator={false}>

                    {/* Weekly Schedule Section */}
                    <Animated.View entering={FadeInDown.delay(100).duration(400)}>
                        <View style={st.sectionHeader}>
                            <View style={st.stepCircle}><Text style={st.stepText}>1</Text></View>
                            <Text style={st.sectionTitle}>7 хоногийн тогтмол цаг</Text>
                        </View>
                        <Text style={st.sectionDesc}>Долоо хоног бүр тогтмол ажиллах цагаа сонгоно уу (00:00 - 24:00)</Text>

                        {DAYS_EN.map((day, idx) => {
                            const dayConfig = schedule.find(s => s.day === day) || { day, active: false, slots: [] };
                            return (
                                <View key={day} style={[st.dayCard, dayConfig.active && st.dayCardActive]}>
                                    <View style={st.dayHeader}>
                                        <Text style={[st.dayTitle, dayConfig.active && { color: COLORS.gold }]}>{DAYS_MN[idx]}</Text>
                                        <Switch
                                            value={dayConfig.active}
                                            onValueChange={() => toggleDayActive(day)}
                                            trackColor={{ false: '#E5E7EB', true: COLORS.gold }}
                                            thumbColor={'#fff'}
                                        />
                                    </View>

                                    {dayConfig.active && (
                                        <View style={st.slotsGrid}>
                                            {ALL_24_SLOTS.map(time => {
                                                const isActive = dayConfig.slots?.includes(time);
                                                return (
                                                    <TouchableScale
                                                        key={time}
                                                        onPress={() => toggleWeeklySlot(day, time)}
                                                        style={[st.slotBtn, isActive ? st.slotActive : st.slotInactive]}
                                                    >
                                                        <Text style={[st.slotText, isActive ? st.slotTextActive : st.slotTextInactive]}>{time}</Text>
                                                    </TouchableScale>
                                                );
                                            })}
                                        </View>
                                    )}
                                </View>
                            );
                        })}
                    </Animated.View>

                    {/* Blocked Slots Section */}
                    <Animated.View entering={FadeInDown.delay(200).duration(400)} style={{ marginTop: 20 }}>
                        <View style={st.sectionHeader}>
                            <View style={st.stepCircle}><Text style={st.stepText}>2</Text></View>
                            <Text style={st.sectionTitle}>Тусгай өдөр тохируулах</Text>
                        </View>
                        <Text style={st.sectionDesc}>Тодорхой өдрийн цагийг хаах бол өдрөө сонгоно уу</Text>

                        <View style={st.exceptionCard}>
                            <View style={st.datePickerRow}>
                                <TouchableScale
                                    style={st.dateSelectBtn}
                                    onPress={() => setDatePickerVisible(true)}
                                >
                                    <CalendarIcon size={18} color={COLORS.textMid} />
                                    <Text style={st.dateSelectText}>{selectedBlockDate}</Text>
                                </TouchableScale>

                                <TouchableScale
                                    style={[st.blockDayBtn, isWholeDayBlocked ? st.unblockBtn : st.blockBtn]}
                                    onPress={toggleBlockWholeDay}
                                >
                                    <Text style={[st.blockDayText, isWholeDayBlocked ? st.unblockText : st.blockText]}>
                                        {isWholeDayBlocked ? 'Өдрийг нээх' : 'Өдрийг хаах'}
                                    </Text>
                                </TouchableScale>
                            </View>

                            <View style={st.slotsGrid}>
                                {ALL_24_SLOTS.map(time => {
                                    const isBlocked = blockedSlots.some(b => b.date === selectedBlockDate && b.time === time);
                                    return (
                                        <TouchableScale
                                            key={time}
                                            onPress={() => toggleBlockSlot(time)}
                                            style={[st.slotBtn, isBlocked ? st.slotBlocked : st.slotAvailableForBlock]}
                                        >
                                            <Text style={[st.slotBlockedText, isBlocked ? st.slotTextBlocked : st.slotTextAvailable]}>{time}</Text>
                                            {isBlocked && <Ban size={10} color="#DC2626" style={{ marginTop: 2 }} />}
                                        </TouchableScale>
                                    );
                                })}
                            </View>
                        </View>
                    </Animated.View>

                </ScrollView>
            )}

            {/* Date Picker Modal */}
            <Modal visible={isDatePickerVisible} transparent animationType="fade">
                <View style={st.modalOverlay}>
                    <View style={st.modalContent}>
                        <View style={st.modalHeader}>
                            <Text style={st.modalTitle}>Өдөр сонгох</Text>
                            <TouchableScale onPress={() => setDatePickerVisible(false)} style={st.closeIcon}>
                                <X size={20} color={COLORS.text} />
                            </TouchableScale>
                        </View>
                        <Calendar
                            current={selectedBlockDate}
                            onDayPress={(day: any) => {
                                setSelectedBlockDate(day.dateString);
                                setDatePickerVisible(false);
                            }}
                            minDate={new Date().toISOString().split('T')[0]}
                            theme={{
                                todayTextColor: COLORS.gold,
                                arrowColor: COLORS.gold,
                                selectedDayBackgroundColor: COLORS.gold,
                            }}
                            markedDates={{
                                [selectedBlockDate]: { selected: true, selectedColor: COLORS.gold }
                            }}
                        />
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const st = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border,
        backgroundColor: COLORS.bg,
    },
    backBtn: {
        width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.85)',
        borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center',
    },
    saveBtn: {
        width: 44, height: 44, borderRadius: 14, backgroundColor: COLORS.gold, alignItems: 'center', justifyContent: 'center',
        ...SHADOWS.gold,
    },
    headerTitle: { fontFamily: SERIF, fontSize: 18, fontWeight: '700', color: COLORS.text },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    contentContainer: { padding: 20, paddingBottom: 100 },

    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    stepCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.gold, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
    stepText: { color: '#fff', fontSize: 12, fontWeight: '800' },
    sectionTitle: { fontFamily: SERIF, fontSize: 16, fontWeight: '700', color: COLORS.textMid, textTransform: 'uppercase' },
    sectionDesc: { fontSize: 12, color: COLORS.textLight, marginBottom: 16, marginLeft: 34 },

    dayCard: {
        backgroundColor: 'rgba(250,250,245,0.8)', borderRadius: 16, borderWidth: 1, borderColor: COLORS.border,
        padding: 16, marginBottom: 12, opacity: 0.6
    },
    dayCardActive: {
        backgroundColor: '#fff', borderColor: 'rgba(217, 119, 6, 0.2)', opacity: 1,
        ...SHADOWS.card
    },
    dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    dayTitle: { fontFamily: SERIF, fontSize: 18, fontWeight: '700', color: COLORS.text },

    slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    slotBtn: {
        paddingVertical: 6, paddingHorizontal: 4, borderRadius: 8, borderWidth: 1, width: '15%',
        alignItems: 'center', justifyContent: 'center'
    },
    slotActive: { backgroundColor: 'rgba(217, 119, 6, 0.1)', borderColor: 'rgba(217, 119, 6, 0.3)' },
    slotInactive: { backgroundColor: '#FEF2F2', borderColor: '#FEE2E2', opacity: 0.5 },
    slotText: { fontSize: 11, fontWeight: '700' },
    slotTextActive: { color: COLORS.gold },
    slotTextInactive: { color: '#DC2626', textDecorationLine: 'line-through' },

    exceptionCard: {
        backgroundColor: '#F8FAFC', borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9',
        padding: 16, marginBottom: 12
    },
    datePickerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    dateSelectBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff',
        paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border
    },
    dateSelectText: { fontFamily: SERIF, fontSize: 14, fontWeight: '600', color: COLORS.text },

    blockDayBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12 },
    blockBtn: { backgroundColor: '#FEF2F2' },
    unblockBtn: { backgroundColor: '#DCFCE7' },
    blockDayText: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
    blockText: { color: '#DC2626' },
    unblockText: { color: '#166534' },

    slotBlockedText: { fontSize: 11, fontWeight: '700' },
    slotBlocked: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
    slotAvailableForBlock: { backgroundColor: '#fff', borderColor: COLORS.border },
    slotTextBlocked: { color: '#DC2626' },
    slotTextAvailable: { color: COLORS.textMid },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: '#fff', borderRadius: 24, padding: 20, overflow: 'hidden' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    modalTitle: { fontFamily: SERIF, fontSize: 18, fontWeight: '700' },
    closeIcon: { padding: 4 }
});
