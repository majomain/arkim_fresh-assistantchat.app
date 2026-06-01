'use client';

import { useDraggableCard } from '@/hooks/use-draggable-card';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import SuccessSvg from '@/components/ui/success-svg/success-svg';

export default function Success({ assetId }: { assetId: string }) {
    const { closeCard } = useDraggableCard();

    return (
        <div className="w-full h-55 flex flex-col justify-center items-center gap-5 text-center pb-1">
            <SuccessSvg className="w-15" />
            <p className="text-base font-semibold">
                Your new asset has been successfully <br /> onboarded
            </p>
            <Link
                href={`/asset?id=${assetId}`}
                onClick={() => closeCard('onboard')}
            >
                <Button variant="bevel">Checkout Asset</Button>
            </Link>
        </div>
    );
}
