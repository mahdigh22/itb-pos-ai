

'use client';

import { useState, useOptimistic, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, MoreHorizontal, Trash2, Edit, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription as AlertDialogDescriptionComponent } from "@/components/ui/alert-dialog";
import type { MenuItem, Category, Ingredient } from "@/lib/types";
import { addMenuItem, addCategory, updateMenuItem, deleteMenuItem, updateCategory, deleteCategory } from '@/app/admin/menu/actions';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';

interface MenuClientProps {
    initialMenuItems: MenuItem[];
    initialCategories: Category[];
    availableIngredients: Ingredient[];
}

type IngredientLink = {
    id: string; // client-side unique id
    ingredientId: string;
    isOptional: boolean;
    quantity: number;
}

function MenuItemFormDialog({ open, onOpenChange, categories, ingredients, onFormSubmit, initialData }) {
    const [ingredientLinks, setIngredientLinks] = useState<IngredientLink[]>([]);
    
    useEffect(() => {
        if (open) {
            setIngredientLinks(initialData?.ingredientLinks?.map(link => ({...link, id: `link-${Date.now()}-${Math.random()}` })) || []);
        }
    }, [open, initialData]);

    const addIngredientLink = () => {
        setIngredientLinks(prev => [...prev, { id: `link-${Date.now()}`, ingredientId: '', isOptional: false, quantity: 1 }]);
    };
    
    const updateIngredientLink = (id: string, field: 'ingredientId' | 'isOptional' | 'quantity', value: string | boolean | number) => {
        setIngredientLinks(prev => prev.map(link => link.id === id ? { ...link, [field]: value } : link));
    };

    const removeIngredientLink = (id: string) => {
        setIngredientLinks(prev => prev.filter(link => link.id !== id));
    }

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const finalLinks = ingredientLinks
            .filter(link => link.ingredientId && link.quantity > 0)
            .map(({id, ...rest}) => rest); // remove client-side id
        formData.set('ingredientLinks', JSON.stringify(finalLinks));
        onFormSubmit(formData);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{initialData ? 'Edit Menu Item' : 'Add New Menu Item'}</DialogTitle>
                </DialogHeader>
                <form id="menu-item-form" onSubmit={handleSubmit} className="flex-grow overflow-y-auto -mr-6 pr-6 space-y-4">
                    <div className="space-y-2"><Label htmlFor="item-name">Item Name</Label><Input id="item-name" name="name" placeholder="e.g. Classic Burger" required defaultValue={initialData?.name} /></div>
                    <div className="space-y-2"><Label htmlFor="item-description">Description</Label><Textarea id="item-description" name="description" placeholder="A brief description of the item." defaultValue={initialData?.description}/></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label htmlFor="item-price">Sell Price</Label><Input id="item-price" name="price" type="number" step="0.01" placeholder="12.99" required defaultValue={initialData?.price}/></div>
                        <div className="space-y-2">
                            <Label htmlFor="item-category">Category</Label>
                            <Select name="category" required defaultValue={initialData?.category}>
                                <SelectTrigger id="item-category"><SelectValue placeholder="Select a category" /></SelectTrigger>
                                <SelectContent>{categories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label htmlFor="item-prep-time">Prep Time (mins)</Label><Input id="item-prep-time" name="preparationTime" type="number" placeholder="15" defaultValue={initialData?.preparationTime || 5} required /></div>
                    </div>
                    
                    <div className="space-y-3">
                        <Label>Recipe Ingredients</Label>
                        <div className="space-y-2 rounded-md border p-3">
                            {ingredientLinks.map(link => {
                                const selectedIngredient = ingredients.find(ing => ing.id === link.ingredientId);
                                return (
                                <div key={link.id} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2">
                                    <Select value={link.ingredientId} onValueChange={(val) => updateIngredientLink(link.id, 'ingredientId', val)}>
                                        <SelectTrigger><SelectValue placeholder="Select Ingredient"/></SelectTrigger>
                                        <SelectContent>
                                            {ingredients.map(ing => <SelectItem key={ing.id} value={ing.id}>{ing.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>

                                    <div className="flex items-center">
                                        <Input 
                                            type="number"
                                            placeholder="Qty" 
                                            className="w-20 h-9"
                                            value={link.quantity}
                                            onChange={e => updateIngredientLink(link.id, 'quantity', parseFloat(e.target.value) || 0)}
                                            min="0"
                                            step="any"
                                        />
                                        {selectedIngredient && <span className="text-sm text-muted-foreground ml-2">{selectedIngredient.unit}</span>}
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Checkbox id={`optional-${link.id}`} checked={link.isOptional} onCheckedChange={(val) => updateIngredientLink(link.id, 'isOptional', Boolean(val))} />
                                        <Label htmlFor={`optional-${link.id}`} className="cursor-pointer">Optional</Label>
                                    </div>

                                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeIngredientLink(link.id)}><X className="h-4 w-4"/></Button>
                                </div>
                            )})}
                            <Button type="button" variant="outline" size="sm" className="w-full" onClick={addIngredientLink}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Add Ingredient
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2"><Label htmlFor="item-image">Image URL</Label><Input id="item-image" name="imageUrl" placeholder="https://placehold.co/600x400.png" defaultValue={initialData?.imageUrl}/></div>
                </form>
                <DialogFooter className="pt-4 border-t">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button type="submit" form="menu-item-form">{initialData ? 'Save Changes' : 'Add Item'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function MenuClient({ initialMenuItems, initialCategories, availableIngredients }: MenuClientProps) {
    const { toast } = useToast();
    
    // Menu Item State
    const [isItemAddDialogOpen, setItemAddDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
    const [deletingItem, setDeletingItem] = useState<MenuItem | null>(null);

    // Category State
    const [isCategoryAddDialogOpen, setCategoryAddDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

    const [optimisticMenuItems, manageOptimisticMenuItems] = useOptimistic<MenuItem[], {action: 'add' | 'delete', item: MenuItem}>(
        initialMenuItems,
        (state, { action, item }) => {
            switch(action) {
                case 'add': return [...state, item].sort((a,b) => a.name.localeCompare(b.name));
                case 'delete': return state.filter(i => i.id !== item.id);
                default: return state;
            }
        }
    );

    const [optimisticCategories, manageOptimisticCategories] = useOptimistic<Category[], {action: 'add' | 'delete', category: Category}>(
        initialCategories,
        (state, { action, category }) => {
            switch(action) {
                case 'add': return [...state, category].sort((a,b) => a.name.localeCompare(b.name));
                case 'delete': return state.filter(c => c.id !== category.id);
                default: return state;
            }
        }
    );

    const handleItemAddSubmit = async (formData: FormData) => {
        // Optimistic update not easily possible due to computed fields (cost).
        // Let server action handle it.
        setItemAddDialogOpen(false);
        const result = await addMenuItem(formData);
        if (!result.success) {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        } else {
            toast({ title: 'Menu Item Added' });
        }
    };
    
    const handleItemEditSubmit = async (formData: FormData) => {
        if (!editingItem) return;
        setEditingItem(null);
        const result = await updateMenuItem(editingItem.id, formData);
        if (!result.success) {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        } else {
            toast({ title: 'Menu Item Updated' });
        }
    };
    
    const handleItemDelete = async () => {
        if (!deletingItem) return;
        manageOptimisticMenuItems({ action: 'delete', item: deletingItem });
        setDeletingItem(null);
        const result = await deleteMenuItem(deletingItem.id);
        if (!result.success) {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        } else {
            toast({ title: 'Menu Item Deleted' });
        }
    };

    const handleCategoryAddSubmit = async (formData: FormData) => {
        const newCategory = { id: `optimistic-${Date.now()}`, name: formData.get('name') as string };
        manageOptimisticCategories({ action: 'add', category: newCategory });
        setCategoryAddDialogOpen(false);
        const result = await addCategory(formData);
        if (!result.success) {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        } else {
            toast({ title: 'Category Added' });
        }
    };

    const handleCategoryEditSubmit = async (formData: FormData) => {
        if (!editingCategory) return;
        setEditingCategory(null);
        const result = await updateCategory(editingCategory.id, formData);
        if (!result.success) {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        } else {
            toast({ title: 'Category Updated' });
        }
    }
    
    const handleCategoryDelete = async () => {
        if (!deletingCategory) return;
        manageOptimisticCategories({ action: 'delete', category: deletingCategory });
        setDeletingCategory(null);
        const result = await deleteCategory(deletingCategory.id);
        if (!result.success) {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        } else {
            toast({ title: 'Category Deleted' });
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Menu Management</h1>
                    <p className="text-muted-foreground">Manage your categories and menu items from the database.</p>
                </div>
                 <Button onClick={() => setItemAddDialogOpen(true)}><PlusCircle className="mr-2 h-4 w-4" /> Add New Item</Button>
            </div>
            <Card>
                <CardHeader><CardTitle>Menu Items</CardTitle><CardDescription>A list of all items on your menu.</CardDescription></CardHeader>
                <CardContent>
                   <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead className="hidden sm:table-cell">Category</TableHead>
                                <TableHead>Sell Price</TableHead>
                                <TableHead>Cost</TableHead>
                                <TableHead>Margin</TableHead>
                                <TableHead className="hidden md:table-cell">Prep Time</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {optimisticMenuItems.map((item) => {
                                const cost = item.cost || 0;
                                const margin = item.price > 0 ? ((item.price - cost) / item.price) * 100 : 0;
                                const marginColor = margin < 25 ? 'text-destructive' : margin < 50 ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400';

                                return (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.name}</TableCell>
                                    <TableCell className="hidden sm:table-cell">{optimisticCategories.find(c => c.id === item.category)?.name}</TableCell>
                                    <TableCell>${item.price.toFixed(2)}</TableCell>
                                    <TableCell>${cost.toFixed(2)}</TableCell>
                                    <TableCell className={cn("font-medium", marginColor)}>{margin.toFixed(1)}%</TableCell>
                                    <TableCell className="hidden md:table-cell">{item.preparationTime} mins</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => setEditingItem(item)}><Edit className="mr-2 h-4 w-4"/> Edit</DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive" onClick={() => setDeletingItem(item)}><Trash2 className="mr-2 h-4 w-4"/> Delete</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            )})}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div><CardTitle>Categories</CardTitle><CardDescription>Manage your menu categories.</CardDescription></div>
                    <Button variant="outline" onClick={() => setCategoryAddDialogOpen(true)}><PlusCircle className="mr-2 h-4 w-4" /> Add Category</Button>
                </CardHeader>
                <CardContent>
                   <Table>
                        <TableHeader><TableRow><TableHead>Name</TableHead><TableHead><span className="sr-only">Actions</span></TableHead></TableRow></TableHeader>
                        <TableBody>
                            {optimisticCategories.map((category) => (
                                <TableRow key={category.id}>
                                    <TableCell className="font-medium">{category.name}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => setEditingCategory(category)}><Edit className="mr-2 h-4 w-4"/> Edit</DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive" onClick={() => setDeletingCategory(category)}><Trash2 className="mr-2 h-4 w-4"/> Delete</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                   </Table>
                </CardContent>
            </Card>

            {/* Menu Item Dialogs */}
            <MenuItemFormDialog 
                open={isItemAddDialogOpen}
                onOpenChange={setItemAddDialogOpen}
                categories={optimisticCategories}
                ingredients={availableIngredients}
                onFormSubmit={handleItemAddSubmit}
                initialData={null}
            />
            <MenuItemFormDialog 
                open={!!editingItem}
                onOpenChange={(isOpen) => !isOpen && setEditingItem(null)}
                categories={optimisticCategories}
                ingredients={availableIngredients}
                onFormSubmit={handleItemEditSubmit}
                initialData={editingItem}
            />
             <AlertDialog open={!!deletingItem} onOpenChange={(isOpen) => !isOpen && setDeletingItem(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescriptionComponent>This will permanently delete the item: <span className="font-bold">{deletingItem?.name}</span>.</AlertDialogDescriptionComponent>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleItemDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
            {/* Category Dialogs */}
            <Dialog open={isCategoryAddDialogOpen} onOpenChange={setCategoryAddDialogOpen}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader><DialogTitle>Add New Category</DialogTitle></DialogHeader>
                    <form action={handleCategoryAddSubmit} className="space-y-4">
                        <div className="space-y-2"><Label htmlFor="cat-name">Category Name</Label><Input id="cat-name" name="name" placeholder="e.g. Sides" required /></div>
                        <DialogFooter><Button type="button" variant="outline" onClick={() => setCategoryAddDialogOpen(false)}>Cancel</Button><Button type="submit">Add Category</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            <Dialog open={!!editingCategory} onOpenChange={(isOpen) => !isOpen && setEditingCategory(null)}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader><DialogTitle>Edit Category</DialogTitle></DialogHeader>
                    <form action={handleCategoryEditSubmit} className="space-y-4">
                        <div className="space-y-2"><Label htmlFor="cat-name-edit">Category Name</Label><Input id="cat-name-edit" name="name" placeholder="e.g. Sides" required defaultValue={editingCategory?.name}/></div>
                        <DialogFooter><Button type="button" variant="outline" onClick={() => setEditingCategory(null)}>Cancel</Button><Button type="submit">Save Changes</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
             <AlertDialog open={!!deletingCategory} onOpenChange={(isOpen) => !isOpen && setDeletingCategory(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescriptionComponent>This will permanently delete the category: <span className="font-bold">{deletingCategory?.name}</span>.</AlertDialogDescriptionComponent>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCategoryDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
