import { apiClientCore as apiClient } from './apiClient';
import { AssetDetail, AssetDetailList, AssetWithThreads } from '@/types/equipment/asset';

const equipmentService = {
    // get list of equipment based on a specific location (with searchable filter)
    getList: async (
        siteId: string,
        search?: string | null,
    ): Promise<AssetDetailList> => {
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
        const response = await apiClient.get<AssetWithThreads>(
            `/equipment?id=${encodeURIComponent(id)}`,
        );
        return response.data;
    },

    create: async (asset: AssetDetail) => {
        const response = await apiClient.post(
            '/equipment',
            asset,
        );
        return response.data;
    },
};

export default equipmentService;
