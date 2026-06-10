export type WorkOrderStatus =
    | 'open'
    | 'thread_opened'
    | 'cancelled'
    | 'completed';

export type WorkOrderSourceType =
    | 'maintenance_task'
    | 'manual'
    | 'chat'
    | 'integration';

export type WorkLogOutcome = 'fixed' | 'not_fixed' | 'partially_fixed';

export interface WorkLogDetail {
    troubleshootingSteps?: string | null;
    parts?:
        | {
              manufacturer?: string | null;
              model?: string | null;
              partNumber?: string | null;
              quantity?: number | null;
              comments?: string | null;
          }[]
        | null;
    outcome?: WorkLogOutcome | null;
    comments?: string | null;
    performedBy?: string | null;
    performedByFirstName?: string | null;
    performedByLastName?: string | null;
    performedAtUtc?: string | null;
}

export type WorkLogDetailList = WorkLogDetail[];

export interface WorkOrderDetail {
    assetId: string;
    dueDate: string;
    title: string;
    description: string;
    assignedUserEmails: string[];
    companyId: string;
    id: string;
    siteId: string;
    createdAtUtc?: string | null;
    createdBy?: string | null;
    assetName: string;
    status: WorkOrderStatus;
    sourceType: WorkOrderSourceType;
    sourceTaskId?: string | null;
    threadId?: string | null;
    threadOpenedBy?: string | null;
    threadOpenedAtUtc?: string | null;
    cancelledBy?: string | null;
    cancelledAtUtc?: string | null;
    cancellationReason?: string | null;
    isArchived: boolean;
    archivedAtUtc?: string | null;
    archivedBy?: string | null;
    workLogs?: WorkLogDetailList | null;
    downtimeMinutes?: number | null;
    attachments?: WorkOrderAttachment[];
}

export interface WorkOrderAttachment {
    attachmentId: string;
    url: string;
    fileName?: string;
    contentType?: string;
    uploadedBy?: string;
    uploadedAtUtc?: string;
}

export type WorkOrderDetailList = WorkOrderDetail[];
