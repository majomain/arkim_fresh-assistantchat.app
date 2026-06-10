'use client';

import { useAsset } from '@/hooks/use-asset';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from '@/hooks/use-location';
import onboardingService from '@/services/api/onboardingService';
import { AssetDocumentList } from '@/types/equipment/document';
import { DialogDescription } from '@radix-ui/react-dialog';
import { EyeIcon, FileIcon, Files } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

import PDFPreviewer from '../ui/pdf-viewer';
import { Skeleton } from '../ui/skeleton';
import { errorToast } from '../ui/sonner';

export default function AssetFilesDialog({
    children,
}: {
    children: React.ReactNode;
}) {
    // preview data for current selected doc
    const [previewData, setPreviewData] = useState<{
        url: string;
        name: string;
    } | null>(null);

    // runtime utils
    const { currentAsset } = useAsset();
    const { selectedLocation } = useLocation();
    const { refreshSession, user } = useAuth();

    // open state for dialog
    const [open, setOpen] = useState<boolean>(false);

    // document list
    const [documentList, setDocumentList] = useState<AssetDocumentList>([]);
    // is data loading flag
    const [isDataLoading, setIsDataLoading] = useState<boolean>(false);

    // get list of documents
    async function getDocuments() {
        try {
            if (selectedLocation && currentAsset) {
                setIsDataLoading(true);
                const response =
                    await onboardingService.getDocumentsByAssetAndModelId(
                        currentAsset.id,
                        currentAsset.assetModelId ?? '',
                    );

                setDocumentList(response);
            }
        } catch (error: any) {
            errorToast({ title: 'Error', description: error.message });
        } finally {
            setIsDataLoading(false);
        }
    }

    // get documents whenever dialog is open
    useEffect(() => {
        if (open) {
            getDocuments();
        } else {
            setIsDataLoading(false);
            setDocumentList([]);
        }
    }, [open]);

    return (
        <Dialog
            open={open}
            onOpenChange={(open) => {
                setOpen(open);
            }}
        >
            <DialogTrigger asChild onClick={() => setOpen(open)}>
                {children}
            </DialogTrigger>
            <DialogContent
                onOpenAutoFocus={(e) => {
                    e.preventDefault();
                }}
            >
                <DialogTitle>
                    <p className="text-xl font-semibold">Documents</p>
                </DialogTitle>
                <DialogDescription />

                <div className="max-h-100 overflow-y-auto p-2 flex flex-col gap-5">
                    {isDataLoading ? (
                        Array.from({ length: 2 }).map((_, index) => (
                            <div
                                key={index}
                                className="w-full flex flex-row justify-between items-center p-2 border rounded-md"
                            >
                                <div className="w-full flex flex-col gap-5">
                                    <Skeleton className="w-50 h-5" />

                                    <Skeleton className="w-30 h-4" />
                                </div>
                            </div>
                        ))
                    ) : documentList.length ? (
                        documentList.map((doc) => (
                            <div
                                key={doc.documentId}
                                onClick={() =>
                                    setPreviewData({
                                        url: doc.previewUrl,
                                        name: doc.fileName,
                                    })
                                }
                                className="w-full flex flex-row justify-between items-center p-2 border rounded-md cursor-pointer hover:bg-muted/50"
                            >
                                {/* checkbox and file name */}
                                <div className="w-full flex flex-col gap-5">
                                    <p className="text-base font-semibold">
                                        {doc.fileName}
                                    </p>

                                    {/* details */}
                                    <div className="flex flex-row gap-2 items-center text-sm font-medium text-muted-foreground">
                                        <p>{doc.documentCategory}</p>
                                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground"></span>
                                        <p>
                                            Source:{' '}
                                            {doc.source
                                                .charAt(0)
                                                .toUpperCase() +
                                                doc.source.slice(1)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        // empty state for no document found
                        <div className="flex flex-col items-center p-2 gap-4">
                            <Files
                                className="text-muted-foreground size-15"
                                strokeWidth={1.5}
                            />
                            <div className="flex flex-col items-center">
                                <p className="text-lg font-bold">
                                    No Document Found
                                </p>
                                <p className="text-sm text-muted-foreground text-center">
                                    Documents will show up once it is ingested
                                </p>
                            </div>
                        </div>
                    )}

                    {previewData && (
                        <PDFPreviewer
                            url={previewData.url}
                            filename={previewData.name}
                            open={!!previewData}
                            onClose={() => setPreviewData(null)}
                            downloadable={false} // only allow admins to download documents
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
            </DialogContent>
        </Dialog>
    );
}
