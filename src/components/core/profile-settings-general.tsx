import { UserType } from '@/contexts/AuthContext';
import { useSignOutMutation } from '@/hooks/api/use-sign-out-mutation';
import { useAuth } from '@/hooks/use-auth';
import userService from '@/services/api/userService';
import { MyTheme } from '@/stores/settings-store';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useState } from 'react';

import { errorToast, successToast } from '@/components/ui/sonner';

import { cn } from '@/lib/utils';

import {
    Accordion,
    AccordionContent,
    AccordionHeader,
    AccordionItem,
} from '../ui/accordian';
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
import { Button } from '../ui/button';
import { DialogDescription, DialogTitle } from '../ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui/select';

const SelectTheme = () => {
    const { setTheme: setNextTheme, theme } = useTheme();

    const availableThemes = [
        {
            label: 'System',
            value: 'system',
            icon: (
                <Monitor
                    className={
                        theme === 'system'
                            ? 'text-primary group-hover/siteTab:text-muted-foreground'
                            : ''
                    }
                />
            ),
        },
        {
            label: 'Light',
            value: 'light',
            icon: (
                <Sun
                    className={
                        theme === 'light'
                            ? 'text-primary group-hover/siteTab:text-muted-foreground'
                            : ''
                    }
                />
            ),
        },
        {
            label: 'Dark',
            value: 'dark',
            icon: (
                <Moon
                    className={
                        theme === 'dark'
                            ? 'text-primary group-hover/siteTab:text-muted-foreground'
                            : ''
                    }
                />
            ),
        },
    ];

    return (
        <Select
            defaultValue="system"
            value={theme}
            onValueChange={async (value) => {
                setNextTheme(value as MyTheme);
                await userService.setTheme(value);
            }}
        >
            <SelectTrigger className="w-32 focus:ring-0 capitalize">
                {theme}
            </SelectTrigger>
            <SelectContent>
                {availableThemes.map((t) => (
                    <SelectItem
                        key={`theme-${t.value}`}
                        value={t.value}
                        className={cn(
                            'group/siteTab flex flex-row items-center gap-2 my-1',
                            {
                                'bg-sidebar-accent font-medium':
                                    theme === t.value,
                            },
                        )}
                    >
                        <span>{t.icon}</span>
                        {t.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
};

const SelectLanguage = () => {
    const { user, updateLang } = useAuth();
    const availableLanguages = [
        {
            label: 'English',
            value: 'en',
        },
        {
            label: 'Español',
            value: 'es',
        },
    ];

    return (
        <Select
            defaultValue="system"
            value={user?.language}
            onValueChange={async (value: UserType['language']) => {
                updateLang(value);
                await userService.setLanguage(value);
            }}
        >
            <SelectTrigger className="w-32 focus:ring-0 capitalize">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                {availableLanguages.map((lang) => (
                    <SelectItem
                        key={`language-${lang.value}`}
                        value={lang.value}
                        className={cn(
                            'group/siteTab flex flex-row items-center gap-2 my-1',
                            {
                                'bg-sidebar-accent font-medium':
                                    user?.language === lang.value,
                            },
                        )}
                    >
                        {lang.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
};

// ── Validation rules ──────────────────────────────────────────────────────────
const MIN_PASSWORD_LENGTH = 8;

function validatePasswords(
    oldPass: string,
    newPass: string,
    confirmPass: string,
): { oldPass?: string; newPass?: string; confirmPass?: string } {
    const errors: { oldPass?: string; newPass?: string; confirmPass?: string } =
        {};

    if (!oldPass) {
        errors.oldPass = 'Current password is required.';
    }

    if (!newPass) {
        errors.newPass = 'New password is required.';
    } else if (newPass === oldPass) {
        errors.newPass = 'New password must differ from the current password.';
    }

    if (!confirmPass) {
        errors.confirmPass = 'Please confirm your new password.';
    } else if (newPass && confirmPass !== newPass) {
        errors.confirmPass = 'Passwords do not match.';
    }

    return errors;
}

// ── PasswordField ─────────────────────────────────────────────────────────────
// Reusable labelled password input with inline error message.
function PasswordField({
    label,
    value,
    onChange,
    error,
    disabled,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    error?: string;
    disabled?: boolean;
}) {
    return (
        <div className="flex flex-col gap-1">
            <p className="text-xs text-muted-foreground">{label}</p>
            <input
                type="password"
                placeholder="••••••"
                disabled={disabled}
                className={cn(
                    'border p-1.5 rounded-md text-sm bg-transparent outline-none focus:ring-1 focus:ring-ring transition-colors disabled:opacity-50',
                    error
                        ? 'border-destructive focus:ring-destructive'
                        : 'border-input',
                )}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
            {/* Inline error — always occupies space to prevent layout jump */}
            <p
                className={cn(
                    'text-xs text-destructive transition-opacity',
                    error ? 'opacity-100' : 'opacity-0 select-none',
                )}
            >
                {error ?? ' '}
            </p>
        </div>
    );
}

function UpdatePassword() {
    const [oldPass, setOldPass] = useState('');
    const [newPass, setNewPass] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [errors, setErrors] = useState<{
        oldPass?: string;
        newPass?: string;
        confirmPass?: string;
    }>({});
    const [isLoading, setIsLoading] = useState(false);

    // Clear a specific field's error as the user starts correcting it
    function clearError(field: keyof typeof errors) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
    }

    async function updatePass() {
        // Run all validations first, show every error at once
        const validationErrors = validatePasswords(
            oldPass,
            newPass,
            confirmPass,
        );
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setErrors({});
        setIsLoading(true);

        try {
            await userService.resetPassword(oldPass, newPass);
            successToast({
                title: 'Password updated',
                description: 'Your password has been changed successfully.',
            });
            // Reset form on success
            setOldPass('');
            setNewPass('');
            setConfirmPass('');
        } catch (err) {
            // Surface API errors on the relevant field where possible
            const message =
                err instanceof Error
                    ? err.message
                    : 'Failed to update password.';
            // Common API signals that the current password was wrong
            const isWrongPassword = message
                .toLowerCase()
                .includes('invalid old password');

            if (isWrongPassword) {
                setErrors({ oldPass: 'Current password is incorrect.' });
            } else {
                errorToast({ title: 'Update failed', description: message });
            }
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Accordion>
            <AccordionItem defaultOpen={false}>
                <AccordionHeader>Update password</AccordionHeader>
                <AccordionContent smoothHide={true}>
                    <div className="flex flex-col gap-0.5 pt-1">
                        <PasswordField
                            label="Current Password"
                            value={oldPass}
                            onChange={(v) => {
                                setOldPass(v);
                                clearError('oldPass');
                            }}
                            error={errors.oldPass}
                            disabled={isLoading}
                        />
                        <PasswordField
                            label="New Password"
                            value={newPass}
                            onChange={(v) => {
                                setNewPass(v);
                                clearError('newPass');
                            }}
                            error={errors.newPass}
                            disabled={isLoading}
                        />
                        <PasswordField
                            label="Confirm New Password"
                            value={confirmPass}
                            onChange={(v) => {
                                setConfirmPass(v);
                                clearError('confirmPass');
                            }}
                            error={errors.confirmPass}
                            disabled={isLoading}
                        />
                    </div>

                    <Button
                        className="mt-1 mb-3"
                        size="sm"
                        onClick={updatePass}
                        disabled={isLoading}
                        loading={isLoading}
                    >
                        Update
                    </Button>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
}

export const ProfileSettingsGeneral = () => {
    const { mutate: signOut, isPending: isSignOutPending } =
        useSignOutMutation();

    const [isLogoutConfirmationAlertOpen, setIsLogoutConfirmationAlertOpen] =
        useState<boolean>(false);

    return (
        <div className="flex flex-col gap-2">
            {/* NOTE: Without this component radix is throwing an error */}
            <DialogTitle></DialogTitle>
            <DialogDescription />

            <div className="flex items-center justify-between py-3 border-b">
                <span className="font-medium">Theme</span>
                <SelectTheme />
            </div>

            {/* <div className="flex items-center justify-between py-3 border-b">
                <span className="font-medium">Language</span>
                <SelectLanguage />
            </div> */}

            <UpdatePassword />

            <div className="flex items-center justify-between py-3 border-b font-medium">
                <span>Sign Out on this device</span>

                <AlertDialog open={isLogoutConfirmationAlertOpen}>
                    <AlertDialogTrigger asChild>
                        <Button
                            variant={'destructive'}
                            onClick={() =>
                                setIsLogoutConfirmationAlertOpen(true)
                            }
                        >
                            Sign Out
                        </Button>
                    </AlertDialogTrigger>
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
                                    onClick={() => {
                                        signOut();
                                    }}
                                    variant={'destructive'}
                                    className="text-white"
                                >
                                    Sign out
                                </Button>
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
};
