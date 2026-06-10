import { DEV_COMPANY_ID, DEV_SITE_ID } from '@/config/devAuthBypass';
import { MessageType } from '@/providers/ChatProvider';
import { CompanyDetailList } from '@/types/company/company';
import {
    AssetDetail,
    AssetDetailList,
    AssetWithThreads,
} from '@/types/equipment/asset';
import {
    CompanyUser,
    ThreadDetail,
    ThreadDetailList,
    ThreadStatus,
} from '@/types/equipment/thread';
import { LocationDetailList } from '@/types/location/location';
import {
    WorkOrderDetail,
    WorkOrderDetailList,
    WorkOrderStatus,
} from '@/types/workOrder/workOrder';

const isoDaysFromNow = (days: number): string => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString();
};

const dateOnlyDaysFromNow = (days: number): string =>
    isoDaysFromNow(days).split('T')[0];

export const MOCK_LOCATIONS: LocationDetailList = [
    {
        id: DEV_SITE_ID,
        name: 'Main Plant',
        description: 'Primary manufacturing facility',
        useMetricSystem: true,
        email: 'plant@example.com',
        configuration: {
            timezone: 'America/Chicago',
            language: 'en',
            dateFormat: 'MM/dd/yyyy',
            timeFormat: '12h',
        },
    },
    {
        id: 'dev-site-warehouse',
        name: 'Warehouse East',
        description: 'Secondary storage and distribution',
        useMetricSystem: true,
        configuration: { timezone: 'America/New_York', language: 'en' },
    },
];

export const MOCK_COMPANIES: CompanyDetailList = [
    {
        companyId: DEV_COMPANY_ID,
        companyName: 'Dev Company',
        isAdmin: true,
        isMonitoring: true,
        isTechnician: true,
        isActive: true,
    },
];

export const MOCK_COMPANY_USERS: CompanyUser[] = [
    {
        email: 'dev@localhost',
        firstName: 'Dev',
        lastName: 'User',
        isAdmin: true,
        isTechnician: true,
        isActive: true,
    },
    {
        email: 'tech.smith@example.com',
        firstName: 'Jordan',
        lastName: 'Smith',
        isAdmin: false,
        isTechnician: true,
        isActive: true,
    },
    {
        email: 'tech.lee@example.com',
        firstName: 'Sam',
        lastName: 'Lee',
        isAdmin: false,
        isTechnician: true,
        isActive: true,
    },
];

const baseAsset = (
    id: string,
    name: string,
    manufacturer: string,
    model: string,
    type: string,
): AssetDetail => ({
    id,
    name,
    siteId: DEV_SITE_ID,
    manufacturer,
    model,
    type,
    description: `${name} — demo asset for local UI development`,
    location: 'Building A, Floor 2',
    serialNumber: `SN-${id.toUpperCase()}`,
    minOperatingTemperatureC: 10,
    maxOperatingTemperatureC: 35,
    minOperatingHumidityPercent: 30,
    maxOperatingHumidityPercent: 70,
    status: 1,
    lastMaintenance: dateOnlyDaysFromNow(-14),
    nextMaintenance: dateOnlyDaysFromNow(30),
});

export const MOCK_ASSETS: AssetDetailList = [
    baseAsset('asset-hvac-1', 'HVAC Unit A', 'Carrier', '38MURA', 'HVAC'),
    baseAsset(
        'asset-comp-1',
        'Compressor B',
        'Atlas Copco',
        'GA75',
        'Compressor',
    ),
    baseAsset('asset-chill-1', 'Chiller C', 'Trane', 'CGAM', 'Chiller'),
    baseAsset('asset-pump-1', 'Cooling Pump D', 'Grundfos', 'CR64', 'Pump'),
    baseAsset('asset-boiler-1', 'Boiler E', 'Weil-McLain', 'Ultra', 'Boiler'),
];

export const MOCK_THREADS: ThreadDetailList = [
    {
        threadId: 'thread-open-1',
        assetId: 'asset-hvac-1',
        userEmail: 'dev@localhost',
        companyId: DEV_COMPANY_ID,
        siteId: DEV_SITE_ID,
        createdAtUtc: isoDaysFromNow(-2),
        messageCount: 4,
        isProcessing: false,
        status: 'open',
        currentProcessingStatus: 'idle',
        rate: null,
        title: 'Unusual noise from supply fan',
        startedFromWorkOrder: false,
        workOrderId: null,
    },
    {
        threadId: 'thread-open-2',
        assetId: 'asset-comp-1',
        userEmail: 'dev@localhost',
        companyId: DEV_COMPANY_ID,
        siteId: DEV_SITE_ID,
        createdAtUtc: isoDaysFromNow(-1),
        messageCount: 6,
        isProcessing: false,
        status: 'open',
        currentProcessingStatus: 'idle',
        rate: null,
        title: 'Pressure drop during peak load',
        startedFromWorkOrder: false,
        workOrderId: null,
    },
    {
        threadId: 'thread-open-3',
        assetId: 'asset-chill-1',
        userEmail: 'tech.smith@example.com',
        companyId: DEV_COMPANY_ID,
        siteId: DEV_SITE_ID,
        createdAtUtc: isoDaysFromNow(-3),
        messageCount: 3,
        isProcessing: false,
        status: 'open',
        currentProcessingStatus: 'idle',
        rate: null,
        title: 'Refrigerant leak suspicion',
        startedFromWorkOrder: false,
        workOrderId: null,
    },
    {
        threadId: 'thread-wo-linked',
        assetId: 'asset-pump-1',
        userEmail: 'dev@localhost',
        companyId: DEV_COMPANY_ID,
        siteId: DEV_SITE_ID,
        createdAtUtc: isoDaysFromNow(-5),
        messageCount: 8,
        isProcessing: false,
        status: 'open',
        currentProcessingStatus: 'idle',
        rate: 4,
        title: 'Vibration above baseline',
        startedFromWorkOrder: true,
        workOrderId: 'wo-thread-opened',
        workOrderTitle: 'Inspect pump coupling alignment',
    },
    {
        threadId: 'thread-closed-1',
        assetId: 'asset-boiler-1',
        userEmail: 'dev@localhost',
        companyId: DEV_COMPANY_ID,
        siteId: DEV_SITE_ID,
        createdAtUtc: isoDaysFromNow(-10),
        messageCount: 12,
        isProcessing: false,
        status: 'closed',
        currentProcessingStatus: 'idle',
        rate: 5,
        title: 'Annual combustion analysis',
        startedFromWorkOrder: false,
        workOrderId: null,
        ratedAtUtc: isoDaysFromNow(-8),
    },
];

export const MOCK_WORK_ORDERS: WorkOrderDetailList = [
    {
        id: 'wo-open-1',
        assetId: 'asset-hvac-1',
        assetName: 'HVAC Unit A',
        siteId: DEV_SITE_ID,
        companyId: DEV_COMPANY_ID,
        title: 'Replace air filter bank',
        description: 'Quarterly filter replacement per PM schedule.',
        dueDate: dateOnlyDaysFromNow(2),
        assignedUserEmails: ['dev@localhost', 'tech.smith@example.com'],
        status: 'open',
        sourceType: 'maintenance_task',
        isArchived: false,
        threadOpenedBy: null,
        threadId: null,
        createdAtUtc: isoDaysFromNow(-7),
        createdBy: 'system',
    },
    {
        id: 'wo-thread-opened',
        assetId: 'asset-pump-1',
        assetName: 'Cooling Pump D',
        siteId: DEV_SITE_ID,
        companyId: DEV_COMPANY_ID,
        title: 'Inspect pump coupling alignment',
        description: 'Follow up on elevated vibration readings.',
        dueDate: dateOnlyDaysFromNow(1),
        assignedUserEmails: ['dev@localhost'],
        status: 'thread_opened',
        sourceType: 'chat',
        isArchived: false,
        threadOpenedBy: 'dev@localhost',
        threadId: 'thread-wo-linked',
        threadOpenedAtUtc: isoDaysFromNow(-1),
        createdAtUtc: isoDaysFromNow(-4),
        createdBy: 'dev@localhost',
    },
    {
        id: 'wo-open-2',
        assetId: 'asset-comp-1',
        assetName: 'Compressor B',
        siteId: DEV_SITE_ID,
        companyId: DEV_COMPANY_ID,
        title: 'Lubricate drive motor bearings',
        description: 'Use OEM-spec grease; record serial numbers.',
        dueDate: dateOnlyDaysFromNow(5),
        assignedUserEmails: ['tech.lee@example.com'],
        status: 'open',
        sourceType: 'manual',
        isArchived: false,
        threadOpenedBy: null,
        threadId: null,
        createdAtUtc: isoDaysFromNow(-2),
        createdBy: 'dev@localhost',
    },
    {
        id: 'wo-completed-1',
        assetId: 'asset-chill-1',
        assetName: 'Chiller C',
        siteId: DEV_SITE_ID,
        companyId: DEV_COMPANY_ID,
        title: 'Calibrate temperature sensors',
        description: 'Completed during last shutdown window.',
        dueDate: dateOnlyDaysFromNow(-3),
        assignedUserEmails: ['dev@localhost'],
        status: 'completed',
        sourceType: 'maintenance_task',
        isArchived: false,
        threadOpenedBy: null,
        threadId: null,
        createdAtUtc: isoDaysFromNow(-14),
        createdBy: 'system',
        workLogs: [
            {
                outcome: 'fixed',
                comments: 'Sensors recalibrated within ±0.5°C tolerance.',
                performedBy: 'dev@localhost',
                performedByFirstName: 'Dev',
                performedByLastName: 'User',
                performedAtUtc: isoDaysFromNow(-3),
            },
        ],
    },
    {
        id: 'wo-open-3',
        assetId: 'asset-boiler-1',
        assetName: 'Boiler E',
        siteId: DEV_SITE_ID,
        companyId: DEV_COMPANY_ID,
        title: 'Test safety relief valve',
        description: 'Document set pressure and reseat behavior.',
        dueDate: dateOnlyDaysFromNow(7),
        assignedUserEmails: ['dev@localhost', 'tech.lee@example.com'],
        status: 'open',
        sourceType: 'integration',
        isArchived: false,
        threadOpenedBy: null,
        threadId: null,
        createdAtUtc: isoDaysFromNow(-1),
        createdBy: 'integration',
    },
    {
        id: 'wo-cancelled-1',
        assetId: 'asset-hvac-1',
        assetName: 'HVAC Unit A',
        siteId: DEV_SITE_ID,
        companyId: DEV_COMPANY_ID,
        title: 'Duplicate work order — cancelled',
        description: 'Merged into wo-open-1.',
        dueDate: dateOnlyDaysFromNow(2),
        assignedUserEmails: ['dev@localhost'],
        status: 'cancelled',
        sourceType: 'manual',
        isArchived: false,
        threadOpenedBy: null,
        threadId: null,
        cancelledBy: 'dev@localhost',
        cancelledAtUtc: isoDaysFromNow(-1),
        cancellationReason: 'Duplicate',
        createdAtUtc: isoDaysFromNow(-6),
    },
];

const MOCK_MESSAGES: Record<string, MessageType[]> = {
    'thread-open-1': [
        {
            threadId: 'thread-open-1',
            messageId: 'msg-1',
            timestamp: isoDaysFromNow(-2),
            role: 'user',
            userEmail: 'dev@localhost',
            content:
                'The supply fan on HVAC Unit A has been making a rattling sound for the past hour.',
            rate: 0,
        },
        {
            threadId: 'thread-open-1',
            messageId: 'msg-2',
            timestamp: isoDaysFromNow(-2),
            role: 'assistant',
            userEmail: 'assistant',
            content:
                'A rattling supply fan often points to loose mounting hardware, debris in the blower wheel, or worn bearings. I recommend inspecting the fan belt tension and checking for foreign objects in the intake.',
            rate: 0,
        },
        {
            threadId: 'thread-open-1',
            messageId: 'msg-3',
            timestamp: isoDaysFromNow(-1),
            role: 'user',
            userEmail: 'dev@localhost',
            content: 'Belt looks slightly frayed on the outer edge.',
            rate: 0,
        },
        {
            threadId: 'thread-open-1',
            messageId: 'msg-4',
            timestamp: isoDaysFromNow(-1),
            role: 'assistant',
            userEmail: 'assistant',
            content:
                'Replace the belt before it fails completely. Match OEM part number and re-tension per manufacturer spec after installation.',
            rate: 0,
        },
    ],
    'thread-wo-linked': [
        {
            threadId: 'thread-wo-linked',
            messageId: 'msg-w1',
            timestamp: isoDaysFromNow(-5),
            role: 'user',
            userEmail: 'dev@localhost',
            content:
                'Vibration readings on Cooling Pump D are 40% above baseline.',
            rate: 0,
        },
        {
            threadId: 'thread-wo-linked',
            messageId: 'msg-w2',
            timestamp: isoDaysFromNow(-4),
            role: 'assistant',
            userEmail: 'assistant',
            content:
                'Check coupling alignment and foundation bolts. Misalignment is a common cause of elevated vibration on rotating equipment.',
            rate: 0,
        },
    ],
};

const defaultMessages = (threadId: string): MessageType[] => [
    {
        threadId,
        messageId: `${threadId}-msg-1`,
        timestamp: isoDaysFromNow(-1),
        role: 'user',
        userEmail: 'dev@localhost',
        content: 'Can you summarize the recommended next steps for this asset?',
        rate: 0,
    },
    {
        threadId,
        messageId: `${threadId}-msg-2`,
        timestamp: isoDaysFromNow(-1),
        role: 'assistant',
        userEmail: 'assistant',
        content:
            'Review recent maintenance logs, verify sensor readings, and schedule a physical inspection if anomalies persist.',
        rate: 0,
    },
];

export const getMockLocations = (): LocationDetailList => [...MOCK_LOCATIONS];

export const getMockLocationById = (id: string) =>
    MOCK_LOCATIONS.find((loc) => loc.id === id) ?? MOCK_LOCATIONS[0];

export const getMockCompanies = (): CompanyDetailList => [...MOCK_COMPANIES];

export const getMockCompanyUsers = (): CompanyUser[] => [...MOCK_COMPANY_USERS];

export const getMockAssets = (
    siteId?: string | null,
    search?: string | null,
): AssetDetailList => {
    let list = MOCK_ASSETS.filter((a) => !siteId || a.siteId === siteId);
    if (search?.trim()) {
        const q = search.trim().toLowerCase();
        list = list.filter(
            (a) =>
                a.name.toLowerCase().includes(q) ||
                a.manufacturer.toLowerCase().includes(q) ||
                a.model.toLowerCase().includes(q),
        );
    }
    return list;
};

export const getMockAssetWithThreads = (id: string): AssetWithThreads => {
    const asset = MOCK_ASSETS.find((a) => a.id === id) ?? MOCK_ASSETS[0];
    const threads = filterMockThreads({
        siteId: asset.siteId,
        assetId: asset.id,
    });
    return { ...asset, threads };
};

export const filterMockThreads = (params: {
    siteId: string;
    assetId?: string | null;
    status?: ThreadStatus | null;
    search?: string | null;
}): ThreadDetailList => {
    let list = MOCK_THREADS.filter((t) => t.siteId === params.siteId);

    if (params.assetId) {
        list = list.filter((t) => t.assetId === params.assetId);
    }
    if (params.status) {
        list = list.filter((t) => t.status === params.status);
    }
    if (params.search?.trim()) {
        const q = params.search.trim().toLowerCase();
        list = list.filter((t) => t.title.toLowerCase().includes(q));
    }
    return list;
};

export const getMockThreadById = (threadId: string): ThreadDetail => {
    const thread = MOCK_THREADS.find((t) => t.threadId === threadId);
    if (!thread) {
        throw new Error(`Mock thread not found: ${threadId}`);
    }
    return thread;
};

export const getMockMessagesByThread = (threadId: string): MessageType[] =>
    MOCK_MESSAGES[threadId] ?? defaultMessages(threadId);

export const filterMockWorkOrders = (params: {
    siteId?: string | null;
    assetId?: string | null;
    status?: WorkOrderStatus | null;
    search?: string | null;
    endDate?: string | null;
}): WorkOrderDetailList => {
    let list: WorkOrderDetail[] = [...MOCK_WORK_ORDERS];

    if (params.siteId) {
        list = list.filter((wo) => wo.siteId === params.siteId);
    }
    if (params.assetId) {
        list = list.filter((wo) => wo.assetId === params.assetId);
    }
    if (params.status) {
        list = list.filter((wo) => wo.status === params.status);
    }
    if (params.endDate) {
        list = list.filter((wo) => wo.dueDate <= params.endDate!);
    }
    if (params.search?.trim()) {
        const q = params.search.trim().toLowerCase();
        list = list.filter(
            (wo) =>
                wo.title.toLowerCase().includes(q) ||
                wo.description.toLowerCase().includes(q) ||
                wo.assetName.toLowerCase().includes(q),
        );
    }
    return list;
};
