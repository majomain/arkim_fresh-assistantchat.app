import { isAuthBypassEnabled } from '@/config/devAuthBypass';
import { filterMockWorkOrders } from '@/mocks/devMockData';
import {
    WorkOrderDetailList,
    WorkOrderStatus,
} from '@/types/workOrder/workOrder';

import { apiClientCore as apiClient } from './apiClient';

const workOrderService = {
    // get user specific work orders using filters
    getAssignedWorkOrders: async (
        currentDate?: Date | null,
        siteId?: string | null,
        assetId?: string | null,
        status?: WorkOrderStatus | null,
        search?: string | null,
    ): Promise<WorkOrderDetailList> => {
        let endDate: string | null = null;
        if (currentDate) {
            const offsetMs = currentDate.getTimezoneOffset() * 60 * 1000;
            const localDate = new Date(currentDate.getTime() - offsetMs);
            endDate = localDate.toISOString().split('T')[0];
        }

        const queryParams = new URLSearchParams();

        if (siteId) {
            queryParams.append('siteId', siteId);
        }
        if (assetId) {
            queryParams.append('assetId', assetId);
        }
        if (status) {
            queryParams.append('status', status);
        }
        if (endDate) {
            queryParams.append('endDate', endDate);
        }
        if (search) {
            queryParams.append('search', search);
        }

        if (isAuthBypassEnabled()) {
            return filterMockWorkOrders({
                siteId,
                assetId,
                status,
                search,
                endDate,
            });
        }

        const queryString = queryParams.toString();
        const url = `/work-orders/list/assigned${queryString ? `?${queryString}` : ''}`;

        const response = await apiClient.get<WorkOrderDetailList>(url);
        return response.data;
    },
};

export default workOrderService;
