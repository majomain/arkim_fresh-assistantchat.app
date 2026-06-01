'use client'

import ArkimLoader from "@/components/core/ArkimLoader";

export default function PageLoader() {
    return (
        <div className="w-screen h-screen flex flex-col justify-center items-center bg-background">
            {/* Branded mark loader — spec §8 (no generic spinner) */}
            <ArkimLoader size={56} label="Loading…" />
        </div>
    )
}
