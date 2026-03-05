import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import { useUserStore } from '../../store/userStore';
import { useAuthStore } from '../../store/authStore';
import { syncUser } from '../../lib/api';

// AuthSync mirrors the EXACT same flow as the parent website:
// 1. GET /api/auth/me — identify current user
// 2. GET /api/users/{id} — fetch full profile
// 3. GET /api/bookings?userId={id} — fetch bookings (done in screens)
// 4. POST /api/sync-user — sync Clerk user to MongoDB
export function AuthSync() {
    const { isSignedIn, getToken, userId } = useAuth();
    const { fetchProfile, clearUser, setUser } = useUserStore();
    const { isCustomAuth, hydrateToken, customToken, customUser } = useAuthStore();
    const [hydrated, setHydrated] = useState(false);

    // Step 1: Hydrate custom auth token on mount
    useEffect(() => {
        const hydrate = async () => {
            await hydrateToken();
            setHydrated(true);
        };
        hydrate();
    }, []);

    // Step 2: Handle Clerk auth sync (same as parent website)
    useEffect(() => {
        if (!hydrated) return;

        const syncClerkAuth = async () => {
            // Skip if using custom auth
            if (isCustomAuth && customToken) {
                return;
            }

            if (isSignedIn && userId) {
                try {
                    // Get the token from Clerk
                    const token = await getToken();
                    if (token) {
                        // Save to SecureStore so api.ts interceptor can use it
                        await SecureStore.setItemAsync('clerk-db-jwt', token);

                        // POST /api/sync-user — same as parent website
                        // This ensures the Clerk user exists in MongoDB
                        try {
                            await syncUser();
                        } catch (e) {
                            console.log('Sync user skipped (might not be needed for custom auth)');
                        }

                        // GET /api/auth/me → GET /api/users/{id} — same as parent
                        await fetchProfile();
                    }
                } catch (error) {
                    console.error('AuthSync Clerk Error:', error);
                }
            } else if (!isCustomAuth) {
                await SecureStore.deleteItemAsync('clerk-db-jwt');
                clearUser();
            }
        };

        syncClerkAuth();
    }, [hydrated, isSignedIn, userId, getToken, isCustomAuth, customToken]);

    // Step 3: Custom auth profile sync — AFTER hydration completes
    useEffect(() => {
        if (!hydrated) return;

        const syncCustomAuth = async () => {
            if (isCustomAuth && customToken) {
                try {
                    // If hydrateToken already fetched user, set it immediately as fallback
                    if (customUser) {
                        setUser(customUser as any);
                    }
                    // GET /api/auth/me → GET /api/users/{id} — same as parent
                    await fetchProfile();
                } catch (error) {
                    console.error('Custom AuthSync Error:', error);
                    if (customUser) {
                        setUser(customUser as any);
                    }
                }
            }
        };

        syncCustomAuth();
    }, [hydrated, isCustomAuth, customToken]);

    return null;
}
