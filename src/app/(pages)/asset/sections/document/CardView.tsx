'use client';

import { AssetDocumentList } from '@/types/equipment/document';
import { EyeIcon, FileIcon, FileStack } from 'lucide-react';

import CardWithPagination from '@/components/core/CardWithPagination';

export default function CardView({
    filteredDocuments,
    setPreviewData,
    isDataLoading,
}: {
    filteredDocuments: AssetDocumentList;
    setPreviewData: (data: { url: string; name: string } | null) => void;
    isDataLoading: boolean;
}) {
    return (
        <div className="md:hidden">
            <CardWithPagination
                isDataLoading={isDataLoading}
                data={filteredDocuments}
                renderCard={(doc) => (
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
                                    {doc.source.charAt(0).toUpperCase() +
                                        doc.source.slice(1)}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
                emptyState={
                    <div className="w-full flex flex-col items-center p-5 mt-5 gap-4">
                        <FileStack
                            className="text-muted-foreground w-15 h-15"
                            strokeWidth={1}
                        />
                        <div className="flex flex-col items-center">
                            <p className="text-base font-semibold">
                                No Document Found
                            </p>
                            <p className="text-sm text-muted-foreground text-center">
                                Uploaded documents will appear here
                            </p>
                        </div>
                    </div>
                }
            />
        </div>
    );
}
