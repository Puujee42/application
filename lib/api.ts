import axios from 'axios';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Monk, Service, Booking, User } from '../src/types/schema';

// Determine base URL based on platform
const getBaseUrl = () => {
    // First check env variable
    if (process.env.EXPO_PUBLIC_API_URL) {
        return process.env.EXPO_PUBLIC_API_URL;
    }

    // Production fallback
    return 'https://gevabal.mn/api';
};

export const API_URL = getBaseUrl();

console.log('API Base URL:', API_URL);

const api = axios.create({
    baseURL: API_URL,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

import { useAuthStore } from '../store/authStore';

// Request interceptor to add auth token (supports both Clerk and custom JWT)
api.interceptors.request.use(async (config) => {
    try {
        const state = useAuthStore.getState();

        // If user is logged in via Custom Auth, use that token
        if (state.isCustomAuth && state.customToken) {
            config.headers.Authorization = `Bearer ${state.customToken}`;
            return config;
        }

        // Try Clerk token
        const clerkToken = await SecureStore.getItemAsync('clerk-db-jwt');
        if (clerkToken) {
            config.headers.Authorization = `Bearer ${clerkToken}`;
            return config;
        }
    } catch (error) {
        console.error('Error getting token', error);
    }
    return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (!error.response) {
            console.error('Сүлжээний алдаа:', error.message);
            console.error('Хандсан URL:', API_URL);
            error.message = `Серверт холбогдож чадсангүй (${API_URL}). Интернэт холболтоо шалгана уу.`;
        } else if (error.response.status === 401) {
            console.error('Зөвшөөрөлгүй хандалт — токен хүчингүй байж магадгүй');
            error.message = 'Нэвтрэх хугацаа дууссан байна. Дахин нэвтэрнэ үү.';
        } else if (error.response.status === 404) {
            error.message = 'Хайсан мэдээлэл олдсонгүй.';
        } else if (error.response.status >= 500) {
            error.message = 'Серверийн алдаа гарлаа. Түр хүлээгээд дахин оролдоно уу.';
        }
        return Promise.reject(error);
    }
);

// ==========================================
// AUTH — Exact same as parent website
// ==========================================

// GET /api/auth/me — Get current authenticated user (same as parent dashboard)
export const getAuthMe = async (): Promise<{ user: any }> => {
    const response = await api.get('/auth/me');
    return response.data;
};

// POST /api/sync-user — Sync Clerk user to MongoDB (same as parent)
export const syncUser = async (): Promise<{ success: boolean }> => {
    const response = await api.post('/sync-user');
    return response.data;
};

// ==========================================
// USERS — Exact same as parent website
// ==========================================

// GET /api/users/{id} — Get user by Clerk ID or MongoDB ID (same as parent dashboard)
export const getUserById = async (id: string): Promise<any> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
};

// GET /api/users/profile — Get current user profile
export const getUserProfile = async (): Promise<User> => {
    const response = await api.get('/users/profile');
    return response.data;
};

// ==========================================
// MONKS — Exact same as parent website
// ==========================================

// GET /api/monks — Get all monks (same as parent)
export const getMonks = async (): Promise<Monk[]> => {
    const response = await api.get('/monks');
    return response.data;
};

// GET /api/monks/{id} — Get monk by ID (same as parent)
export const getMonkById = async (id: string): Promise<Monk> => {
    const response = await api.get(`/monks/${id}`);
    return response.data;
};

// ==========================================
// SERVICES — Exact same as parent website
// ==========================================

// GET /api/services
export const getServices = async (): Promise<Service[]> => {
    const response = await api.get('/services');
    return response.data;
};

// GET /api/services/{id}
export const getServiceById = async (id: string): Promise<Service> => {
    const response = await api.get(`/services/${id}`);
    return response.data;
};

// ==========================================
// BOOKINGS — Exact same as parent website
// ==========================================

// GET /api/bookings?userId={id} — Same as parent dashboard
export const getBookings = async (userId: string): Promise<Booking[]> => {
    const response = await api.get(`/bookings?userId=${userId}`);
    return response.data;
};

// POST /api/bookings — Create booking (same as parent)
export const createBooking = async (bookingData: Partial<Booking>): Promise<{ success: boolean; id: string }> => {
    const response = await api.post('/bookings', bookingData);
    return response.data;
};

// PATCH /api/bookings/{id} — Update booking status (same as parent)
export const cancelBooking = async (bookingId: string): Promise<{ success: boolean }> => {
    const response = await api.patch(`/bookings/${bookingId}`, { status: 'cancelled' });
    return response.data;
};

export const updateBookingStatus = async (bookingId: string, data: { status?: string; callStatus?: string; isManual?: boolean }): Promise<{ success: boolean }> => {
    const response = await api.patch(`/bookings/${bookingId}`, data);
    return response.data;
};

// DELETE /api/bookings/{id}
export const deleteBooking = async (bookingId: string): Promise<void> => {
    await api.delete(`/bookings/${bookingId}`);
};

// ==========================================
// CHAT — Exact same as parent website
// ==========================================

export interface ChatMessage {
    _id?: string;
    bookingId: string;
    senderId: string;
    senderName: string;
    text: string;
    createdAt: string;
}

// GET /api/chat?bookingId={id}
export const getChatMessages = async (bookingId: string): Promise<ChatMessage[]> => {
    const response = await api.get(`/chat?bookingId=${bookingId}`);
    return response.data;
};

// POST /api/chat
export const sendChatMessage = async (bookingId: string, text: string, senderName?: string): Promise<ChatMessage> => {
    const response = await api.post('/chat', { bookingId, text, senderName });
    return response.data;
};

// ==========================================
// LIVEKIT — Exact same as parent website
// ==========================================

// GET /api/livekit?room={room}&username={username}
export const getLivekitToken = async (roomName: string, username: string): Promise<{ token: string }> => {
    const response = await api.get(`/livekit?room=${encodeURIComponent(roomName)}&username=${encodeURIComponent(username)}`);
    return response.data;
};

// ==========================================
// BLOGS — Exact same as parent website
// ==========================================

export interface BlogPost {
    _id: string;
    id: string;
    title: { mn: string; en: string };
    content: { mn: string; en: string };
    date: string;
    cover: string;
    category: string;
    authorName: string;
}

// GET /api/blogs
export const getBlogs = async (): Promise<BlogPost[]> => {
    const response = await api.get('/blogs');
    return response.data;
};

// POST /api/admin/content — Create blog (same as parent ContentManager)
export const createBlog = async (data: {
    titleMn: string;
    titleEn: string;
    contentMn: string;
    contentEn: string;
    date?: string;
    imageUrl?: string;
    userId?: string;
}): Promise<{ success: boolean; id: string }> => {
    const { userId, ...rest } = data;
    const response = await api.post(`/admin/content${userId ? `?userId=${userId}` : ''}`, { ...rest, type: 'blog' });
    return response.data;
};

// PUT /api/admin/content — Update blog (same as parent ContentManager)
export const updateBlog = async (id: string, data: {
    titleMn?: string;
    titleEn?: string;
    contentMn?: string;
    contentEn?: string;
    date?: string;
    imageUrl?: string;
    userId?: string;
}): Promise<{ success: boolean }> => {
    const { userId, ...rest } = data;
    const response = await api.put(`/admin/content${userId ? `?userId=${userId}` : ''}`, { ...rest, id, type: 'blog' });
    return response.data;
};

// DELETE /api/admin/content — Delete blog (same as parent ContentManager)
export const deleteBlog = async (id: string, userId?: string): Promise<{ success: boolean }> => {
    const response = await api.delete(`/admin/content${userId ? `?userId=${userId}` : ''}`, { data: { id, type: 'blog' } });
    return response.data;
};

// Upload image to Cloudinary from device URI
export const uploadImageToCloudinary = async (uri: string): Promise<string> => {
    const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    const formData = new FormData();
    const filename = uri.split('/').pop() || 'photo.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('file', { uri, name: filename, type } as any);
    formData.append('upload_preset', uploadPreset || 'Buddha');
    formData.append('cloud_name', cloudName || '');

    const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: 'POST', body: formData }
    );
    const json = await res.json();
    if (!json.secure_url) throw new Error('Image upload failed');
    return json.secure_url;
};

// ==========================================
// COMMENTS — Exact same as parent website
// ==========================================

export interface Comment {
    _id?: string;
    targetId: string; // The ID of the blog post, service, or object being commented on
    targetType?: string;
    authorId?: string;
    authorName: string;
    text: string;
    karma?: number;
    createdAt?: string;
}

// GET /api/comments
export const getComments = async (): Promise<Comment[]> => {
    const response = await api.get('/comments');
    return response.data;
};

// POST /api/comments
export const postComment = async (commentData: Partial<Comment>): Promise<Comment> => {
    const response = await api.post('/comments', commentData);
    return response.data;
};

export default api;
