'use client'

import { LocationDetail, LocationDetailList } from "@/types/location/location";
import { createContext } from "react";

export type LocationContextType = {
    locations: LocationDetailList;
    selectedLocation: LocationDetail | null;
    isLoadingLocations: boolean;
    selectLocation: (locationId: string) => void;
    refreshLocations: () => void;
}

export const LocationContext = createContext<LocationContextType>({
    locations: [],
    selectedLocation: null,
    isLoadingLocations: true,
    selectLocation: () => { },
    refreshLocations: () => { }
});