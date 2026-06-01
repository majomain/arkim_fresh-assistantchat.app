export type AssetDocumentStatus = 'pending'
    | 'ready_for_ingestion'
    | 'ingested'
    | 'completed'
    | 'failed';

export interface AssetDocument {
    documentId: string;
    assetMake: string;
    assetModel: string;
    assetModelId: string;
    documentCategory: string;
    assetId?: string | null;
    fileName: string;
    language: 'en';
    fileSizeKb: number;
    confidence: number;
    source: string;
    sourceUrl: string;
    previewUrl: string;
    pageCount?: number;
    processingStatus: AssetDocumentStatus;
}

export type AssetDocumentList = AssetDocument[];