'use client';

import { STORAGE_KEYS } from '@/config/constant';
import { AssetContext } from '@/contexts/AssetContext';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from '@/hooks/use-location';
import equipmentService from '@/services/api/equipmentService';
import messagingService from '@/services/api/messagingService';
import { AssetWithThreads } from '@/types/equipment/asset';
import { ThreadDetail, ThreadDetailList } from '@/types/equipment/thread';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import { errorToast } from '@/components/ui/sonner';

export default function AssetProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    // user
    const { user } = useAuth();
    // location util
    const { selectedLocation } = useLocation();

    // has bootstrapped flag
    const [hasBootstrapped, setHasBootstrapped] = useState<boolean>(false);
    // asset list loading flag
    const [isAssetListLoading, setIsAssetListLoading] =
        useState<boolean>(false);
    // is asset's thread list loading state flag
    const [isAssetThreadListLoading, setIsAssetThreadListLoading] =
        useState<boolean>(false);
    // asset list store
    const [assetList, setAssetList] = useState<AssetWithThreads[]>([]);
    // current asset id store
    const [currentAssetId, setCurrentAssetId] = useState<string | null>(null);
    // current asset store
    const [currentAsset, setCurrentAsset] = useState<AssetWithThreads | null>(
        null,
    );
    // is asset detail loading
    const [isAssetLoading, setIsAssetLoading] = useState<boolean>(false);

    // router to redirect
    const router = useRouter();

    // url params
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const assetIdFromUrl =
        pathname.includes('/asset') || pathname.includes('/new-chat')
            ? searchParams.get('id')
            : null;

    // reset all data
    function resetData() {
        setIsAssetListLoading(false);
        setAssetList([]);
        setCurrentAsset(null);
        setCurrentAssetId(null);
    }

    // fetch asset list
    async function fetchAssetList(refreshing: boolean = false) {
        if (user) {
            try {
                setIsAssetListLoading(true);

                // Get selected location ID from localStorage
                const selectedLocationId = localStorage.getItem(
                    STORAGE_KEYS.SELECTED_LOCATION_ID,
                );

                if (!selectedLocationId) {
                    console.warn('No location selected, skipping asset fetch');
                    setAssetList([]);
                    setIsAssetListLoading(false);
                    return [];
                }

                // Fetch assets from equipment service
                const data = await equipmentService.getList(selectedLocationId);

                // Transform AssetDetails[] to AssetWithThreads[]
                const list: AssetWithThreads[] = data.length
                    ? data.map((asset) => ({
                          ...asset,
                          threads: [] as ThreadDetailList,
                      }))
                    : [];

                if (
                    currentAssetId &&
                    !list.some((asset) => asset.id === currentAssetId)
                ) {
                    setCurrentAssetId(null);
                    setCurrentAsset(null);
                    errorToast({
                        title: 'Asset Not Found',
                        description:
                            'The asset you are looking for is either invalid or does not exist',
                    });
                    router.replace('/');
                }

                const listWithThreads = await Promise.all(
                    list.map(async (asset) => {
                        const data = await messagingService.getThreadsByAsset(
                            asset.id,
                            selectedLocation?.id ?? '',
                            'open',
                        );
                        return { ...asset, threads: data };
                    }),
                );

                // sort assets alphabetically by name
                listWithThreads.sort((a, b) => a.name.localeCompare(b.name));

                setAssetList(listWithThreads);

                return listWithThreads;
            } catch (error: any) {
                errorToast({ title: 'Error', description: error.message });
                setAssetList([]);
                return [];
            } finally {
                setIsAssetListLoading(false);
                if (!refreshing) setHasBootstrapped(true);
            }
        } else {
            return [];
        }
    }

    // refresh asset list
    async function refreshAssetList() {
        const list = await fetchAssetList(true);

        return list;
    }

    // handle asset page functionality
    async function handleAssetPage(id: string | null) {
        try {
            if (!assetList.length) {
                router.replace('/');
                return;
            }
            setIsAssetLoading(true);
            setCurrentAssetId(id);
            setCurrentAsset(null);

            if (id) {
                const asset = await equipmentService.getById(id.trim());
                if (!asset) {
                    errorToast({
                        title: 'Asset Not Found',
                        description:
                            'The asset you are looking for is either invalid or does not exist',
                    });
                    router.replace('/');
                } else {
                    const assetFromParam =
                        assetList.find((asset) => asset.id === id) ?? null;
                    const currAst = assetFromParam ?? asset;

                    setCurrentAssetId(currAst?.id ?? null);
                    setCurrentAsset(currAst ?? null);
                }
            }
        } catch (error: any) {
            errorToast({ title: 'Error', description: error.message });
        } finally {
            setIsAssetLoading(false);
        }
    }

    // function to add newly created thread to the list
    function addNewThreadToList(threadData: ThreadDetail) {
        const asset = assetList.find((a) => a.id === threadData.assetId);

        if (asset) {
            const updatedThreads = [threadData, ...(asset?.threads ?? [])];
            const updatedCurrentAsset = {
                ...asset,
                threads: updatedThreads,
            };

            // update current data if current asset is active
            if (currentAsset && currentAsset?.id === threadData.assetId) {
                setCurrentAsset(updatedCurrentAsset);
            }
            // update asset list
            setAssetList((prev) =>
                prev.map((asset) =>
                    asset.id === threadData.assetId
                        ? { ...asset, threads: updatedThreads }
                        : asset,
                ),
            );
        }
    }

    // update thread title
    function updateThreadTitle(threadId: string, title: string) {
        // update the asset list
        setAssetList((prev) =>
            prev.map((asset) => {
                if (!asset.threads?.length) return asset;

                const hasThread = asset.threads.some(
                    (t) => t.threadId === threadId,
                );
                if (!hasThread) return asset;

                return {
                    ...asset,
                    threads: asset.threads.map((thread) =>
                        thread.threadId === threadId
                            ? { ...thread, title }
                            : thread,
                    ),
                };
            }),
        );
        // update the current asset with that thread
        setCurrentAsset((prev) => {
            if (!prev?.threads) return prev;

            const hasThread = prev.threads.some((t) => t.threadId === threadId);
            if (!hasThread) return prev;

            return {
                ...prev,
                threads: prev.threads.map((thread) =>
                    thread.threadId === threadId
                        ? { ...thread, title }
                        : thread,
                ),
            };
        });
    }

    // place thread to top whenever new message is being posted
    function placeThreadToTop(threadId: string) {
        if (!currentAsset) return;

        const threads = [...currentAsset.threads];
        const index = threads.findIndex((t) => t.threadId === threadId);
        if (index === -1) return;

        const [thread] = threads.splice(index, 1);
        const newThreads = [thread, ...threads];

        // update current asset
        setCurrentAsset((prev) =>
            prev ? { ...prev, threads: newThreads } : prev,
        );

        // update asset list
        setAssetList((prev) =>
            prev.map((asset) =>
                asset.id === currentAsset.id
                    ? { ...asset, threads: newThreads }
                    : asset,
            ),
        );
    }

    // remove thread from asset list and current asset
    function removeThread(threadId: string) {
        // update asset list
        setAssetList((prev) =>
            prev.map((asset) => {
                if (!asset.threads?.length) return asset;

                return {
                    ...asset,
                    threads: asset.threads.filter(
                        (t) => t.threadId !== threadId,
                    ),
                };
            }),
        );

        // update current asset
        setCurrentAsset((prev) => {
            if (!prev?.threads) return prev;

            return {
                ...prev,
                threads: prev.threads.filter((t) => t.threadId !== threadId),
            };
        });
    }

    // get asset from list using given asset id
    function getAssetFromListById(assetId: string) {
        return assetList.find((a) => a.id === assetId) ?? null;
    }

    useEffect(() => {
        if (assetList.length) {
            const asset = assetList.find((a) => a.id === currentAssetId);
            setCurrentAsset(asset ?? null);
        }
    }, [assetList, currentAssetId]);

    useEffect(() => {
        // bootstrap with data if user found
        if (user && selectedLocation) {
            if (!hasBootstrapped) {
                fetchAssetList();
            } else {
                // unset current data if not asset
                if (
                    !pathname.includes('/asset') &&
                    !pathname.includes('/thread') &&
                    !pathname.includes('/new-chat')
                ) {
                    setCurrentAssetId(null);
                    setCurrentAsset(null);
                }

                // if page changes to asset handle the feature
                if (assetIdFromUrl) handleAssetPage(assetIdFromUrl);
            }
        } else {
            resetData();
        }
    }, [user, hasBootstrapped, assetIdFromUrl, pathname, selectedLocation]);

    // Refetch assets when location changes
    useEffect(() => {
        if (user && selectedLocation && hasBootstrapped) {
            console.log('Location changed, refreshing assets...');
            fetchAssetList(true);
        }
    }, [selectedLocation]);

    return (
        <AssetContext.Provider
            value={{
                hasBootstrapped,
                isAssetListLoading,
                isAssetThreadListLoading,
                isAssetLoading,
                assetList,
                currentAsset,
                currentAssetId,
                setAssetList,
                setCurrentAssetId,
                setCurrentAsset,
                refreshAssetList,
                addNewThreadToList,
                updateThreadTitle,
                placeThreadToTop,
                removeThread,
                getAssetFromListById,
            }}
        >
            {children}
        </AssetContext.Provider>
    );
}
