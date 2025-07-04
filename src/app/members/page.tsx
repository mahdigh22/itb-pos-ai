'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MembersPage() {
    const router = useRouter();

    useEffect(() => {
        const isLoggedIn = typeof window !== 'undefined' ? localStorage.getItem('isLoggedIn') : null;
        if (isLoggedIn !== 'true') {
            router.replace('/login');
        } else {
            router.replace('/');
        }
    }, [router]);

    return (
        <div className="flex items-center justify-center h-full">
            <p>Redirecting...</p>
        </div>
    );
}