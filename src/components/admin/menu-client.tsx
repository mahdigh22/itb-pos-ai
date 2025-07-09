
'use client';

import { useState, useRef, useOptimistic } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, MoreHorizontal, Trash2, Edit, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import type { MenuItem, Category, Ingredient } from "@/lib/types";
import { addMenuItem, addCategory } from '@/app/admin/menu/actions';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '../ui/scroll-area';

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

function AddMenuItemDialog({ open, onOpenChange, categories, ingredients, onFormSubmit }) {
    const formRef = useRef<HTMLFormElement>(null);
    const [ingredientLinks, setIngredientLinks] = useState<IngredientLink[]>([]);

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
        formRef.current?.reset();
        setIngredientLinks([]);
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            if (!isOpen) {
                setIngredientLinks([]);
            }
            onOpenChange(isOpen);
        }}>
            <DialogTrigger asChild><Button><PlusCircle className="mr-2 h-4 w-4" /> Add New Item</Button></DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Add New Menu Item</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} ref={formRef} className="space-y-4">
                    <ScrollArea className="max-h-[60vh] p-1">
                        <div className="space-y-4 pr-6">
                            <div className="space-y-2"><Label htmlFor="item-name">Item Name</Label><Input id="item-name" name="name" placeholder="e.g. Classic Burger" required /></div>
                            <div className="space-y-2"><Label htmlFor="item-description">Description</Label><Textarea id="item-description" name="description" placeholder="A brief description of the item." /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Label htmlFor="item-price">Price</Label><Input id="item-price" name="price" type="number" step="0.01" placeholder="12.99" required /></div>
                                <div className="space-y-2">
                                    <Label htmlFor="item-category">Category</Label>
                                    <Select name="category" required>
                                        <SelectTrigger id="item-category"><SelectValue placeholder="Select a category" /></SelectTrigger>
                                        <SelectContent>{categories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Label htmlFor="item-prep-time">Prep Time (mins)</Label><Input id="item-prep-time" name="preparationTime" type="number" placeholder="15" defaultValue="5" required /></div>
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

                            <div className="space-y-2"><Label htmlFor="item-image">Image URL</Label><Input id="item-image" name="imageUrl" placeholder="https://placehold.co/600x400.png" /></div>
                        </div>
                    </ScrollArea>
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                        <Button type="submit">Add Item</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default function MenuClient({ initialMenuItems, initialCategories, availableIngredients }: MenuClientProps) {
    const { toast } = useToast();
    
    const [isItemDialogOpen, setItemDialogOpen] = useState(false);
    const [isCategoryDialogOpen, setCategoryDialogOpen] = useState(false);
    const categoryFormRef = useRef<HTMLFormElement>(null);

    const [optimisticMenuItems, addOptimisticMenuItem] = useOptimistic<MenuItem[], MenuItem>(
        initialMenuItems,
        (state, newItem) => [...state, newItem].sort((a,b) => a.name.localeCompare(b.name))
    );

    const [optimisticCategories, addOptimisticCategory] = useOptimistic<Category[], Category>(
        initialCategories,
        (state, newCategory) => [...state, newCategory].sort((a,b) => a.name.localeCompare(b.name))
    );

    const handleItemFormSubmit = async (formData: FormData) => {
        const ingredientLinksString = formData.get('ingredientLinks') as string;
        const ingredientLinks = ingredientLinksString ? JSON.parse(ingredientLinksString) : [];

        const newItem = {
            id: `optimistic-item-${Date.now()}`,
            name: formData.get('name') as string,
            description: formData.get('description') as string,
            price: parseFloat(formData.get('price') as string),
            category: formData.get('category') as string,
            imageUrl: formData.get('imageUrl') as string || 'https://placehold.co/600x400.png',
            imageHint: 'food placeholder',
            preparationTime: parseInt(formData.get('preparationTime') as string, 10) || 5,
            ingredientLinks: ingredientLinks,
            ingredients: ingredientLinks.map(link => {
                const ing = availableIngredients.find(i => i.id === link.ingredientId);
                return ing ? { ...ing, isOptional: link.isOptional, quantity: link.quantity } : null;
            }).filter(Boolean),
        };

        addOptimisticMenuItem(newItem as MenuItem);
        setItemDialogOpen(false);
        
        const result = await addMenuItem(formData);
        if (!result.success) {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        } else {
            toast({ title: 'Menu Item Added' });
        }
    };

    const handleCategoryFormSubmit = async (formData: FormData) => {
        const newCategory = {
            id: `optimistic-cat-${Date.now()}`,
            name: formData.get('name') as string,
        };
        addOptimisticCategory(newCategory);
        categoryFormRef.current?.reset();
        setCategoryDialogOpen(false);
        
        const result = await addCategory(formData);
        if (!result.success) {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        } else {
            toast({ title: 'Category Added' });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Menu Management</h1>
                    <p className="text-muted-foreground">Manage your categories and menu items from the database.</p>
                </div>
                 <AddMenuItemDialog 
                    open={isItemDialogOpen}
                    onOpenChange={setItemDialogOpen}
                    categories={optimisticCategories}
                    ingredients={availableIngredients}
                    onFormSubmit={handleItemFormSubmit}
                 />
            </div>
            <Card>
                <CardHeader><CardTitle>Menu Items</CardTitle><CardDescription>A list of all items on your menu.</CardDescription></CardHeader>
                <CardContent>
                   <Table>
                        <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Category</TableHead><TableHead>Price</TableHead><TableHead>Prep Time</TableHead><TableHead><span className="sr-only">Actions</span></TableHead></TableRow></TableHeader>
                        <TableBody>
                            {optimisticMenuItems.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.name}</TableCell>
                                    <TableCell>{optimisticCategories.find(c => c.id === item.category)?.name}</TableCell>
                                    <TableCell>${item.price.toFixed(2)}</TableCell>
                                    <TableCell>{item.preparationTime} mins</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem><Edit className="mr-2 h-4 w-4"/> Edit</DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4"/> Delete</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div><CardTitle>Categories</CardTitle><CardDescription>Manage your menu categories.</CardDescription></div>
                    <Dialog open={isCategoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                        <DialogTrigger asChild><Button variant="outline"><PlusCircle className="mr-2 h-4 w-4" /> Add Category</Button></DialogTrigger>
                        <DialogContent className="sm:max-w-sm">
                            <DialogHeader><DialogTitle>Add New Category</DialogTitle></DialogHeader>
                            <form action={handleCategoryFormSubmit} ref={categoryFormRef} className="space-y-4">
                                <div className="space-y-2"><Label htmlFor="cat-name">Category Name</Label><Input id="cat-name" name="name" placeholder="e.g. Sides" required /></div>
                                <DialogFooter>
                                    <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                                    <Button type="submit">Add Category</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
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
                                                <DropdownMenuItem><Edit className="mr-2 h-4 w-4"/> Edit</DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4"/> Delete</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                   </Table>
                </CardContent>
            </Card>
        </div>
    );
}
