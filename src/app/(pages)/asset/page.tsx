'use client';

import { useAuth } from '@/hooks/use-auth';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

import Chats from './sections/chat/Chats';
import Detail from './sections/detail/Detail';
import Documents from './sections/document/Documents';
import WorkOrders from './sections/workOrder/WorkOrders';

export default function AssetPage() {
    const { user } = useAuth();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const assetIdFromUrlExist =
        pathname.includes('/asset') && searchParams.get('id') ? true : false;
    const router = useRouter();

    useEffect(() => {
        if (!assetIdFromUrlExist) {
            router.replace('/');
        }
    }, [assetIdFromUrlExist]);

    return !user ? null : (
        <div className="mx-auto my-5 flex flex-col gap-8 items-center w-full max-w-3xl px-1">
            <Detail />

            {/* Work Orders + Threads sit side by side on wider screens, stack on mobile */}
            <div className="grid w-full grid-cols-1 gap-8 md:grid-cols-2">
                <WorkOrders />

                <Chats />
            </div>

            <Documents />
        </div>
    );
}
