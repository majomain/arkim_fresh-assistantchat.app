'use client';

import { useAsset } from '@/hooks/use-asset';
import { useAuth } from '@/hooks/use-auth';
import { useDebounce } from '@/hooks/use-debounce';
import { useLocation } from '@/hooks/use-location';
import onboardingService from '@/services/api/onboardingService';
import { AssetDocumentList } from '@/types/equipment/document';
import { FileStackIcon, RefreshCcw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import {
    Accordion,
    AccordionContent,
    AccordionHeader,
    AccordionItem,
} from '@/components/ui/accordian';
import { Button } from '@/components/ui/button';
import PDFPreviewer from '@/components/ui/pdf-viewer';
import { Skeleton } from '@/components/ui/skeleton';
import { errorToast } from '@/components/ui/sonner';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';

import CardView from './CardView';
import TableView from './TableView';

export default function Documents() {
    // preview data for current selected doc
    const [previewData, setPreviewData] = useState<{
        url: string;
        name: string;
    } | null>(null);

    // runtime utils
    const { currentAsset } = useAsset();
    const { refreshSession, user } = useAuth();
    const { selectedLocation } = useLocation();

    // is data loading flag
    const [isDataLoading, setIsDataLoading] = useState<boolean>(false);

    // search value
    const [search, setSearch] = useState<string>('');
    // document list
    const [documentList, setDocumentList] = useState<AssetDocumentList>([]);

    const debouncedSearch = useDebounce(search, 400);
    const isTyping = search !== debouncedSearch;

    // get list of documents
    const getDocuments = useCallback(async () => {
        try {
            if (selectedLocation && currentAsset) {
                setIsDataLoading(true);
                const response =
                    await onboardingService.getDocumentsByAssetAndModelId(
                        currentAsset.id,
                        currentAsset.assetModelId ?? '',
                        debouncedSearch,
                    );

                setDocumentList(response);
            }
        } catch (error: any) {
            errorToast({ title: 'Error', description: error.message });
        } finally {
            setIsDataLoading(false);
        }
    }, [selectedLocation, currentAsset, debouncedSearch]);

    useEffect(() => {
        getDocuments();
    }, [getDocuments]);

    useEffect(() => {
        setSearch('');
    }, [currentAsset]);

    return (
        <div className="w-full bento px-6 py-4">
            <Accordion>
                <AccordionItem hideBorder={true} defaultOpen={false}>
                    <AccordionHeader>
                        <div className="flex flex-row gap-1 items-center text-sm font-medium">
                            <FileStackIcon className="size-5" />
                            Documents
                            {isDataLoading ? (
                                <Skeleton className="size-4" />
                            ) : (
                                <span>({documentList.length})</span>
                            )}
                        </div>
                    </AccordionHeader>
                    <AccordionContent smoothHide={true}>
                        <div className="w-full flex justify-end mt-2 mb-4">
                            <div className="flex flex-row items-center justify-end gap-2">
                                <Tooltip>
                                    <TooltipTrigger
                                        asChild
                                        disabled={isDataLoading || isTyping}
                                    >
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => {
                                                if (!isDataLoading) {
                                                    setSearch('');
                                                    getDocuments();
                                                }
                                            }}
                                        >
                                            <RefreshCcw className="size-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        Refresh documents
                                    </TooltipContent>
                                </Tooltip>
                                {/* <Search search={search} setSearch={setSearch} /> */}
                            </div>
                        </div>

                        <TableView
                            filteredDocuments={documentList}
                            setPreviewData={setPreviewData}
                            isDataLoading={isDataLoading || isTyping}
                        />

                        <CardView
                            filteredDocuments={documentList}
                            setPreviewData={setPreviewData}
                            isDataLoading={isDataLoading || isTyping}
                        />
                    </AccordionContent>
                </AccordionItem>
            </Accordion>

            {previewData && (
                <PDFPreviewer
                    url={previewData.url}
                    filename={previewData.name}
                    open={!!previewData}
                    downloadable={false} // only allow admins to download documents
                    onClose={() => setPreviewData(null)}
                    fetchPdf={async (url) => {
                        const res = await fetch(url, {
                            credentials: 'include',
                        });

                        if (res.status === 403) {
                            refreshSession();
                        }
                        if (!res.ok)
                            throw new Error(
                                `HTTP ${res.status}: ${res.statusText}`,
                            );
                        return res.blob();
                    }}
                />
            )}
        </div>
    );
}
