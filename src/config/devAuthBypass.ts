import { OIDC_CONFIG, STORAGE_KEYS } from '@/config/constant';
import { UserType } from '@/contexts/AuthContext';
import { UserDetail } from '@/types/user/user';

export const DEV_AUTH_TOKEN = 'dev-bypass-token';

export const DEV_SITE_ID = 'dev-site';

export const DEV_COMPANY_ID =
    process.env.NEXT_PUBLIC_DEV_COMPANY_ID ??
    '00000000-0000-0000-0000-000000000001';

/** Only active in development when explicitly enabled via env. */
export const isAuthBypassEnabled = (): boolean =>
    process.env.NODE_ENV === 'development' &&
    process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true';

export const getDevMockContext = (): UserDetail => ({
    user: {
        email: 'dev@localhost',
        firstName: 'Dev',
        lastName: 'User',
        isAdmin: true,
        isMonitoring: true,
        isTechnician: true,
        isActive: true,
        theme: 'dark',
        language: 'en',
        defaultSite: DEV_SITE_ID,
        assignedSites: [DEV_SITE_ID, 'dev-site-warehouse'],
    },
    companyName: 'Dev Company',
    defaultTheme: 'dark',
    defaultLanguage: 'en',
    useMetricSystem: false,
});

export const devMockContextToUser = (context: UserDetail): UserType => ({
    id: context.user.email,
    name: `${context.user.firstName} ${context.user.lastName}`,
    firstName: context.user.firstName,
    lastName: context.user.lastName,
    isAdmin: context.user.isAdmin,
    isTechnician: context.user.isTechnician,
    isActive: context.user.isActive,
    email: context.user.email,
    theme: context.user.theme,
    language: context.user.language,
    defaultSite: context.user.defaultSite,
    assignedSites: context.user.assignedSites,
});

export const setupDevAuthSession = (): void => {
    if (typeof window === 'undefined') return;

    // Clear stale OIDC sign-out flag — otherwise AuthProvider exits early with no user
    localStorage.removeItem(OIDC_CONFIG.SIGNOUT_FLAG_KEY);

    localStorage.setItem(STORAGE_KEYS.ID_TOKEN, DEV_AUTH_TOKEN);
    localStorage.setItem(STORAGE_KEYS.SELECTED_COMPANY_ID, DEV_COMPANY_ID);
    localStorage.setItem(STORAGE_KEYS.SELECTED_LOCATION_ID, DEV_SITE_ID);
};

export const clearDevAuthSession = (): void => {
    if (typeof window === 'undefined') return;

    localStorage.removeItem(STORAGE_KEYS.ID_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.SELECTED_COMPANY_ID);
    localStorage.removeItem(STORAGE_KEYS.SELECTED_LOCATION_ID);
};
