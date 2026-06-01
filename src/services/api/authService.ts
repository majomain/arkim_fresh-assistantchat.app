
import axios from 'axios';
import { apiClientCore as apiClient } from './apiClient';
import { UserDetail } from '@/types/user/user';

const authService = {
    exchangeTokens: async (
        idToken: string,
        refreshToken: string,
    ): Promise<void> => {
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
        const response =
            await apiClient.get<UserDetail>('/auth/context');
        return response.data;
    },

    signOut: async (idToken?: string) => {
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
