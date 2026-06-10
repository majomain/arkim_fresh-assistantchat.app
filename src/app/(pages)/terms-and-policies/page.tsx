'use client';

import userService from '@/services/api/userService';
import { MyTheme } from '@/stores/settings-store';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import { AppLogo } from '@/components/core/app-logo';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
} from '@/components/ui/select';

export default function TermsAndPoliciesPage() {
    const { setTheme: setNextTheme, theme } = useTheme();

    return (
        <div className="w-full md:w-3xl lg:w-5xl mx-auto px-2">
            <div className="w-full flex flex-row justify-between py-5">
                <AppLogo />
                <Select
                    defaultValue="system"
                    value={theme}
                    onValueChange={async (value) => {
                        setNextTheme(value as MyTheme);
                        await userService.setTheme(value);
                    }}
                >
                    <SelectTrigger className="w-fit">
                        {theme === 'system' ? (
                            <Monitor />
                        ) : theme === 'light' ? (
                            <Sun />
                        ) : (
                            <Moon />
                        )}
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="system">System</SelectItem>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <p className="text-4xl font-semibold text-center">
                Terms & Policies
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-20">
                <div className="flex flex-col bento p-5">
                    <p className="text-xl font-semibold text-primary">Terms</p>
                    <ul className="list-disc list-outside px-7 py-2 text-sm">
                        <li>
                            Lorem ipsum dolor sit amet consectetur adipisicing
                            elit. Vel, repellat.
                        </li>
                        <li>
                            Lorem ipsum dolor, sit amet consectetur adipisicing
                            elit. Eum ad tempore ducimus, repellendus excepturi
                            temporibus?
                        </li>
                        <li>Lorem ipsum dolor sit amet.</li>
                        <li>
                            Lorem ipsum dolor sit amet consectetur adipisicing
                            elit.
                        </li>
                        <li>
                            Lorem ipsum dolor sit amet, consectetur adipisicing
                            elit. Suscipit, quod.
                        </li>
                    </ul>
                </div>

                <div className="flex flex-col bento p-5">
                    <p className="text-xl font-semibold text-primary">
                        Policies
                    </p>
                    <ul className="list-disc list-outside px-7 py-2 text-sm">
                        <li>
                            Lorem ipsum dolor sit amet consectetur adipisicing
                            elit. Vel, repellat.
                        </li>
                        <li>
                            Lorem ipsum dolor, sit amet consectetur adipisicing
                            elit. Eum ad tempore ducimus, repellendus excepturi
                            temporibus?
                        </li>
                        <li>Lorem ipsum dolor sit amet.</li>
                        <li>
                            Lorem ipsum dolor sit amet consectetur adipisicing
                            elit.
                        </li>
                        <li>
                            Lorem ipsum dolor sit amet, consectetur adipisicing
                            elit. Suscipit, quod.
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
