'use client';

import Image from 'next/image';

import { buildLogosPath } from '@/utils/assets';

export default function LogoSpinner() {
    return (
        <div className="relative flex items-center justify-center">
            {/* Logo */}
            <Image
                src={buildLogosPath('arkim.webp')}
                width={80}
                height={80}
                alt="Arkim logo"
                className="rounded-full z-10"
            />

            {/* Spinner ring */}
            <div className="absolute w-28 h-28 border-4 border-t-primary border-b-primary border-l-transparent border-r-transparent rounded-full animate-spin" />
        </div>
    );
}
