import { create } from 'zustand';
import { RITUALS_DATA, RitualCategory, RitualItem } from '../lib/data/ritualsData';

interface RitualsState {
    categories: RitualCategory[];
    isLoading: boolean;
    error: string | null;
    // We can add actions here if we need to mutate state from Rust backend
    fetchRitualsFromBackend: () => Promise<void>;
    getRitualById: (id: string) => RitualItem | undefined;
}

export const useRitualsStore = create<RitualsState>((set, get) => ({
    categories: RITUALS_DATA, // Initialize with our local static data
    isLoading: false,
    error: null,

    fetchRitualsFromBackend: async () => {
        // Scaffold for when the rust backend actually serves the data instead of just local static file
        set({ isLoading: true, error: null });
        try {
            // const response = await ritualsApi.getRituals();
            // set({ categories: response.data, isLoading: false });

            // Simulating network request for now
            await new Promise(resolve => setTimeout(resolve, 500));
            set({ isLoading: false });
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
        }
    },

    getRitualById: (id: string) => {
        const state = get();
        for (const category of state.categories) {
            const found = category.items.find(item => item.id === id);
            if (found) return found;
        }
        return undefined;
    }
}));
