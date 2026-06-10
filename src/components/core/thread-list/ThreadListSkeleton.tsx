'use client';

import { Skeleton } from '@/components/ui/skeleton';

export default function ThreadListSkeleton() {
    return (
        <div className="flex flex-col items-stretch gap-1.5">
            <Skeleton className="h-8 rounded-lg" />
            <Skeleton className="h-8 rounded-lg" />
            <Skeleton className="h-8 rounded-lg" />
            <Skeleton className="h-8 rounded-lg" />
        </div>
    );
}
