import axios from 'axios';

// Replace with actual rust-service endpoint (e.g. 10.0.2.2 for Android emulator pointing to localhost:8080)
// Or use your local Wi-Fi IP if physical device
const RUST_SERVICE_URL = process.env.EXPO_PUBLIC_RUST_API_URL || 'http://127.0.0.1:8080';

const api = axios.create({
    baseURL: RUST_SERVICE_URL,
    timeout: 5000,
});

export const ritualsApi = {
    processData: async (items: number[]) => {
        try {
            const response = await api.post('/process', { items });
            return response.data;
        } catch (error) {
            console.error('Failed to communicate with Rust service:', error);
            throw error;
        }
    },

    // Future endpoints
    // getRituals: async () => {
    //   const response = await api.get('/rituals');
    //   return response.data;
    // },
};
