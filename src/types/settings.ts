// Settings types and enums

export enum Temperature {
    CELSIUS = 'CELSIUS',
    FAHRENHEIT = 'FAHRENHEIT',
}

export enum Distance {
    METRIC = 'METRIC',
    IMPERIAL = 'IMPERIAL',
}

export interface UserSettings {
    temperature?: Temperature;
    distance?: Distance;
}

export interface UpdateSettingsInput {
    temperature?: Temperature;
    distance?: Distance;
}
