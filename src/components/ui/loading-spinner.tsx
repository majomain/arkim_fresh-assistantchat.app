import { cn } from "@/lib/utils";

export const LoadingSpinner = ({ className }: { className?: string }) => (
    <div
        className={cn(

            className,
            'size-3 md:size-4 m-auto animate-spin rounded-full border-2 border-current border-t-transparent'

        )}
    >
        <span className="sr-only">Loading...</span>
    </div>
);
