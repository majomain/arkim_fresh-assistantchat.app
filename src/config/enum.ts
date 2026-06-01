export enum Metric {
  Temperature = 'temperature',
  Humidity = 'humidity',
  Power = 'power',
}

export enum TemperatureUnit {
  C = 'C',
  F = 'F',
}

export enum TimeFrame {
  Hour = 'hour',
  Day = 'day',
  Month = 'month',
  Year = 'year',
}

export enum AssetsEquipmentStatus {
  Maintenance = 'Maintenance',
  Operational = 'Operational',
  Warning = 'Warning',
}

export enum EnergyUnit {
  KWh = 'kWh',
  cost = 'cost',
}

export enum RateTiers {
  OffPeak = 'OffPeak',
  MidPeak = 'MidPeak',
  OnPeak = 'OnPeak',
  SuperOffPeak = 'SuperOffPeak',
}

export enum TimeZones {
  PST = 'America/Los_Angeles',
  UTC = 'UTC',
}

export enum DateFormat {
  MDY = 'MM/DD/YYYY',
  DMY = 'DD/MM/YYYY',
  YMD = 'YYYY/MM/DD',
}

export enum TimeFormat {
  TWELVE_HOURS = '12h',
  TWENTY_FOUR_HOURS = '24h',
}

export enum AssetsTemperatureStatus {
  Normal = 'Normal',
  Warning = 'Warning',
  Critical = 'Critical',
}
export enum AssetsAlertsStatus {
  Normal = 'Normal',
  Warning = 'Warning',
  Critical = 'Critical',
}