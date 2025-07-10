
import DashboardClient from '@/components/admin/dashboard-client';
import { getOrdersForReports } from './reports/actions';

export default async function AdminDashboardPage() {
    const orders = await getOrdersForReports();
    return (
        <DashboardClient initialOrders={orders} />
    )
}
