
import AdminSidebar from "@/components/admin/admin-sidebar";
import ReportsClient from "@/components/admin/reports-client";
import { getOrdersForReports } from "./actions";
import { getTables } from "../tables/actions";

export default async function ReportsPage() {
  const [orders, tables] = await Promise.all([
    getOrdersForReports(),
    getTables(),
  ]);

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <ReportsClient initialOrders={orders} tables={tables} />
      </main>
    </div>
  );
}

