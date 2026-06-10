'use client';

import { useAuth } from '@/hooks/use-auth';

import PageLoader from '@/components/core/PageLoader';
import RecentOpenThreads from '@/components/core/home/RecentOpenThreads';
import RecentWorkOrders from '@/components/core/home/RecentWorkOrders';

import LoginPage from '../login/page';

export default function HomePage() {
    const { user, loading } = useAuth();

    if (loading) return <PageLoader />;
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
