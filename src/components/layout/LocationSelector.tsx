'use client';

import { useLocationBroadcast } from '@/hooks/broadcasts/use-location-broadcast';
import { useLocation } from '@/hooks/use-location';
import { Factory } from 'lucide-react';

import { cn } from '@/lib/utils';

import { Select, SelectContent, SelectItem, SelectTrigger } from '../ui/select';
import { SidebarMenuButton, SidebarMenuItem, useSidebar } from '../ui/sidebar';

export default function LocationSelector() {
    // sidebar utils
    const { isMobile, state } = useSidebar();
    // location data
    const { locations, selectedLocation, selectLocation, isLoadingLocations } =
        useLocation();

    const { locationUpdated } = useLocationBroadcast((event) => {
        if (event.type === 'LOCATION_UPDATED') {
            selectLocation(event.locationId);
        }
    });

    const isIconOnly = state === 'collapsed' && !isMobile;
    const locationLabel = selectedLocation?.name || 'Select location';

    const handleValueChange = (value: string) => {
        selectLocation(value);
        locationUpdated(value);
    };

    return (
        <SidebarMenuItem>
            <Select
                value={selectedLocation?.id || ''}
                onValueChange={handleValueChange}
                disabled={isLoadingLocations || locations.length === 0}
            >
                {isIconOnly ? (
                    <SidebarMenuButton tooltip={locationLabel} asChild>
                        <SelectTrigger className="sidebar-collapse-item h-8 w-full border-0 bg-transparent p-0 shadow-none focus:ring-0 [&>svg:last-child]:hidden">
                            <Factory className="size-4 shrink-0" />
                        </SelectTrigger>
                    </SidebarMenuButton>
                ) : (
                    <SelectTrigger className="w-full h-9 font-medium text-sm focus:ring-0">
                        <p className="flex flex-row items-center gap-2">
                            <Factory className="size-4 shrink-0" />
                            {selectedLocation?.name}
                        </p>
                    </SelectTrigger>
                )}
                <SelectContent>
                    {locations.map((location) => (
                        <SelectItem
                            key={location.id}
                            value={location.id!}
                            className={cn(
                                'group/siteTab flex flex-row items-center gap-2 my-1',
                                {
                                    'bg-sidebar-accent font-medium':
                                        selectedLocation?.id === location.id,
                                },
                            )}
                        >
                            <Factory
                                className={
                                    selectedLocation?.id === location.id
                                        ? 'text-primary group-hover/siteTab:text-muted-foreground'
                                        : ''
                                }
                            />
                            {location.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </SidebarMenuItem>
    );
}
