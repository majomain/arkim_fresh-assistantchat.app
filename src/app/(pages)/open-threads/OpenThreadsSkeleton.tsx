'use client'
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function OpenThreadsSkeleton({count}:{count?:number}) {
    return Array.from({ length: count ?? 7 }).map((_, index) => (
        <Card
            key={index}
        >
            <CardContent className="flex flex-col gap-2 animate-pulse">
                <Skeleton className="w-full h-8" />

                <Skeleton className="mt-5 h-25 w-full rounded-lg" />
            </CardContent>
        </Card>
    ));
}