'use client';

import { STORAGE_KEYS } from '@/config/constant';
import { useCompanyBroadcast } from '@/hooks/broadcasts/use-company-broadcast';
import { useAuth } from '@/hooks/use-auth';
import companyService from '@/services/api/companyService';
import oidcAuthService from '@/services/auth/oidcAuthService';
import { CompanyDetailList } from '@/types/company/company';
import { Building2, ChevronRight, ShieldBan } from 'lucide-react';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

import { buildLogosPath } from '@/utils/assets';

import { cn } from '@/lib/utils';

export default function CompanySelectPage() {
    // router to redirect
    const router = useRouter();
    // auth utils
    const { refreshSession } = useAuth();
    // list of companies
    const [companies, setCompanies] = useState<CompanyDetailList>([]);
    // is api processing flag
    const [isLoading, setIsLoading] = useState(true);
    // is logging out flag
    const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
    // error for alert dialog
    const [error, setError] = useState('');
    // selected company id from localstorage to highlight in UI
    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(
        null,
    );

    // flag for component mount
    const [mounted, setMounted] = useState(false);
    // get the current resolved theme
    const { resolvedTheme } = useTheme();

    // broadcast setup
    const { companyUpdated } = useCompanyBroadcast((event) => {
        if (event.type === 'COMPANY_UPDATED') {
            refreshSession();
        }
    });

    useEffect(() => setMounted(true), []);

    // flag for dark mode after mount to avoid hydration problems
    const isDark = mounted ? resolvedTheme === 'dark' : null;

    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                setIsLoading(true);
                const companiesList = await companyService.getList();
                setCompanies(
                    companiesList.filter(
                        (company) => company.isAdmin || company.isTechnician,
                    ),
                );

                if (companiesList.length === 0) {
                    router.replace('/company-setup');
                }
            } catch (err: any) {
                console.error('Failed to fetch companies:', err);
                setError(err.message || 'Failed to load companies');
            } finally {
                setIsLoading(false);
            }
        };

        setSelectedCompanyId(
            localStorage.getItem(STORAGE_KEYS.SELECTED_COMPANY_ID) ?? null,
        );

        fetchCompanies();
    }, [router]);

    const handleSelectCompany = async (companyId: string) => {
        localStorage.setItem(STORAGE_KEYS.SELECTED_COMPANY_ID, companyId);

        // Refresh auth session to load user context with company
        await refreshSession('/');

        companyUpdated();
    };

    if (isLoading) {
        return (
            <div
                className="fixed inset-0 flex items-center justify-center z-50"
                style={{
                    backgroundImage: 'var(--background-gradient)',
                    backgroundAttachment: 'fixed',
                    backgroundSize: 'cover',
                }}
            >
                <div className="flex flex-col gap-1">
                    <LoadingSpinner className="w-10 h-10" />
                    <p className="text-sm text-muted-foreground text-center">
                        Loading company list...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div
            className="fixed inset-0 flex items-center justify-center p-4 z-50"
            style={{
                backgroundImage: 'var(--background-gradient)',
                backgroundAttachment: 'fixed',
                backgroundSize: 'cover',
            }}
        >
            {isLoggingOut ? (
                <div className="flex flex-col items-center gap-4">
                    <LoadingSpinner className="w-10 h-10" />
                    <p className="text-sm text-muted-foreground text-center">
                        Logging out...
                    </p>
                </div>
            ) : (
                <Card className="w-full max-w-md">
                    <CardHeader className="space-y-1 flex flex-col gap-6">
                        <Image
                            src={buildLogosPath(
                                isDark ? 'logo-dark.svg' : 'logo-light.svg',
                            )}
                            width={140}
                            height={140}
                            alt="Arkim logo"
                            className="m-auto"
                        />

                        <div className="flex flex-col gap-1 w-full">
                            <p className="text-lg font-semibold text-center">
                                Select Company
                            </p>
                            <p className="text-sm text-muted-foreground text-center">
                                Choose a company to continue
                            </p>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2 max-h-80 overflow-auto">
                            {companies.length > 0 ? (
                                companies.map((company) => {
                                    return (
                                        <button
                                            key={company.companyId}
                                            onClick={() =>
                                                handleSelectCompany(
                                                    company.companyId,
                                                )
                                            }
                                            className={cn(
                                                'w-full flex items-center justify-between p-4 border rounded-lg hover:bg-muted hover:border-primary transition-colors',
                                                selectedCompanyId &&
                                                    company.companyId ===
                                                        selectedCompanyId
                                                    ? 'bg-primary/10 border-primary'
                                                    : '',
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Building2 className="h-5 w-5 text-muted-foreground" />
                                                <div className="text-left">
                                                    <div className="font-medium">
                                                        {company.companyName}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {company.companyId}
                                                        {company.isAdmin && (
                                                            <span className="ml-2 text-primary">
                                                                Admin
                                                            </span>
                                                        )}
                                                        {!company.isActive && (
                                                            <span className="ml-2 text-destructive">
                                                                Inactive
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                        </button>
                                    );
                                })
                            ) : (
                                <div className="flex flex-col text-center items-center gap-4 mt-2 mb-5">
                                    <ShieldBan
                                        className="size-18"
                                        strokeWidth={1}
                                    />
                                    <div className="flex flex-col gap-1">
                                        <p className="font-semibold text-sm">
                                            No Assigned Company Found
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Please ask admin to assign you a
                                            company or else sign in with
                                            different account.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="pt-4 border-t flex justify-center">
                            <Button
                                variant="destructive"
                                size="lg"
                                onClick={() => {
                                    oidcAuthService.signOut();
                                    setIsLoggingOut(true);
                                }}
                            >
                                Sign Out
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
