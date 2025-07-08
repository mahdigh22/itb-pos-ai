'use client';

import { useState, useRef, useOptimistic } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, MoreHorizontal, Trash2, Edit, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { MenuItem, Category } from "@/lib/types";
import { addMenuItem, addCategory } from '@/app/admin/menu/actions';
import { useToast } from '@/hooks/use-toast';

interface MenuClientProps {
    initialMenuItems: MenuItem[];
    initialCategories: Category[];
}

export default function MenuClient({ initialMenuItems, initialCategories }: MenuClientProps) {
    const { toast } = useToast();
    
    // States for dialogs and forms
    const [isItemDialogOpen, setItemDialogOpen] = useState(false);
    const [isCategoryDialogOpen, setCategoryDialogOpen] = useState(false);
    const itemFormRef = useRef<HTMLFormElement>(null);
    const categoryFormRef = useRef<HTMLFormElement>(null);

    // Optimistic state for Menu Items
    const [optimisticMenuItems, addOptimisticMenuItem] = useOptimistic<MenuItem[], MenuItem>(
        initialMenuItems,
        (state, newItem) => [...state, newItem].sort((a,b) => a.name.localeCompare(b.name))
    );

    // Optimistic state for Categories
    const [optimisticCategories, addOptimisticCategory] = useOptimistic<Category[], Category>(
        initialCategories,
        (state, newCategory) => [...state, newCategory].sort((a,b) => a.name.localeCompare(b.name))
    );

    const handleItemFormSubmit = async (formData: FormData) => {
        const newItem = {
            id: `optimistic-item-${Date.now()}`,
            name: formData.get('name') as string,
            description: formData.get('description') as string,
            price: parseFloat(formData.get('price') as string),
            category: formData.get('category') as string,
            imageUrl: formData.get('imageUrl') as string || 'https://placehold.co/600x400.png',
            imageHint: 'food placeholder',
            preparationTime: parseInt(formData.get('preparationTime') as string, 10) || 5,
        };
        addOptimisticMenuItem(newItem);
        itemFormRef.current?.reset();
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
                 <Dialog open={isItemDialogOpen} onOpenChange={setItemDialogOpen}>
                    <DialogTrigger asChild><Button><PlusCircle className="mr-2 h-4 w-4" /> Add New Item</Button></DialogTrigger>
                    <DialogContent className="sm:max-w-[480px]">
                        <DialogHeader>
                            <DialogTitle>Add New Menu Item</DialogTitle>
                        </DialogHeader>
                        <form action={handleItemFormSubmit} ref={itemFormRef} className="space-y-4">
                            <div className="space-y-2"><Label htmlFor="item-name">Item Name</Label><Input id="item-name" name="name" placeholder="e.g. Classic Burger" required /></div>
                            <div className="space-y-2"><Label htmlFor="item-description">Description</Label><Textarea id="item-description" name="description" placeholder="A brief description of the item." /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Label htmlFor="item-price">Price</Label><Input id="item-price" name="price" type="number" step="0.01" placeholder="12.99" required /></div>
                                <div className="space-y-2">
                                    <Label htmlFor="item-category">Category</Label>
                                    <Select name="category" required>
                                        <SelectTrigger id="item-category"><SelectValue placeholder="Select a category" /></SelectTrigger>
                                        <SelectContent>{optimisticCategories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Label htmlFor="item-prep-time">Prep Time (mins)</Label><Input id="item-prep-time" name="preparationTime" type="number" placeholder="15" defaultValue="5" required /></div>
                            </div>
                            <div className="space-y-2"><Label htmlFor="item-image">Image URL</Label><Input id="item-image" name="imageUrl" placeholder="https://placehold.co/600x400.png" /></div>
                             <DialogFooter>
                                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                                <Button type="submit">Add Item</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
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
