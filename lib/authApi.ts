import api from './api';
import { User } from '../src/types/schema';

export interface LoginResponse {
    success: boolean;
    token: string;
    user: User;
    message?: string;
}

export interface SignupResponse {
    message: string;
    userId: string;
}

export const authApi = {
    login: async (phone: string, password: string): Promise<LoginResponse> => {
        const response = await api.post('/auth/client-login', {
            identifier: phone,
            password,
        });
        return response.data;
    },

    signup: async (
        phoneNumber: string,
        password: string,
        extra?: { email?: string; firstName?: string; lastName?: string; dateOfBirth?: string; zodiacYear?: string }
    ): Promise<SignupResponse> => {
        const response = await api.post('/auth/client-signup', {
            phoneNumber,
            password,
            email: extra?.email,
            firstName: extra?.firstName,
            lastName: extra?.lastName,
            dateOfBirth: extra?.dateOfBirth,
            zodiacYear: extra?.zodiacYear,
        });
        return response.data;
    },

    getProfile: async (): Promise<User> => {
        const response = await api.get('/users/profile');
        return response.data;
    },

    updateProfile: async (data: Partial<User>): Promise<User> => {
        const response = await api.put('/users/profile', data);
        return response.data;
    },

    logout: async (): Promise<void> => {
        await api.post('/auth/logout');
    },
};

export default authApi;
