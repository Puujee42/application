import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create persister for offline support
export const asyncStoragePersister = createAsyncStoragePersister({
    storage: AsyncStorage,
});

// Create QueryClient with offline-first configuration
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            gcTime: 1000 * 60 * 60 * 24, // 24 hours
            staleTime: 1000 * 60 * 5, // 5 minutes
            refetchOnWindowFocus: true,
            refetchOnReconnect: true,
            retry: 2,
        },
        mutations: {
            retry: 2,
        },
    },
});
