'use client';

import { useAuth } from '@/hooks/use-auth';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';

import { cn } from '@/lib/utils';

export default function ForbiddenPage() {
    const { user } = useAuth();
    const router = useRouter();

    return (
        <div className="w-full h-full">
            <div
                className={cn(
                    'flex flex-col items-center justify-center text-center px-4',
                    !user ? 'min-h-screen' : 'h-[calc(100dvh-30dvh)]',
                )}
            >
                <h1 className="text-3xl font-bold tracking-tight">Error 403</h1>
                <Image
                    src="/assets/not-found.svg"
                    alt="403 Forbidden"
                    width={50}
                    height={50}
                    className="w-80"
                />
                <p className="mt-4 text-lg text-muted-foreground">
                    {user
                        ? "You don't have the right permission."
                        : "You don't have the right permission to access the application."}
                </p>
                <div className="mt-6">
                    <Button
                        asChild
                        onClick={() => {
                            if (user) router.back();
                        }}
                    >
                        {!user ? <Link href="/login">Login</Link> : 'Go back'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
