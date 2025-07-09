
'use client';

import { useState, useRef, useOptimistic } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, MoreHorizontal, Trash2, Edit } from "lucide-react";
import type { Extra } from "@/lib/types";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { addExtra } from '@/app/admin/extras/actions';
import { useToast } from '@/hooks/use-toast';

export default function ExtrasClient({ initialExtras }: { initialExtras: Extra[] }) {
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);
    const [isDialogOpen, setDialogOpen] = useState(false);
    
    const [optimisticExtras, addOptimisticExtra] = useOptimistic<Extra[], Extra>(
        initialExtras,
        (state, newExtra) => [...state, newExtra].sort((a, b) => a.name.localeCompare(b.name))
    );

    const handleFormSubmit = async (formData: FormData) => {
        const newExtra: Extra = {
            id: `optimistic-${Date.now()}`,
            name: formData.get('name') as string,
            price: parseFloat(formData.get('price') as string) || 0,
        };
        
        addOptimisticExtra(newExtra);

        formRef.current?.reset();
        setDialogOpen(false);

        const result = await addExtra(formData);

        if (result.success) {
            toast({
                title: 'Extra Added',
                description: 'The new extra has been successfully added.',
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
                    <h1 className="text-3xl font-bold font-headline">Extras Management</h1>
                    <p className="text-muted-foreground">Manage add-ons that can be applied to menu items.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add New Extra
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Extra</DialogTitle>
                            <DialogDescription>Add a new extra with its name and price.</DialogDescription>
                        </DialogHeader>
                        <form action={handleFormSubmit} ref={formRef} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Extra Name</Label>
                                <Input id="name" name="name" placeholder="e.g. Extra Cheese" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="price">Price</Label>
                                <Input id="price" name="price" type="number" step="0.01" placeholder="1.50" required defaultValue="0" />
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="button" variant="outline">Cancel</Button>
                                </DialogClose>
                                <Button type="submit">Add Extra</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
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
