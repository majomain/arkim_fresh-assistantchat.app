export const isPreview = process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview';
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';

export const frontendDomain = !isProduction
    ? 'http://localhost:3000'
    : 'https://app-helium.vercel.app';

export * from './upload-url';
export * from './password';
