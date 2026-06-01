/**
 * Application configuration
 *
 * This file centralizes all configuration variables from environment variables
 */

export interface ApiConfig {
    baseUrlCore?: string;
    baseUrlMonitoring?: string;
    baseUrlMessaging?: string;
    baseUrlOnboarding?: string;
}

export interface AppConfig {
    appName: string;
    appVersion: string;
}

// API configuration
export const getApiConfig = () => {
    return {
        baseUrlCore: process.env.NEXT_PUBLIC_API_BASE_URL_CORE,
        baseUrlMonitoring: process.env.NEXT_PUBLIC_API_BASE_URL_MONITORING,
        baseUrlMessaging: process.env.NEXT_PUBLIC_API_BASE_URL_MESSAGING,
        baseUrlOnboarding: process.env.NEXT_PUBLIC_API_BASE_URL_ONBOARDING,
    };
};

export const getAppConfig = () => {
    return {
        appName: process.env.NEXT_PUBLIC_APP_NAME || 'Arkim',
        appVersion: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    };
};

export const getEnvironment = () => {
  return process.env.NEXT_PUBLIC_ENVIRONMENT || 'dev';
};
