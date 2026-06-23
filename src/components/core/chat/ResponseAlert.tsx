'use client';

import { useChat } from '@/hooks/use-chat';
import { BellRing, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { Card, CardContent } from '@/components/ui/card';

import { webNotify } from '@/utils/web-notification';

export default function ResponseNotification() {
    const { responseAlerts, removeResponseAlert } = useChat();
    const router = useRouter();

    // track which alerts are visible for slide-in animation
    const [visibleAlerts, setVisibleAlerts] = useState<string[]>([]);
    // track which alerts are hidden in UI (but still in context)
    const [hiddenAlerts, setHiddenAlerts] = useState<Set<string>>(new Set());
    // keep timeout refs so we can clear on unmount
    const timeoutRefs = useRef<Map<string, ReturnType<typeof setTimeout>>>(
        new Map(),
    );

    // slide-in new alerts and start their auto-hide timers
    useEffect(() => {
        responseAlerts.forEach((alert) => {
            if (visibleAlerts.includes(alert.id) || hiddenAlerts.has(alert.id))
                return;

            // fire web notification
            webNotify(
                alert.title,
                { body: alert.description, tag: 'thread_response' },
                () => {
                    window.focus();
                    router.push(`/thread?id=${alert.threadId}`);
                },
            );

            // slight delay so the enter animation is visible
            setTimeout(() => {
                setVisibleAlerts((prev) => [...prev, alert.id]);
            }, 50);

            // auto-hide after 8s (UI only, stays in context/popover)
            const timeoutId = setTimeout(() => {
                dismissFromUI(alert.id);
            }, 8000);

            timeoutRefs.current.set(alert.id, timeoutId);
        });
    }, [responseAlerts]);

    // cleanup all timeouts on unmount
    useEffect(() => {
        return () => {
            timeoutRefs.current.forEach((id) => clearTimeout(id));
        };
    }, []);

    // hide from UI only — alert stays in context (popover still shows it)
    const dismissFromUI = (alertId: string) => {
        clearTimeout(timeoutRefs.current.get(alertId));
        timeoutRefs.current.delete(alertId);
        setVisibleAlerts((prev) => prev.filter((id) => id !== alertId));
        setHiddenAlerts((prev) => new Set(prev).add(alertId));
    };

    // navigate and fully remove from context
    const handleCardClick = (threadId: string, alertId: string) => {
        clearTimeout(timeoutRefs.current.get(alertId));
        timeoutRefs.current.delete(alertId);
        removeResponseAlert(alertId);
        router.push(`/thread?id=${threadId}`);
    };

    // only render alerts that are not hidden
    const visibleToastAlerts = responseAlerts.filter(
        (a) => !hiddenAlerts.has(a.id),
    );

    return visibleToastAlerts.length ? (
        <div className="fixed top-[10dvh] right-4 z-50 flex flex-col gap-3">
            {visibleToastAlerts.map((responseAlert) => {
                const isVisible = visibleAlerts.includes(responseAlert.id);

                return (
                    <Card
                        key={responseAlert.id}
                        className={`surface-attention surface-attention--bar p-2.5 cursor-pointer transform transition-all duration-300 ease-out
                            ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-30 opacity-0'}`}
                        onClick={() =>
                            handleCardClick(
                                responseAlert.threadId,
                                responseAlert.id,
                            )
                        }
                    >
                        <CardContent className="p-0 flex flex-col gap-2">
                            <div className="flex flex-row gap-2 items-center justify-between">
                                <div className="flex flex-row gap-2 items-center min-w-0">
                                    <div className="attention-icon-chip">
                                        <BellRing className="w-5 h-5" />
                                    </div>
                                    <p className="text-base font-semibold truncate max-w-40 sm:max-w-60">
                                        {responseAlert.title}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    className="p-0.5 rounded-md bg-muted flex-shrink-0 absolute -top-1.5 -right-1.5"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        dismissFromUI(responseAlert.id);
                                    }}
                                >
                                    <X className="size-4" />
                                </button>
                            </div>
                            <p className="text-sm line-clamp-3 max-w-60 sm:max-w-75">
                                {responseAlert.description}
                            </p>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    ) : null;
}
