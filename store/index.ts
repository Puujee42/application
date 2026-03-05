import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserState {
    language: string;
    theme: 'light' | 'dark' | 'system';
    setLanguage: (lang: string) => void;
    setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useUserStore = create<UserState>()(
    persist(
        (set) => ({
            language: 'en',
            theme: 'system',
            setLanguage: (language) => set({ language }),
            setTheme: (theme) => set({ theme }),
        }),
        {
            name: 'user-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);

interface BookingState {
    selectedMonk: string | null;
    selectedDate: Date | null;
    selectedTimeSlot: string | null;
    setSelectedMonk: (id: string | null) => void;
    setSelectedDate: (date: Date | null) => void;
    setSelectedTimeSlot: (slot: string | null) => void;
    clearBooking: () => void;
}

export const useBookingStore = create<BookingState>((set) => ({
    selectedMonk: null,
    selectedDate: null,
    selectedTimeSlot: null,
    setSelectedMonk: (id) => set({ selectedMonk: id }),
    setSelectedDate: (date) => set({ selectedDate: date }),
    setSelectedTimeSlot: (slot) => set({ selectedTimeSlot: slot }),
    clearBooking: () =>
        set({
            selectedMonk: null,
            selectedDate: null,
            selectedTimeSlot: null,
        }),
}));

interface FavoritesState {
    favoriteMonks: string[];
    toggleMonkFavorite: (id: string) => void;
}

export const useFavoritesStore = create<FavoritesState>()(
    persist(
        (set, get) => ({
            favoriteMonks: [],
            toggleMonkFavorite: (id) => {
                const { favoriteMonks } = get();
                if (favoriteMonks.includes(id)) {
                    set({ favoriteMonks: favoriteMonks.filter((m) => m !== id) });
                } else {
                    set({ favoriteMonks: [...favoriteMonks, id] });
                }
            },
        }),
        {
            name: 'favorites-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
