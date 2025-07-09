
'use client';

import { useState, useOptimistic } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, MoreHorizontal, Trash2, Edit } from "lucide-react";
import type { Ingredient } from "@/lib/types";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { addIngredient, updateIngredient, deleteIngredient } from '@/app/admin/ingredients/actions';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription } from "@/components/ui/alert-dialog";
import { useTranslations } from 'next-intl';

function IngredientForm({ ingredient, onFormSubmit, onCancel }) {
    const t = useTranslations('AdminIngredients.form');
    return (
        <form action={onFormSubmit} className="space-y-4">
             <input type="hidden" name="id" value={ingredient?.id || ''} />
            <div className="space-y-2">
                <Label htmlFor="name">{t('nameLabel')}</Label>
                <Input id="name" name="name" placeholder={t('namePlaceholder')} required defaultValue={ingredient?.name} />
            </div>
            <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="stock">{t('stockLabel')}</Label>
                    <Input id="stock" name="stock" type="number" placeholder="1000" required defaultValue={ingredient?.stock || 0} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="unit">{t('unitLabel')}</Label>
                    <Select name="unit" required defaultValue={ingredient?.unit || "pcs"}>
                        <SelectTrigger id="unit">
                            <SelectValue placeholder={t('unitPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="g">{t('units.g')}</SelectItem>
                            <SelectItem value="kg">{t('units.kg')}</SelectItem>
                            <SelectItem value="ml">{t('units.ml')}</SelectItem>
                            <SelectItem value="l">{t('units.l')}</SelectItem>
                            <SelectItem value="pcs">{t('units.pcs')}</SelectItem>
                            <SelectItem value="slice">{t('units.slice')}</SelectItem>
                            <SelectItem value="btl">{t('units.btl')}</SelectItem>
                            <SelectItem value="can">{t('units.can')}</SelectItem>
                            <SelectItem value="oz">{t('units.oz')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="cost">{t('costLabel')}</Label>
                    <Input id="cost" name="cost" type="number" step="0.01" placeholder="0.50" required defaultValue={ingredient?.cost || 0} />
                </div>
            </div>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel}>{t('cancel')}</Button>
                <Button type="submit">{ingredient ? t('save') : t('add')}</Button>
            </DialogFooter>
        </form>
    );
}


export default function IngredientsClient({ initialIngredients }: { initialIngredients: Ingredient[] }) {
    const t = useTranslations('AdminIngredients');
    const tAlerts = useTranslations('Alerts');
    const { toast } = useToast();
    const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
    const [isAddDialogOpen, setAddDialogOpen] = useState(false);
    const [deletingIngredient, setDeletingIngredient] = useState<Ingredient | null>(null);

    const [optimisticIngredients, manageOptimisticIngredients] = useOptimistic<Ingredient[], {action: 'add' | 'delete', ingredient: Ingredient}>(
        initialIngredients,
        (state, { action, ingredient }) => {
            switch (action) {
                case 'add':
                    return [...state, ingredient].sort((a, b) => a.name.localeCompare(b.name));
                case 'delete':
                    return state.filter((i) => i.id !== ingredient.id);
                default:
                    return state;
            }
        }
    );

    const handleAddSubmit = async (formData: FormData) => {
        const newIngredient: Ingredient = {
            id: `optimistic-${Date.now()}`,
            name: formData.get('name') as string,
            stock: parseFloat(formData.get('stock') as string) || 0,
            unit: formData.get('unit') as string || 'units',
            cost: parseFloat(formData.get('cost') as string) || 0,
        };
        
        setAddDialogOpen(false);
        manageOptimisticIngredients({ action: 'add', ingredient: newIngredient });
        
        const result = await addIngredient(formData);

        if (result.success) {
            toast({ title: tAlerts('ingredientAdded') });
        } else {
            toast({ variant: 'destructive', title: tAlerts('error'), description: result.error });
        }
    };
    
    const handleEditSubmit = async (formData: FormData) => {
        if (!editingIngredient) return;
        setEditingIngredient(null);
        const result = await updateIngredient(editingIngredient.id, formData);
        if (result.success) {
            toast({ title: tAlerts('ingredientUpdated') });
        } else {
            toast({ variant: 'destructive', title: tAlerts('error'), description: result.error });
        }
    };

    const handleDelete = async () => {
        if (!deletingIngredient) return;
        manageOptimisticIngredients({ action: 'delete', ingredient: deletingIngredient });
        setDeletingIngredient(null);
        const result = await deleteIngredient(deletingIngredient.id);
        if (result.success) {
            toast({ title: tAlerts('ingredientDeleted') });
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
                    <CardTitle>{t('allIngredientsTitle')}</CardTitle>
                    <CardDescription>{t('allIngredientsDescription')}</CardDescription>
                </CardHeader>
                <CardContent>
                   <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('columns.name')}</TableHead>
                                <TableHead>{t('columns.stockLevel')}</TableHead>
                                <TableHead>{t('columns.costPerUnit')}</TableHead>
                                <TableHead><span className="sr-only">{t('columns.actions')}</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {optimisticIngredients.map((ingredient) => (
                                <TableRow key={ingredient.id}>
                                    <TableCell className="font-medium">{ingredient.name}</TableCell>
                                    <TableCell>{ingredient.stock} {ingredient.unit}</TableCell>
                                    <TableCell>${ingredient.cost.toFixed(2)}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">{t('openMenu')}</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => setEditingIngredient(ingredient)}><Edit className="mr-2 h-4 w-4"/> {t('actions.edit')}</DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive" onClick={() => setDeletingIngredient(ingredient)}><Trash2 className="mr-2 h-4 w-4"/> {t('actions.delete')}</DropdownMenuItem>
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
                    <IngredientForm onFormSubmit={handleAddSubmit} onCancel={() => setAddDialogOpen(false)} />
                </DialogContent>
            </Dialog>

            <Dialog open={!!editingIngredient} onOpenChange={(isOpen) => !isOpen && setEditingIngredient(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('dialogs.edit.title')}</DialogTitle>
                    </DialogHeader>
                    <IngredientForm ingredient={editingIngredient} onFormSubmit={handleEditSubmit} onCancel={() => setEditingIngredient(null)} />
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deletingIngredient} onOpenChange={(isOpen) => !isOpen && setDeletingIngredient(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('dialogs.delete.title')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('dialogs.delete.description', {name: deletingIngredient?.name})}
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
