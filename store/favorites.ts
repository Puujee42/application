import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface FavoritesState {
    monks: string[];
    addFavorite: (id: string) => void;
    removeFavorite: (id: string) => void;
    toggleFavorite: (id: string) => void;
    isFavorite: (id: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>()(
    persist(
        (set, get) => ({
            monks: [],
            addFavorite: (id) =>
                set((state) => ({
                    monks: [...new Set([...state.monks, id])],
                })),
            removeFavorite: (id) =>
                set((state) => ({
                    monks: state.monks.filter((itemId) => itemId !== id),
                })),
            toggleFavorite: (id) => {
                const { isFavorite, addFavorite, removeFavorite } = get();
                if (isFavorite(id)) {
                    removeFavorite(id);
                } else {
                    addFavorite(id);
                }
            },
            isFavorite: (id) => get().monks.includes(id),
        }),
        {
            name: 'favorites-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
