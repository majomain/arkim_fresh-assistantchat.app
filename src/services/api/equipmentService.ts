import { isAuthBypassEnabled } from '@/config/devAuthBypass';
import { getMockAssetWithThreads, getMockAssets } from '@/mocks/devMockData';
import {
    AssetDetail,
    AssetDetailList,
    AssetWithThreads,
} from '@/types/equipment/asset';

import { apiClientCore as apiClient } from './apiClient';

const equipmentService = {
    // get list of equipment based on a specific location (with searchable filter)
    getList: async (
        siteId: string,
        search?: string | null,
    ): Promise<AssetDetailList> => {
        if (isAuthBypassEnabled()) {
            return getMockAssets(siteId, search);
        }

        const queryParams = new URLSearchParams();

        if (siteId) {
            queryParams.append('siteId', siteId);
        }

        if (search) {
            queryParams.append('search', search);
        }

        const queryString = queryParams.toString();
        const url = `/equipment/list${queryString ? `?${queryString}` : ''}`;

        const response = await apiClient.get<AssetDetailList>(url);
        return response.data;
    },

    getById: async (id: string): Promise<AssetWithThreads> => {
        if (isAuthBypassEnabled()) {
            return getMockAssetWithThreads(id);
        }

        const response = await apiClient.get<AssetWithThreads>(
            `/equipment?id=${encodeURIComponent(id)}`,
        );
        return response.data;
    },

    create: async (asset: AssetDetail) => {
        if (isAuthBypassEnabled()) {
            return { ...asset, id: asset.id || `asset-${Date.now()}` };
        }

        const response = await apiClient.post('/equipment', asset);
        return response.data;
    },
};

export default equipmentService;
