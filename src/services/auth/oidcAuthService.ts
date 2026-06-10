import { OIDC_CONFIG, STORAGE_KEYS } from '@/config/constant';
import {
    clearDevAuthSession,
    isAuthBypassEnabled,
    setupDevAuthSession,
} from '@/config/devAuthBypass';
import authService from '@/services/api/authService';
import { clearOidcStorage } from '@/storage/oidcStorage';
import {
    InMemoryWebStorage,
    User,
    UserManager,
    UserManagerSettings,
    WebStorageStateStore,
} from 'oidc-client-ts';

import { clearAllDraft } from '@/utils/draft-mechanism';

class OidcAuthService {
    private userManager: UserManager | null = null;
    private signOutInFlight: boolean = false;

    constructor() {
        if (typeof window !== 'undefined') {
            this.signOutInFlight =
                localStorage.getItem(OIDC_CONFIG.SIGNOUT_FLAG_KEY) === '1';
        } else {
            this.signOutInFlight = false;
        }
    }

    public isSigningOut(): boolean {
        return (
            this.signOutInFlight ||
            localStorage.getItem(OIDC_CONFIG.SIGNOUT_FLAG_KEY) === '1'
        );
    }

    public clearSignOutFlag(): void {
        this.signOutInFlight = false;
        try {
            localStorage.removeItem(OIDC_CONFIG.SIGNOUT_FLAG_KEY);
        } catch (error) {
            console.error(
                'Failed to remove signout flag from session storage:',
                error,
            );
        }
    }

    public resetUserManager(): void {
        this.userManager = null;
    }

    private isValidCognitoEnv(value: string | undefined): value is string {
        if (!value?.trim()) return false;
        return !value.includes('<') && !value.includes('>');
    }

    private buildSettings(): UserManagerSettings {
        const cognitoIssuerUrl =
            process.env.NEXT_PUBLIC_COGNITO_ISSUER_URL ||
            process.env.REACT_APP_COGNITO_ISSUER_URL;
        const cognitoClientId =
            process.env.NEXT_PUBLIC_COGNITO_APP_CLIENT_ID ||
            process.env.REACT_APP_COGNITO_APP_CLIENT_ID;

        if (
            !this.isValidCognitoEnv(cognitoIssuerUrl) ||
            !this.isValidCognitoEnv(cognitoClientId)
        ) {
            throw new Error(
                'Cognito configuration is missing from environment variables. Copy .env.template to .env and set NEXT_PUBLIC_COGNITO_ISSUER_URL and NEXT_PUBLIC_COGNITO_APP_CLIENT_ID, then restart the dev server.',
            );
        }

        const origin = window.location.origin;

        return {
            authority: cognitoIssuerUrl.endsWith('/')
                ? cognitoIssuerUrl
                : `${cognitoIssuerUrl}/`,
            client_id: cognitoClientId,
            redirect_uri: `${origin}${OIDC_CONFIG.PATHS.CALLBACK}`,
            response_type: 'code',
            scope: OIDC_CONFIG.SCOPE,
            stateStore: new WebStorageStateStore({
                store: window.localStorage,
                prefix: 'oidc.',
            }),
            userStore: new WebStorageStateStore({
                store: new InMemoryWebStorage(),
            }),
            automaticSilentRenew: false,
            silent_redirect_uri: `${origin}${OIDC_CONFIG.PATHS.CALLBACK}`,
            post_logout_redirect_uri: `${origin}${OIDC_CONFIG.PATHS.CALLBACK}`,
            loadUserInfo: false,
        };
    }

    private buildCognitoLogoutUrl(): string | null {
        const cognitoClientId =
            process.env.NEXT_PUBLIC_COGNITO_APP_CLIENT_ID ||
            process.env.REACT_APP_COGNITO_APP_CLIENT_ID;
        if (!cognitoClientId) return null;

        const logoutUri = encodeURIComponent(
            `${window.location.origin}${OIDC_CONFIG.PATHS.LOGIN}`,
        );

        return `${OIDC_CONFIG.COGNITO_DOMAIN}/logout?client_id=${cognitoClientId}&logout_uri=${logoutUri}`;
    }

    private createUserManager(): UserManager {
        const settings = this.buildSettings();
        const um = new UserManager(settings);

        // Clean up any lingering state to avoid mismatch errors
        um.clearStaleState().catch(() => {
            // ignore cleanup errors
        });

        return um;
    }

    private getUserManager(): UserManager {
        if (this.userManager) return this.userManager;
        this.userManager = this.createUserManager();
        return this.userManager;
    }

    public getAuthToken(): string | null {
        return localStorage.getItem(STORAGE_KEYS.ID_TOKEN);
    }

    public setAuthToken(idToken: string): void {
        localStorage.setItem(STORAGE_KEYS.ID_TOKEN, idToken);
    }

    public clearAuthToken(): void {
        localStorage.removeItem(STORAGE_KEYS.ID_TOKEN);
    }

    public hasStoredToken(): boolean {
        return !!localStorage.getItem(STORAGE_KEYS.ID_TOKEN);
    }

    public async signIn(redirectUrl?: string): Promise<void> {
        if (isAuthBypassEnabled()) {
            setupDevAuthSession();
            const target =
                redirectUrl ||
                localStorage.getItem(STORAGE_KEYS.OIDC_REDIRECT_URL) ||
                '/';
            localStorage.removeItem(STORAGE_KEYS.OIDC_REDIRECT_URL);
            window.location.href = target;
            return;
        }

        try {
            const userManager = this.getUserManager();

            // Store the redirect URL in localStorage instead of state
            if (redirectUrl) {
                localStorage.setItem(
                    STORAGE_KEYS.OIDC_REDIRECT_URL,
                    redirectUrl,
                );
            }

            await userManager.signinRedirect();
        } catch (error) {
            console.error('Error initiating sign in:', error);
            throw error;
        }
    }

    public async signInCallback(): Promise<{
        user: User;
        redirectUrl?: string;
    }> {
        // Clear signout flag if it was set
        try {
            localStorage.removeItem(OIDC_CONFIG.SIGNOUT_FLAG_KEY);
        } catch {}
        this.signOutInFlight = false;

        try {
            const userManager = this.getUserManager();
            await userManager.removeUser();

            const user = await userManager.signinRedirectCallback();

            if (!user.id_token || !user.refresh_token) {
                throw new Error('Missing required tokens from OIDC response');
            }

            await authService.exchangeTokens(user.id_token, user.refresh_token);

            this.setAuthToken(user.id_token);

            const redirectUrl =
                localStorage.getItem(STORAGE_KEYS.OIDC_REDIRECT_URL) || '/';

            localStorage.removeItem(STORAGE_KEYS.OIDC_REDIRECT_URL);

            return { user, redirectUrl };
        } catch (error) {
            console.error('Error handling sign in callback:', error);

            try {
                const userManager = this.getUserManager();
                await userManager.clearStaleState();
                await userManager.removeUser();
                clearOidcStorage();
                this.clearAuthToken();
            } catch (cleanupError) {
                console.warn('Error during cleanup:', cleanupError);
            }

            throw error;
        }
    }

    /**
     * LOGOUT FLOW:
     * 1. Set isSigningOut flag → blocks API requests and prevents race conditions
     * 2. Call backend /auth/logout → clears server-side session/cookies
     * 3. Clear userManager, localStorage tokens, OIDC storage
     * 4. Redirect to Cognito /logout → clears Cognito cookies (prevents auto-login)
     * 5. Cognito redirects to /login → OidcProtectedRoute clears flag → redirects to Cognito login page
     */
    public async signOut(): Promise<void> {
        if (isAuthBypassEnabled()) {
            await clearAllDraft();
            clearDevAuthSession();
            this.clearAuthToken();
            window.location.replace('/login');
            return;
        }

        await clearAllDraft();
        console.log('[OIDC signOut] Starting signOut...');
        if (this.signOutInFlight) {
            console.warn('[OIDC signOut] Already in-flight, ignoring.');
            return;
        }
        this.signOutInFlight = true;
        try {
            localStorage.setItem(OIDC_CONFIG.SIGNOUT_FLAG_KEY, '1');
            console.log('[OIDC signOut] Flag set in localStorage');
        } catch {}

        console.log('[OIDC signOut] Calling backend logout...');
        try {
            await authService.signOut(this.getAuthToken() ?? undefined);
            console.log('[OIDC signOut] Backend logout complete');
        } catch (error) {
            console.error('[OIDC signOut] Backend logout error:', error);
        }

        console.log('[OIDC signOut] Cleaning up userManager...');
        try {
            const userManager = this.getUserManager();
            await userManager.removeUser();
            await userManager.clearStaleState();
            console.log('[OIDC signOut] UserManager cleanup complete');
        } catch (error) {
            console.warn('[OIDC signOut] UserManager cleanup error:', error);
        }

        console.log('[OIDC signOut] Clearing tokens and storage...');
        this.clearAuthToken();
        clearOidcStorage();

        // Clear selected company ID to force company selection on next login
        localStorage.removeItem(STORAGE_KEYS.SELECTED_COMPANY_ID);
        // Clear selected location ID
        localStorage.removeItem(STORAGE_KEYS.SELECTED_LOCATION_ID);
        console.log('[OIDC signOut] Cleared selected company and location IDs');
        const cognitoLogoutUrl = this.buildCognitoLogoutUrl();
        if (cognitoLogoutUrl) {
            console.log(
                '[OIDC signOut] Redirecting to Cognito logout NOW:',
                cognitoLogoutUrl,
            );
            // Use replace to prevent back button and make redirect harder to cancel
            window.location.replace(cognitoLogoutUrl);
            console.log('[OIDC signOut] window.location.replace called');
            return;
        }

        console.log('[OIDC signOut] No Cognito URL, redirecting to /login');
        window.location.replace('/login');
    }

    public isAuthenticated(): boolean {
        return this.hasStoredToken();
    }
}

const oidcAuthService = new OidcAuthService();
export default oidcAuthService;
