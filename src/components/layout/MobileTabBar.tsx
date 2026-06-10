'use client';

import { Box, ClipboardList, MessageSquareText, PieChart } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { ProfileDropdown } from '../core/profile-dropdown';

type Tab = {
    key: string;
    label: string;
    href: string;
    icon: React.ComponentType<{
        size?: number;
        strokeWidth?: number;
        style?: React.CSSProperties;
    }>;
    matches: (path: string) => boolean;
    hub?: boolean;
};

const TABS: Tab[] = [
    {
        key: 'work',
        label: 'Work',
        href: '/work-orders',
        icon: ClipboardList,
        matches: (p) => p.startsWith('/work-orders'),
    },
    {
        key: 'assets',
        label: 'Assets',
        href: '/assets',
        icon: Box,
        matches: (p) => p.startsWith('/assets') || p.startsWith('/asset'),
    },
    {
        key: 'threads',
        label: 'Threads',
        href: '/open-threads',
        icon: MessageSquareText,
        matches: (p) => p.startsWith('/open-threads'),
        hub: true,
    },
    {
        key: 'stats',
        label: 'Stats',
        href: '/analytics',
        icon: PieChart,
        matches: (p) => p.startsWith('/analytics'),
    },
];

/**
 * Mobile bottom tab bar — spec §2.1.
 * 5 items: Work · Assets · Threads · Stats · You.
 * Hidden on the immersive Thread screen.
 */
export default function MobileTabBar() {
    const pathname = usePathname();

    // Immersive: hide on the thread screen
    if (pathname.startsWith('/thread')) return null;

    return (
        <nav
            className="flex md:!hidden items-stretch justify-around"
            style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 40,
                background: 'var(--surface)',
                borderTop: '1px solid var(--border-col)',
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                height: 64,
            }}
        >
            {TABS.map((tab) => {
                const active = tab.matches(pathname);
                const Icon = tab.icon;
                return (
                    <Link
                        key={tab.key}
                        href={tab.href}
                        className="group"
                        style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 3,
                            textDecoration: 'none',
                            color: active
                                ? 'var(--accent-text)'
                                : 'var(--muted-col)',
                            transition: 'color 140ms',
                            position: 'relative',
                        }}
                    >
                        <Icon
                            size={21}
                            strokeWidth={active ? 2 : 1.6}
                            style={{ color: 'inherit' }}
                        />
                        <span
                            style={{
                                fontSize: 10.5,
                                fontWeight: active ? 600 : 500,
                                letterSpacing: '0.2px',
                                color: 'inherit',
                            }}
                        >
                            {tab.label}
                        </span>
                    </Link>
                );
            })}

            {/* "You" — reuses the existing ProfileDropdown avatar trigger */}
            <div
                style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 3,
                }}
            >
                <div className="scale-90">
                    <ProfileDropdown />
                </div>
                <span
                    style={{
                        fontSize: 10.5,
                        fontWeight: 500,
                        letterSpacing: '0.2px',
                        color: 'var(--muted-col)',
                    }}
                >
                    You
                </span>
            </div>
        </nav>
    );
}
