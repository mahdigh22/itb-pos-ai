
'use client';

import { useState, useOptimistic } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, MoreHorizontal, Trash2, Edit } from "lucide-react";
import type { RestaurantTable } from "@/lib/types";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { addTable, updateTable, deleteTable } from '@/app/admin/tables/actions';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription } from "@/components/ui/alert-dialog";

function TableForm({ table, onFormSubmit, onCancel }) {
    return (
        <form action={onFormSubmit} className="space-y-4">
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

export default function TablesClient({ initialTables }: { initialTables: RestaurantTable[] }) {
    const { toast } = useToast();
    const [editingTable, setEditingTable] = useState<RestaurantTable | null>(null);
    const [isAddDialogOpen, setAddDialogOpen] = useState(false);
    const [deletingTable, setDeletingTable] = useState<RestaurantTable | null>(null);

    const [optimisticTables, manageOptimisticTables] = useOptimistic<RestaurantTable[], {action: 'add' | 'delete', table: RestaurantTable}>(
        initialTables,
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

    const handleAddSubmit = async (formData: FormData) => {
        const newTable: RestaurantTable = {
            id: `optimistic-${Date.now()}`,
            name: formData.get('name') as string,
        };
        
        setAddDialogOpen(false);
        manageOptimisticTables({ action: 'add', table: newTable });

        const result = await addTable(formData);

        if (result.success) {
            toast({ title: 'Table Added' });
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
    };
    
    const handleEditSubmit = async (formData: FormData) => {
        if (!editingTable) return;
        setEditingTable(null);
        const result = await updateTable(editingTable.id, formData);
        if (result.success) {
            toast({ title: 'Table Updated' });
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
    };

    const handleDelete = async () => {
        if (!deletingTable) return;
        manageOptimisticTables({ action: 'delete', table: deletingTable });
        setDeletingTable(null);
        const result = await deleteTable(deletingTable.id);
        if (result.success) {
            toast({ title: 'Table Deleted' });
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
    };

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
                    <TableForm onFormSubmit={handleAddSubmit} onCancel={() => setAddDialogOpen(false)} />
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
                            This will permanently delete the table: <span className="font-bold">{deletingTable?.name}</span>.
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
