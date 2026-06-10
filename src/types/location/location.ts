export interface LocationDetail {
    id: string;
    name: string;
    description?: string | null;
    useMetricSystem: boolean;
    email?: string | null;
    configuration?: {
        timezone?: string | null;
        language?: string | null;
        dateFormat?: string | null;
        timeFormat?: string | null;
    } | null;
}

export type LocationDetailList = LocationDetail[];
