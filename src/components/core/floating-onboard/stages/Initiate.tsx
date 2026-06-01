'use client'

import { RotateCw } from "lucide-react";

export default function Initiate({  asset }: { asset: string; }) {
    return <div className="w-full h-45 flex flex-col justify-center items-center gap-5">
        <RotateCw className="size-12 animate-spin" />
        <p className="text-base font-semibold text-center">
            Initiating process For {asset}
        </p>
    </div>;
}