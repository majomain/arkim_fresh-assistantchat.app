import { STORAGE_KEYS } from '@/config/constant';
import { getApiConfig } from '@/config/environmentVariablesService';
import { clearOidcStorage } from '@/storage/oidcStorage';
import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { ApiError } from '@/lib/api-error';
import authService from './authService';
import oidcAuthService from '../auth/oidcAuthService';

const apiConfig = getApiConfig();

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

// on refresh token event handler
const onTokenRefreshed = (token: string) => {
    refreshSubscribers.forEach((callback) => callback(token));
    refreshSubscribers = [];
};

// add refresh subscriber to retry session if api fails
const addRefreshSubscriber = (callback: (token: string) => void) => {
    refreshSubscribers.push(callback);
};

// custom headers for api calls
export const getApiHeaders = (): Record<string, string> => {
    // client
    const headers: Record<string, string> = {
        'x-arkim-client': 'chat',
    };

    // authenticated bearer token
    const token = oidcAuthService.getAuthToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // company id
    const selectedCompanyId = localStorage.getItem(
        STORAGE_KEYS.SELECTED_COMPANY_ID,
    );
    if (selectedCompanyId) {
        headers['X-Arkim-CompanyId'] = selectedCompanyId;
    }

    return headers;
};

// create client for axios api calls
const createClient = (baseUrl?: string): AxiosInstance => {
    // Determine the final baseURL:
    // - If baseUrl is already a full URL (http:// or https://), use it as-is
    // - If it's a relative path, prepend window.location.origin (if in browser)
    // - Fall back to baseUrl if window is not available (during build)
    let finalBaseUrl = baseUrl;
    if (
        baseUrl &&
        typeof window !== 'undefined' &&
        !baseUrl.startsWith('http://') &&
        !baseUrl.startsWith('https://')
    ) {
        finalBaseUrl = `${window.location.origin}${baseUrl}`;
    }

    // axios instance creation
    const client = axios.create({
        baseURL: finalBaseUrl,
        headers: {
            'Content-Type': 'application/json',
        },
        withCredentials: true,
    });

    // axios custom request handler [get custom headers and other config for api call]
    client.interceptors.request.use(
        (config) => {
            // Don't send requests during signOut to avoid race conditions
            // But allow the logout request itself
            if (oidcAuthService.isSigningOut() && config.url !== '/auth/logout') {
                console.log(
                    '[API] Request blocked during signOut:',
                    config.url,
                );
                const controller = new AbortController();
                controller.abort();
                config.signal = controller.signal;
                return config;
            }

            const headers = getApiHeaders();
            Object.entries(headers).forEach(([key, value]) => {
                config.headers[key] = value;
            });
            if (config.data instanceof FormData) {
                delete config.headers['Content-Type'];
            }
            return config;
        },
        (error) => Promise.reject(error),
    );

    // axios custom response handler
    client.interceptors.response.use(
        // handle success
        (response) => {
            const { data } = response;
            // throw error if the reponse has custom error placed, else return response
            if (
                (data?.errorCode && data.errorCode < 0) ||
                data?.isSuccess === false
            ) {
                const customError = new ApiError(
                    data.message || 'Unknown error',
                    data.errorCode,
                    data,
                    false,
                );
                return Promise.reject(customError);
            }

            return response;
        },
        // handle failure
        async (error) => {
            if (error.code === 'ERR_CANCELED') {
                return Promise.reject(error);
            }

            const originalRequest =
                error.config as InternalAxiosRequestConfig & {
                    _retry?: boolean;
                };

            // check if error is not server related, if yes then throw server error else proceed with custom error
            if (error.response) {
                const { status, data } = error.response;

                // check if response was unauthorized or not, if yes then check for refreshing flag
                if (status === 401 && !originalRequest._retry) {
                    if (oidcAuthService.isSigningOut()) {
                        console.log(
                            '[API] 401 ignored during signOut:',
                            originalRequest.url,
                        );
                        return Promise.reject(error);
                    }
                    console.log(
                        '[API] 401 received, attempting refresh:',
                        originalRequest.url,
                    );

                    // add refresh token for the user if refreshing flag is true
                    if (isRefreshing) {
                        return new Promise((resolve) => {
                            addRefreshSubscriber((token: string) => {
                                originalRequest.headers['Authorization'] =
                                    `Bearer ${token}`;
                                resolve(client(originalRequest));
                            });
                        });
                    }
                    // refresh the token
                    originalRequest._retry = true;
                    isRefreshing = true;

                    try {
                        const response = await authService.refreshTokens();
                        const newToken = response.idToken;

                        oidcAuthService.setAuthToken(newToken);
                        onTokenRefreshed(newToken);

                        originalRequest.headers['Authorization'] =
                            `Bearer ${newToken}`;
                        return client(originalRequest);
                    } catch (refreshError) {
                        oidcAuthService.clearAuthToken();
                        clearOidcStorage();
                        if (!oidcAuthService.isSigningOut()) {
                            window.location.href = '/login';
                        }
                        return Promise.reject(refreshError);
                    } finally {
                        isRefreshing = false;
                    }
                }

                console.error(
                    `� HTTP Error ${status}:`,
                    data?.message || data?.detail || 'Unknown error',
                );

                // throw custom error
                const customError = new ApiError(
                    data?.message || data?.detail || `HTTP Error ${status}`,
                    status,
                    data,
                    false,
                );
                return Promise.reject(customError);
            } else if (error.request) {
                const networkError = new ApiError(
                    'Network error - please check your connection',
                    0,
                    undefined,
                    true,
                );
                return Promise.reject(networkError);
            } else {
                console.error('⚙️ Request setup error:', error.message);
                return Promise.reject(error);
            }
        },
    );

    return client;
};

export const apiClientCore = createClient(apiConfig.baseUrlCore);
export const apiClientMessaging = createClient(apiConfig.baseUrlMessaging);
export const apiClientOnboarding = createClient(apiConfig.baseUrlOnboarding);
