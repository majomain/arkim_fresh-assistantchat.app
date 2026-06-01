'use client'

import { useAuth } from "./use-auth";


export default function useImageError() {
    const { refreshSession } = useAuth();
    async function handleImageError(url: string) {
        try {
            const res = await fetch(url, { method: 'HEAD', credentials: 'include' });
            if (res.status === 403) refreshSession();
        } catch { }
    }

    return {
        handleImageError
    }
}