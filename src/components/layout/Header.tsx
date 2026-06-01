'use client'

import { useAuth } from "@/hooks/use-auth";
import { ProfileDropdown } from "../core/profile-dropdown";
import { SidebarTrigger, useSidebar } from "../ui/sidebar";
import { AppLogo } from "../core/app-logo";
import { useChat } from "@/hooks/use-chat";
import ThreadClickableUtils from "./ThreadClickableUtils";
import { useAsset } from "@/hooks/use-asset";
import { useThread } from "@/hooks/use-thread";
import AssetFilesDialog from "./AssetFilesDialog";
import { Button } from "../ui/button";
import { Files } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import NotificationPopover from "../core/notification/NotificationPopover";

export default function Header() {
    // is mobile flag and sidebar current state
    const { isMobile } = useSidebar();
    // user data
    const { user } = useAuth();
    // current asset's id 
    const { currentAssetId, currentAsset } = useAsset();
    const { currentThread, currentThreadId } = useThread();
    // runtime chat data
    const { processedThreads } = useChat();

    return <header className="sticky top-0 bg-background px-2 sm:px-4 py-2.5 flex justify-between items-center w-full z-2"
        style={{
            backgroundImage: "var(--background-gradient)",
            backgroundAttachment: "fixed",
            backgroundSize: "cover"
        }}
    >
        {user
            ?
            <div className='flex flex-row items-center justify-between'>
                {
                    isMobile
                        ?
                        <>
                            <div className="relative">
                                <SidebarTrigger />
                                {Object.keys(processedThreads).length > 0 && <span className="absolute right-0.5 top-0.5 w-1 h-1 p-1 bg-primary rounded-full" />}
                            </div>
                        </>
                        :
                        null
                }
                {
                    currentThreadId
                        ?
                        currentAsset != null && currentAssetId
                            ?
                            <ThreadClickableUtils
                                assetName={currentAsset.name}
                                currentThread={currentThread}
                            />
                            :
                            null
                        : null
                }
            </div>
            :
            <AppLogo />
        }

        <div>
            {
                user
                    ?
                    currentThreadId && currentAsset != null && currentAssetId
                        ?
                        <div className="flex flex-row gap-2 items-center">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <AssetFilesDialog>
                                        <Button variant='ghost' size='icon' className="hover:!bg-muted">
                                            <Files className="size-4" />
                                        </Button>
                                    </AssetFilesDialog>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" align="end">
                                    Files saved for equipment
                                </TooltipContent>
                            </Tooltip>

                            <NotificationPopover />
                            <ProfileDropdown />
                        </div>
                        :
                        <div className="flex flex-row items-center gap-2">
                            <NotificationPopover />
                            <ProfileDropdown />
                        </div>
                    :
                    null
            }
        </div>
    </header>;
}