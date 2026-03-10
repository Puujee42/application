import { useEffect, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import api from '../lib/api';
import { useUserStore } from '../store/userStore';

// Defines how the app behaves when a notification is received while the app is in foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export function useBookingNotifications() {
    const { user } = useUserStore();

    const scheduleBookingNotifications = useCallback(async () => {
        if (!user) return;

        // 1. Request Permissions
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('Notification permissions not granted');
            return;
        }

        if (Platform.OS === 'android') {
            Notifications.setNotificationChannelAsync('bookings', {
                name: 'Booking Reminders',
                importance: Notifications.AndroidImportance.HIGH,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#D97706',
            });
        }

        try {
            // 2. Clear all previously scheduled notifications to avoid duplicates when rescheduling
            await Notifications.cancelAllScheduledNotificationsAsync();

            // 3. Fetch upcoming confirmed bookings
            const userId = user._id?.toString() || user.clerkId;
            if (!userId) return;

            const isMonk = user.role === 'monk';
            const param = isMonk ? `monkId=${userId}` : `userId=${userId}`;

            const res = await api.get(`/bookings?${param}`);
            const data = Array.isArray(res.data) ? res.data : (res.data?.bookings || []);

            if (!Array.isArray(data)) return;

            const now = new Date();

            data.forEach((booking: any) => {
                if (booking.status !== 'CONFIRMED' || !booking.bookingDate || !booking.bookingTime) {
                    return; // Skip non-confirmed or invalid bookings
                }

                // Parse the booking date and time. Assuming localized format or pure ISO date string.
                // We'll construct a Date object for the exact start time.
                const [hours, minutes] = booking.bookingTime.split(':').map(Number);
                const bookingDateTime = new Date(booking.bookingDate);
                bookingDateTime.setHours(hours, minutes, 0, 0);

                // If the booking is already in the past, skip
                if (bookingDateTime <= now) return;

                // Time definitions
                const timeStr = booking.bookingTime;

                // Triggers
                const trigger60 = new Date(bookingDateTime.getTime() - 60 * 60 * 1000); // 1 hour before
                const trigger30 = new Date(bookingDateTime.getTime() - 30 * 60 * 1000); // 30 minutes before
                const trigger10 = new Date(bookingDateTime.getTime() - 10 * 60 * 1000); // 10 minutes before

                // 1 Hour Before
                if (trigger60 > now) {
                    Notifications.scheduleNotificationAsync({
                        content: {
                            title: '⏳ Уулзалт удахгүй эхэлнэ',
                            body: `Таны уулзалт 1 цагийн дараа (${timeStr}) эхлэх гэж байна.`,
                            sound: true,
                        },
                        trigger: { date: trigger60, type: 'date' as const } as Notifications.DateTriggerInput,
                    });
                }

                // 30 Minutes Before
                if (trigger30 > now) {
                    Notifications.scheduleNotificationAsync({
                        content: {
                            title: '⏳ Уулзалт удахгүй эхэлнэ',
                            body: `Таны уулзалт 30 минутын дараа (${timeStr}) эхлэх гэж байна.`,
                            sound: true,
                        },
                        trigger: { date: trigger30, type: 'date' as const } as Notifications.DateTriggerInput,
                    });
                }

                // 10 Minutes Before
                if (trigger10 > now) {
                    Notifications.scheduleNotificationAsync({
                        content: {
                            title: '🔥 Уулзалт эхлэхэд бэлэн боллоо',
                            body: `Таны уулзалт ердөө 10 минутын дараа (${timeStr}) эхэлнэ. Апп-аа нээнэ үү.`,
                            sound: true,
                        },
                        trigger: { date: trigger10, type: 'date' as const } as Notifications.DateTriggerInput,
                    });
                }
            });
        } catch (error) {
            console.error('Failed to schedule booking notifications:', error);
        }
    }, [user]);

    // Automatically attempt scheduling when hook is mounted or user changes
    useEffect(() => {
        scheduleBookingNotifications();
    }, [scheduleBookingNotifications]);

    return {
        scheduleBookingNotifications
    };
}
