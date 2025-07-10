

'use client';

import { useState, useOptimistic } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, MoreHorizontal, Trash2, Edit } from "lucide-react";
import type { Extra } from "@/lib/types";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { addExtra, updateExtra, deleteExtra } from '@/app/admin/extras/actions';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription } from "@/components/ui/alert-dialog";

function ExtraForm({ extra, onFormSubmit, onCancel }) {
    return (
        <form action={onFormSubmit} className="space-y-4">
            <input type="hidden" name="id" value={extra?.id || ''} />
            <div className="space-y-2">
                <Label htmlFor="name">Extra Name</Label>
                <Input id="name" name="name" placeholder="e.g. Extra Cheese" required defaultValue={extra?.name} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <Input id="price" name="price" type="number" step="0.01" placeholder="1.50" required defaultValue={extra?.price ?? 0} />
            </div>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button type="submit">{extra ? 'Save Changes' : 'Add Extra'}</Button>
            </DialogFooter>
        </form>
    );
}

export default function ExtrasClient({ initialExtras }: { initialExtras: Extra[] }) {
    const { toast } = useToast();
    const [editingExtra, setEditingExtra] = useState<Extra | null>(null);
    const [isAddDialogOpen, setAddDialogOpen] = useState(false);
    const [deletingExtra, setDeletingExtra] = useState<Extra | null>(null);

    const [optimisticExtras, manageOptimisticExtras] = useOptimistic<Extra[], {action: 'add' | 'delete', extra: Extra}>(
        initialExtras,
        (state, { action, extra }) => {
            switch (action) {
                case 'add':
                    return [...state, extra].sort((a, b) => a.name.localeCompare(b.name));
                case 'delete':
                    return state.filter((e) => e.id !== extra.id);
                default:
                    return state;
            }
        }
    );

    const handleAddSubmit = async (formData: FormData) => {
        const newExtra: Extra = {
            id: `optimistic-${Date.now()}`,
            name: formData.get('name') as string,
            price: parseFloat(formData.get('price') as string) || 0,
        };
        
        setAddDialogOpen(false);
        manageOptimisticExtras({ action: 'add', extra: newExtra });

        const result = await addExtra(formData);

        if (result.success) {
            toast({ title: "Extra Added" });
        } else {
            toast({ variant: 'destructive', title: "Error", description: result.error });
        }
    };
    
    const handleEditSubmit = async (formData: FormData) => {
        if (!editingExtra) return;
        setEditingExtra(null);
        const result = await updateExtra(editingExtra.id, formData);
        if (result.success) {
            toast({ title: "Extra Updated" });
        } else {
            toast({ variant: 'destructive', title: "Error", description: result.error });
        }
    };

    const handleDelete = async () => {
        if (!deletingExtra) return;
        manageOptimisticExtras({ action: 'delete', extra: deletingExtra });
        setDeletingExtra(null);
        const result = await deleteExtra(deletingExtra.id);
        if (result.success) {
            toast({ title: "Extra Deleted" });
        } else {
            toast({ variant: 'destructive', title: "Error", description: result.error });
        }
    };


    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Extras Management</h1>
                    <p className="text-muted-foreground">Manage add-ons that can be applied to menu items.</p>
                </div>
                <Button onClick={() => setAddDialogOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add New Extra
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>All Extras</CardTitle>
                    <CardDescription>A list of all available extras and their prices.</CardDescription>
                </CardHeader>
                <CardContent>
                   <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {optimisticExtras.map((extra) => (
                                <TableRow key={extra.id}>
                                    <TableCell className="font-medium">{extra.name}</TableCell>
                                    <TableCell>${extra.price.toFixed(2)}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => setEditingExtra(extra)}><Edit className="mr-2 h-4 w-4"/> Edit</DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive" onClick={() => setDeletingExtra(extra)}><Trash2 className="mr-2 h-4 w-4"/> Delete</DropdownMenuItem>
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
                        <DialogTitle>Add New Extra</DialogTitle>
                        <DialogDescription>Add a new extra with its name and price.</DialogDescription>
                    </DialogHeader>
                    <ExtraForm onFormSubmit={handleAddSubmit} onCancel={() => setAddDialogOpen(false)} />
                </DialogContent>
            </Dialog>

            <Dialog open={!!editingExtra} onOpenChange={(isOpen) => !isOpen && setEditingExtra(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Extra</DialogTitle>
                    </DialogHeader>
                    <ExtraForm extra={editingExtra} onFormSubmit={handleEditSubmit} onCancel={() => setEditingExtra(null)} />
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deletingExtra} onOpenChange={(isOpen) => !isOpen && setDeletingExtra(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the extra: {deletingExtra?.name}.
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
