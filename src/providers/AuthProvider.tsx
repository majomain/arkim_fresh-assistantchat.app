'use client';

import { STORAGE_KEYS } from '@/config/constant';
import {
    getDevMockContext,
    isAuthBypassEnabled,
    setupDevAuthSession,
} from '@/config/devAuthBypass';
import { AuthContext, UserType } from '@/contexts/AuthContext';
import authService from '@/services/api/authService';
import oidcAuthService from '@/services/auth/oidcAuthService';
import { UserDetail } from '@/types/user/user';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { errorToast } from '@/components/ui/sonner';

import { clearAllDraft } from '@/utils/draft-mechanism';

export default function AuthProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [user, setUser] = useState<UserType | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { setTheme } = useTheme();

    // Ref to prevent concurrent / re-entrant loadSession calls
    const loadingRef = useRef(false);

    // Stable router ref — prevents router identity changes from
    // destabilizing loadSession's useCallback dependencies
    const routerRef = useRef(router);
    useEffect(() => {
        routerRef.current = router;
    }, [router]);

    // Stable setTheme ref for the same reason
    const setThemeRef = useRef(setTheme);
    useEffect(() => {
        setThemeRef.current = setTheme;
    }, [setTheme]);

    const saveUserDetail = useCallback((context: UserDetail) => {
        setUser({
            id: context.user.email,
            name: `${context.user.firstName} ${context.user.lastName}`,
            firstName: context.user.firstName,
            lastName: context.user.lastName,
            isAdmin: context.user.isAdmin,
            isTechnician: context.user.isTechnician,
            isActive: context.user.isActive,
            email: context.user.email,
            theme: context.user.theme,
            language: context.user.language,
            defaultSite: context.user.defaultSite,
            assignedSites: context.user.assignedSites,
        });

        setThemeRef.current(context.user?.theme ?? 'dark');
    }, []);

    /**
     * Clear local session state and navigate to a path.
     * Does NOT hit Cognito — use this for unauthenticated / forbidden
     * redirects inside loadSession where a full signOut is not appropriate.
     */
    const clearLocalSession = useCallback(async (path: string) => {
        await clearAllDraft();
        oidcAuthService.clearAuthToken();
        setUser(null);
        routerRef.current.replace(path);
    }, []);

    /**
     * Full user-initiated logout — clears backend session and redirects
     * through Cognito. Only call this from explicit user actions.
     */
    const logout = useCallback(async () => {
        try {
            await oidcAuthService.signOut();
            setUser(null);
        } catch (err) {
            console.error('Logout failed:', err);
        }
    }, []);

    const loadSession = useCallback(
        async (route?: string) => {
            // to prevent multiple concurrent calls to loadSession which can cause race conditions and inconsistent state during callbacks from oidcAuthService.signIn and signOut
            if (
                typeof window !== 'undefined' &&
                window.location.pathname === '/signin-oidc'
            ) {
                setLoading(false);
                loadingRef.current = false;
                return;
            }

            // Avoid a redundant router.replace('/login') when already on /login.
            // On Safari, that navigation triggers an RSC fetch which fails after a
            // cross-origin Cognito redirect, causing an infinite reload loop.
            const isLoginPage =
                typeof window !== 'undefined' &&
                window.location.pathname === '/login';

            if (loadingRef.current) return;
            loadingRef.current = true;
            setLoading(true);

            try {
                if (isAuthBypassEnabled()) {
                    setupDevAuthSession();
                    const context = getDevMockContext();
                    saveUserDetail(context);
                    if (route) routerRef.current.replace(route);
                    return;
                }

                // If a logout is in progress, skip auth checks (Safari Cognito redirect loop guard).
                if (oidcAuthService.isSigningOut()) {
                    return;
                }

                let authenticated = oidcAuthService.isAuthenticated();

                if (!authenticated) {
                    try {
                        const response = await authService.refreshTokens();
                        if (response.idToken) {
                            oidcAuthService.setAuthToken(response.idToken);
                            authenticated = true;
                        }
                    } catch {
                        // No valid session — user needs to login
                    }
                }

                if (!authenticated) {
                    if (!isLoginPage) {
                        clearLocalSession('/login');
                    }
                    return;
                }

                // Check if company is selected
                const selectedCompanyId = localStorage.getItem(
                    STORAGE_KEYS.SELECTED_COMPANY_ID,
                );

                if (!selectedCompanyId) {
                    console.log(
                        'No company selected, user context will be loaded after company selection',
                    );
                    setUser(null);
                    routerRef.current.replace('/company-select');
                    return;
                }

                let context = null;
                try {
                    context = await authService.getContext();
                } catch (err) {
                    console.error('Failed to fetch context:', err);
                    // Context fetch failed — clear local session only, don't full-logout
                    if (!isLoginPage) {
                        clearLocalSession('/login');
                    }
                    return;
                }

                if (context.user.isAdmin || context.user.isTechnician) {
                    saveUserDetail(context);

                    if (route) routerRef.current.replace(route);
                } else {
                    localStorage.removeItem(STORAGE_KEYS.SELECTED_COMPANY_ID);

                    errorToast({
                        title: 'Forbidden',
                        description:
                            "You don't have the right permission to access the company",
                    });

                    // Permission denied — clear local state and redirect to company select
                    // so the user can pick a different company without a full Cognito logout
                    setUser(null);
                    routerRef.current.replace('/company-select');
                }
            } catch (err) {
                console.error('Failed to fetch session:', err);
                clearLocalSession('/login');
            } finally {
                setLoading(false);
                loadingRef.current = false;
            }
        },
        [saveUserDetail, clearLocalSession],
    ); // router intentionally excluded — using routerRef

    const login = useCallback(async () => {
        await oidcAuthService.signIn('/');
    }, []);

    const updateLang = useCallback((lang: UserType['language']) => {
        setUser((prev) => {
            if (prev === null) return null;
            return { ...prev, language: lang };
        });
    }, []);

    const refreshSession = useCallback(
        async (route?: string) => {
            // Reset the guard so a manual refresh is always allowed
            loadingRef.current = false;
            await loadSession(route);
        },
        [loadSession],
    );

    // Run once on mount — loadSession is stable so this won't loop
    useEffect(() => {
        loadSession();
    }, [loadSession]);

    const contextValue = useMemo(
        () => ({
            user,
            loading,
            login,
            logout,
            refreshSession,
            updateLang,
        }),
        [user, loading, login, logout, refreshSession, updateLang],
    );

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
}
