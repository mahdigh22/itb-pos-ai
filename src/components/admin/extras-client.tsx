
'use client';

import { useState, useOptimistic, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, MoreHorizontal, Trash2, Edit, X } from "lucide-react";
import type { Extra, Ingredient } from "@/lib/types";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { addExtra, updateExtra, deleteExtra } from '@/app/admin/extras/actions';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

type IngredientLink = {
  id: string; // client-side unique id
  ingredientId: string;
  quantity: number;
};

function ExtraForm({ extra, ingredients, onFormSubmit, onCancel }: { extra?: Extra | null, ingredients: Ingredient[], onFormSubmit: (data: FormData) => void, onCancel: () => void }) {
    const [ingredientLinks, setIngredientLinks] = useState<IngredientLink[]>([]);
    
    useEffect(() => {
        setIngredientLinks(
            extra?.ingredientLinks?.map((link) => ({
                ...link,
                id: `link-${Date.now()}-${Math.random()}`,
            })) || []
        );
    }, [extra]);

    const addIngredientLink = () => {
        setIngredientLinks((prev) => [
            ...prev,
            { id: `link-${Date.now()}`, ingredientId: "", quantity: 1 },
        ]);
    };

    const updateIngredientLink = (id: string, field: "ingredientId" | "quantity", value: string | number) => {
        setIngredientLinks((prev) =>
            prev.map((link) => (link.id === id ? { ...link, [field]: value } : link))
        );
    };

    const removeIngredientLink = (id: string) => {
        setIngredientLinks((prev) => prev.filter((link) => link.id !== id));
    };
    
    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const finalLinks = ingredientLinks
            .filter((link) => link.ingredientId && link.quantity > 0)
            .map(({ id, ...rest }) => rest);
        formData.set("ingredientLinks", JSON.stringify(finalLinks));
        onFormSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <input type="hidden" name="id" value={extra?.id || ''} />
            <div className="space-y-2">
                <Label htmlFor="name">Extra Name</Label>
                <Input id="name" name="name" placeholder="e.g. Extra Cheese" required defaultValue={extra?.name} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <Input id="price" name="price" type="number" step="0.01" placeholder="1.50" required defaultValue={extra?.price ?? 0} />
            </div>

            <div className="space-y-3">
              <Label>Ingredients Used</Label>
              <div className="space-y-2 rounded-md border p-3">
                {ingredientLinks.map(link => {
                   const selectedIngredient = ingredients.find(ing => ing.id === link.ingredientId);
                   return (
                    <div key={link.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-2">
                      <Select value={link.ingredientId} onValueChange={(val) => updateIngredientLink(link.id, "ingredientId", val)}>
                          <SelectTrigger><SelectValue placeholder="Select Ingredient"/></SelectTrigger>
                          <SelectContent>{ingredients.map(ing => <SelectItem key={ing.id} value={ing.id}>{ing.name}</SelectItem>)}</SelectContent>
                      </Select>
                      <div className="flex items-center">
                          <Input type="number" placeholder="Qty" className="w-20 h-9" value={link.quantity} onChange={e => updateIngredientLink(link.id, "quantity", parseFloat(e.target.value) || 0)} min="0" step="any"/>
                          {selectedIngredient && <span className="text-sm text-muted-foreground ml-2">{selectedIngredient.unit}</span>}
                      </div>
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeIngredientLink(link.id)}><X className="h-4 w-4" /></Button>
                    </div>
                   )
                })}
                <Button type="button" variant="outline" size="sm" className="w-full" onClick={addIngredientLink}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Ingredient
                </Button>
              </div>
            </div>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button type="submit">{extra ? 'Save Changes' : 'Add Extra'}</Button>
            </DialogFooter>
        </form>
    );
}

export default function ExtrasClient({ initialExtras, availableIngredients }: { initialExtras: Extra[], availableIngredients: Ingredient[] }) {
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
            ingredientLinks: JSON.parse(formData.get('ingredientLinks') as string || '[]'),
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
                    <ExtraForm onFormSubmit={handleAddSubmit} onCancel={() => setAddDialogOpen(false)} ingredients={availableIngredients} />
                </DialogContent>
            </Dialog>

            <Dialog open={!!editingExtra} onOpenChange={(isOpen) => !isOpen && setEditingExtra(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Extra</DialogTitle>
                    </DialogHeader>
                    <ExtraForm extra={editingExtra} onFormSubmit={handleEditSubmit} onCancel={() => setEditingExtra(null)} ingredients={availableIngredients} />
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
