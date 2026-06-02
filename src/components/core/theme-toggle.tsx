'use client';

import userService from '@/services/api/userService';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

/**
 * Header light/dark switch. Toggles between light and dark, persists the
 * preference (best-effort — never blocks the UI), and shows the icon for the
 * mode you'd switch *to* (moon while light, sun while dark).
 */
export function ThemeToggle() {
    const { resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // next-themes only knows the resolved theme after mount — guard against a
    // server/client mismatch by rendering a stable placeholder until then.
    useEffect(() => setMounted(true), []);

    const isDark = resolvedTheme === 'dark';

    const toggle = () => {
        const next = isDark ? 'light' : 'dark';
        setTheme(next);
        // Persist for real users; harmless no-op if the backend is unreachable.
        userService.setTheme(next).catch(() => {});
    };

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="hover:!bg-muted"
                    onClick={toggle}
                    aria-label="Toggle theme"
                >
                    {mounted && isDark ? (
                        <Sun className="size-4" />
                    ) : (
                        <Moon className="size-4" />
                    )}
                </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="end">
                {mounted && isDark ? 'Switch to light' : 'Switch to dark'}
            </TooltipContent>
        </Tooltip>
    );
}
