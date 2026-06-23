'use client';

import { useAuthSession } from '@/hooks/api/use-auth-session';
import { useSignOutMutation } from '@/hooks/api/use-sign-out-mutation';
import { useVersion } from '@/hooks/use-version';
import { ExternalLink, HelpCircle, LogOut, Settings } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/button';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '../ui/alert-dialog';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Dialog } from '../ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
    ProfileSettingsDialogContent,
    SettingsItem,
} from './profile-settings-dialog-content';
import { ProfileSettingsGeneral } from './profile-settings-general';
import { ProfileSettingsNotifications } from './profile-settings-notifications';

export const ProfileDropdown = () => {
    const { data: session } = useAuthSession();
    const { version, isLoading } = useVersion();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const { mutate: signOut, isPending: isSignOutPending } =
        useSignOutMutation();

    // flag for logout confirmation
    const [isLogoutConfirmationAlertOpen, setIsLogoutConfirmationAlertOpen] =
        useState<boolean>(false);
    // profile drop down flag
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] =
        useState<boolean>(false);

    // Get user initials for the avatar
    const getUserInitials = () => {
        const { name, email } = session?.user || {};
        if (!name && !email) return 'U';
        const fullName = name || email || 'User';
        const nameParts = fullName.split(' ');
        const initials = nameParts
            .map((part) => part.charAt(0).toUpperCase())
            .join('');
        if (initials.length === 0) return 'U';
        return initials.length > 2 ? initials.slice(0, 2) : initials;
    };
    const getUserFullName = (): string => {
        if (!session?.user?.name) return '?';
        return `${session.user.name ?? ''}`;
    };

    return (
        <DropdownMenu
            open={isProfileDropdownOpen}
            onOpenChange={setIsProfileDropdownOpen}
        >
            <DropdownMenuTrigger
                asChild
                onClick={() => setIsProfileDropdownOpen(true)}
            >
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 bg-primary text-primary-foreground rounded-full hover:rounded-md hover:bg-primary"
                >
                    <Avatar>
                        <AvatarFallback>{getUserInitials()}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-50" align="end">
                {session?.user && (
                    <>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">
                                    {getUserFullName()}
                                </p>
                                <p className="text-xs leading-none text-muted-foreground">
                                    {session?.user.email}
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                    </>
                )}

                <DropdownMenuItem
                    onClick={() => setIsSettingsOpen(true)}
                    className="flex items-center gap-3 px-3 py-2 cursor-pointer"
                >
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                </DropdownMenuItem>

                {/* <DropdownMenuSeparator className="my-2" /> */}

                {/* <DropdownMenuItem className="p-0 cursor-pointer">
                    <Link href='/help-and-faq' target='_blank' className="flex items-center gap-3 px-3 py-2 w-full">
                        <HelpCircle className="w-4 h-4" />
                        <span>Help & FAQ</span>
                        <ExternalLink className="w-3 h-3 ml-auto" />
                    </Link>
                </DropdownMenuItem> */}

                {/* <DropdownMenuSeparator className="my-2" /> */}

                <DropdownMenuItem
                    className="flex items-center gap-3 px-3 py-2 cursor-pointer"
                    onClick={() => setIsLogoutConfirmationAlertOpen(true)}
                >
                    <LogOut className="w-4 h-4" />
                    <span>Sign out</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <div className="flex items-center justify-between text-xs text-muted-foreground px-2.5 pb-1">
                    <span>Version</span>
                    <span>{isLoading ? '...' : version}</span>
                </div>
            </DropdownMenuContent>

            <AlertDialog open={isLogoutConfirmationAlertOpen}>
                <AlertDialogTrigger asChild></AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Sign Out</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to sign out?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            disabled={isSignOutPending}
                            onClick={() => {
                                setIsLogoutConfirmationAlertOpen(false);
                            }}
                        >
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction asChild>
                            <Button
                                disabled={isSignOutPending}
                                loading={isSignOutPending}
                                onClick={
                                    !isSignOutPending
                                        ? () => {
                                              signOut();
                                          }
                                        : undefined
                                }
                                variant={'destructive'}
                                className="text-white"
                            >
                                Sign Out
                            </Button>
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <ProfileSettingsDialogContent isOpen={isSettingsOpen}>
                    {(selectedSection) => (
                        <div className="flex-1 overflow-auto text-sm px-4">
                            {selectedSection === SettingsItem.General ? (
                                <ProfileSettingsGeneral />
                            ) : null}

                            {selectedSection === SettingsItem.Notifications ? (
                                <ProfileSettingsNotifications />
                            ) : null}
                        </div>
                    )}
                </ProfileSettingsDialogContent>
            </Dialog>
        </DropdownMenu>
    );
};
