
'use client';

import { useState, useOptimistic } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, MoreHorizontal, Trash2, Edit } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { saveTaxRate, addPriceList, updatePriceList, deletePriceList, saveActivePriceList } from '@/app/admin/settings/actions';
import type { PriceList } from '@/lib/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription } from "@/components/ui/alert-dialog";

interface SettingsClientProps {
    initialTaxRate: number;
    initialPriceLists: PriceList[];
    initialActivePriceListId?: string;
}

function PriceListForm({ priceList, onFormSubmit, onCancel }) {
    return (
        <form action={onFormSubmit} className="space-y-4">
            <input type="hidden" name="id" value={priceList?.id || ''} />
            <div className="space-y-2"><Label htmlFor="pl-name">Price List Name</Label><Input id="pl-name" name="name" placeholder="e.g. VIP Members" required defaultValue={priceList?.name}/></div>
            <div className="space-y-2"><Label htmlFor="pl-discount">Discount (%)</Label><Input id="pl-discount" name="discount" type="number" placeholder="15" required defaultValue={priceList?.discount} /></div>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button type="submit">{priceList ? 'Save Changes' : 'Add Price List'}</Button>
            </DialogFooter>
        </form>
    );
}

export default function SettingsClient({ initialTaxRate, initialPriceLists, initialActivePriceListId }: SettingsClientProps) {
    const { toast } = useToast();
    const [taxRate, setTaxRate] = useState(initialTaxRate);
    const [isSavingTax, setIsSavingTax] = useState(false);
    const [activePriceListId, setActivePriceListId] = useState(initialActivePriceListId);
    
    const [isAddDialogOpen, setAddDialogOpen] = useState(false);
    const [editingPriceList, setEditingPriceList] = useState<PriceList | null>(null);
    const [deletingPriceList, setDeletingPriceList] = useState<PriceList | null>(null);

    const [optimisticPriceLists, manageOptimisticPriceLists] = useOptimistic<PriceList[], {action: 'add' | 'delete', priceList: PriceList}>(
        initialPriceLists,
        (state, { action, priceList }) => {
            switch(action) {
                case 'add': return [...state, priceList];
                case 'delete': return state.filter(pl => pl.id !== priceList.id);
                default: return state;
            }
        }
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

    const handleActivePriceListChange = async (newId: string) => {
        const finalId = newId === 'none' ? null : newId;
        setActivePriceListId(finalId ?? undefined); // Optimistic UI update
        const result = await saveActivePriceList(finalId);
        if (result.success) {
            toast({ title: 'Settings Saved', description: 'Active price list has been updated.' });
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
            setActivePriceListId(initialActivePriceListId); // Revert on error
        }
    };

    const handleAddPriceList = async (formData: FormData) => {
        const newPriceList: PriceList = {
            id: `optimistic-pl-${Date.now()}`,
            name: formData.get('name') as string,
            discount: parseFloat(formData.get('discount') as string),
        };
        manageOptimisticPriceLists({ action: 'add', priceList: newPriceList });
        setAddDialogOpen(false);

        const result = await addPriceList(formData);
        if (!result.success) {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        } else {
            toast({ title: 'Price List Added' });
        }
    };
    
    const handleEditPriceList = async (formData: FormData) => {
        if (!editingPriceList) return;
        setEditingPriceList(null);
        const result = await updatePriceList(editingPriceList.id, formData);
        if (!result.success) {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        } else {
            toast({ title: 'Price List Updated' });
        }
    };
    
    const handleDeletePriceList = async () => {
        if (!deletingPriceList) return;
        manageOptimisticPriceLists({ action: 'delete', priceList: deletingPriceList });
        setDeletingPriceList(null);
        const result = await deletePriceList(deletingPriceList.id);
        if (!result.success) {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        } else {
            toast({ title: 'Price List Deleted' });
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
                    <CardTitle>Taxes & Defaults</CardTitle>
                    <CardDescription>Manage tax rates and default price lists for new checks.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <Label htmlFor="tax-rate">Default Tax Rate (%)</Label>
                        <Input 
                            id="tax-rate" 
                            type="number" 
                            value={taxRate} 
                            onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)} 
                        />
                         <Button className="mt-2" onClick={handleSaveTax} disabled={isSavingTax}>
                            {isSavingTax ? 'Saving...' : 'Save Tax Rate'}
                        </Button>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="active-price-list">Default Price List for New Checks</Label>
                        <Select
                            value={activePriceListId || 'none'}
                            onValueChange={handleActivePriceListChange}
                        >
                            <SelectTrigger id="active-price-list">
                                <SelectValue placeholder="Select a default..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">None (No Discount)</SelectItem>
                                {optimisticPriceLists.map((pl) => (
                                    <SelectItem key={pl.id} value={pl.id}>
                                        {pl.name} ({pl.discount}%)
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Manage Price Lists</CardTitle>
                        <CardDescription>Create or edit price lists (e.g., Happy Hour, Employee Discount).</CardDescription>
                    </div>
                    <Button variant="outline" onClick={() => setAddDialogOpen(true)}><PlusCircle className="mr-2 h-4 w-4" /> Add Price List</Button>
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
                                                <DropdownMenuItem onClick={() => setEditingPriceList(pl)}><Edit className="mr-2 h-4 w-4"/> Edit</DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive" onClick={() => setDeletingPriceList(pl)}><Trash2 className="mr-2 h-4 w-4"/> Delete</DropdownMenuItem>
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
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader><DialogTitle>Add New Price List</DialogTitle></DialogHeader>
                    <PriceListForm onFormSubmit={handleAddPriceList} onCancel={() => setAddDialogOpen(false)} />
                </DialogContent>
            </Dialog>

            <Dialog open={!!editingPriceList} onOpenChange={(isOpen) => !isOpen && setEditingPriceList(null)}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader><DialogTitle>Edit Price List</DialogTitle></DialogHeader>
                    <PriceListForm priceList={editingPriceList} onFormSubmit={handleEditPriceList} onCancel={() => setEditingPriceList(null)} />
                </DialogContent>
            </Dialog>
            
            <AlertDialog open={!!deletingPriceList} onOpenChange={(isOpen) => !isOpen && setDeletingPriceList(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the price list: <span className="font-bold">{deletingPriceList?.name}</span>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeletePriceList}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
