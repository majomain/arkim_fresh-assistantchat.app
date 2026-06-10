import { ThreadDetailList } from './thread';

export type AssetStatusType = 'internal_review' | 'completed' | 'failed';

export interface AssetSensor {
    id: string;
    type?: string | null;
    description?: string | null;
    parameter?: string | null;
    unit?: string | null;
    minValue?: number | null;
    maxValue?: number | null;
    alarmThreshold?: number | null;
}

export interface AssetMonitor {
    id: string;
    parameterExpand?: string | null;
    alarmTypeExpand?: string | null;
    conditionExpand?: string | null;
    valueExpand?: number | null;
    priorityExpand?: string | null;
}

export interface AssetDetail {
    id: string;
    name: string;
    description?: string | null;
    type?: string | null;
    minOperatingTemperatureC?: number | null;
    maxOperatingTemperatureC?: number | null;
    minOperatingHumidityPercent?: number | null;
    maxOperatingHumidityPercent?: number | null;
    siteId: string;
    location?: string | null;
    manufacturer: string;
    model: string;
    assetModelId?: string | null;
    serialNumber?: string | null;
    voltage?: string | null;
    current?: string | null;
    phase?: string | null;
    imageUrl?: string | null;
    connectionType?: string | null;
    isVdfAvailable?: boolean | null;
    vdfMacId?: string | null;
    sensors?: AssetSensor[] | null;
    monitors?: AssetMonitor[] | null;
    archived?: boolean | null;
    archivedBy?: string | null;
    archivedAt?: string | null;
    status?: number | null;
    lastMaintenance?: string | null;
    nextMaintenance?: string | null;
}

export type AssetDetailList = AssetDetail[];

export interface AssetWithThreads extends AssetDetail {
    threads: ThreadDetailList;
}
