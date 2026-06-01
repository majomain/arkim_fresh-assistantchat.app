'use client'

import { useAsset } from "@/hooks/use-asset";
import ThreadListSkeleton from "./ThreadListSkeleton";
import ThreadSelective from "./ThreadSelective";

export default function ThreadList() {
    const { isAssetListLoading } = useAsset();
    return isAssetListLoading
        ?
        <ThreadListSkeleton />
        :
        <ThreadSelective />
}