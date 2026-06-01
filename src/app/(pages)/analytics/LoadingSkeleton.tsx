'use client'

import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingSkeleton() {
    return <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="flex-1 h-60" />
            <Skeleton className="flex-1 h-60" />
            <Skeleton className="flex-1 h-60" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="lg:col-span-2 flex-1 h-60" />
            <Skeleton className="flex-1 h-60" />
            <Skeleton className="flex-1 h-60" />
        </div>
    </div>;
}