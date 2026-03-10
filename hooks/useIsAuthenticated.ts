import { useAuth } from '../lib/useClerkSafe';
import { useAuthStore } from '../store/authStore';

export function useIsAuthenticated(): boolean {
    const { isCustomAuth } = useAuthStore();
    const { isSignedIn } = useAuth();
    return !!(isCustomAuth || isSignedIn);
}
