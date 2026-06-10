'use client';

import messagingService from '@/services/api/messagingService';
import userService from '@/services/api/userService';
import { CompanyUser } from '@/types/equipment/thread';
import dayjs from 'dayjs';
import { Check, ClipboardList, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/datepicker';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { errorToast, successToast } from '@/components/ui/sonner';

import { cn } from '@/lib/utils';

interface CreateWorkOrderDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    threadId: string;
    threadTitle: string;
    hasAttachments?: boolean;
    onSuccess?: () => void;
}

export default function CreateWorkOrderDialog({
    open,
    onOpenChange,
    threadId,
    threadTitle,
    hasAttachments = false,
    onSuccess,
}: CreateWorkOrderDialogProps) {
    const [users, setUsers] = useState<CompanyUser[]>([]);
    const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
    const [search, setSearch] = useState('');
    const [dueDate, setDueDate] = useState<Date | undefined>(new Date());
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [includeAttachments, setIncludeAttachments] = useState(true);

    useEffect(() => {
        if (open) {
            setSelectedEmails([]);
            setSearch('');
            setDueDate(new Date());
            setIncludeAttachments(true);
            fetchUsers();
        }
    }, [open]);

    async function fetchUsers() {
        try {
            setIsLoadingUsers(true);
            const companyUsers = await userService.getCompanyUsers();
            setUsers(companyUsers.filter((u) => u.isActive));
        } catch (error: any) {
            errorToast({ title: 'Error', description: 'Failed to load users' });
        } finally {
            setIsLoadingUsers(false);
        }
    }

    const filteredUsers = useMemo(() => {
        if (!search.trim()) return users;
        const q = search.trim().toLowerCase();
        return users.filter(
            (u) =>
                u.email.toLowerCase().includes(q) ||
                u.firstName.toLowerCase().includes(q) ||
                u.lastName.toLowerCase().includes(q),
        );
    }, [users, search]);

    function toggleUser(email: string) {
        setSelectedEmails((prev) =>
            prev.includes(email)
                ? prev.filter((e) => e !== email)
                : [...prev, email],
        );
    }

    async function handleConfirm() {
        if (selectedEmails.length === 0 || !dueDate) return;

        try {
            setIsCreating(true);
            const result = await messagingService.createWorkOrder(
                threadId,
                selectedEmails,
                dayjs(dueDate).format('YYYY-MM-DD'),
                includeAttachments || undefined,
            );
            onOpenChange(false);
            successToast({
                title: 'Work Order Created',
                description: (
                    <span>
                        <b>{result.title}</b> has been created.
                    </span>
                ),
            });
            onSuccess?.();
        } catch (error: any) {
            errorToast({
                title: 'Error',
                description: error.message || 'Failed to create work order',
            });
        } finally {
            setIsCreating(false);
        }
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                if (isCreating) return;
                onOpenChange(nextOpen);
            }}
        >
            <DialogContent
                className=" flex flex-col"
                hideCloseButton
                onInteractOutside={(e) => {
                    if (isCreating) e.preventDefault();
                }}
                onEscapeKeyDown={(e) => {
                    if (isCreating) e.preventDefault();
                }}
            >
                <DialogHeader>
                    <DialogTitle className="text-start flex items-center gap-2">
                        <ClipboardList className="size-4" />
                        Create Work Order
                    </DialogTitle>
                    <DialogDescription className="text-start">
                        Create a work order from <b>{threadTitle}</b>
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-3 mt-1">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium">Due date</label>
                        <DatePicker
                            selected={dueDate}
                            onSelect={setDueDate}
                            fromDate={new Date()}
                            placeholder="Select due date"
                            className="w-full"
                            disabled={isCreating}
                        />
                    </div>

                    <label className="text-sm font-medium">Assign to</label>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                            placeholder="Search users..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            disabled={isCreating}
                            className="pl-8 h-9"
                        />
                    </div>

                    <div className="border rounded-md max-h-48 overflow-y-auto">
                        {isLoadingUsers ? (
                            <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                                Loading users...
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                                No users found
                            </div>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    className={cn(
                                        'sticky top-0 bg-background flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-muted transition-colors border-b',
                                    )}
                                    disabled={isCreating}
                                    onClick={() => {
                                        const allSelected = filteredUsers.every(
                                            (u) =>
                                                selectedEmails.includes(
                                                    u.email,
                                                ),
                                        );
                                        if (allSelected) {
                                            // Deselect all filtered users
                                            setSelectedEmails((prev) =>
                                                prev.filter(
                                                    (e) =>
                                                        !filteredUsers.some(
                                                            (u) =>
                                                                u.email === e,
                                                        ),
                                                ),
                                            );
                                        } else {
                                            // Select all filtered users (preserve any existing selections)
                                            setSelectedEmails((prev) => [
                                                ...new Set([
                                                    ...prev,
                                                    ...filteredUsers.map(
                                                        (u) => u.email,
                                                    ),
                                                ]),
                                            ]);
                                        }
                                    }}
                                >
                                    {(() => {
                                        const allSelected =
                                            filteredUsers.length > 0 &&
                                            filteredUsers.every((u) =>
                                                selectedEmails.includes(
                                                    u.email,
                                                ),
                                            );
                                        return (
                                            <>
                                                <div
                                                    className={cn(
                                                        'flex items-center justify-center size-4 rounded border shrink-0',
                                                        allSelected
                                                            ? 'bg-primary border-primary text-primary-foreground'
                                                            : 'border-input',
                                                    )}
                                                >
                                                    {allSelected && (
                                                        <Check className="size-3" />
                                                    )}
                                                </div>
                                                <span className="truncate font-medium">
                                                    Select All
                                                </span>
                                            </>
                                        );
                                    })()}
                                </button>

                                {filteredUsers.map((user) => {
                                    const isSelected = selectedEmails.includes(
                                        user.email,
                                    );
                                    return (
                                        <button
                                            key={user.email}
                                            type="button"
                                            className={cn(
                                                'flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-muted transition-colors',
                                                isSelected && 'bg-primary/5',
                                            )}
                                            onClick={() =>
                                                toggleUser(user.email)
                                            }
                                            disabled={isCreating}
                                        >
                                            <div
                                                className={cn(
                                                    'flex items-center justify-center size-4 rounded border shrink-0',
                                                    isSelected
                                                        ? 'bg-primary border-primary text-primary-foreground'
                                                        : 'border-input',
                                                )}
                                            >
                                                {isSelected && (
                                                    <Check className="size-3" />
                                                )}
                                            </div>
                                            <span className="truncate">
                                                {user.firstName} {user.lastName}
                                            </span>
                                            <span className="text-muted-foreground truncate ml-auto text-xs">
                                                {user.email}
                                            </span>
                                        </button>
                                    );
                                })}
                            </>
                        )}
                    </div>

                    {selectedEmails.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                            {selectedEmails.length} user
                            {selectedEmails.length > 1 ? 's' : ''} selected
                        </p>
                    )}
                </div>

                {hasAttachments && (
                    <button
                        type="button"
                        className="flex items-center gap-2 text-sm text-left"
                        onClick={() => setIncludeAttachments((v) => !v)}
                        disabled={isCreating}
                    >
                        <div
                            className={cn(
                                'flex items-center justify-center size-4 rounded border shrink-0',
                                includeAttachments
                                    ? 'bg-primary border-primary text-primary-foreground'
                                    : 'border-input',
                            )}
                        >
                            {includeAttachments && <Check className="size-3" />}
                        </div>
                        I consent to include thread photos in the new work order
                    </button>
                )}

                <div className="w-full flex flex-row items-center gap-5">
                    <Button
                        className="flex-1"
                        variant="secondary"
                        onClick={() => onOpenChange(false)}
                        disabled={isCreating}
                    >
                        Cancel
                    </Button>
                    <Button
                        className="flex-1"
                        onClick={handleConfirm}
                        disabled={
                            selectedEmails.length === 0 ||
                            !dueDate ||
                            isCreating
                        }
                        loading={isCreating}
                    >
                        Confirm
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
