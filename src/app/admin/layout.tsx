
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

    let admin = null;
    try {
        const storedAdmin = localStorage.getItem('currentAdmin');
        if (storedAdmin) {
            admin = JSON.parse(storedAdmin);
        }
    } catch (e) {
        console.error("Failed to parse admin from localStorage");
        admin = null;
    }

    if (!admin?.id) {
      toast({
          variant: 'destructive',
          title: 'Access Denied',
          description: 'You must be logged in as an admin to access this area.'
      });
      router.replace('/admin/login');
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
