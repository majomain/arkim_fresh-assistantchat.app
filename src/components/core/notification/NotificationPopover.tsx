'use client';

import { useChat } from '@/hooks/use-chat';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
    Bell,
    BrushCleaning,
    Clock,
    Inbox,
    MessageSquare,
    X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

dayjs.extend(relativeTime);

function NotificationPopover() {
    const { responseAlerts, removeResponseAlert, removeProcessedThread } =
        useChat();
    const router = useRouter();
    const [open, setOpen] = useState(false);

    const responseAlertsCount = responseAlerts.length;
    const sortedAlerts = responseAlerts.sort(
        (a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0),
    );

    const clearAll = () => {
        responseAlerts.forEach((alert) => {
            removeResponseAlert(alert.id);
            removeProcessedThread(alert.threadId);
        });
    };

    const handleNavigate = (threadId: string, alertId: string) => {
        removeResponseAlert(alertId);
        setOpen(false);
        router.push(`/thread?id=${threadId}`);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5" />

                    {responseAlertsCount > 0 && (
                        <span className="absolute top-1 right-1 size-2 bg-destructive rounded-full" />
                    )}
                </Button>
            </PopoverTrigger>

            <PopoverContent
                className="w-[350px] sm:w-[380px] p-0"
                align="end"
                sideOffset={8}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-3 border-b">
                    <h3 className="font-semibold text-sm leading-none">
                        Notifications
                    </h3>

                    {responseAlertsCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearAll}
                            className="text-xs h-7 gap-1.5 text-muted-foreground hover:text-foreground"
                        >
                            <BrushCleaning className="w-3.5 h-3.5" />
                            Clear all
                        </Button>
                    )}
                </div>

                {/* Body */}
                {responseAlertsCount === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-3">
                        <Inbox
                            className="size-12 text-muted-foreground/60"
                            strokeWidth={1.2}
                        />
                        <div>
                            <p className="text-sm font-medium">
                                No new notifications
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                You are all caught up!
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="max-h-80 overflow-y-auto scrollable">
                        <div className="divide-y">
                            {sortedAlerts.map((alert) => (
                                <div
                                    key={alert.id}
                                    className="group relative flex items-start gap-3 p-3 hover:bg-muted/30 cursor-pointer"
                                    onClick={() =>
                                        handleNavigate(alert.threadId, alert.id)
                                    }
                                >
                                    {/* Icon */}
                                    <div className="flex-shrink-0 mt-0.5 p-1.5 rounded-full bg-sidebar-primary group-hover:bg-muted">
                                        <MessageSquare className="w-4 h-4 text-sidebar-primary-foreground group-hover:text-foreground" />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0 pr-6">
                                        <p className="text-sm font-semibold leading-snug truncate">
                                            {alert.title}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                            {alert.description}
                                        </p>

                                        <p className="text-xs flex justify-start gap-1 items-center mt-2">
                                            <Clock className="size-3" />
                                            {dayjs(alert.timestamp).fromNow()}
                                        </p>
                                    </div>

                                    {/* Dismiss button */}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-2.5 right-2 h-6 w-6 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity text-muted-foreground"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeResponseAlert(alert.id);
                                            removeProcessedThread(
                                                alert.threadId,
                                            );
                                        }}
                                        aria-label="Dismiss notification"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}

export default NotificationPopover;
