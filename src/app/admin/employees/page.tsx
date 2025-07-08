import EmployeesClient from "@/components/admin/employees-client";
import { getEmployees } from "./actions";

export default async function AdminEmployeesPage() {
    const employees = await getEmployees();
    return <EmployeesClient initialEmployees={employees} />;
}
