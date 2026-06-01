'use client'

import { STORAGE_KEYS } from "@/config/constant";
import { LocationContext } from "@/contexts/LocationContext";
import { useAuth } from "@/hooks/use-auth";
import locationService from "@/services/api/locationService";
import { LocationDetail, LocationDetailList } from "@/types/location/location";
import { useCallback, useEffect, useState } from "react";

export default function LocationProvider({ children }: { children: React.ReactNode }) {
    // user util 
    const { user } = useAuth();

    // locations list
    const [locations, setLocations] = useState<LocationDetailList>([]);
    // current selected location 
    const [selectedLocation, setSelectedLocation] = useState<LocationDetail | null>(null);
    // is location list loading flag
    const [isLoadingLocations, setIsLoadingLocations] = useState<boolean>(true);

    // load user locations
    const loadLocations = useCallback(async () => {
        try {
            setIsLoadingLocations(true);
            const locationList = await locationService.listUserLocations();
            const list = locationList.filter((location) => user?.assignedSites.includes(location.id));
            setLocations(list);

            // Get stored location ID
            const storedLocationId = localStorage.getItem(
                STORAGE_KEYS.SELECTED_LOCATION_ID,
            );

            let locationToSelect: LocationDetail | null = null;

            if (storedLocationId) {
                // Try to find stored location
                locationToSelect =
                    list.find((loc) => loc.id === storedLocationId) ||
                    null;
            }

            if (!locationToSelect) {
                // Find default location from user preferences
                locationToSelect =
                    list.find((loc) => (loc as any).isDefault) || null;

                // If no default, select first location
                if (!locationToSelect && list.length > 0) {
                    locationToSelect = list[0];
                }
            }

            if (locationToSelect && locationToSelect.id) {
                setSelectedLocation(locationToSelect);
                localStorage.setItem(
                    STORAGE_KEYS.SELECTED_LOCATION_ID,
                    locationToSelect.id,
                );
            }
        } catch (error) {
            console.error('Failed to load locations:', error);
        } finally {
            setIsLoadingLocations(false);
        }
    }, [user]);

    // select a location
    const selectLocationById = useCallback((locationId: string) => {
        const location = locations.find((loc) => loc.id === locationId);
        if (location) {
            setSelectedLocation(location);
            localStorage.setItem(STORAGE_KEYS.SELECTED_LOCATION_ID, locationId);
        }
    }, [locations]);

    // Load locations when user is authenticated
    useEffect(() => {
        if (user) {
            loadLocations();
        }
    }, [user, loadLocations]);

    return <LocationContext.Provider value={{
        locations,
        selectedLocation,
        isLoadingLocations,
        selectLocation: selectLocationById,
        refreshLocations: loadLocations
    }}>
        {children}
    </LocationContext.Provider>
}