import { AssetDetail } from '@/types/equipment/asset';
import { apiClientOnboarding as apiClient } from './apiClient';
import { AssetDocumentList } from '@/types/equipment/document';

interface OnboardInitPayload {
    label: string;
    manufacturer: string;
    model: string;
}

interface OnboardInitResponse {
    assetId: string;
    status: string;
}

interface OnboardCompletePayload {
    pagesWithError: number[];
    approved: boolean;
}

const onboardingService = {
    getAssetById: async (assetId: string): Promise<AssetDetail> => {
        const response = await apiClient.get<AssetDetail>(
            `/assets/${assetId}`,
        );
        return response.data;
    },

    searchAssets: async (
        manufacturer: string,
        model: string,
    ): Promise<AssetDetail | null> => {
        try {
            const response = await apiClient.get<AssetDetail>(
                `/assets/search?manufacturer=${manufacturer.trim()}&model=${model.trim()}`,
            );
            return response.data;
        } catch (error: any) {
            if (error.status === 404) {
                return null;
            }
            throw error;
        }
    },

    initOnboarding: async (
        payload: OnboardInitPayload,
    ): Promise<OnboardInitResponse> => {
        const response = await apiClient.post<OnboardInitResponse>(
            '/assets/onboard/init',
            payload,
        );
        return response.data;
    },

    completeOnboarding: async (
        assetId: string,
        payload: OnboardCompletePayload,
    ): Promise<any> => {
        const response = await apiClient.post(
            `/assets/onboard/${assetId}`,
            payload,
        );
        return response.data;
    },

    cancelOnboarding: async (assetId: string): Promise<any> => {
        const response = await apiClient.delete(
            `/assets/onboard/${assetId}/cancel`,
        );
        return response.data;
    },

    getDocumentsByAssetAndModelId: async (assetId: string, assetModelId: string, search?: string | null): Promise<AssetDocumentList> => {
        const response = await apiClient.get(
            `/documents?asset_id=${assetId}&asset_model_id=${assetModelId}&search=${search ?? ''}`,
        );
        return response.data;
    },
};

export default onboardingService;
