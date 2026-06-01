import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type MyTheme = 'light' | 'dark' | 'system';
export type MyTemperature = 'celsius' | 'fahrenheit';
export type MyDistance = 'metric' | 'imperial';

interface SettingsStore {
    theme: MyTheme;
    temperature: MyTemperature;
    distance: MyDistance;
    setTheme: (theme: MyTheme) => void;
    setTemperature: (temperature: MyTemperature) => void;
    setDistance: (distance: MyDistance) => void;
}

export const useSettingsStore = create<SettingsStore>()(
    persist(
        (set) => ({
            theme: 'system',
            temperature: 'celsius',
            distance: 'metric',
            setTheme: (theme) => set({ theme }),
            setTemperature: (temperature) => set({ temperature }),
            setDistance: (distance) => set({ distance }),
        }),
        {
            name: 'settings-storage',
        },
    ),
);
