import { isAuthBypassEnabled } from '@/config/devAuthBypass';
import { getMockLocationById, getMockLocations } from '@/mocks/devMockData';
import { LocationDetail, LocationDetailList } from '@/types/location/location';

import { apiClientCore as apiClient } from './apiClient';

const locationService = {
    listUserLocations: async (): Promise<LocationDetailList> => {
        if (isAuthBypassEnabled()) return getMockLocations();

        const response =
            await apiClient.get<LocationDetailList>(`/sites/list/context`);
        return response.data;
    },

    getById: async (id: string): Promise<LocationDetail> => {
        if (isAuthBypassEnabled()) return getMockLocationById(id);

        const response = await apiClient.get<LocationDetail>(
            `/sites?id=${encodeURIComponent(id)}`,
        );
        return response.data;
    },
};

export default locationService;
