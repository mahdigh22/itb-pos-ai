
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
import { useTranslations } from 'next-intl';

function ExtraForm({ extra, onFormSubmit, onCancel }) {
    const t = useTranslations('AdminExtras.form');
    return (
        <form action={onFormSubmit} className="space-y-4">
            <input type="hidden" name="id" value={extra?.id || ''} />
            <div className="space-y-2">
                <Label htmlFor="name">{t('nameLabel')}</Label>
                <Input id="name" name="name" placeholder={t('namePlaceholder')} required defaultValue={extra?.name} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="price">{t('priceLabel')}</Label>
                <Input id="price" name="price" type="number" step="0.01" placeholder="1.50" required defaultValue={extra?.price ?? 0} />
            </div>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel}>{t('cancel')}</Button>
                <Button type="submit">{extra ? t('save') : t('add')}</Button>
            </DialogFooter>
        </form>
    );
}

export default function ExtrasClient({ initialExtras }: { initialExtras: Extra[] }) {
    const t = useTranslations('AdminExtras');
    const tAlerts = useTranslations('Alerts');
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
            toast({ title: tAlerts('extraAdded') });
        } else {
            toast({ variant: 'destructive', title: tAlerts('error'), description: result.error });
        }
    };
    
    const handleEditSubmit = async (formData: FormData) => {
        if (!editingExtra) return;
        setEditingExtra(null);
        const result = await updateExtra(editingExtra.id, formData);
        if (result.success) {
            toast({ title: tAlerts('extraUpdated') });
        } else {
            toast({ variant: 'destructive', title: tAlerts('error'), description: result.error });
        }
    };

    const handleDelete = async () => {
        if (!deletingExtra) return;
        manageOptimisticExtras({ action: 'delete', extra: deletingExtra });
        setDeletingExtra(null);
        const result = await deleteExtra(deletingExtra.id);
        if (result.success) {
            toast({ title: tAlerts('extraDeleted') });
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
                    <CardTitle>{t('allExtrasTitle')}</CardTitle>
                    <CardDescription>{t('allExtrasDescription')}</CardDescription>
                </CardHeader>
                <CardContent>
                   <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('columns.name')}</TableHead>
                                <TableHead>{t('columns.price')}</TableHead>
                                <TableHead><span className="sr-only">{t('columns.actions')}</span></TableHead>
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
                                                    <span className="sr-only">{t('openMenu')}</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => setEditingExtra(extra)}><Edit className="mr-2 h-4 w-4"/> {t('actions.edit')}</DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive" onClick={() => setDeletingExtra(extra)}><Trash2 className="mr-2 h-4 w-4"/> {t('actions.delete')}</DropdownMenuItem>
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
                    <ExtraForm onFormSubmit={handleAddSubmit} onCancel={() => setAddDialogOpen(false)} />
                </DialogContent>
            </Dialog>

            <Dialog open={!!editingExtra} onOpenChange={(isOpen) => !isOpen && setEditingExtra(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('dialogs.edit.title')}</DialogTitle>
                    </DialogHeader>
                    <ExtraForm extra={editingExtra} onFormSubmit={handleEditSubmit} onCancel={() => setEditingExtra(null)} />
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deletingExtra} onOpenChange={(isOpen) => !isOpen && setDeletingExtra(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('dialogs.delete.title')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('dialogs.delete.description', {name: deletingExtra?.name})}
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
