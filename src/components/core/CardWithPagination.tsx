'use client';

import { Loader2, PackageOpen } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import Pagination, { SizeType } from './filters/Pagination';

interface CardWithPaginationProps<T> {
    data: T[];
    renderCard: (item: T, index?: number) => React.ReactNode;
    isDataLoading?: boolean;
    emptyState?: React.ReactNode;
}

export default function CardWithPagination<T>({
    data,
    renderCard,
    isDataLoading = false,
    emptyState,
}: CardWithPaginationProps<T>) {
    // current page state for pagination
    const [currentPage, setCurrentPage] = useState(1);
    // current size state for pagination
    const [currentSize, setCurrentSize] = useState<SizeType>('10');
    // card container reference to scroll to top on page change
    const cardContainerRef = useRef<HTMLDivElement | null>(null);

    // reset page on data change
    useEffect(() => {
        setCurrentPage(1);
    }, [data]);

    // scroll to top on page change
    useEffect(() => {
        if (cardContainerRef.current) {
            cardContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [currentPage]);

    // computed paginated data
    const sizeNum = parseInt(currentSize);
    const startIndex = (currentPage - 1) * sizeNum;
    const paginated = data.slice(startIndex, startIndex + sizeNum);

    const totalPages = Math.max(1, Math.ceil(data.length / sizeNum));

    return (
        <>
            <div
                ref={cardContainerRef}
                className="scrollable py-0.5 px-2 flex flex-col gap-5 max-h-[500px] overflow-auto"
            >
                {isDataLoading ? (
                    <div className="p-10 flex flex-col items-center gap-1">
                        <Loader2 className="animate-spin size-6" />
                        <p>Loading...</p>
                    </div>
                ) : paginated.length ? (
                    paginated.map((item) => renderCard(item))
                ) : (
                    (emptyState ?? (
                        <div className="w-full flex flex-col items-center p-2 gap-4 mt-5">
                            <PackageOpen
                                className="text-muted-foreground w-15 h-15"
                                strokeWidth={1}
                            />
                            <p className="text-lg font-semibold text-center">
                                No Data Found
                            </p>
                        </div>
                    ))
                )}
            </div>

            <div className="w-full flex justify-end pt-2 mt-2 border-t-1">
                <Pagination
                    isDataLoading={isDataLoading}
                    totalPages={totalPages}
                    page={currentPage}
                    size={currentSize}
                    onPageChange={setCurrentPage}
                    onSizeChange={(size) => {
                        setCurrentSize(size);
                        setCurrentPage(1);
                    }}
                />
            </div>
        </>
    );
}
