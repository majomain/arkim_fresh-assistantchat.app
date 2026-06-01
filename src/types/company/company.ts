export interface CompanyDetail {
    companyId: string;
    companyName: string;
    isAdmin: boolean;
    isMonitoring: boolean;
    isTechnician: boolean;
    isActive: boolean;
}

export type CompanyDetailList = CompanyDetail[];

