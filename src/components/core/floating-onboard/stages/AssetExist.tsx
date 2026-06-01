'use client';

import { useDraggableCard } from '@/hooks/use-draggable-card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import SuccessSvg from '@/components/ui/success-svg/success-svg';

export default function AssetExist({ assetId }: { assetId: string }) {
    const { closeCard } = useDraggableCard();

    return (
        <div className="w-full h-55 flex flex-col justify-center items-center gap-5 text-center pb-1">
            <SuccessSvg className="w-15" />
            <p className="text-base font-semibold">
                Asset with given make and model <br /> already exist
            </p>

            <Link
                className="w-70"
                href={`/asset?id=${assetId}`}
                onClick={() => closeCard('onboard')}
            >
                <Button className="w-full" variant="bevel">Start Chat</Button>
            </Link>
        </div>
    );
}
