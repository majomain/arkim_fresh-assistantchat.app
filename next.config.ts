import type { NextConfig } from 'next';

// Use require to avoid TypeScript module resolution issues
const withPWA = require('next-pwa')({
    dest: 'public',
    disable: process.env.NODE_ENV === 'development',
    register: true,
    skipWaiting: true,
    runtimeCaching: [
        {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24 * 365, // <== 365 days
                },
                cacheableResponse: {
                    statuses: [0, 200],
                },
            },
        },
        {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24 * 365, // <== 365 days
                },
                cacheableResponse: {
                    statuses: [0, 200],
                },
            },
        },
        {
            urlPattern: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
                cacheName: 'static-font-assets',
                expiration: {
                    maxEntries: 4,
                    maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
                },
            },
        },
        {
            urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
                cacheName: 'static-image-assets',
                expiration: {
                    maxEntries: 64,
                    maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                },
            },
        },
        {
            urlPattern: /\/_next\/static.+\.js$/i,
            handler: 'CacheFirst',
            options: {
                cacheName: 'next-static-js',
                expiration: {
                    maxEntries: 64,
                    maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                },
            },
        },
        {
            urlPattern: /\/_next\/static.+\.css$/i,
            handler: 'CacheFirst',
            options: {
                cacheName: 'next-static-css',
                expiration: {
                    maxEntries: 64,
                    maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                },
            },
        },
    ],
});

const isPreview = process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview';
const isDevelopment = process.env.NODE_ENV === 'development';

const cspCategories = {
    'default-src': ["'self'"],
    'frame-src': ["'self'", '*'],
    'media-src': ["'self'"],
    'child-src': ["'self'", '*'],
    'connect-src': [
        "'self'",
        'https://arkim-bucket.s3.eu-central-1.amazonaws.com',
        'https://allowing-tahr-32.clerk.accounts.dev/v1/',
        'https://clerk-telemetry.com/v1/event',
        'https://local-machine-29.localcan.dev/',
        'https://chatapi.arkim.ai/',
        'https://chatapi-staging.arkim.ai/',
    ],
    'base-uri': ["'self'"],
    'font-src': ["'self'"],
    'form-action': ["'self'"],
    'img-src': ["'self'", 'blob: data:'],
    'object-src': ["'none'"],
    'script-src': [
        "'self'",
        "'unsafe-eval'",
        "'unsafe-inline'",
        'https://va.vercel-scripts.com/v1/', // Vercel scripts like speed insights
        'https://allowing-tahr-32.clerk.accounts.dev/npm/',
        'https://allowing-tahr-32.clerk.accounts.dev/v1/',
        isPreview ? 'https://vercel.live/_next-live/' : undefined, // Vercel preview env stuff
    ],
    'style-src': [
        "'self'",
        "'unsafe-inline'",
        'https://fonts.googleapis.com',
        isPreview ? 'https://vercel.live/fonts' : undefined, // Vercel preview env stuff
    ],
    'worker-src': ["'self'", 'blob:'],
};

const nextConfig: NextConfig = {
    webpack: (config) => {
        config.resolve.alias.canvas = false;
        return config;
    },
    output: 'export',
    distDir: 'out',
    images: {
        unoptimized: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    async headers() {
        return isDevelopment
            ? []
            : [
                {
                    source: '/(.*)',
                    headers: [
                        {
                            key: 'Content-Security-Policy',
                            value: Object.entries(cspCategories)
                                .map(
                                    ([key, values]) =>
                                        `${key} ${values.join(' ')}`,
                                )
                                .join('; '),
                        },
                    ],
                },
            ];
    },
    devIndicators: {
        position: 'bottom-right',
    },
    turbopack: {},
};

export default withPWA(nextConfig);
