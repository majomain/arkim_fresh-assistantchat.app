'use client';

import { ThreadDetail } from '@/types/equipment/thread';
import { createContext } from 'react';

export type ThreadContextType = {
    isThreadLoading: boolean;
    currentThread: ThreadDetail | null;
    currentThreadId: string | null;
    currentProcessingThreads: string[] | [];
    setCurrentThreadId: (threadId: string | null) => void;
    setCurrentThread: (threadData: ThreadDetail) => void;
    fetchThreadDetail: (id: string) => void;
    closeThread: (id: string) => Promise<boolean>;
    reportThread: (id: string) => Promise<boolean>;
    isThreadProcessing: (id: string) => boolean;
};

export const ThreadContext = createContext<ThreadContextType>({
    isThreadLoading: false,
    currentThread: null,
    currentThreadId: null,
    currentProcessingThreads: [],
    setCurrentThreadId: () => {},
    setCurrentThread: () => {},
    fetchThreadDetail: () => {},
    closeThread: async () => false,
    reportThread: async () => false,
    isThreadProcessing: () => false,
});
