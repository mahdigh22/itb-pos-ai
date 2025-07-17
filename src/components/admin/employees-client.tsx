
'use client';

import { useState, useOptimistic, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal, PlusCircle, Trash2, Edit, Loader2 } from "lucide-react";
import type { Employee, Admin } from "@/lib/types";
import { format } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { addEmployee, updateEmployee, deleteEmployee, getEmployees } from '@/app/admin/employees/actions';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription } from "@/components/ui/alert-dialog";

function EmployeeForm({ employee, onFormSubmit, onCancel }: { employee?: Employee | null, onFormSubmit: (data: FormData) => Promise<void>, onCancel: () => void }) {
    return (
        <form action={onFormSubmit} className="space-y-4">
            <input type="hidden" name="id" value={employee?.id || ''} />
            <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" name="name" placeholder="Jane Doe" required defaultValue={employee?.name} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" name="email" type="email" placeholder="name@example.com" required defaultValue={employee?.email} />
            </div>
             <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" placeholder={employee ? 'Leave blank to keep current password' : "••••••••"} required={!employee} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select name="role" required defaultValue={employee?.role || "Server"}>
                    <SelectTrigger id="role">
                        <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Server">Server</SelectItem>
                        <SelectItem value="Chef">Chef</SelectItem>
                        <SelectItem value="Manager">Manager</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button type="submit">{employee ? 'Save Changes' : 'Add Employee'}</Button>
            </DialogFooter>
        </form>
    );
}

export default function EmployeesClient() {
    const { toast } = useToast();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentAdmin, setCurrentAdmin] = useState<Admin | null>(null);

    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [isAddDialogOpen, setAddDialogOpen] = useState(false);
    const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);

    useEffect(() => {
        const adminData = localStorage.getItem('currentAdmin');
        if (adminData) {
            const admin = JSON.parse(adminData);
            setCurrentAdmin(admin);
            getEmployees(admin.restaurantId).then(data => {
                setEmployees(data);
                setIsLoading(false);
            });
        } else {
            setIsLoading(false);
        }
    }, []);

    const [optimisticEmployees, manageOptimisticEmployees] = useOptimistic<Employee[], {action: 'add' | 'delete' | 'update', employee: Employee}>(
        employees,
        (state, { action, employee }) => {
            switch (action) {
                case 'add':
                    return [...state, employee].sort((a, b) => a.name.localeCompare(b.name));
                case 'update':
                    return state.map(e => e.id === employee.id ? { ...e, ...employee } : e);
                case 'delete':
                    return state.filter((e) => e.id !== employee.id);
                default:
                    return state;
            }
        }
    );

    useEffect(() => {
        setEmployees(employees);
    }, [employees]);


    const handleAddSubmit = async (formData: FormData) => {
        if (!currentAdmin) return;
        const newEmployeeStub: Employee = {
            id: `optimistic-${Date.now()}`,
            name: formData.get('name') as string,
            email: formData.get('email') as string,
            role: formData.get('role') as 'Manager' | 'Server' | 'Chef',
            startDate: new Date().toISOString(),
            restaurantId: currentAdmin.restaurantId,
        };
        
        setAddDialogOpen(false);
        manageOptimisticEmployees({ action: 'add', employee: newEmployeeStub });

        const result = await addEmployee(currentAdmin.restaurantId, formData);

        if (result.success && result.employee) {
            setEmployees(prev => [...prev.filter(e => e.id !== newEmployeeStub.id), result.employee!].sort((a,b) => a.name.localeCompare(b.name)));
            toast({ title: "Employee Added" });
        } else {
            toast({ variant: 'destructive', title: "Error", description: result.error });
            setEmployees(prev => prev.filter(e => e.id !== newEmployeeStub.id));
        }
    };
    
    const handleEditSubmit = async (formData: FormData) => {
        if (!editingEmployee || !currentAdmin) return;
        const updatedEmployeeData = {
            id: editingEmployee.id,
            name: formData.get('name') as string,
            email: formData.get('email') as string,
            role: formData.get('role') as 'Manager' | 'Server' | 'Chef',
        }
        
        setEditingEmployee(null);
        manageOptimisticEmployees({ action: 'update', employee: { ...editingEmployee, ...updatedEmployeeData } });

        const result = await updateEmployee(currentAdmin.restaurantId, editingEmployee.id, formData);

        if (result.success) {
            toast({ title: "Employee Updated" });
            const data = await getEmployees(currentAdmin.restaurantId);
            setEmployees(data);
        } else {
            toast({ variant: 'destructive', title: "Error", description: result.error });
            const data = await getEmployees(currentAdmin.restaurantId);
            setEmployees(data);
        }
    };

    const handleDelete = async () => {
        if (!deletingEmployee || !currentAdmin) return;

        const employeeToDelete = { ...deletingEmployee };
        setDeletingEmployee(null);
        manageOptimisticEmployees({ action: 'delete', employee: employeeToDelete });
        
        const result = await deleteEmployee(currentAdmin.restaurantId, employeeToDelete.id);
        if (result.success) {
            toast({ title: "Employee Deleted" });
            setEmployees(prev => prev.filter(e => e.id !== employeeToDelete.id));
        } else {
            toast({ variant: 'destructive', title: "Error", description: result.error });
            setEmployees(prev => [...prev, employeeToDelete].sort((a,b) => a.name.localeCompare(b.name)));
        }
    };
    
    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Employee Management</h1>
                    <p className="text-muted-foreground">Manage your staff, passwords, and roles.</p>
                </div>
                <Button onClick={() => setAddDialogOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add New Employee
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>All Employees</CardTitle>
                    <CardDescription>A list of all staff members from the database.</CardDescription>
                </CardHeader>
                <CardContent>
                   <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead className="hidden lg:table-cell">Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead className="hidden md:table-cell">Start Date</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {optimisticEmployees.map((employee) => (
                                <TableRow key={employee.id}>
                                    <TableCell className="font-medium">{employee.name}</TableCell>
                                    <TableCell className="hidden lg:table-cell">{employee.email}</TableCell>
                                    <TableCell>{employee.role}</TableCell>
                                    <TableCell className="hidden md:table-cell">{format(new Date(employee.startDate), 'PPP')}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => setEditingEmployee(employee)}><Edit className="mr-2 h-4 w-4"/> Edit</DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive" onClick={() => setDeletingEmployee(employee)}><Trash2 className="mr-2 h-4 w-4"/> Delete</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Employee</DialogTitle>
                        <DialogDescription>Fill in the details for the new staff member.</DialogDescription>
                    </DialogHeader>
                    <EmployeeForm onFormSubmit={handleAddSubmit} onCancel={() => setAddDialogOpen(false)} />
                </DialogContent>
            </Dialog>

            <Dialog open={!!editingEmployee} onOpenChange={(isOpen) => !isOpen && setEditingEmployee(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Employee</DialogTitle>
                        <DialogDescription>Update the details for this staff member.</DialogDescription>
                    </DialogHeader>
                    <EmployeeForm employee={editingEmployee} onFormSubmit={handleEditSubmit} onCancel={() => setEditingEmployee(null)} />
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deletingEmployee} onOpenChange={(isOpen) => !isOpen && setDeletingEmployee(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the employee {deletingEmployee?.name}.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </div>
    );
}
