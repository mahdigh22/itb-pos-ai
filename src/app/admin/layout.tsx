
import AdminSidebar from '@/components/admin/admin-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {

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
