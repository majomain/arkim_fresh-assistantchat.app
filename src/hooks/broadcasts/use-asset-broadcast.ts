'use client';

import { useBroadcast } from '../use-broadcast';

export type AssetEvent = { type: 'ASSET_CREATED' };

export function useAssetBroadcast(onMessage?: (event: AssetEvent) => void) {
    const { emit } = useBroadcast<AssetEvent>('assets', onMessage);

    // emit that a new asset has been created with the asset details
    const assetCreated = () => {
        emit({ type: 'ASSET_CREATED' });
    };

    return { assetCreated };
}
