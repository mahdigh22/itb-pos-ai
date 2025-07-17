
'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/admin-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import type { Admin } from '@/lib/types';
import { Loader2 } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAdminLoaded, setIsAdminLoaded] = useState(false);

  useEffect(() => {
   
    if (pathname === '/admin/login') {
        setIsAdminLoaded(true);
        return;
    }
      
    try {
      const adminData = localStorage.getItem('currentAdmin');
      if (!adminData) {
        router.replace('/admin/login');
      } else {
        setIsAdminLoaded(true);
      }
    } catch (e) {
      console.error("Failed to access localStorage, redirecting to login.");
      router.replace('/admin/login');
    }
  }, [router, pathname]);

  // If we are on the login page, just render children without the layout shell.
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }
  
  if (!isAdminLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background">
        <AdminSidebar />
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
