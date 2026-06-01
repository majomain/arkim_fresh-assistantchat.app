'use client';

import { useVersion } from '@/hooks/use-version';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import clsx from 'clsx';
import { Bell, File, Settings, XIcon } from 'lucide-react';
import { ReactNode, useEffect, useState } from 'react';

import { Button } from '../ui/button';
import { DialogContent } from '../ui/dialog';

export enum SettingsItem {
    General = 'general',
    Notifications = 'notifications',
}

const sidebarItems = [
    { id: SettingsItem.General, label: 'General', icon: Settings },
    { id: SettingsItem.Notifications, label: 'Notifications', icon: Bell }
];

export const ProfileSettingsDialogContent = ({
    children,
    isOpen,
}: {
    children: (section: SettingsItem) => ReactNode;
    isOpen: boolean;
}) => {
    const [selectedSection, setSelectedSection] = useState(
        SettingsItem.General,
    );

    useEffect(() => {
        if (isOpen) {
            setSelectedSection(SettingsItem.General);
        }
    }, [isOpen]);

    return (
        <DialogContent
            hideCloseButton
            className="flex min-h-96 flex-col sm:flex-row gap-0 sm:gap-4 py-2 px-2 w-full sm:max-w-2xl"
        >
            <div className="flex flex-col sm:flex-col space-y-3 ">
                {/* header for larger screen */}
                <div className="hidden sm:flex justify-between p-2 mb-3">
                    <DialogPrimitive.Close className="cursor-pointer ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
                        <XIcon />
                        <span className="sr-only">Close</span>
                    </DialogPrimitive.Close>
                </div>

                {/* header for smaller screen */}
                <div className="flex sm:hidden justify-between p-2 mb-3">
                    <DialogPrimitive.Close className="cursor-pointer ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
                        <XIcon />
                        <span className="sr-only">Close</span>
                    </DialogPrimitive.Close>
                </div>

                <div className="grid grid-cols-2 place-items-center gap-3 px-2 sm:flex sm:flex-col sm:gap-1 sm:px-0">
                    {sidebarItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Button
                                variant="ghost"
                                key={item.id}
                                onClick={() => setSelectedSection(item.id)}
                                className={clsx(
                                    `w-full flex justify-start items-center gap-3 font-normal hover:bg-accent group/setting`,
                                    {
                                        'bg-accent font-medium': selectedSection === item.id,
                                    },
                                )}
                            >
                                <Icon className={`size-4 ${selectedSection === item.id ? 'text-primary' : 'text-muted-foreground group-hover/setting:text-foreground'}`} />
                                <span className="">
                                    {item.label}
                                </span>
                            </Button>
                        );
                    })}
                </div>
            </div>
            {children(selectedSection)}
        </DialogContent>
    );
};
