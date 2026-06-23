'use client';

import { useAuth } from '@/hooks/use-auth';
import clsx, { type ClassValue } from 'clsx';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { buildLogosPath } from '@/utils/assets';
import { emitHomePageVisited } from '@/utils/page-events';

import { Button } from '../ui/button';
import { useSidebar } from '../ui/sidebar';

const COLLAPSED_LOGO_URL = 'https://assets.arkim.ai/arkim-logo-email-98px.png';

export const AppLogo = ({ className }: { className?: ClassValue }) => {
    const [mounted, setMounted] = useState(false);
    const { resolvedTheme } = useTheme();
    const { isMobile, toggleSidebar, state } = useSidebar();
    const { user } = useAuth();
    const isCollapsed = state === 'collapsed' && !isMobile;

    useEffect(() => setMounted(true), []);

    const isDark = mounted ? resolvedTheme === 'dark' : null;
    const expandedLogoSrc = buildLogosPath(
        isDark ? 'logo-dark.svg' : 'logo-light.svg',
    );

    return (
        <Link
            href="/"
            aria-label="Arkim home"
            onClick={() => {
                emitHomePageVisited();
                if (isMobile) toggleSidebar();
            }}
        >
            <Button
                id="app-logo"
                variant="ghost"
                className={clsx(
                    'max-w-fit p-0 px-1 transition-[width,height,padding,max-width] duration-[var(--sidebar-transition-duration)] ease-[var(--sidebar-transition-timing)]',
                    isCollapsed &&
                        'size-8 min-w-8 max-w-8 overflow-hidden rounded-md p-0',
                    !user && '!bg-transparent',
                    className,
                )}
            >
                <span
                    className={clsx(
                        'app-logo-mark',
                        isCollapsed && 'app-logo-mark--collapsed',
                    )}
                    aria-hidden
                >
                    <img
                        src={expandedLogoSrc}
                        className="app-logo-mark__full"
                        alt=""
                    />
                    <img
                        src={COLLAPSED_LOGO_URL}
                        className="app-logo-mark__compact"
                        alt=""
                    />
                </span>
            </Button>
        </Link>
    );
};
