/**
 * Safe Clerk hooks — returns defaults when ClerkProvider is not in the tree.
 * 
 * Uses a React Context (ClerkAvailableContext) set by _layout.tsx to know
 * whether ClerkProvider is wrapping the current tree, rather than try/catch.
 */

import React, { createContext, useContext } from 'react';
import { useUser as _useUser, useAuth as _useAuth } from '@clerk/clerk-expo';

// ── Context: is Clerk wrapping this tree? ──
export const ClerkAvailableContext = createContext<boolean>(false);

export function useUser() {
    const available = useContext(ClerkAvailableContext);
    if (!available) {
        return { isLoaded: false, isSignedIn: undefined, user: undefined } as unknown as ReturnType<typeof _useUser>;
    }
    return _useUser();
}

export function useAuth() {
    const available = useContext(ClerkAvailableContext);
    if (!available) {
        return {
            isLoaded: false,
            isSignedIn: false,
            userId: null,
            sessionId: null,
            signOut: async () => { },
            getToken: async () => null,
        } as unknown as ReturnType<typeof _useAuth>;
    }
    return _useAuth();
}
