
import ReportsClient from "@/components/admin/reports-client";
import { getOrdersForReports } from "./actions";
import { getTables } from "../tables/actions";

export default async function ReportsPage() {
  const [orders, tables] = await Promise.all([
    getOrdersForReports(),
    getTables(),
  ]);

  return (
    <ReportsClient initialOrders={orders} tables={tables} />
  );
}
