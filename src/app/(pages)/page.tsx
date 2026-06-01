'use client'

import { useAuth } from "@/hooks/use-auth";
import LoginPage from "../login/page";
import RecentWorkOrders from "@/components/core/home/RecentWorkOrders";
import RecentOpenThreads from "@/components/core/home/RecentOpenThreads";

export default function HomePage() {
    const { user, loading } = useAuth();

    if (loading) return null;
    if (!user) return <LoginPage />;

    return (
        <div className="flex flex-col gap-1 py-5">
            <div className="flex flex-col gap-2">
                <RecentWorkOrders />

                <RecentOpenThreads />
            </div>
        </div>
    );
}