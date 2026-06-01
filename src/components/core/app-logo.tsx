'use client'
import clsx, { type ClassValue } from 'clsx';
import Image from 'next/image';

import { buildLogosPath } from '@/utils/assets';

import { Button } from '../ui/button';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSidebar } from '../ui/sidebar';
import { useAuth } from '@/hooks/use-auth';
import { emitHomePageVisited } from '@/utils/page-events';

export const AppLogo = ({ className }: { className?: ClassValue }) => {
    // flag for component mount
    const [mounted, setMounted] = useState(false);
    // get the current resolved theme
    const { resolvedTheme } = useTheme();
    // sidebar utils
    const { isMobile, toggleSidebar } = useSidebar();
    const { user } = useAuth();

    useEffect(() => setMounted(true), []);

    // flag for dark mode after mount to avoid hydration problems
    const isDark = mounted ? resolvedTheme === "dark" : null;

    return (
        <Link href="/" onClick={
            () => {
                emitHomePageVisited();
                if (isMobile) toggleSidebar();
            }
        }>
            <Button
                id='app-logo'
                variant={'ghost'}
                className={clsx(
                    'max-w-fit p-0 px-1',
                    !user && '!bg-transparent',
                    className,
                )}
            >

                <img src={buildLogosPath(isDark ? 'logo-dark.svg' : 'logo-light.svg')} className='block w-auto h-7' alt='Arkim logo' />
            </Button>
        </Link>
    );
};
