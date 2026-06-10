'use client';

import { OctagonAlertIcon } from 'lucide-react';

export default function EmptyState({
    header,
    description,
}: {
    header?: string | null;
    description?: string | null;
}) {
    return (
        <div className="w-full h-full flex flex-col items-center">
            <div className="w-full sm:w-sm flex flex-col items-center text-center gap-5">
                <OctagonAlertIcon
                    className="w-25 h-25 text-destructive"
                    strokeWidth={1.5}
                />
                <div className="flex flex-col items-center gap-1">
                    {header && <p className="text-2xl font-bold">{header}</p>}
                    {description && (
                        <p className="text-base font-semibold text-muted-foreground">
                            {description}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
