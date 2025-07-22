
'use client';

import { useState, useOptimistic, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, MoreHorizontal, Trash2, Edit, Loader2 } from "lucide-react";
import type { RestaurantTable, Admin } from "@/lib/types";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { addTable, updateTable, deleteTable, getTables } from '@/app/admin/tables/actions';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription } from "@/components/ui/alert-dialog";

function TableForm({ table, onFormSubmit, onCancel }: { table?: RestaurantTable | null, onFormSubmit: (data: FormData) => void, onCancel: () => void }) {
    return (
        <form onSubmit={(e) => { e.preventDefault(); onFormSubmit(new FormData(e.currentTarget)); }} className="space-y-4">
            <input type="hidden" name="id" value={table?.id || ''} />
            <div className="space-y-2">
                <Label htmlFor="name">Table Name / Number</Label>
                <Input id="name" name="name" placeholder="e.g. Table 5 or Patio 2" required defaultValue={table?.name} />
            </div>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button type="submit">{table ? 'Save Changes' : 'Add Table'}</Button>
            </DialogFooter>
        </form>
    );
}

export default function TablesClient() {
    const { toast } = useToast();
    const [tables, setTables] = useState<RestaurantTable[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentAdmin, setCurrentAdmin] = useState<Admin | null>(null);

    const [editingTable, setEditingTable] = useState<RestaurantTable | null>(null);
    const [isAddDialogOpen, setAddDialogOpen] = useState(false);
    const [deletingTable, setDeletingTable] = useState<RestaurantTable | null>(null);

    useEffect(() => {
        const adminData = sessionStorage.getItem('currentAdmin');
        if (adminData) {
            const admin = JSON.parse(adminData);
            setCurrentAdmin(admin);
            getTables(admin.restaurantId).then(data => {
                setTables(data);
                setIsLoading(false);
            });
        } else {
            setIsLoading(false);
        }
    }, []);

    const [optimisticTables, manageOptimisticTables] = useOptimistic<RestaurantTable[], {action: 'add' | 'delete', table: RestaurantTable}>(
        tables,
        (state, { action, table }) => {
            switch (action) {
                case 'add':
                    return [...state, table].sort((a, b) => a.name.localeCompare(b.name));
                case 'delete':
                    return state.filter((t) => t.id !== table.id);
                default:
                    return state;
            }
        }
    );

    useEffect(() => {
        setTables(tables);
    }, [tables]);

    const handleAddSubmit = async (formData: FormData) => {
        if (!currentAdmin) return;
        setAddDialogOpen(false);
        const result = await addTable(currentAdmin.restaurantId, formData);

        if (result.success) {
            toast({ title: "Table Added" });
            const data = await getTables(currentAdmin.restaurantId);
            setTables(data);
        } else {
            toast({ variant: 'destructive', title: "Error", description: result.error });
        }
    };
    
    const handleEditSubmit = async (formData: FormData) => {
        if (!editingTable || !currentAdmin) return;
        setEditingTable(null);
        const result = await updateTable(currentAdmin.restaurantId, editingTable.id, formData);
        if (result.success) {
            toast({ title: "Table Updated" });
            const data = await getTables(currentAdmin.restaurantId);
            setTables(data);
        } else {
            toast({ variant: 'destructive', title: "Error", description: result.error });
        }
    };

    const handleDelete = async () => {
        if (!deletingTable || !currentAdmin) return;
        const tableToDelete = { ...deletingTable };
        manageOptimisticTables({ action: 'delete', table: tableToDelete });
        setDeletingTable(null);
        const result = await deleteTable(currentAdmin.restaurantId, tableToDelete.id);
        if (result.success) {
            toast({ title: "Table Deleted" });
            setTables(prev => prev.filter(t => t.id !== tableToDelete.id));
        } else {
            toast({ variant: 'destructive', title: "Error", description: result.error });
            manageOptimisticTables({ action: 'add', table: tableToDelete });
        }
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Table Management</h1>
                    <p className="text-muted-foreground">Define the tables available in your restaurant.</p>
                </div>
                <Button onClick={() => setAddDialogOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add New Table
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>All Tables</CardTitle>
                    <CardDescription>A list of all tables for dine-in orders.</CardDescription>
                </CardHeader>
                <CardContent>
                   <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {optimisticTables.map((table) => (
                                <TableRow key={table.id}>
                                    <TableCell className="font-medium">{table.name}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => setEditingTable(table)}><Edit className="mr-2 h-4 w-4"/> Edit</DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive" onClick={() => setDeletingTable(table)}><Trash2 className="mr-2 h-4 w-4"/> Delete</DropdownMenuItem>
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
                        <DialogTitle>Add New Table</DialogTitle>
                        <DialogDescription>Add a new table available for seating.</DialogDescription>
                    </DialogHeader>
                    <TableForm onFormSubmit={handleAddSubmit} onCancel={() => setAddDialogOpen(false)} table={null} />
                </DialogContent>
            </Dialog>

            <Dialog open={!!editingTable} onOpenChange={(isOpen) => !isOpen && setEditingTable(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Table</DialogTitle>
                    </DialogHeader>
                    <TableForm table={editingTable} onFormSubmit={handleEditSubmit} onCancel={() => setEditingTable(null)} />
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deletingTable} onOpenChange={(isOpen) => !isOpen && setDeletingTable(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the table: {deletingTable?.name}.
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
