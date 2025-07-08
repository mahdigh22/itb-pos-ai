
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, MoreHorizontal, Trash2, Edit } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface PriceList {
    id: string;
    name: string;
    discount: number; // as a percentage
}

const initialPriceLists: PriceList[] = [
    { id: 'pl-1', name: 'Default', discount: 0 },
    { id: 'pl-2', name: 'Happy Hour', discount: 20 },
    { id: 'pl-3', name: 'Employee Discount', discount: 50 },
];

export default function AdminSettingsPage() {
    const [taxRate, setTaxRate] = useState(8.0);
    const [priceLists, setPriceLists] = useState<PriceList[]>(initialPriceLists);

    return (
        <div className="space-y-6">
             <div>
                <h1 className="text-3xl font-bold font-headline">System Settings</h1>
                <p className="text-muted-foreground">Manage general application settings.</p>
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
                            onChange={(e) => setTaxRate(parseFloat(e.target.value))} 
                        />
                    </div>
                   <Button className="mt-4">Save Changes</Button>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Price Lists</CardTitle>
                        <CardDescription>Manage different price lists (e.g., Happy Hour).</CardDescription>
                    </div>
                     <Dialog>
                        <DialogTrigger asChild>
                           <Button variant="outline">
                                <PlusCircle className="mr-2 h-4 w-4" /> Add Price List
                           </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-sm">
                            <DialogHeader>
                                <DialogTitle>Add New Price List</DialogTitle>
                            </DialogHeader>
                            <form className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="pl-name">Price List Name</Label>
                                    <Input id="pl-name" name="name" placeholder="e.g. VIP Members" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="pl-discount">Discount (%)</Label>
                                    <Input id="pl-discount" name="discount" type="number" placeholder="15" required />
                                </div>
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
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Discount</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {priceLists.map((pl) => (
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
