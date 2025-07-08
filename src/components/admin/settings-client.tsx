'use client';

import { useState, useRef, useOptimistic } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, MoreHorizontal, Trash2, Edit } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { saveTaxRate, addPriceList } from '@/app/admin/settings/actions';
import type { PriceList } from '@/lib/types';

interface SettingsClientProps {
    initialTaxRate: number;
    initialPriceLists: PriceList[];
}

export default function SettingsClient({ initialTaxRate, initialPriceLists }: SettingsClientProps) {
    const { toast } = useToast();
    const [taxRate, setTaxRate] = useState(initialTaxRate);
    const [isSavingTax, setIsSavingTax] = useState(false);
    
    const [isPriceListDialogOpen, setPriceListDialogOpen] = useState(false);
    const priceListFormRef = useRef<HTMLFormElement>(null);

    const [optimisticPriceLists, addOptimisticPriceList] = useOptimistic<PriceList[], PriceList>(
        initialPriceLists,
        (state, newPriceList) => [...state, newPriceList]
    );

    const handleSaveTax = async () => {
        setIsSavingTax(true);
        const result = await saveTaxRate(taxRate);
        if (result.success) {
            toast({ title: 'Settings Saved', description: 'Tax rate has been updated.' });
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
            setTaxRate(initialTaxRate); // Revert on error
        }
        setIsSavingTax(false);
    };

    const handleAddPriceList = async (formData: FormData) => {
        const newPriceList: PriceList = {
            id: `optimistic-pl-${Date.now()}`,
            name: formData.get('name') as string,
            discount: parseFloat(formData.get('discount') as string),
        };
        addOptimisticPriceList(newPriceList);
        setPriceListDialogOpen(false);
        priceListFormRef.current?.reset();

        const result = await addPriceList(formData);
        if (!result.success) {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        } else {
            toast({ title: 'Price List Added' });
        }
    };


    return (
        <div className="space-y-6">
             <div>
                <h1 className="text-3xl font-bold font-headline">System Settings</h1>
                <p className="text-muted-foreground">Manage general application settings from the database.</p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Taxes</CardTitle>
                    <CardDescription>Manage tax rates for your business.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="max-w-sm space-y-2">
                        <Label htmlFor="tax-rate">Default Tax Rate (%)</Label>
                        <Input 
                            id="tax-rate" 
                            type="number" 
                            value={taxRate} 
                            onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)} 
                        />
                    </div>
                   <Button className="mt-4" onClick={handleSaveTax} disabled={isSavingTax}>
                        {isSavingTax ? 'Saving...' : 'Save Changes'}
                   </Button>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Price Lists</CardTitle>
                        <CardDescription>Manage different price lists (e.g., Happy Hour).</CardDescription>
                    </div>
                     <Dialog open={isPriceListDialogOpen} onOpenChange={setPriceListDialogOpen}>
                        <DialogTrigger asChild>
                           <Button variant="outline"><PlusCircle className="mr-2 h-4 w-4" /> Add Price List</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-sm">
                            <DialogHeader><DialogTitle>Add New Price List</DialogTitle></DialogHeader>
                            <form action={handleAddPriceList} ref={priceListFormRef} className="space-y-4">
                                <div className="space-y-2"><Label htmlFor="pl-name">Price List Name</Label><Input id="pl-name" name="name" placeholder="e.g. VIP Members" required /></div>
                                <div className="space-y-2"><Label htmlFor="pl-discount">Discount (%)</Label><Input id="pl-discount" name="discount" type="number" placeholder="15" required /></div>
                                <DialogFooter>
                                    <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                                    <Button type="submit">Add Price List</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                   <Table>
                        <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Discount</TableHead><TableHead><span className="sr-only">Actions</span></TableHead></TableRow></TableHeader>
                        <TableBody>
                            {optimisticPriceLists.map((pl) => (
                                <TableRow key={pl.id}>
                                    <TableCell className="font-medium">{pl.name}</TableCell>
                                    <TableCell>{pl.discount}%</TableCell>
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
