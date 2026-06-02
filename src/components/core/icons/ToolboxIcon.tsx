import { cn } from '@/lib/utils';

/**
 * Toolbox icon (Lucide has no toolbox/toolcase glyph). Drawn in the Lucide
 * style — 24×24, currentColor stroke, 2px, round caps — so it sizes and tints
 * like the surrounding lucide-react icons.
 *
 *  - closed: a box with a carry handle on the lid + a seam.
 *  - open:   the tray with the lid lifted off above it (a visible gap).
 */
export function ToolboxIcon({
    open = false,
    className,
}: {
    open?: boolean;
    className?: string;
}) {
    return (
        <svg
            viewBox="0 0 24 24"
            width={24}
            height={24}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn('shrink-0', className)}
            aria-hidden="true"
        >
            {open ? (
                <>
                    {/* tray */}
                    <rect x="2" y="13" width="20" height="7" rx="1.8" />
                    <path d="M2 16.5h20" />
                    {/* lifted lid + handle */}
                    <rect x="4.5" y="6.8" width="15" height="3.2" rx="1" />
                    <path d="M10 6.8V6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v.8" />
                </>
            ) : (
                <>
                    {/* box */}
                    <rect x="2" y="9" width="20" height="11" rx="2" />
                    {/* handle on the lid */}
                    <path d="M9 9V6.5A1.5 1.5 0 0 1 10.5 5h3A1.5 1.5 0 0 1 15 6.5V9" />
                    {/* lid seam */}
                    <path d="M2 13h20" />
                </>
            )}
        </svg>
    );
}
