'use client';

import NotificationPopover from '@/components/core/notification/NotificationPopover';
import { ProfileDropdown } from '@/components/core/profile-dropdown';
import { ThemeToggle } from '@/components/core/theme-toggle';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';

type PageTopBarProps = {
    title: string;
    eyebrow?: string;
    meta?: React.ReactNode;
};

export default function PageTopBar({ title, eyebrow, meta }: PageTopBarProps) {
    const { isMobile } = useSidebar();

    return (
        <div className="flex-shrink-0 flex items-center justify-between gap-3 px-1 py-3 min-w-0">
            <div className="flex items-center gap-2 min-w-0 flex-1">
                {isMobile && (
                    <div className="flex-shrink-0">
                        <SidebarTrigger />
                    </div>
                )}
                <div className="min-w-0">
                    {eyebrow && (
                        <p className="eyebrow" style={{ marginBottom: 3 }}>
                            {eyebrow}
                        </p>
                    )}
                    <h1 className="page-header min-w-0 truncate">{title}</h1>
                    {meta}
                </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                <ThemeToggle />
                <NotificationPopover />
                <ProfileDropdown />
            </div>
        </div>
    );
}
