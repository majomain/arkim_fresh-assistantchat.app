import { isAuthBypassEnabled } from '@/config/devAuthBypass';
import {
    filterMockThreads,
    getMockMessagesByThread,
    getMockThreadById,
} from '@/mocks/devMockData';
import { MessageType } from '@/providers/ChatProvider';
import {
    CreateWorkOrderResponse,
    ThreadDetail,
    ThreadDetailList,
    ThreadStatus,
} from '@/types/equipment/thread';

import { apiClientMessaging as apiClient } from './apiClient';

const messagingService = {
    getThreads: async (
        siteId: string,
        assetId?: string | null,
        status?: ThreadStatus | null,
        search?: string | null,
    ): Promise<ThreadDetailList> => {
        if (isAuthBypassEnabled()) {
            return filterMockThreads({ siteId, assetId, status, search });
        }

        let url = `/threads?site_id=${siteId}`;
        if (assetId) url = url + `&asset_id=${assetId}`;
        if (status) url = url + `&status=${status ?? ''}`;
        if (search) url = url + `&search=${search ?? ''}`;

        const response = await apiClient.get<ThreadDetailList>(url);
        return response.data ?? [];
    },

    getThreadById: async (threadId: string): Promise<ThreadDetail> => {
        if (isAuthBypassEnabled()) {
            return getMockThreadById(threadId);
        }

        const response = await apiClient.get<ThreadDetail>(
            `/threads/${threadId}`,
        );
        return response.data;
    },

    getOpenThreads: async (
        siteId: string,
        search?: string | null,
        assetId?: string | null,
    ): Promise<ThreadDetailList> => {
        if (isAuthBypassEnabled()) {
            return filterMockThreads({
                siteId,
                assetId,
                status: 'open',
                search,
            });
        }

        let url = `/threads?site_id=${siteId}&status=open`;
        if (assetId) url = url + `&asset_id=${assetId}`;
        if (search) url = url + `&search=${search ?? ''}`;
        const response = await apiClient.get<ThreadDetailList>(url);
        return response.data ?? [];
    },

    getClosedThreads: async (siteId: string): Promise<ThreadDetailList> => {
        if (isAuthBypassEnabled()) {
            return filterMockThreads({ siteId, status: 'closed' });
        }

        const response = await apiClient.get<ThreadDetailList>(
            `/threads?site_id=${siteId}&status=closed`,
        );
        return response.data ?? [];
    },

    getThreadsByAsset: async (
        assetId: string,
        siteId: string,
        status = '',
    ): Promise<ThreadDetailList> => {
        if (isAuthBypassEnabled()) {
            return filterMockThreads({
                siteId,
                assetId,
                status: (status as ThreadStatus) || null,
            });
        }

        const response = await apiClient.get<ThreadDetailList>(
            `/threads?asset_id=${assetId}&site_id=${siteId}&status=${status}`,
        );
        return response.data ?? [];
    },

    getMessagesByThread: async (threadId: string): Promise<MessageType[]> => {
        if (isAuthBypassEnabled()) {
            return getMockMessagesByThread(threadId);
        }

        const response = await apiClient.get<MessageType[]>(
            `/messages/${threadId}`,
        );
        return response.data ?? [];
    },

    closeThreadById: async (threadId: string): Promise<void> => {
        if (isAuthBypassEnabled()) return;

        const response = await apiClient.post(`/threads/close/${threadId}`);
        return response.data ?? [];
    },

    reportThreadById: async (threadId: string): Promise<void> => {
        if (isAuthBypassEnabled()) return;

        const response = await apiClient.post(`/threads/report/${threadId}`);
        return response.data ?? [];
    },

    getDeepgramToken: async (): Promise<string> => {
        if (isAuthBypassEnabled()) return 'dev-mock-deepgram-token';

        const response = await apiClient.get<{
            access_token: string;
            expires_in: number;
        }>(`/external/deepgram/token?ttl_seconds=3600`);
        return response.data.access_token;
    },

    uploadAttachments: async (
        files: File[],
        assetId: string,
    ): Promise<{ urls: string[] }> => {
        if (isAuthBypassEnabled()) {
            return {
                urls: files.map((_, i) => `https://example.com/mock-${i}.png`),
            };
        }

        const formData = new FormData();
        files.forEach((f) => formData.append('files', f));
        const response = await apiClient.post<{ urls: string[] }>(
            '/attachments/upload?asset_id=' + assetId,
            formData,
        );
        return response.data ?? { urls: [] };
    },

    deleteAttachment: async (url: string): Promise<void> => {
        if (isAuthBypassEnabled()) return;

        await apiClient.delete('/attachments', { data: { url } });
    },

    rateMessage: async (
        threadId: string,
        messageId: string,
        rate: number,
    ): Promise<{
        messageId: string;
        threadId: string;
        rate: number;
        ratedAtUtc: string | null;
    }> => {
        if (isAuthBypassEnabled()) {
            return {
                messageId,
                threadId,
                rate,
                ratedAtUtc: new Date().toISOString(),
            };
        }

        const response = await apiClient.put(
            `/messages/${threadId}/${messageId}/rate`,
            { rate },
        );
        return response.data;
    },

    createWorkOrder: async (
        threadId: string,
        assignedUserEmails: string[],
        dueDate: string,
        includeAttachments?: boolean,
    ): Promise<CreateWorkOrderResponse> => {
        if (isAuthBypassEnabled()) {
            return {
                id: `wo-mock-${threadId}`,
                title: 'Mock work order',
                link: '/work-orders',
            };
        }

        const response = await apiClient.post<CreateWorkOrderResponse>(
            `/threads/${threadId}/create-work-order`,
            {
                assignedUserEmails,
                dueDate,
                ...(includeAttachments && { includeAttachments }),
            },
        );
        return response.data;
    },

    rateThread: async (
        threadId: string,
        rate: number,
        feedback?: string,
    ): Promise<{
        threadId: string;
        rate: number;
        feedback: string | null;
        ratedAtUtc: string;
    }> => {
        if (isAuthBypassEnabled()) {
            return {
                threadId,
                rate,
                feedback: feedback || null,
                ratedAtUtc: new Date().toISOString(),
            };
        }

        const response = await apiClient.put(`/threads/${threadId}/rate`, {
            rate,
            feedback: feedback || null,
        });
        return response.data;
    },
};

export default messagingService;
