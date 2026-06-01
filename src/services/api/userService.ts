import { CompanyUser } from '@/types/equipment/thread';

import { apiClientCore as apiClient } from './apiClient';

const userService = {
    getCompanyUsers: async (): Promise<CompanyUser[]> => {
        const response = await apiClient.get<CompanyUser[]>('/users/list');
        return response.data ?? [];
    },

    setTheme: async (theme: string) => {
        const response = await apiClient.patch(
            '/users/preferences/theme?theme=' + theme,
            {},
        );
        return response.data;
    },

    setLanguage: async (language: string) => {
        const response = await apiClient.patch(
            '/users/preferences/language?language=' + language,
            {},
        );
        return response.data;
    },

    setDefaultLocation: async (siteId: string) => {
        const response = await apiClient.patch(
            '/users/preferences/site?siteId=' + siteId,
            {},
        );
        return response.data;
    },

    resetPassword: async (oldPassword: string, newPassword: string) => {
        const response = await apiClient.patch('/users/preferences/password', {
            oldPassword,
            newPassword,
        });
        return response.data;
    },
};

export default userService;
