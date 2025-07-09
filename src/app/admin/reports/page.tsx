import ReportsClient from "@/components/admin/reports-client";
import { getOrdersForReports } from "./actions";
import { getTables } from "../tables/actions";

export default async function AdminReportsPage() {
    const [initialOrders, tables] = await Promise.all([
        getOrdersForReports(),
        getTables()
    ]);
    return <ReportsClient initialOrders={initialOrders} tables={tables} />;
}
