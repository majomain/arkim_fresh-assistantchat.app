'use client';

import { WorkOrderDetailList, WorkOrderStatus } from "@/types/workOrder/workOrder";
import { useBroadcast } from "../use-broadcast";
import { useLocation } from "../use-location";
import { useAsset } from "../use-asset";
import { useAuth } from "../use-auth";

export type WorkOrderEvent =
    | { type: 'WORK_ORDER_CLAIMED'; workOrderId: string; siteId: string; status: WorkOrderStatus; }
    | { type: 'WORK_ORDER_LIST_REFRESH'; siteId: string; assetId?: string; };

export function useWorkOrderBroadcast(onMessage?: (event: WorkOrderEvent) => void) {
    const { user } = useAuth();
    const { selectedLocation } = useLocation();
    const { currentAssetId } = useAsset();

    const { emit } = useBroadcast<WorkOrderEvent>('work-orders', onMessage);

    // claim work order and emit that event for that work order within the given site
    const claimWorkOrder = (workOrderId: string, siteId: string, status: WorkOrderStatus) =>
        emit({ type: 'WORK_ORDER_CLAIMED', workOrderId, siteId, status });

    // request other tabs to refresh their work order list for the given site and asset (if provided)
    const requestRefresh = (siteId: string, assetId?: string) =>
        emit({ type: 'WORK_ORDER_LIST_REFRESH', siteId, assetId });

    const updateWorkOrder = (
        setWorkOrders: React.Dispatch<React.SetStateAction<WorkOrderDetailList>>,
        workOrderId: string,
        siteId: string,
        status: WorkOrderStatus
    ) => {
        if (selectedLocation?.id === siteId && workOrderId) {
            setWorkOrders(prev => prev.map(wo => wo.id === workOrderId ? { ...wo, threadId: wo.threadId ?? crypto.randomUUID(), threadOpenedBy: wo.threadOpenedBy ?? user?.email, status } : wo));
        }

    };

    // remove the work order from the list when it's claimed within the same site
    const removeWorkOrder = (
        setWorkOrders: React.Dispatch<React.SetStateAction<WorkOrderDetailList>>,
        workOrderId: string,
        siteId: string
    ) => {
        if (selectedLocation?.id === siteId && workOrderId) {
            setWorkOrders(prev => prev.filter(wo => wo.id !== workOrderId));
        }
    };

    // refresh the work order list when it's requested by other tabs within the same site and asset (if provided)
    const refreshWorkOrderList = (
        getWorkOrders: () => Promise<void>,
        siteId: string,
        assetId?: string
    ) => {
        // common check for site location
        const hitFunction = () => {
            if (selectedLocation?.id === siteId) {
                getWorkOrders();
            }
        }

        if (assetId) {
            if (currentAssetId && assetId === currentAssetId) {
                hitFunction();
            }
        } else {
            hitFunction();
        }
    }

    return { claimWorkOrder, requestRefresh, removeWorkOrder, updateWorkOrder, refreshWorkOrderList };
}