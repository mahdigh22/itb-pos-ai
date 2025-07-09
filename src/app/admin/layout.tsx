
'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AdminSidebar from '@/components/admin/admin-sidebar';
import { useToast } from '@/hooks/use-toast';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const { toast } = useToast();
  
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (isLoginPage) {
      setIsCheckingAuth(false);
      return;
    }

    let employee = null;
    try {
        const storedEmployee = localStorage.getItem('currentEmployee');
        if (storedEmployee) {
            employee = JSON.parse(storedEmployee);
        }
    } catch (e) {
        console.error("Failed to parse employee from localStorage");
        employee = null;
    }

    if (employee?.role !== 'Manager') {
      toast({
          variant: 'destructive',
          title: 'Access Denied',
          description: 'You do not have permission to access the admin area.'
      });
      router.replace('/');
    } else {
      setIsCheckingAuth(false);
    }
  }, [router, pathname, isLoginPage, toast]);

  if (isCheckingAuth && !isLoginPage) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <div className="p-4 md:p-8">
            {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
