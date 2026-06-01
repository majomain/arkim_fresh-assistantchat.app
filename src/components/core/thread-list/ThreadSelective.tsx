'use client';
import { useChat } from '@/hooks/use-chat';
import clsx from 'clsx';
import {
    Box,
    Loader2,
    PackageCheck,
    PackageOpen,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useSidebar } from '@/components/ui/sidebar';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { truncateTitle } from '@/utils/string';
import { cn } from '@/lib/utils';
import ThreadSelectiveChat from './ThreadSelectiveChat';
import { useAsset } from '@/hooks/use-asset';
import { useThread } from '@/hooks/use-thread';

export default function ThreadSelective() {
    // is device mobile
    const { isMobile, toggleSidebar, scrollRef } = useSidebar();
    // runtime chat data
    const { processingThreads, processedThreads } = useChat();

    // runtime data
    const {
        isAssetThreadListLoading,
        assetList,
        currentAssetId,
    } = useAsset();

    const { currentThreadId } = useThread();

    // router for redirection
    const router = useRouter();

    // check if asset is in process or not
    const isAssetProcessing = (assetId: string) =>
        Object.values(processingThreads).some((val) => val === assetId);
    // check if asset has processed or not
    const isAssetProcessed = (assetId: string) =>
        Object.values(processedThreads).some((val) => val === assetId);

    // scroll to active asset
    const activeAssetRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!activeAssetRef.current || !scrollRef.current || currentThreadId) return;

        activeAssetRef.current.scrollIntoView({
            block: 'nearest',
            behavior: 'smooth',
        });
    }, [currentAssetId, currentThreadId]);

    return (
        <div className="flex flex-col">
            {assetList.length > 0 ? (
                <div className={cn('flex flex-col items-stretch gap-1')}>
                    {assetList.map((asset) => (
                        <div
                            ref={asset.id === currentAssetId ? activeAssetRef : null}
                            key={asset.id}
                            className="relative flex flex-col items-stretch gap-1"
                        >

                            <div
                                className={clsx(
                                    'sticky top-0 z-1 bg-card flex-1 hover:bg-sidebar-accent group/assetTab',
                                    'rounded-md flex items-center justify-between text-sm cursor-pointer',
                                    {
                                        'bg-sidebar-accent font-medium': asset.id === currentAssetId,
                                    }
                                )}
                            >
                                <Tooltip delayDuration={600}>
                                    <TooltipTrigger className='flex flex-row items-center w-full' asChild>
                                        <div>
                                            <div
                                                className="w-full py-2 px-2 flex flex-row items-center gap-2" onClick={() => {
                                                    const redirectPath = currentAssetId ===
                                                        asset.id &&
                                                        currentThreadId === null ?
                                                        '/' :
                                                        `/asset?id=${asset.id}`;

                                                    router.push(redirectPath);
                                                    if (isMobile) toggleSidebar();
                                                }}>
                                                {isAssetProcessing(
                                                    asset.id,
                                                ) &&
                                                    asset.id !== currentAssetId ? (
                                                    <PackageOpen
                                                        className={cn(
                                                            'size-4',
                                                            {
                                                                'group-hover/assetTab:text-foreground text-sidebar-primary-foreground':
                                                                    asset.id === currentAssetId && !currentThreadId
                                                            }
                                                        )}
                                                    />
                                                ) : isAssetProcessed(asset.id) &&
                                                    asset.id !== currentAssetId ? (
                                                    <PackageCheck
                                                        className={cn(
                                                            'size-4',
                                                            {
                                                                'group-hover/assetTab:text-foreground text-sidebar-primary-foreground':
                                                                    asset.id === currentAssetId && !currentThreadId
                                                            }
                                                        )}
                                                    />
                                                ) : asset.id === currentAssetId ? (
                                                    <PackageOpen
                                                        className={cn(
                                                            'size-4',
                                                            {
                                                                'group-hover/assetTab:text-sidebar-foreground text-sidebar-primary-foreground':
                                                                    asset.id === currentAssetId
                                                            }
                                                        )}
                                                    />
                                                ) : (
                                                    <Box
                                                        className={cn(
                                                            'size-4 group-hover/assetTab:text-foreground'
                                                        )}
                                                    />
                                                )}

                                                {truncateTitle(asset.name, 22)}
                                            </div>

                                            {currentAssetId === asset.id &&
                                                isAssetThreadListLoading ? (
                                                <p className="py-2 px-2 !text-sidebar-foreground flex flex-row items-center">
                                                    <Loader2 width={20} height={20} className='animate-spin text-sidebar-primary-foreground' />
                                                </p>
                                            ) : null}
                                        </div>
                                    </TooltipTrigger>
                                    {asset.name.length > 18 && (
                                        <TooltipContent
                                            side={isMobile ? 'top' : 'right'}
                                        >
                                            {asset.name}
                                        </TooltipContent>)}
                                </Tooltip>
                            </div>


                            <ThreadSelectiveChat
                                threads={asset.threads}
                                hidden={currentAssetId !== asset.id}
                            />
                        </div>
                    ))}
                </div>
            ) : null}
        </div>
    );
}
