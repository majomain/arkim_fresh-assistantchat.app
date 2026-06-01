import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Mulish } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const mulish = Mulish({
    subsets: ['latin'],
    variable: '--font-mulish',
    weight: ['300', '400', '500', '600'],
    display: 'swap',
});

const cormorant = Cormorant_Garamond({
    subsets: ['latin'],
    variable: '--font-cormorant',
    weight: ['400'],
    style: ['italic'],
    display: 'swap',
});

export const metadata: Metadata = {
    title: 'Arkim Chat Assistant',
    description:
        'A chat assistant that helps engineers to investigate defect equipments.',
    manifest: '/manifest.json',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: 'Arkim Chat Assistant',
    },
    formatDetection: {
        telephone: false,
    },
    other: {
        'mobile-web-app-capable': 'yes',
        'apple-mobile-web-app-status-bar-style': 'default',
    },
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
    themeColor: '#ffffff',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning className={`${mulish.variable} ${cormorant.variable}`}>
            <body>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
