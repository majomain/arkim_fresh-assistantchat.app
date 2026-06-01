'use client';

import {
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    Ellipsis,
    Loader2,
    Loader2Icon,
    MessagesSquare,
    Minus,
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { ThreadAction, ThreadDetail, ThreadDetailList } from "@/types/equipment/thread";
import ActionPopover from '@/components/core/work-order/ActionPopover';
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    PaginationState,
    SortingState,
    useReactTable,
} from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Pagination, { SizeType } from '@/components/core/filters/Pagination';

export default function ChatTableView({
    filteredThreadList,
    processingThreads,
    processedThreads,
    isThreadProcessing,
    action,
    isDataLoading,
    getDateFromTimestamp
}: {
    filteredThreadList: ThreadDetailList;
    processingThreads: Record<string, string | null>;
    processedThreads: Record<string, string | null>;
    isThreadProcessing: (threadId: string) => boolean;
    action: (action: ThreadAction, threadTitle: string, threadId: string) => void;
    isDataLoading: boolean;
    getDateFromTimestamp: (timestamp: string) => string;
}) {
    // router to navigate
    const router = useRouter();

    const [sorting, setSorting] = useState<SortingState>([]);

    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 10,
    });

    const columns: ColumnDef<ThreadDetail>[] = useMemo(() => {
        const preColumns: ColumnDef<ThreadDetail>[] = [
            {
                accessorKey: 'title',
                header: ({ column }) => <div className="flex justify-start">
                    <button
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                        className="flex flex-row items-center gap-1"
                    >
                        Title
                        {column.getIsSorted() === 'asc' ? (
                            <ArrowUp className="size-4" />
                        ) : column.getIsSorted() === 'desc' ? (
                            <ArrowDown className="size-4" />
                        ) : (
                            <ArrowUpDown className="size-4" />
                        )}
                    </button>
                </div>,
                cell: ({ row }) => <div className="text-start flex flex-row gap-1.5 items-center font-medium">
                    {
                        processedThreads[row.original.threadId] &&
                        <span className="w-1 h-1 p-1 bg-primary rounded-full" />
                    }
                    {row.getValue('title')}
                </div>,
            },
            {
                accessorKey: 'createdAtUtc',
                header: ({ column }) => <div className="flex justify-center">
                    <button
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                        className="flex flex-row items-center gap-1"
                    >
                        Created At
                        {column.getIsSorted() === 'asc' ? (
                            <ArrowUp className="size-4" />
                        ) : column.getIsSorted() === 'desc' ? (
                            <ArrowDown className="size-4" />
                        ) : (
                            <ArrowUpDown className="size-4" />
                        )}
                    </button>
                </div>,
                cell: ({ row }) => <div className="text-center">{getDateFromTimestamp(row.getValue('createdAtUtc') ?? '')}</div>,
            },
            {
                accessorKey: 'status',
                header: ({ column }) => <div className="flex justify-center">
                    <button
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                        className="flex flex-row items-center gap-1"
                    >
                        Status
                        {column.getIsSorted() === 'asc' ? (
                            <ArrowUp className="size-4" />
                        ) : column.getIsSorted() === 'desc' ? (
                            <ArrowDown className="size-4" />
                        ) : (
                            <ArrowUpDown className="size-4" />
                        )}
                    </button>
                </div>,
                cell: ({ row }) => {
                    const thread = row.original;

                    return <div className="text-center">
                        <Badge variant='outline' className={`border-none ${thread.status === "open" ? "bg-primary/15" : thread.status === 'reported' ? "bg-success/15" : thread.status === 'closed' ? 'bg-destructive/15' : 'bg-success/15'}`}>
                            <p className={`flex flex-row items-center gap-1 ${thread.status === "open" ? "text-primary" : thread.status === 'reported' ? "text-success" : thread.status === 'closed' ? 'text-destructive' : 'text-success'}`}>
                                {thread.status ? (thread?.status.charAt(0).toUpperCase() + thread?.status.slice(1)) : ''}
                            </p>
                        </Badge>
                    </div>;
                },
            },
            {
                accessorKey: 'action',
                header: () => <div className="text-center">Action</div>,
                cell: ({ row }) => {
                    const thread = row.original;

                    return <div className="flex justify-center items-center" onClick={(e) => e.stopPropagation()}>
                        {
                            processingThreads[thread.threadId] || isThreadProcessing(thread.threadId) ? (
                                <div className="flex flex-row items-center justify-center">
                                    <Loader2Icon className="size-5 animate-spin" />
                                </div>
                            ) : (
                                thread.status === 'open'
                                    ?
                                    <ActionPopover action={action} threadId={thread.threadId} threadTitle={thread.workOrderTitle ?? thread.title}>
                                        <Ellipsis className="size-4 m-auto" />
                                    </ActionPopover>
                                    :
                                    <Minus className="size-3 m-auto" />
                            )
                        }
                    </div>
                }
            }
        ];

        return preColumns;
    }, [filteredThreadList]);

    const table = useReactTable({
        data: filteredThreadList,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        onSortingChange: setSorting,
        getPaginationRowModel: getPaginationRowModel(),
        onPaginationChange: setPagination,
        state: {
            sorting,
            pagination
        },
    });

    return <div className='hidden md:block'>
        <Table>
            <TableHeader className="bg-card sticky top-0 z-1">
                {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                            <TableHead
                                className='font-medium'
                                key={header.id}>
                                {header.isPlaceholder
                                    ? null
                                    : flexRender(
                                        header.column.columnDef.header,
                                        header.getContext()
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
                ) : table.getPaginationRowModel().rows?.length ? (
                    table.getPaginationRowModel().rows.map((row) => (
                        <TableRow
                            key={row.id}
                            className={`cursor-pointer`}
                            onClick={() => router.push(`/thread?id=${row.original.threadId}`)}
                        >
                            {row.getVisibleCells().map((cell) => (
                                <TableCell key={cell.id} className="py-3">
                                    {flexRender(
                                        cell.column.columnDef.cell,
                                        cell.getContext()
                                    )}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={columns.length} className="h-24">
                            <div className="text-center py-12">
                                <MessagesSquare
                                    className="text-muted-foreground w-15 h-15 mx-auto mb-4"
                                    strokeWidth={1}
                                />
                                <h3 className="text-base font-medium mb-1">
                                    No Thread Found
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Create a new thread for your asset
                                </p>
                            </div>
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>

        <Pagination
            isDataLoading={isDataLoading}
            className='mt-5'
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
    </div >
}
