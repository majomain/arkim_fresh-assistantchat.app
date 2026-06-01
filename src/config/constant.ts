import { getEnvironment } from "./environmentVariablesService";

export const ISSUE_CODE = {
    BELOW_TEMPERATURE: '1',
    ABOVE_TEMPERATURE: '2',
    TEMPERATURE_SENSOR_NOT_RESPONDING: '3',
    BELOW_HUMIDITY: '4',
    ABOVE_HUMIDITY: '5',
    HUMIDITY_SENSOR_NOT_RESPONDING: '6',
    BELOW_POWER: '7',
    ABOVE_POWER: '8',
    POWER_SENSOR_NOT_RESPONDING: '9',
};

export const STORAGE_KEYS = {
    THEME_MODE: 'theme-mode',
    SELECTED_COMPANY_ID: 'selectedCompanyId',
    SELECTED_LOCATION_ID: 'selectedLocationId',
    OIDC_REDIRECT_URL: 'oidc_redirect_url',
    SESSION_ID: 'arkimSessionId',
    I18NEXT_LNG: 'i18nextLng',
    OIDC_PREFIX: 'oidc',
    ID_TOKEN: 'arkim_id_token',
};

const getCognitoDomain = () => {
    const environment = getEnvironment();
    return `https://chat-shared-${environment}.auth.us-west-2.amazoncognito.com`;
};

export const OIDC_CONFIG = {
    COGNITO_DOMAIN: getCognitoDomain(),
    PATHS: {
        CALLBACK: '/signin-oidc',
        LOGIN: '/login',
        DASHBOARD: '/dashboard',
    },
    SCOPE: 'openid profile email',
    SIGNOUT_FLAG_KEY: 'oidc:signout_in_progress',
};
