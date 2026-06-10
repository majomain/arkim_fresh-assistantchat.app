'use client';

import { MessageType, MessageUserRole } from '@/providers/ChatProvider';
import { createContext } from 'react';

import { StreamingDataType } from '@/lib/streamline-chat-handler';

export type ResponseAlertType = {
    id: string;
    threadId: string;
    title: string;
    description: string;
    timestamp?: number;
};

type ChatContextType = {
    sse: StreamingDataType;
    areMessagesLoading: boolean;
    messages: MessageType[] | [];
    setMessages: (message: MessageType[] | []) => void;
    postMessageAsync: (
        content: any,
        userAssetId: string | null,
        threadId: string,
        isWorkOrder: boolean,
        threadTitle?: string,
        workOrderData?: {
            workOrderId: string;
            dueDate: string;
            title: string;
        },
        role?: MessageUserRole,
        attachmentUrls?: string[],
    ) => void;
    responseAlerts: ResponseAlertType[] | [];
    removeResponseAlert: (id: string) => void;
    processingThreads: Record<string, string | null>;
    processedThreads: Record<string, string | null>;
    removeProcessedThread: (id: string) => void;
};

export const ChatContext = createContext<ChatContextType>({
    sse: {
        isPosting: false,
        reasoning: {},
        response: '',
        thinking: [],
    },
    areMessagesLoading: false,
    messages: [],
    setMessages: (message: MessageType[] | []) => {},
    postMessageAsync: async () => {},
    responseAlerts: [],
    removeResponseAlert: (id: string) => {},
    processingThreads: {},
    processedThreads: {},
    removeProcessedThread: (id: string) => {},
});
