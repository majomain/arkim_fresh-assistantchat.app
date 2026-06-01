'use client'

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { errorToast } from "@/components/ui/sonner";
import { useAsset } from "@/hooks/use-asset";
import { useLocation } from "@/hooks/use-location";
import equipmentService from "@/services/api/equipmentService";
import { AssetDetailList } from "@/types/equipment/asset";
import { Box, SearchIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function AssetSearch({ isTyping, search, closeDialog }: { isTyping: boolean; search: string; closeDialog: () => void; }) {
    // asset utils
    const { isAssetListLoading } = useAsset();
    // location util
    const { selectedLocation } = useLocation();
    const router = useRouter();

    const [assets, setAssets] = useState<AssetDetailList>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // get list of assets
    const getAssets = useCallback(async () => {
        try {
            if (!search) {
                setAssets([]);
                return;
            }

            if (selectedLocation) {
                setIsLoading(true);

                // Fetch assets from equipment service
                const response = await equipmentService.getList(
                    selectedLocation.id,
                    search
                );


                setAssets(response);
            }
        } catch (error: any) {
            errorToast({ title: 'Error', description: error.message });
        } finally {
            setIsLoading(false);
        }
    }, [selectedLocation, search]);

    useEffect(() => {
        getAssets();
    }, [getAssets]);

    return isLoading || isAssetListLoading || isTyping ? (
        <div className="flex flex-col gap-2 max-h-[60dvh] overflow-y-auto px-2 scrollable">
            {
                Array.from({ length: 1 }).map((_, index) => (
                    <Skeleton key={index} className="h-35 w-full rounded-lg" />
                ))
            }
        </div>
    ) : assets.length ? (
        <div className="grid grid-cols-1 gap-2 max-h-[60dvh] overflow-y-auto px-2 scrollable">
            {assets.map((asset, index) => {
                return (
                    <Card className="cursor-pointer hover:shadow-none" key={`asset-${asset.id}-${index}`}
                        onClick={() => {
                            closeDialog();
                            router.push(`/asset?id=${asset.id}`);
                        }}
                    >
                        <CardContent>
                            <p className="text-base font-semibold">{asset.name}</p>
                            <div className="grid grid-cols-2 gap-2 pl-0.5">
                                <p className="text-xs flex flex-col items-start font-semibold text-muted-foreground">
                                    Type
                                    <span className="!font-normal">
                                        {asset?.type}
                                    </span>
                                </p>
                                <p className="text-xs flex flex-col items-start font-semibold text-muted-foreground">
                                    Manufacturer
                                    <span className="!font-normal">
                                        {asset?.manufacturer}
                                    </span>
                                </p>
                                <p className="text-xs flex flex-col items-start font-semibold text-muted-foreground">
                                    Model
                                    <span className="!font-normal">
                                        {asset?.model}
                                    </span>
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    ) : (
        <div className="w-full flex flex-col justify-center items-center mb-10">
            <div className="p-3 flex justify-center items-center bg-transparent cursor-default">
                {
                    search
                        ?
                        <Box
                            className="w-16 h-16 text-muted-foreground"
                            strokeWidth={1}
                        />
                        :
                        <SearchIcon
                            className="w-16 h-16 text-muted-foreground"
                            strokeWidth={1}
                        />
                }
            </div>
            <div className="flex flex-col gap-2 items-center justify-center text-center">
                <h3 className="text-base font-semibold">
                    {
                        search ? 'No assets found' : 'Start typing to search'
                    }
                </h3>
            </div>
        </div>
    )
}