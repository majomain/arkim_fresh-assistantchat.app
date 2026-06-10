'use client';

import { CheckCircle2, Info, XCircle } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Toaster as Sonner, ToasterProps, toast as sonnerToast } from 'sonner';

const Toaster = ({ ...props }: ToasterProps) => {
    const { theme = 'system' } = useTheme();

    return (
        <Sonner
            theme={theme as ToasterProps['theme']}
            className="toaster group"
            style={
                {
                    '--normal-bg': 'var(--popover)',
                    '--normal-text': 'var(--popover-foreground)',
                    '--normal-border': 'var(--border)',
                } as React.CSSProperties
            }
            {...props}
        />
    );
};

interface ToastProps {
    title: string;
    description?: string | React.ReactNode;
}

const ErrorToast = ({ description, title }: ToastProps) => {
    return (
        <div className="border-1 border-muted bg-card shadow-md shadow-card-shadow flex items-center justify-between gap-3 rounded-lg p-4 md:max-w-[364px]">
            <XCircle
                className="size-5 text-destructive font-bold"
                strokeWidth={2}
            />

            <div className="flex flex-1 items-center">
                <div className="w-full">
                    <p className="font-semibold text-xs">{title}</p>
                    {description ? (
                        <p className="mt-0.5 text-xs">{description}</p>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

const SuccessToast = ({ description, title }: ToastProps) => {
    return (
        <div className="border-1 border-muted bg-card shadow-md shadow-card-shadow flex items-center justify-between gap-3 rounded-lg p-4 md:max-w-[364px]">
            <CheckCircle2
                className="size-5 text-success font-bold"
                strokeWidth={2}
            />

            <div className="flex flex-1 items-center">
                <div className="w-full">
                    <p className="font-semibold text-xs">{title}</p>
                    {description ? (
                        <p className="mt-0.5 text-xs">{description}</p>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

const errorToast = (toast: ToastProps) =>
    sonnerToast.custom(
        () => (
            <ErrorToast title={toast.title} description={toast.description} />
        ),
        {
            position: 'bottom-right',
        },
    );
const successToast = (toast: ToastProps) =>
    sonnerToast.custom(
        () => (
            <SuccessToast title={toast.title} description={toast.description} />
        ),
        {
            position: 'bottom-right',
        },
    );

export { Toaster, errorToast, successToast };
