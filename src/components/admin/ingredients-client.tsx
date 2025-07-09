'use client';

import { useState, useRef, useOptimistic } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, MoreHorizontal, Trash2, Edit } from "lucide-react";
import type { Ingredient } from "@/lib/types";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { addIngredient } from '@/app/admin/ingredients/actions';
import { useToast } from '@/hooks/use-toast';

export default function IngredientsClient({ initialIngredients }: { initialIngredients: Ingredient[] }) {
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);
    const [isDialogOpen, setDialogOpen] = useState(false);
    
    const [optimisticIngredients, addOptimisticIngredient] = useOptimistic<Ingredient[], Ingredient>(
        initialIngredients,
        (state, newIngredient) => [...state, newIngredient].sort((a, b) => a.name.localeCompare(b.name))
    );

    const handleFormSubmit = async (formData: FormData) => {
        const newIngredient: Ingredient = {
            id: `optimistic-${Date.now()}`,
            name: formData.get('name') as string,
        };
        
        addOptimisticIngredient(newIngredient);

        formRef.current?.reset();
        setDialogOpen(false);

        const result = await addIngredient(formData);

        if (result.success) {
            toast({
                title: 'Ingredient Added',
                description: 'The new ingredient has been successfully added.',
            });
        } else {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: result.error || 'Something went wrong.',
            });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Ingredient Management</h1>
                    <p className="text-muted-foreground">Manage your master list of ingredients.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add New Ingredient
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Ingredient</DialogTitle>
                            <DialogDescription>Add a new ingredient to your master list.</DialogDescription>
                        </DialogHeader>
                        <form action={handleFormSubmit} ref={formRef} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Ingredient Name</Label>
                                <Input id="name" name="name" placeholder="e.g. Cherry Tomatoes" required />
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="button" variant="outline">Cancel</Button>
                                </DialogClose>
                                <Button type="submit">Add Ingredient</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>All Ingredients</CardTitle>
                    <CardDescription>A list of all available ingredients from the database.</CardDescription>
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
                            {optimisticIngredients.map((ingredient) => (
                                <TableRow key={ingredient.id}>
                                    <TableCell className="font-medium">{ingredient.name}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
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
