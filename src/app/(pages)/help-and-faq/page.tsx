'use client'

import { AppLogo } from "@/components/core/app-logo";
import { Accordion, AccordionContent, AccordionHeader, AccordionItem } from "@/components/ui/accordian";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import userService from "@/services/api/userService";
import { MyTheme } from "@/stores/settings-store";
import { Monitor, Moon, SearchIcon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export default function HelpAndFaqPage() {
    const { setTheme: setNextTheme, theme } = useTheme();

    return <div className="w-full md:w-3xl lg:w-5xl mx-auto px-2">
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
                    {
                        theme === 'system'
                            ?
                            <Monitor />
                            :
                            theme === 'light'
                                ?
                                <Sun />
                                :
                                <Moon />
                    }
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                </SelectContent>
            </Select>
        </div>

        <div className="flex flex-col gap-15 mt-5">

            <div className="flex flex-col gap-5">
                <p className="text-4xl font-semibold text-center">FAQ</p>
                <div className="border rounded-md py-2 px-5 bento">
                    <Accordion>
                        <AccordionItem defaultOpen={false}>
                            <AccordionHeader>
                                <p className="font-semibold">How to onboard a new asset?</p>
                            </AccordionHeader>
                            <AccordionContent>
                                <div className="bg-background border rounded-md p-2 mb-2">
                                    <p className="text-sm">Follow the steps to onboard a new asset</p>
                                    <ul className="list-disc list-outside px-7 py-2">
                                        <li className="text-sm">Open the onboard asset card</li>
                                        <li className="text-sm">Fill up the required fields</li>
                                        <li className="text-sm">Hit onboard to finish up the process</li>
                                    </ul>
                                    <p className="text-sm my-3">If asset already exist in your asset list(check in sidebar) then system will ask you to access that one or else if access the newly onboarded asset.</p>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>

                    <Accordion>
                        <AccordionItem defaultOpen={false}>
                            <AccordionHeader>
                                <p className="font-semibold">How to onboard a new asset?</p>
                            </AccordionHeader>
                            <AccordionContent>
                                <div className="bg-background border rounded-md p-2 mb-2">
                                    <p className="text-sm">Follow the steps to onboard a new asset</p>
                                    <ul className="list-disc list-outside px-7 py-2">
                                        <li className="text-sm">Open the onboard asset card</li>
                                        <li className="text-sm">Fill up the required fields</li>
                                        <li className="text-sm">Hit onboard to finish up the process</li>
                                    </ul>
                                    <p className="text-sm my-3">If asset already exist in your asset list(check in sidebar) then system will ask you to access that one or else if access the newly onboarded asset.</p>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>

                    <Accordion>
                        <AccordionItem defaultOpen={false}>
                            <AccordionHeader>
                                <p className="font-semibold">How to onboard a new asset?</p>
                            </AccordionHeader>
                            <AccordionContent>
                                <div className="bg-background border rounded-md p-2 mb-2">
                                    <p className="text-sm">Follow the steps to onboard a new asset</p>
                                    <ul className="list-disc list-outside px-7 py-2">
                                        <li className="text-sm">Open the onboard asset card</li>
                                        <li className="text-sm">Fill up the required fields</li>
                                        <li className="text-sm">Hit onboard to finish up the process</li>
                                    </ul>
                                    <p className="text-sm my-3">If asset already exist in your asset list(check in sidebar) then system will ask you to access that one or else if access the newly onboarded asset.</p>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
            </div>
        </div>
    </div>;
}