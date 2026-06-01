'use client';

/**
 * ArkimLoader — branded loader built from the real Arkim mark.
 *
 * Two modes:
 *   indeterminate  A highlight band sweeps top→bottom through the mark, looping.
 *                  Used for: streaming thinking, list sync, any open-ended wait.
 *   determinate    The mark fills top→bottom by `pct` (0–100).
 *                  Used for: onboarding pipeline with showPct.
 *
 * Implementation note (from spec §8): stacked <img> layers with clip-path so it
 * renders and captures reliably across browsers without CSS mask CORS issues.
 *
 * Sizes: 18 (inline trace), 22 (working line), 34 (list sync), 56–64 (pipeline).
 */

interface ArkimLoaderProps {
    size?: number;
    pct?: number | null;
    label?: string;
    inline?: boolean;
    showPct?: boolean;
    className?: string;
}

const BASE_SRC   = '/assets/loader/arkim-mark.png';
const ACCENT_SRC = '/assets/loader/arkim-mark-accent.png';

export default function ArkimLoader({
    size = 56,
    pct = null,
    label,
    inline = false,
    showPct = false,
    className,
}: ArkimLoaderProps) {
    const determinate = pct != null;

    const mark = (
        <span
            className="amark"
            data-mode={determinate ? 'determinate' : 'indeterminate'}
            style={{
                width: size,
                height: size,
                '--pct': `${pct ?? 0}%`,
            } as React.CSSProperties}
        >
            {/* dim base — "empty screw" */}
            <img className="amark-layer amark-base" src={BASE_SRC} alt="" draggable={false} />
            {/* soft trailing glow for depth (indeterminate only) */}
            {!determinate && (
                <img className="amark-layer amark-glow" src={ACCENT_SRC} alt="" draggable={false} />
            )}
            {/* accent fill — clipped to reveal via animation or pct */}
            <img className="amark-layer amark-fill" src={ACCENT_SRC} alt="" draggable={false} />
        </span>
    );

    if (showPct && determinate) {
        return (
            <div className={`loader-pct${className ? ` ${className}` : ''}`}>
                {mark}
                <div className="lp-num">
                    {Math.round(pct ?? 0)}<b>%</b>
                </div>
                {label && <div className="lb-label">{label}</div>}
            </div>
        );
    }

    if (inline) {
        return (
            <span className={`loader-inline${className ? ` ${className}` : ''}`}>
                {mark}
                {label && <span className="li-label">{label}</span>}
            </span>
        );
    }

    return (
        <div className={`loader-block${className ? ` ${className}` : ''}`}>
            {mark}
            {label && <div className="lb-label">{label}</div>}
        </div>
    );
}
