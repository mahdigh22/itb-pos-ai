
'use client';

import { useState, useOptimistic, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, MoreHorizontal, Trash2, Edit, Loader2 } from "lucide-react";
import type { Ingredient, Admin } from "@/lib/types";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { addIngredient, updateIngredient, deleteIngredient, getIngredients } from '@/app/admin/ingredients/actions';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription } from "@/components/ui/alert-dialog";

function IngredientForm({ ingredient, onFormSubmit, onCancel }: { ingredient?: Ingredient | null, onFormSubmit: (data: FormData) => Promise<void>, onCancel: () => void }) {
    return (
        <form action={onFormSubmit} className="space-y-4">
             <input type="hidden" name="id" value={ingredient?.id || ''} />
            <div className="space-y-2">
                <Label htmlFor="name">Ingredient Name</Label>
                <Input id="name" name="name" placeholder="e.g. Cherry Tomatoes" required defaultValue={ingredient?.name} />
            </div>
            <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="stock">Initial Stock</Label>
                    <Input id="stock" name="stock" type="number" placeholder="1000" required defaultValue={ingredient?.stock || 0} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="unit">Unit</Label>
                    <Select name="unit" required defaultValue={ingredient?.unit || "pcs"}>
                        <SelectTrigger id="unit">
                            <SelectValue placeholder="Select a unit" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="g">grams (g)</SelectItem>
                            <SelectItem value="kg">kilograms (kg)</SelectItem>
                            <SelectItem value="ml">milliliters (ml)</SelectItem>
                            <SelectItem value="l">liters (l)</SelectItem>
                            <SelectItem value="pcs">pieces (pcs)</SelectItem>
                            <SelectItem value="slice">slice</SelectItem>
                            <SelectItem value="btl">bottle (btl)</SelectItem>
                            <SelectItem value="can">can</SelectItem>
                            <SelectItem value="oz">ounce (oz)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="cost">Cost per Unit</Label>
                    <Input id="cost" name="cost" type="number" step="0.01" placeholder="0.50" required defaultValue={ingredient?.cost || 0} />
                </div>
            </div>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button type="submit">{ingredient ? 'Save Changes' : 'Add Ingredient'}</Button>
            </DialogFooter>
        </form>
    );
}

export default function IngredientsClient() {
    const { toast } = useToast();
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentAdmin, setCurrentAdmin] = useState<Admin | null>(null);

    const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
    const [isAddDialogOpen, setAddDialogOpen] = useState(false);
    const [deletingIngredient, setDeletingIngredient] = useState<Ingredient | null>(null);

     useEffect(() => {
        const adminData = sessionStorage.getItem('currentAdmin');
        if (adminData) {
            const admin = JSON.parse(adminData);
            setCurrentAdmin(admin);
            getIngredients(admin.restaurantId).then(data => {
                setIngredients(data);
                setIsLoading(false);
            });
        } else {
            setIsLoading(false);
        }
    }, []);

    const [optimisticIngredients, manageOptimisticIngredients] = useOptimistic<Ingredient[], {action: 'add' | 'delete' | 'update', ingredient: Ingredient}>(
        ingredients,
        (state, { action, ingredient }) => {
            switch (action) {
                case 'add':
                    return [...state, ingredient].sort((a, b) => a.name.localeCompare(b.name));
                case 'update':
                    return state.map(i => i.id === ingredient.id ? { ...i, ...ingredient } : i);
                case 'delete':
                    return state.filter((i) => i.id !== ingredient.id);
                default:
                    return state;
            }
        }
    );

     useEffect(() => {
        setIngredients(ingredients);
    }, [ingredients]);


    const handleAddSubmit = async (formData: FormData) => {
        if (!currentAdmin) return;
        
        setAddDialogOpen(false);
        const result = await addIngredient(currentAdmin.restaurantId, formData);

        if (result.success) {
            toast({ title: "Ingredient Added" });
            const data = await getIngredients(currentAdmin.restaurantId);
            setIngredients(data);
        } else {
            toast({ variant: 'destructive', title: "Error", description: result.error });
        }
    };
    
    const handleEditSubmit = async (formData: FormData) => {
        if (!editingIngredient || !currentAdmin) return;
        setEditingIngredient(null);
        const result = await updateIngredient(currentAdmin.restaurantId, editingIngredient.id, formData);
        if (result.success) {
            toast({ title: "Ingredient Updated" });
            const data = await getIngredients(currentAdmin.restaurantId);
            setIngredients(data);
        } else {
            toast({ variant: 'destructive', title: "Error", description: result.error });
        }
    };

    const handleDelete = async () => {
        if (!deletingIngredient || !currentAdmin) return;
        const ingToDelete = { ...deletingIngredient };
        manageOptimisticIngredients({ action: 'delete', ingredient: ingToDelete });
        setDeletingIngredient(null);

        const result = await deleteIngredient(currentAdmin.restaurantId, ingToDelete.id);
        if (result.success) {
            toast({ title: "Ingredient Deleted" });
            setIngredients(prev => prev.filter(i => i.id !== ingToDelete.id));
        } else {
            toast({ variant: 'destructive', title: "Error", description: result.error });
            manageOptimisticIngredients({ action: 'add', ingredient: ingToDelete });
        }
    };
    
    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Ingredient Management</h1>
                    <p className="text-muted-foreground">Manage your master list of ingredients and their stock levels.</p>
                </div>
                 <Button onClick={() => setAddDialogOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add New Ingredient
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>All Ingredients</CardTitle>
                    <CardDescription>A list of all available ingredients and their stock levels.</CardDescription>
                </CardHeader>
                <CardContent>
                   <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Stock Level</TableHead>
                                <TableHead>Cost per Unit</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
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
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => setEditingIngredient(ingredient)}><Edit className="mr-2 h-4 w-4"/> Edit</DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive" onClick={() => setDeletingIngredient(ingredient)}><Trash2 className="mr-2 h-4 w-4"/> Delete</DropdownMenuItem>
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
                        <DialogTitle>Add New Ingredient</DialogTitle>
                        <DialogDescription>Add a new ingredient to your master list.</DialogDescription>
                    </DialogHeader>
                    <IngredientForm onFormSubmit={handleAddSubmit} onCancel={() => setAddDialogOpen(false)} ingredient={null} />
                </DialogContent>
            </Dialog>

            <Dialog open={!!editingIngredient} onOpenChange={(isOpen) => !isOpen && setEditingIngredient(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Ingredient</DialogTitle>
                    </DialogHeader>
                    <IngredientForm ingredient={editingIngredient} onFormSubmit={handleEditSubmit} onCancel={() => setEditingIngredient(null)} />
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deletingIngredient} onOpenChange={(isOpen) => !isOpen && setDeletingIngredient(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the ingredient: {deletingIngredient?.name}.
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
