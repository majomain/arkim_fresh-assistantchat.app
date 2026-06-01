'use client'

import { AssetWithThreads } from "@/types/equipment/asset";
import { ThreadDetail } from "@/types/equipment/thread";
import { createContext } from "react";

export type AssetContextType = {
    hasBootstrapped: boolean;
    isAssetListLoading: boolean;
    isAssetThreadListLoading: boolean;
    isAssetLoading: boolean;
    assetList: AssetWithThreads[];
    currentAsset: AssetWithThreads | null;
    currentAssetId: string | null;
    setAssetList: (assets: AssetWithThreads[]) => void;
    setCurrentAssetId: (assetId: string | null) => void;
    setCurrentAsset: (asset: AssetWithThreads | null) => void;
    refreshAssetList: () => Promise<AssetWithThreads[]>;
    addNewThreadToList: (threadData: ThreadDetail) => void;
    updateThreadTitle: (threadId: string, title: string) => void;
    placeThreadToTop: (threadId: string) => void;
    removeThread: (threadId: string) => void;
    getAssetFromListById: (assetId: string) => AssetWithThreads | null;
};

export const AssetContext = createContext<AssetContextType>({
    hasBootstrapped: false,
    isAssetListLoading: false,
    isAssetThreadListLoading: false,
    isAssetLoading: false,
    assetList: [],
    currentAsset: null,
    currentAssetId: null,
    setAssetList: () => { },
    setCurrentAssetId: () => { },
    setCurrentAsset: () => { },
    refreshAssetList: async () => [],
    addNewThreadToList: () => { },
    updateThreadTitle: () => { },
    placeThreadToTop: () => { },
    removeThread: () => { },
    getAssetFromListById: () => null
});