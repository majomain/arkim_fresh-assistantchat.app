'use client';

import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';

export interface SessionUser {
    id: string;
    name: string;
    email: string;
    image?: string;
}

export interface AuthSession {
    user: SessionUser;
}

export const authSessionQueryKey = ['auth', 'session'];

/**
 * Hook to get the current authenticated user session using Cognito
 * This replaces the old useBetterAuthSession hook
 */
export const useAuthSession = () => {
    const { user, loading } = useAuth();

    return useQuery<AuthSession | null>({
        queryKey: authSessionQueryKey,
        queryFn: () => {
            if (!user) return null;
            return {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    image: user.image,
                },
            };
        },
        enabled: !loading,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};
