'use client';

import { useAuth } from '@/hooks/use-auth';
import {
    WorkOrderDetail,
    WorkOrderDetailList,
    WorkOrderStatus,
} from '@/types/workOrder/workOrder';
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
    ClipboardList,
    Image,
    Loader2,
    Logs,
    MessageSquare,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import Pagination, { SizeType } from '@/components/core/filters/Pagination';
import AttachmentsDialog from '@/components/core/work-order/AttachmentsDialog';
import WorkLogDialog from '@/components/core/work-order/WorkLogDialog';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

import { cn } from '@/lib/utils';

export default function TableView({
    filteredWorkOrderList,
    getStatusLabel,
    getDateFromTimestamp,
    isDataLoading,
    createThreadFromWorkOrder,
}: {
    filteredWorkOrderList: WorkOrderDetailList;
    getStatusLabel: (status: WorkOrderStatus) => string;
    getDateFromTimestamp: (timestamp: string) => string;
    isDataLoading: boolean;
    createThreadFromWorkOrder: (workOrder: WorkOrderDetail) => void;
}) {
    // user util
    const { user } = useAuth();

    const [sorting, setSorting] = useState<SortingState>([]);

    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 10,
    });

    const columns: ColumnDef<WorkOrderDetail>[] = useMemo(() => {
        const preColumns: ColumnDef<WorkOrderDetail>[] = [
            {
                accessorKey: 'title',
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
                            Title
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
                        {row.getValue('title')}
                    </div>
                ),
            },
            {
                accessorKey: 'description',
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
                            Description
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
                    <div>
                        <p
                            className={cn(
                                'text-start whitespace-pre-wrap',
                                row.original.description.length > 100 &&
                                    'line-clamp-3',
                            )}
                        >
                            {row.getValue('description')}
                        </p>
                        {row.original.description.length > 100 ? (
                            <Dialog>
                                <DialogTrigger>
                                    <span
                                        className={cn(
                                            row.original.description.length >
                                                100
                                                ? 'text-xs font-medium text-end text-link'
                                                : 'hidden',
                                        )}
                                    >
                                        show more
                                    </span>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogDescription />
                                    <DialogTitle>Description</DialogTitle>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                        {row.original.description}
                                    </p>
                                </DialogContent>
                            </Dialog>
                        ) : null}
                    </div>
                ),
            },
            // {
            //     accessorKey: 'createdAtUtc',
            //     header: ({ column }) => <div className="flex justify-center">
            //         <button
            //             onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            //             className="flex flex-row items-center gap-1"
            //         >
            //             Date
            //             {column.getIsSorted() === 'asc' ? (
            //                 <ArrowUp className="size-4" />
            //             ) : column.getIsSorted() === 'desc' ? (
            //                 <ArrowDown className="size-4" />
            //             ) : (
            //                 <ArrowUpDown className="size-4" />
            //             )}
            //         </button>
            //     </div>,
            //     cell: ({ row }) => <div className="text-center">{getDateFromTimestamp(row.getValue('createdAtUtc') ?? '')}</div>,
            // },
            {
                accessorKey: 'dueDate',
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
                            Due Date
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
                        {getDateFromTimestamp(row.getValue('dueDate') ?? '')}
                    </div>
                ),
            },
            {
                accessorKey: 'status',
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
                            Status
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
                    const workOrder = row.original;

                    return (
                        <div className="text-center">
                            <Badge
                                variant="outline"
                                className={`
                                border-none ${
                                    workOrder.status === 'thread_opened'
                                        ? 'bg-primary/15'
                                        : workOrder.status === 'completed'
                                          ? 'bg-success/15'
                                          : workOrder.status === 'cancelled'
                                            ? 'bg-destructive/15'
                                            : 'bg-warning/15'
                                }`}
                            >
                                <p
                                    className={`${
                                        workOrder.status === 'thread_opened'
                                            ? 'text-primary'
                                            : workOrder.status === 'completed'
                                              ? 'text-success'
                                              : workOrder.status === 'cancelled'
                                                ? 'text-destructive'
                                                : 'text-warning'
                                    }`}
                                >
                                    {getStatusLabel(workOrder.status)}
                                </p>
                            </Badge>
                        </div>
                    );
                },
            },
            {
                accessorKey: 'action',
                header: () => <div className="text-center">Action</div>,
                cell: ({ row }) => {
                    const workOrder = row.original;

                    return (
                        <div className="flex flex-col items-center gap-2">
                            {workOrder.threadId &&
                            workOrder.threadOpenedBy === user?.email &&
                            workOrder.status !== 'open' ? (
                                <Link
                                    href={`thread?id=${workOrder.threadId}`}
                                    className="text-xs font-medium border border-foreground hover:bg-muted hover:border-transparent rounded-md px-2 py-1.5 flex flex-row items-center gap-1"
                                >
                                    <MessageSquare
                                        className="size-3.5"
                                        strokeWidth={2}
                                    />
                                    {workOrder.status === 'thread_opened'
                                        ? 'Continue Work'
                                        : 'View thread'}
                                </Link>
                            ) : workOrder.status === 'open' &&
                              !workOrder.threadId ? (
                                <p
                                    className="text-xs font-medium border border-foreground hover:bg-muted hover:border-transparent rounded-md px-2 py-1.5 cursor-pointer flex flex-row items-center gap-1"
                                    onClick={() => {
                                        createThreadFromWorkOrder(workOrder);
                                    }}
                                >
                                    <ClipboardList
                                        className="size-3.5"
                                        strokeWidth={2}
                                    />
                                    Start work
                                </p>
                            ) : workOrder.status === 'thread_opened' &&
                              workOrder.threadOpenedBy !== user?.email ? (
                                <Badge variant="outline">
                                    Other technican working
                                </Badge>
                            ) : null}

                            {workOrder.workLogs && workOrder.workLogs.length ? (
                                <WorkLogDialog workOrder={workOrder}>
                                    <p className="text-xs font-medium border border-foreground hover:bg-muted hover:border-transparent rounded-md px-2 py-1.5 flex flex-row items-center gap-1">
                                        <Logs
                                            className="size-3.5"
                                            strokeWidth={2}
                                        />
                                        Work Logs
                                    </p>
                                </WorkLogDialog>
                            ) : null}

                            {workOrder.attachments &&
                            workOrder.attachments.length ? (
                                <AttachmentsDialog workOrder={workOrder}>
                                    <p className="text-xs font-medium border border-foreground hover:bg-muted hover:border-transparent rounded-md px-2 py-1.5 flex flex-row items-center gap-1">
                                        <Image
                                            className="size-3.5"
                                            strokeWidth={2}
                                        />
                                        Attachments
                                    </p>
                                </AttachmentsDialog>
                            ) : null}
                        </div>
                    );
                },
            },
        ];

        return preColumns;
    }, [filteredWorkOrderList]);

    const table = useReactTable({
        data: filteredWorkOrderList,
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
                                    <ClipboardList
                                        className="text-muted-foreground w-15 h-15 mx-auto mb-4"
                                        strokeWidth={1}
                                    />
                                    <h3 className="text-base font-medium mb-1">
                                        No Work Order Found
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Once you're assinged a work order, it
                                        will reflect here
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
