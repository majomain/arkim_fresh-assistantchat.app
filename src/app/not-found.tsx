'use client';

import Image from 'next/image';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

export default function NotFound() {
    return (
        <div className="w-full h-full">
            <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
                <h1 className="text-3xl font-bold tracking-tight">Error 404</h1>
                <Image
                    src="/assets/not-found.svg"
                    alt="404 Not Found"
                    width={50}
                    height={50}
                    className="w-80"
                />

                <p className="mt-4 text-lg text-muted-foreground">
                    Oops! The page you’re looking for doesn’t exist.
                </p>
                <div className="mt-6">
                    <Button asChild>
                        <Link href="/">Go back home</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
