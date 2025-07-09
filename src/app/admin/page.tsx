
import { getOrdersForReports } from "./reports/actions";
import DashboardClient from "@/components/admin/dashboard-client";

export default async function AdminDashboardPage() {
    const initialOrders = await getOrdersForReports();
    return <DashboardClient initialOrders={initialOrders} />;
}
