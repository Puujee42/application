import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { User } from '../src/types/schema';
import api from '../lib/api';

const CUSTOM_AUTH_TOKEN_KEY = 'custom-auth-jwt';

interface AuthState {
    customToken: string | null;
    customUser: User | null;
    isCustomAuth: boolean;
    isLoading: boolean;
    error: string | null;
    login: (phone: string, password: string) => Promise<void>;
    signup: (phone: string, password: string, extra?: { email?: string; firstName?: string; lastName?: string; dateOfBirth?: string; zodiacYear?: string }) => Promise<void>;
    logout: () => Promise<void>;
    setCustomAuth: (token: string, user: User) => Promise<void>;
    clearCustomAuth: () => Promise<void>;
    hydrateToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            customToken: null,
            customUser: null,
            isCustomAuth: false,
            isLoading: false,
            error: null,

            login: async (phone: string, password: string) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await api.post('/auth/client-login', {
                        identifier: phone,
                        password,
                    });

                    if (response.data.success && response.data.token) {
                        const { token, user } = response.data;
                        await SecureStore.setItemAsync(CUSTOM_AUTH_TOKEN_KEY, token);
                        set({
                            customToken: token,
                            customUser: user,
                            isCustomAuth: true,
                            isLoading: false,
                        });
                    } else {
                        throw new Error(response.data.message || 'Login failed');
                    }
                } catch (error: any) {
                    const message = error.response?.data?.message || error.message || 'Login failed';
                    set({ error: message, isLoading: false });
                    throw new Error(message);
                }
            },

            signup: async (phone: string, password: string, extra?: { email?: string; firstName?: string; lastName?: string; dateOfBirth?: string; zodiacYear?: string }) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await api.post('/auth/client-signup', {
                        phoneNumber: phone,
                        password,
                        email: extra?.email,
                        firstName: extra?.firstName,
                        lastName: extra?.lastName,
                        dateOfBirth: extra?.dateOfBirth,
                        zodiacYear: extra?.zodiacYear,
                    });

                    if (response.data.userId) {
                        // After signup, automatically login
                        await get().login(phone, password);
                    } else {
                        throw new Error(response.data.message || 'Signup failed');
                    }
                } catch (error: any) {
                    const message = error.response?.data?.message || error.message || 'Signup failed';
                    set({ error: message, isLoading: false });
                    throw new Error(message);
                }
            },

            logout: async () => {
                try {
                    await SecureStore.deleteItemAsync(CUSTOM_AUTH_TOKEN_KEY);
                    set({
                        customToken: null,
                        customUser: null,
                        isCustomAuth: false,
                        error: null,
                    });
                } catch (error) {
                    console.error('Logout error:', error);
                }
            },

            setCustomAuth: async (token: string, user: User) => {
                await SecureStore.setItemAsync(CUSTOM_AUTH_TOKEN_KEY, token);
                set({
                    customToken: token,
                    customUser: user,
                    isCustomAuth: true,
                });
            },

            clearCustomAuth: async () => {
                await SecureStore.deleteItemAsync(CUSTOM_AUTH_TOKEN_KEY);
                set({
                    customToken: null,
                    customUser: null,
                    isCustomAuth: false,
                });
            },

            hydrateToken: async () => {
                try {
                    const token = await SecureStore.getItemAsync(CUSTOM_AUTH_TOKEN_KEY);
                    if (token) {
                        set({ customToken: token, isCustomAuth: true });
                        // Fetch user profile with the token
                        const response = await api.get('/users/profile');
                        if (response.data) {
                            set({ customUser: response.data });
                        }
                    }
                } catch (error) {
                    console.error('Token hydration error:', error);
                    // Clear invalid token
                    await SecureStore.deleteItemAsync(CUSTOM_AUTH_TOKEN_KEY);
                    set({ customToken: null, isCustomAuth: false, customUser: null });
                }
            },
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                isCustomAuth: state.isCustomAuth,
            }),
        }
    )
);
