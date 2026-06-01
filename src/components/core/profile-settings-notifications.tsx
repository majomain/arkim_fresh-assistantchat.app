import { PopoverProps } from '@radix-ui/react-popover';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/button';
import { DialogDescription, DialogTitle } from '../ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Switch } from '../ui/switch';
import { disableNotification, enableNotification, notificationsEnabled } from '@/utils/web-notification';

const PushEmailPopover = ({ ...props }: PopoverProps) => {
    const [enabled, setEnabled] = useState<boolean>(() => notificationsEnabled());

    function togglePushNotificationSetting(checked: boolean) {
        setEnabled(checked);
        checked ? enableNotification() : disableNotification();
    }

    return (
        <Popover {...props}>
            <PopoverTrigger asChild>
                <Button variant="ghost" className="">
                    Push
                    <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-fit p-4" align="end">
                <div className="space-y-4">
                    <div className="flex items-center justify-between gap-5">
                        <span className="text-sm font-medium">Push</span>
                        <Switch checked={enabled} onCheckedChange={togglePushNotificationSetting} />
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
};

export const ProfileSettingsNotifications = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isOpen2, setIsOpen2] = useState(false);
    return (
        <div className="flex flex-col gap-2">
            {/* NOTE: Without this componet radix is throwing and error */}
            <DialogTitle></DialogTitle>
            <DialogDescription />

            <div className="flex flex-col justify-between py-3 border-b">
                <div className="flex items-center justify-between">
                    <span className="font-medium">Responses</span>
                    <PushEmailPopover open={isOpen} onOpenChange={setIsOpen} />
                </div>
                <p className="text-muted-foreground text-xs leading-relaxed">
                    Get notified when Medes responds to requests that take
                    time, like research or deep thinking.
                </p>
            </div>
        </div>
    );
};
