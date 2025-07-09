import ReportsClient from "@/components/admin/reports-client";
import { getOrdersForReports } from "./actions";

export default async function AdminReportsPage() {
    const initialOrders = await getOrdersForReports();
    return <ReportsClient initialOrders={initialOrders} />;
}
