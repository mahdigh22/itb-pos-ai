
'use client';

import { useState, useOptimistic, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, MoreHorizontal, Trash2, Edit, Loader2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { saveTaxRate, addPriceList, updatePriceList, deletePriceList, saveActivePriceList, getSettings } from '@/app/admin/settings/actions';
import type { PriceList, Admin } from '@/lib/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription } from "@/components/ui/alert-dialog";

interface Settings {
    taxRate: number;
    priceLists: PriceList[];
    activePriceListId?: string;
}

function PriceListForm({ priceList, onFormSubmit, onCancel }: { priceList?: PriceList | null, onFormSubmit: (data: FormData) => void, onCancel: () => void }) {
    return (
        <form onSubmit={(e) => { e.preventDefault(); onFormSubmit(new FormData(e.currentTarget)); }} className="space-y-4">
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

export default function SettingsClient() {
    const { toast } = useToast();
    const [settings, setSettings] = useState<Settings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentAdmin, setCurrentAdmin] = useState<Admin | null>(null);

    const [isSavingTax, setIsSavingTax] = useState(false);
    
    const [isAddDialogOpen, setAddDialogOpen] = useState(false);
    const [editingPriceList, setEditingPriceList] = useState<PriceList | null>(null);
    const [deletingPriceList, setDeletingPriceList] = useState<PriceList | null>(null);

     useEffect(() => {
        const adminData = localStorage.getItem('currentAdmin');
        if (adminData) {
            const admin = JSON.parse(adminData);
            setCurrentAdmin(admin);
            getSettings(admin.restaurantId).then(data => {
                setSettings(data);
                setIsLoading(false);
            });
        } else {
            setIsLoading(false);
        }
    }, []);

    const handleSaveTax = async () => {
        if (!settings || !currentAdmin) return;
        setIsSavingTax(true);
        const result = await saveTaxRate(currentAdmin.restaurantId, settings.taxRate);
        if (result.success) {
            toast({ title: 'Settings Saved', description: 'Tax rate has been updated.' });
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
            const data = await getSettings(currentAdmin.restaurantId);
            setSettings(data);
        }
        setIsSavingTax(false);
    };

    const handleActivePriceListChange = async (newId: string) => {
        if (!settings || !currentAdmin) return;
        const finalId = newId === 'none' ? null : newId;
        const oldId = settings.activePriceListId;
        setSettings(s => s ? ({ ...s, activePriceListId: finalId ?? undefined }) : null);
        
        const result = await saveActivePriceList(currentAdmin.restaurantId, finalId);
        if (result.success) {
            toast({ title: 'Settings Saved', description: 'Active price list has been updated.' });
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
            setSettings(s => s ? ({ ...s, activePriceListId: oldId }) : null);
        }
    };

    const handleAddPriceList = async (formData: FormData) => {
        if (!currentAdmin) return;
        setAddDialogOpen(false);
        const result = await addPriceList(currentAdmin.restaurantId, formData);
        if (!result.success) {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        } else {
            toast({ title: 'Price List Added' });
            const data = await getSettings(currentAdmin.restaurantId);
            setSettings(data);
        }
    };
    
    const handleEditPriceList = async (formData: FormData) => {
        if (!editingPriceList || !currentAdmin) return;
        setEditingPriceList(null);
        const result = await updatePriceList(currentAdmin.restaurantId, editingPriceList.id, formData);
        if (!result.success) {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        } else {
            toast({ title: 'Price List Updated' });
            const data = await getSettings(currentAdmin.restaurantId);
            setSettings(data);
        }
    };
    
    const handleDeletePriceList = async () => {
        if (!deletingPriceList || !currentAdmin) return;
        setDeletingPriceList(null);
        const result = await deletePriceList(currentAdmin.restaurantId, deletingPriceList.id);
        if (!result.success) {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        } else {
            toast({ title: 'Price List Deleted' });
            const data = await getSettings(currentAdmin.restaurantId);
            setSettings(data);
        }
    };
    
    if (isLoading || !settings) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }


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
                            value={settings.taxRate} 
                            onChange={(e) => setSettings(s => s ? { ...s, taxRate: parseFloat(e.target.value) || 0 } : null)} 
                        />
                         <Button className="mt-2" onClick={handleSaveTax} disabled={isSavingTax}>
                            {isSavingTax ? 'Saving...' : 'Save Tax Rate'}
                        </Button>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="active-price-list">Default Price List for New Checks</Label>
                        <Select
                            value={settings.activePriceListId || 'none'}
                            onValueChange={handleActivePriceListChange}
                        >
                            <SelectTrigger id="active-price-list">
                                <SelectValue placeholder="Select a default..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">None (No Discount)</SelectItem>
                                {settings.priceLists.map((pl) => (
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
                            {settings.priceLists.map((pl) => (
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
                    <PriceListForm onFormSubmit={handleAddPriceList} onCancel={() => setAddDialogOpen(false)} priceList={null} />
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
