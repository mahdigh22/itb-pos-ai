
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import type { Employee } from '@/lib/types';


export default function MembersPage() {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState<Employee | null>(null);

    useEffect(() => {
        let employeeData = null;
        try {
            const storedEmployee = localStorage.getItem('currentEmployee');
            if (storedEmployee) {
                employeeData = JSON.parse(storedEmployee);
            }
        } catch (e) {
            console.error("Failed to parse employee data from localStorage", e);
        }

        if (!employeeData?.id) {
            router.replace('/login');
        } else {
            setCurrentUser(employeeData);
            router.replace('/');
        }
    }, [router]);

    return (
        <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
}
