
import EmployeesClient from '@/components/admin/employees-client';
import { getEmployees } from './actions';

export default async function EmployeesPage() {
  const employees = await getEmployees();
  return <EmployeesClient initialEmployees={employees} />;
}
