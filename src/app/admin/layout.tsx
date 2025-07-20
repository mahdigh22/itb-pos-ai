
'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/admin-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAdminLoaded, setIsAdminLoaded] = useState(false);

  useEffect(() => {
   
    if (pathname === '/admin/login' || pathname === '/admin/signup') {
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

  if (pathname === '/admin/login' || pathname === '/admin/signup') {
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
        <main className={cn(
          "flex-1 p-4 md:p-8 overflow-y-auto transition-all duration-300 ease-in-out",
          "group-data-[state=expanded]/sidebar-wrapper:md:ml-64",
          "group-data-[state=collapsed]/sidebar-wrapper:md:ml-14"
        )}>
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
