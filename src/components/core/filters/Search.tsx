'use client'

import { cn } from "@/lib/utils";
import { SearchIcon, XIcon } from "lucide-react";

export default function Search({ search, setSearch, placeHolder, shadowCard = false, className }: { search: string; setSearch: (search: string) => void; placeHolder?: string; shadowCard?:boolean; className?:string }) {
    return <div className={cn(
        'flex items-center gap-2 rounded-lg px-3 py-1 bg-card border-1',
        shadowCard && 'border-1 border-muted bg-card shadow-md shadow-card-shadow rounded-md',
        className ?? ''
    )}>
        <SearchIcon className="text-muted-foreground size-4" />
        <input
            type="text"
            placeholder={placeHolder ?? 'Search'}
            value={search}
            onChange={(e) => setSearch(e.target?.value)}
            maxLength={50}
            className="w-full bg-transparent outline-none border-none p-0.5"
        />
        {search && <XIcon className="cursor-pointer text-muted-foreground size-5" onClick={() => setSearch('')} />}
    </div>;
}