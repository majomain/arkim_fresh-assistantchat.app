'use client';

import { useAsset } from '@/hooks/use-asset';
import { useAuth } from '@/hooks/use-auth';
import { useChat } from '@/hooks/use-chat';
import { useDraft } from '@/hooks/use-draft';
import { useDraggableCard } from '@/hooks/use-draggable-card';
import * as LucideIcons from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarTrigger,
    useSidebar,
} from '@/components/ui/sidebar';

import { cn } from '@/lib/utils';

import { AppLogo } from '../core/app-logo';
import GlobalSearchDialog from '../core/global-search/GlobalSearchDialog';
import ThreadList from '../core/thread-list/ThreadList';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import LocationSelector from './LocationSelector';
import { SideBarMenu } from './sidebar-menu';

export default function SideBar() {
    const { draftCount } = useDraft();
    // user detail
    const { user } = useAuth();
    // sidebar utils
    const { isMobile, toggleSidebar, state } = useSidebar();
    // runtime chat data
    const { processedThreads } = useChat();
    const { isAssetListLoading, refreshAssetList } = useAsset();

    const pathName = usePathname();
    const { openCard, cards } = useDraggableCard();

    return user ? (
        <Sidebar variant="sidebar" collapsible="icon">
            <SidebarHeader className="h-14">
                <div className="flex items-center justify-between h-full">
                    <AppLogo className="group-data-[collapsible=icon]:hidden hover:!bg-sidebar-accent" />
                    <div className="relative">
                        <SidebarTrigger />
                        {state === 'collapsed' &&
                            !isMobile &&
                            Object.keys(processedThreads).length > 0 && (
                                <span className="absolute right-0.5 top-0.5 w-1 h-1 p-1 bg-primary rounded-full" />
                            )}
                    </div>
                </div>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup className="bg-sidebar">
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {/* Location Selector */}
                            <LocationSelector />

                            {/* search */}
                            <SidebarMenuItem>
                                <SidebarMenuButton tooltip={'Search'} asChild>
                                    <GlobalSearchDialog />
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            {/* add new asset */}
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    asChild
                                    onClick={() => {
                                        if (isMobile) toggleSidebar();
                                        openCard('onboard');
                                    }}
                                    isActive={cards['onboard']?.open}
                                    tooltip={'New Asset'}
                                >
                                    <div className="cursor-pointer">
                                        <LucideIcons.Plus className="text-muted-foreground" />

                                        <span className="group-data-[collapsible=icon]:hidden text-foreground">
                                            New Asset
                                        </span>
                                    </div>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            {SideBarMenu.map((item) => {
                                const IconComponent = LucideIcons[
                                    item.icon
                                ] as React.ComponentType<{
                                    className?: string;
                                }>;

                                return (
                                    <SidebarMenuItem key={item.href}>
                                        <SidebarMenuButton
                                            isActive={pathName.includes(
                                                item.href,
                                            )}
                                            tooltip={item.title}
                                            asChild
                                        >
                                            <Link
                                                onClick={() => {
                                                    if (isMobile)
                                                        toggleSidebar();
                                                }}
                                                href={item.href}
                                                className="flex items-center gap-2 w-full justify-between"
                                            >
                                                <div className="flex flex-row items-center gap-2">
                                                    <IconComponent className="size-4" />

                                                    <span className="group-data-[collapsible=icon]:hidden text-foreground">
                                                        {item.title}
                                                    </span>
                                                </div>

                                                {draftCount > 0 &&
                                                item.title
                                                    .toLowerCase()
                                                    .includes('draft') &&
                                                !pathName.includes(
                                                    item.href,
                                                ) ? (
                                                    <span className="text-xs bg-sidebar-primary text-sidebar-primary-foreground px-1.5 py-0.5 rounded-full">
                                                        {draftCount}
                                                    </span>
                                                ) : null}
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}

                            <Separator className="group-data-[collapsible=icon]:hidden" />
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <div
                    className={cn(
                        'flex flex-row justify-between itemc-center px-3 group-data-[collapsible=icon]:hidden',
                    )}
                >
                    <p className="text-xs font-semibold text-sidebar-foreground/60">
                        Asset List
                    </p>

                    <Tooltip>
                        <TooltipTrigger>
                            <LucideIcons.RefreshCcw
                                className={cn(
                                    'size-3.5 cursor-pointer',
                                    isAssetListLoading && 'animate-spin',
                                )}
                                onClick={() => {
                                    if (!isAssetListLoading) {
                                        refreshAssetList();
                                    }
                                }}
                            />
                        </TooltipTrigger>
                        <TooltipContent side="bottom" align="start">
                            Refresh assets
                        </TooltipContent>
                    </Tooltip>
                </div>

                <div
                    className={cn(
                        'max-h-full overflow-auto px-2 pb-2 group-data-[collapsible=icon]:hidden',
                    )}
                >
                    <ThreadList />
                </div>
            </SidebarContent>

            <SidebarFooter className="border-t-1">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton tooltip="Back to Company">
                            <Link
                                href="/company-select"
                                className="flex items-center gap-2 w-full"
                            >
                                <LucideIcons.ArrowLeftFromLine className="size-4" />
                                <span className="group-data-[collapsible=icon]:hidden">
                                    Back to Company
                                </span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    ) : null;
}
