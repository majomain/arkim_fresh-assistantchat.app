import {
    DEV_AUTH_TOKEN,
    getDevMockContext,
    isAuthBypassEnabled,
} from '@/config/devAuthBypass';
import { UserDetail } from '@/types/user/user';
import axios from 'axios';

import { apiClientCore as apiClient } from './apiClient';

const authService = {
    exchangeTokens: async (
        idToken: string,
        refreshToken: string,
    ): Promise<void> => {
        if (isAuthBypassEnabled()) return;

        await axios.post(
            `${apiClient.defaults.baseURL}/auth/signin`,
            { refresh_token: refreshToken },
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${idToken}`,
                },
                withCredentials: true,
            },
        );
    },

    refreshTokens: async (): Promise<{ idToken: string }> => {
        if (isAuthBypassEnabled()) {
            return { idToken: DEV_AUTH_TOKEN };
        }

        const response = await axios.post<{ idToken: string }>(
            `${apiClient.defaults.baseURL}/auth/refresh`,
            {},
            {
                headers: {
                    'Content-Type': 'application/json',
                },
                withCredentials: true,
            },
        );
        return response.data;
    },

    getContext: async (): Promise<UserDetail> => {
        if (isAuthBypassEnabled()) {
            return getDevMockContext();
        }

        const response = await apiClient.get<UserDetail>('/auth/context');
        return response.data;
    },

    signOut: async (idToken?: string) => {
        if (isAuthBypassEnabled()) return;

        const response = await axios.post(
            `${apiClient.defaults.baseURL}/auth/logout`,
            {},
            {
                headers: {
                    'Content-Type': 'application/json',
                    ...(idToken && { Authorization: `Bearer ${idToken}` }),
                },
                withCredentials: true,
            },
        );
        return response.data;
    },
};

export default authService;
