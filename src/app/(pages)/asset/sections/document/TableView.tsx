'use client';

import { AssetDocument, AssetDocumentList } from '@/types/equipment/document';
import {
    ColumnDef,
    PaginationState,
    SortingState,
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import {
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    EyeIcon,
    FileIcon,
    FileStack,
    Loader2,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import Pagination, { SizeType } from '@/components/core/filters/Pagination';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

export default function TableView({
    filteredDocuments,
    setPreviewData,
    isDataLoading,
}: {
    filteredDocuments: AssetDocumentList;
    setPreviewData: (data: { url: string; name: string } | null) => void;
    isDataLoading: boolean;
}) {
    const [sorting, setSorting] = useState<SortingState>([]);

    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 10,
    });

    const columns: ColumnDef<AssetDocument>[] = useMemo(() => {
        const preColumns: ColumnDef<AssetDocument>[] = [
            {
                accessorKey: 'fileName',
                header: ({ column }) => (
                    <div className="flex justify-start">
                        <button
                            onClick={() =>
                                column.toggleSorting(
                                    column.getIsSorted() === 'asc',
                                )
                            }
                            className="flex flex-row items-center gap-1"
                        >
                            Name
                            {column.getIsSorted() === 'asc' ? (
                                <ArrowUp className="size-4" />
                            ) : column.getIsSorted() === 'desc' ? (
                                <ArrowDown className="size-4" />
                            ) : (
                                <ArrowUpDown className="size-4" />
                            )}
                        </button>
                    </div>
                ),
                cell: ({ row }) => (
                    <div className="text-start font-medium">
                        {row.getValue('fileName')}
                    </div>
                ),
            },
            {
                accessorKey: 'documentCategory',
                header: ({ column }) => (
                    <div className="flex justify-center">
                        <button
                            onClick={() =>
                                column.toggleSorting(
                                    column.getIsSorted() === 'asc',
                                )
                            }
                            className="flex flex-row items-center gap-1"
                        >
                            Type
                            {column.getIsSorted() === 'asc' ? (
                                <ArrowUp className="size-4" />
                            ) : column.getIsSorted() === 'desc' ? (
                                <ArrowDown className="size-4" />
                            ) : (
                                <ArrowUpDown className="size-4" />
                            )}
                        </button>
                    </div>
                ),
                cell: ({ row }) => (
                    <div className="text-center">
                        {row.getValue('documentCategory')}
                    </div>
                ),
            },
            {
                accessorKey: 'source',
                header: ({ column }) => (
                    <div className="flex justify-center">
                        <button
                            onClick={() =>
                                column.toggleSorting(
                                    column.getIsSorted() === 'asc',
                                )
                            }
                            className="flex flex-row items-center gap-1"
                        >
                            Source
                            {column.getIsSorted() === 'asc' ? (
                                <ArrowUp className="size-4" />
                            ) : column.getIsSorted() === 'desc' ? (
                                <ArrowDown className="size-4" />
                            ) : (
                                <ArrowUpDown className="size-4" />
                            )}
                        </button>
                    </div>
                ),
                cell: ({ row }) => {
                    const doc = row.original;

                    return (
                        <div className="text-center">
                            {doc.source.charAt(0).toUpperCase() +
                                doc.source.slice(1)}
                        </div>
                    );
                },
            },
            {
                accessorKey: 'action',
                header: () => <div className="text-center">Action</div>,
                cell: ({ row }) => {
                    const doc = row.original;

                    return (
                        <div className="flex flex-row justify-center items-center gap-2">
                            <button
                                type="button"
                                className="text-xs font-medium border border-foreground rounded-md px-2 py-1.5 flex flex-row items-center gap-1 hover:bg-muted hover:border-transparent"
                                onClick={() =>
                                    setPreviewData({
                                        url: doc.previewUrl,
                                        name: doc.fileName,
                                    })
                                }
                            >
                                <EyeIcon className="w-4 h-4" /> Preview
                            </button>

                            {/* <a href={doc.sourceUrl ?? doc.previewUrl} target='_blank'>
                            <button type="button" className="text-xs font-medium border border-foreground rounded-md px-2 py-1.5 flex flex-row items-center gap-1 hover:bg-muted hover:border-transparent">
                                <FileIcon className="w-4 h-4" /> Full Document
                            </button>
                        </a> */}
                        </div>
                    );
                },
            },
        ];

        return preColumns;
    }, [filteredDocuments]);

    const table = useReactTable({
        data: filteredDocuments,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        onSortingChange: setSorting,
        getPaginationRowModel: getPaginationRowModel(),
        onPaginationChange: setPagination,
        state: {
            sorting,
            pagination,
        },
    });

    return (
        <div className="hidden md:block">
            <Table>
                <TableHeader className="bg-card sticky top-0 z-1">
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <TableHead
                                    className="font-medium"
                                    key={header.id}
                                >
                                    {header.isPlaceholder
                                        ? null
                                        : flexRender(
                                              header.column.columnDef.header,
                                              header.getContext(),
                                          )}
                                </TableHead>
                            ))}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {isDataLoading ? (
                        <TableRow>
                            <TableCell colSpan={columns.length}>
                                <div className="flex flex-col gap-1 justify-center items-center py-12">
                                    <Loader2 className="animate-spin size-6" />
                                    <p>Loading...</p>
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                            <TableRow key={row.id}>
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id} className="py-3">
                                        {flexRender(
                                            cell.column.columnDef.cell,
                                            cell.getContext(),
                                        )}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell
                                colSpan={columns.length}
                                className="h-24"
                            >
                                <div className="text-center py-12">
                                    <FileStack
                                        className="text-muted-foreground w-15 h-15 mx-auto mb-4"
                                        strokeWidth={1}
                                    />
                                    <h3 className="text-base font-medium mb-1">
                                        No Document Found
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Asset related documents will appear here
                                    </p>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            <Pagination
                isDataLoading={isDataLoading}
                className="mt-5"
                totalPages={table.getPageCount()}
                page={table.getState().pagination.pageIndex + 1}
                size={String(table.getState().pagination.pageSize) as SizeType}
                onPageChange={(page) => {
                    table.setPageIndex(page - 1);
                }}
                onSizeChange={(size) => {
                    table.setPageSize(Number(size));
                    table.setPageIndex(0);
                }}
            />
        </div>
    );
}
