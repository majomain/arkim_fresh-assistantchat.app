'use client';

import { Skeleton } from '@/components/ui/skeleton';

export default function MessageSkeleton() {
    return (
        <div
            className="w-full md:w-120 lg:w-2xl flex flex-col gap-4 px-2"
            style={{ maxHeight: `calc(100vh - 210px)` }}
        >
            <div className="flex justify-end">
                <Skeleton className="w-[60%] p-5" />
            </div>
            <div className="flex justify-start">
                <Skeleton className="w-[60%] p-5" />
            </div>
            <div className="flex justify-end">
                <Skeleton className="w-[60%] p-5" />
            </div>
            <div className="flex justify-start">
                <Skeleton className="w-[60%] p-5" />
            </div>
            <div className="flex justify-end">
                <Skeleton className="w-[60%] p-5" />
            </div>
            <div className="flex justify-start">
                <Skeleton className="w-[60%] p-5" />
            </div>
        </div>
    );
}
