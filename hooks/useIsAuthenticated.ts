import { useAuth } from '../lib/useClerkSafe';
import { useAuthStore } from '../store/authStore';

/**
 * Unified authentication check.
 * Returns true if the user is signed in via Clerk OR custom auth (phone+password).
 */
export function useIsAuthenticated(): boolean {
    const { isSignedIn } = useAuth();
    const { isCustomAuth, customToken } = useAuthStore();
    return !!(isSignedIn || (isCustomAuth && customToken));
}
