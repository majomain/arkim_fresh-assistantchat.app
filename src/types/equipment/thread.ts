export type ThreadStatus = 'open' | 'closed' | 'reported';

export type ThreadAction = 'report' | 'close' | 'create-work-order';

export interface CreateWorkOrderResponse {
    id: string;
    title: string;
    link: string;
}

export interface CompanyUser {
    email: string;
    firstName: string;
    lastName: string;
    isAdmin: boolean;
    isTechnician: boolean;
    isActive: boolean;
}

export interface ThreadDetail {
    assetId: string;
    threadId: string;
    userEmail: string;
    companyId: string;
    siteId: string;
    createdAtUtc: string;
    messageCount: number;
    isProcessing: boolean;
    status: ThreadStatus;
    currentProcessingStatus: string;
    rate: number | null;
    feedback?: string | null;
    title: string;
    rootRunId?: string | null;
    ratedAtUtc?: string | null;
    startedFromWorkOrder: boolean;
    workOrderId?: string | null;
    workOrderTitle?: string | null;
}

export type ThreadDetailList = ThreadDetail[];
