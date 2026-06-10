type ThemeType = 'light' | 'dark' | 'system';

export type User = {
    email: string;
    firstName: string;
    lastName: string;
    isAdmin: boolean;
    isMonitoring: boolean;
    isTechnician: boolean;
    isActive: boolean;
    theme: ThemeType;
    language: 'en';
    defaultSite: string;
    assignedSites: string[];
};

export interface UserDetail {
    user: User;
    companyName: string;
    defaultTheme: ThemeType;
    defaultLanguage: string;
    useMetricSystem: boolean;
}
