'use client'
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function WorkOrdersSkeleton({ count }: { count?: number }) {
    return Array.from({ length: count ?? 7 }).map((_, index) => (
        <Card
            key={index}
        >
            <CardContent className="flex flex-col gap-2 animate-pulse">
                <div className="flex flex-row items-center justify-between">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-5 w-12" />
                </div>

                <div className="mt-3 flex flex-col gap-1.5">
                    <Skeleton className="h-16 w-full" />
                </div>

                <Skeleton className="mt-1 h-25 w-full rounded-lg" />
            </CardContent>
        </Card>
    ));
}