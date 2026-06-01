
import { LocationDetail, LocationDetailList } from '@/types/location/location';
import { apiClientCore as apiClient } from './apiClient';

const locationService = {
    listUserLocations: async (): Promise<LocationDetailList> => {
        const response = await apiClient.get<LocationDetailList>(
            `/sites/list/context`,
        );
        return response.data;
    },

    getById: async (id: string): Promise<LocationDetail> => {
        const response = await apiClient.get<LocationDetail>(
            `/sites?id=${encodeURIComponent(id)}`,
        );
        return response.data;
    },
};

export default locationService;
