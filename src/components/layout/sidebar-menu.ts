import * as LucideIcons from "lucide-react";

type IconNameType = keyof typeof LucideIcons;

type SideBarMenuItemType = {
    title: string;
    href: string;
    icon: IconNameType
}

export const SideBarMenu: SideBarMenuItemType[] = [
    {
        title: 'Analytics',
        href: '/analytics',
        icon: 'ChartPie'
    },
    // {
    //     title: 'Drafts',
    //     href: '/drafts',
    //     icon: 'Layers2'
    // },
    {
        title: 'Work Orders',
        href: '/work-orders',
        icon: 'ClipboardList'
    },
    {
        title: 'Open Threads',
        href: '/open-threads',
        icon: 'MessageSquareText'
    },
]