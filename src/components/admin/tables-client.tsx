
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
import { useTranslations } from 'next-intl';

function TableForm({ table, onFormSubmit, onCancel }) {
    const t = useTranslations('AdminTables.form');
    return (
        <form action={onFormSubmit} className="space-y-4">
            <input type="hidden" name="id" value={table?.id || ''} />
            <div className="space-y-2">
                <Label htmlFor="name">{t('nameLabel')}</Label>
                <Input id="name" name="name" placeholder={t('namePlaceholder')} required defaultValue={table?.name} />
            </div>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel}>{t('cancel')}</Button>
                <Button type="submit">{table ? t('save') : t('add')}</Button>
            </DialogFooter>
        </form>
    );
}

export default function TablesClient({ initialTables }: { initialTables: RestaurantTable[] }) {
    const t = useTranslations('AdminTables');
    const tAlerts = useTranslations('Alerts');
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
            toast({ title: tAlerts('tableAdded') });
        } else {
            toast({ variant: 'destructive', title: tAlerts('error'), description: result.error });
        }
    };
    
    const handleEditSubmit = async (formData: FormData) => {
        if (!editingTable) return;
        setEditingTable(null);
        const result = await updateTable(editingTable.id, formData);
        if (result.success) {
            toast({ title: tAlerts('tableUpdated') });
        } else {
            toast({ variant: 'destructive', title: tAlerts('error'), description: result.error });
        }
    };

    const handleDelete = async () => {
        if (!deletingTable) return;
        manageOptimisticTables({ action: 'delete', table: deletingTable });
        setDeletingTable(null);
        const result = await deleteTable(deletingTable.id);
        if (result.success) {
            toast({ title: tAlerts('tableDeleted') });
        } else {
            toast({ variant: 'destructive', title: tAlerts('error'), description: result.error });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold font-headline">{t('title')}</h1>
                    <p className="text-muted-foreground">{t('description')}</p>
                </div>
                <Button onClick={() => setAddDialogOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {t('addNew')}
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>{t('allTablesTitle')}</CardTitle>
                    <CardDescription>{t('allTablesDescription')}</CardDescription>
                </CardHeader>
                <CardContent>
                   <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('columns.name')}</TableHead>
                                <TableHead><span className="sr-only">{t('columns.actions')}</span></TableHead>
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
                                                    <span className="sr-only">{t('openMenu')}</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => setEditingTable(table)}><Edit className="mr-2 h-4 w-4"/> {t('actions.edit')}</DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive" onClick={() => setDeletingTable(table)}><Trash2 className="mr-2 h-4 w-4"/> {t('actions.delete')}</DropdownMenuItem>
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
                        <DialogTitle>{t('dialogs.add.title')}</DialogTitle>
                        <DialogDescription>{t('dialogs.add.description')}</DialogDescription>
                    </DialogHeader>
                    <TableForm onFormSubmit={handleAddSubmit} onCancel={() => setAddDialogOpen(false)} />
                </DialogContent>
            </Dialog>

            <Dialog open={!!editingTable} onOpenChange={(isOpen) => !isOpen && setEditingTable(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('dialogs.edit.title')}</DialogTitle>
                    </DialogHeader>
                    <TableForm table={editingTable} onFormSubmit={handleEditSubmit} onCancel={() => setEditingTable(null)} />
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deletingTable} onOpenChange={(isOpen) => !isOpen && setDeletingTable(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('dialogs.delete.title')}</AlertDialogTitle>
                        <AlertDialogDescription>
                           {t('dialogs.delete.description', {name: deletingTable?.name})}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('dialogs.delete.cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>{t('dialogs.delete.confirm')}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
