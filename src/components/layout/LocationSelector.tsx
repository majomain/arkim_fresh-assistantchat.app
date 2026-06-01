'use client'

import { useLocation } from "@/hooks/use-location";
import { Select, SelectContent, SelectItem, SelectTrigger } from "../ui/select"
import { useSidebar } from "../ui/sidebar";
import { Factory } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocationBroadcast } from "@/hooks/broadcasts/use-location-broadcast";

export default function LocationSelector() {
    // sidebar utils
    const { isMobile, state } = useSidebar();
    // location data
    const { locations, selectedLocation, selectLocation, isLoadingLocations } = useLocation();

    const { locationUpdated } = useLocationBroadcast((event) => {
        if (event.type === 'LOCATION_UPDATED') {
            selectLocation(event.locationId);
        }
    });

    return (state === 'expanded' || isMobile) && (
        <Select
            value={selectedLocation?.id || ''}
            onValueChange={(value) => {
                selectLocation(value);
                locationUpdated(value);
            }}
            disabled={
                isLoadingLocations || locations.length === 0
            }
        >
            <SelectTrigger className="w-full h-9 font-medium text-sm focus:ring-0">
                <p className="flex flex-row items-center gap-1">
                    <Factory />
                    {selectedLocation?.name}
                </p>
            </SelectTrigger>
            <SelectContent>
                {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id!} className={cn(
                        'group/siteTab flex flex-row items-center gap-2 my-1',
                        { 'bg-sidebar-accent font-medium': selectedLocation?.id === location.id }
                    )}>
                        <Factory className={selectedLocation?.id === location.id ? 'text-primary group-hover/siteTab:text-muted-foreground' : ''} />
                        {location.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}