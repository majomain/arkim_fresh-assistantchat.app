'use cleint';

import {
    ThreadDetail,
    ThreadDetailList,
    ThreadStatus,
} from '@/types/equipment/thread';

import { useBroadcast } from '../use-broadcast';

export type ThreadEvent =
    | { type: 'THREAD_STATUS_UPDATED'; threadId: string; status: ThreadStatus }
    | { type: 'THREAD_CREATED'; thread: ThreadDetail }
    | { type: 'THREAD_TITLE_UPDATED'; threadId: string; title: string };

export function useThreadBroadcast(onMessage?: (event: ThreadEvent) => void) {
    const { emit } = useBroadcast<ThreadEvent>('threads', onMessage);

    // emit that a thread has been updated with the thread details
    const threadStatusUpdated = (threadId: string, status: ThreadStatus) => {
        emit({ type: 'THREAD_STATUS_UPDATED', threadId, status });
    };

    // emit that a new thread has been created with the thread details
    const threadCreated = (thread: ThreadDetail) => {
        emit({ type: 'THREAD_CREATED', thread });
    };

    const threadTitleUpdated = (threadId: string, title: string) => {
        emit({ type: 'THREAD_TITLE_UPDATED', threadId, title });
    };

    return { threadStatusUpdated, threadCreated, threadTitleUpdated };
}
