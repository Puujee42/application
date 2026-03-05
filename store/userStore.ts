import { create } from 'zustand';
import { User } from '../src/types/schema';
import { getAuthMe, getUserById, getMonkById } from '../lib/api';
import authApi from '../lib/authApi';

interface UserState {
    user: User | null;
    isLoading: boolean;
    error: string | null;
    fetchProfile: () => Promise<void>;
    updateProfile: (data: Partial<User>) => Promise<void>;
    setUser: (user: User | null) => void;
    clearUser: () => void;
}

export const useUserStore = create<UserState>((set) => ({
    user: null,
    isLoading: false,
    error: null,

    // Uses the EXACT same flow as parent website dashboard:
    // Step 1: GET /api/auth/me → identifies current user
    // Step 2: GET /api/users/{id} → gets full user document
    // Step 3: If monk, GET /api/monks/{id} → gets monk-specific data
    fetchProfile: async () => {
        set({ isLoading: true, error: null });
        try {
            // Step 1: GET /api/auth/me (same as parent dashboard)
            const authData = await getAuthMe();

            if (!authData?.user) {
                set({ user: null, isLoading: false });
                return;
            }

            const authUser = authData.user;
            const userId = authUser._id?.toString() || authUser.id;

            // Step 2: GET /api/users/{id} (same as parent dashboard)
            let fullUser: any;
            try {
                fullUser = await getUserById(userId);
            } catch {
                // Fallback to auth/me data if /users/{id} fails
                fullUser = authUser;
            }

            // Step 3: If monk, GET /api/monks/{id} (same as parent)
            if (fullUser?.role === 'monk' && fullUser?._id) {
                try {
                    const monkData = await getMonkById(fullUser._id.toString());
                    // Merge monk-specific data on top of user data
                    fullUser = { ...fullUser, ...monkData, _id: fullUser._id };
                } catch {
                    console.log('Could not fetch monk profile, using user data');
                }
            }

            set({ user: fullUser as any, isLoading: false });
        } catch (error: any) {
            console.error('Failed to fetch profile:', error);
            set({ error: error.message || 'Failed to fetch profile', isLoading: false });
        }
    },

    updateProfile: async (data: Partial<User>) => {
        set({ isLoading: true, error: null });
        try {
            await authApi.updateProfile(data);
            const store = useUserStore.getState();
            await store.fetchProfile();
        } catch (error: any) {
            console.error('Failed to update profile:', error);
            set({ error: error.message || 'Failed to update profile', isLoading: false });
            throw error;
        }
    },

    setUser: (user) => set({ user }),
    clearUser: () => set({ user: null, error: null }),
}));
