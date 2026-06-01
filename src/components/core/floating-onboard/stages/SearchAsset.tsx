'use client'

import { CogIcon } from "lucide-react";

export default function SearchAsset() {
    return <div className="w-full h-45 flex flex-col justify-center items-center gap-5">
        <CogIcon className="size-12 animate-spin" />
        <p className="text-base font-semibold">Checking Knowledge Base</p>
    </div>;
}