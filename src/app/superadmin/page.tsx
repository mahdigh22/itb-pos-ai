
'use client';

import { useState, useEffect, useOptimistic } from 'react';
import type { Admin } from '@/lib/types';
import { verifySuperAdminPassword, getRestaurantsWithAdmins, createRestaurant, deleteRestaurant, addRestaurantAdmin, updateRestaurantAdmin, deleteRestaurantAdmin } from './actions';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, PlusCircle, Trash2, Edit, MoreHorizontal, ShieldCheck, KeyRound } from 'lucide-react';
import ItbIcon from '@/components/itb-icon';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';

interface Restaurant {
  id: string;
  name: string;
  admins: Admin[];
}

function AdminForm({ admin, onFormSubmit, onCancel }: { admin?: Admin | null, onFormSubmit: (data: FormData) => void, onCancel: () => void }) {
    return (
        <form onSubmit={(e) => { e.preventDefault(); onFormSubmit(new FormData(e.currentTarget)); }} className="space-y-4">
            <input type="hidden" name="id" value={admin?.id || ''} />
            <div className="space-y-2"><Label htmlFor="name">Full Name</Label><Input id="name" name="name" required defaultValue={admin?.name} /></div>
            <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" required defaultValue={admin?.email}/></div>
            <div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" name="password" type="password" placeholder={admin ? "Leave blank to keep current" : ""} required={!admin}/></div>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button type="submit">{admin ? 'Save Admin' : 'Add Admin'}</Button>
            </DialogFooter>
        </form>
    );
}

function SuperAdminDashboard() {
    const { toast } = useToast();
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isRestaurantDialogOpen, setRestaurantDialogOpen] = useState(false);
    const [deletingRestaurant, setDeletingRestaurant] = useState<Restaurant | null>(null);
    
    const [isAddAdminOpen, setAddAdminOpen] = useState<string | null>(null); // restaurantId
    const [editingAdmin, setEditingAdmin] = useState<{ restaurantId: string; admin: Admin } | null>(null);
    const [deletingAdmin, setDeletingAdmin] = useState<{ restaurantId: string; admin: Admin } | null>(null);

    useEffect(() => {
        getRestaurantsWithAdmins().then(data => {
            setRestaurants(data);
            setIsLoading(false);
        });
    }, []);

    const handleCreateRestaurant = async (formData: FormData) => {
        setRestaurantDialogOpen(false);
        const result = await createRestaurant(formData);
        if (result.success) {
            toast({ title: "Restaurant Created" });
            const data = await getRestaurantsWithAdmins();
            setRestaurants(data);
        } else {
            toast({ variant: 'destructive', title: "Error", description: result.error });
        }
    }

    const handleDeleteRestaurant = async () => {
        if (!deletingRestaurant) return;
        const result = await deleteRestaurant(deletingRestaurant.id);
        if (result.success) {
            toast({ title: "Restaurant Deleted" });
            setRestaurants(prev => prev.filter(r => r.id !== deletingRestaurant.id));
        } else {
            toast({ variant: 'destructive', title: "Error", description: result.error });
        }
        setDeletingRestaurant(null);
    }
    
    const handleAddAdmin = async (formData: FormData) => {
        if (!isAddAdminOpen) return;
        const result = await addRestaurantAdmin(isAddAdminOpen, formData);
        if (result.success) {
            toast({ title: "Admin Added" });
            const data = await getRestaurantsWithAdmins();
            setRestaurants(data);
        } else {
            toast({ variant: 'destructive', title: "Error", description: result.error });
        }
        setAddAdminOpen(null);
    }
    
    const handleUpdateAdmin = async (formData: FormData) => {
        if (!editingAdmin) return;
        const { restaurantId, admin } = editingAdmin;
        const result = await updateRestaurantAdmin(restaurantId, admin.id, formData);
        if (result.success) {
            toast({ title: "Admin Updated" });
            const data = await getRestaurantsWithAdmins();
            setRestaurants(data);
        } else {
            toast({ variant: 'destructive', title: "Error", description: result.error });
        }
        setEditingAdmin(null);
    }
    
    const handleDeleteAdmin = async () => {
        if (!deletingAdmin) return;
        const { restaurantId, admin } = deletingAdmin;
        const result = await deleteRestaurantAdmin(restaurantId, admin.id);
        if (result.success) {
            toast({ title: "Admin Deleted" });
             const data = await getRestaurantsWithAdmins();
            setRestaurants(data);
        } else {
            toast({ variant: 'destructive', title: "Error", description: result.error });
        }
        setDeletingAdmin(null);
    }


    if (isLoading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>
    }

    return (
        <div className="container mx-auto p-4 md:p-8">
            <header className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                    <ShieldCheck className="h-10 w-10 text-primary"/>
                    <div>
                        <h1 className="text-3xl font-bold font-headline">Super Admin Portal</h1>
                        <p className="text-muted-foreground">Manage all restaurants and administrators.</p>
                    </div>
                </div>
                <Button onClick={() => setRestaurantDialogOpen(true)}><PlusCircle className="mr-2"/> Create Restaurant</Button>
            </header>

            <div className="space-y-8">
                {restaurants.map(restaurant => (
                    <Card key={restaurant.id} className="overflow-hidden">
                        <CardHeader className="bg-card-foreground/5 flex items-center justify-between flex-row">
                            <div>
                                <CardTitle className="text-xl">{restaurant.name}</CardTitle>
                                <CardDescription>ID: {restaurant.id}</CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => setAddAdminOpen(restaurant.id)}><PlusCircle className="mr-2 h-4 w-4" /> Add Admin</Button>
                                <Button size="sm" variant="destructive-outline" onClick={() => setDeletingRestaurant(restaurant)}><Trash2 className="mr-2 h-4 w-4" /> Delete Restaurant</Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Admin Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead><span className="sr-only">Actions</span></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {restaurant.admins.map(admin => (
                                        <TableRow key={admin.id}>
                                            <TableCell className="font-medium">{admin.name}</TableCell>
                                            <TableCell>{admin.email}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" onClick={() => setEditingAdmin({ restaurantId: restaurant.id, admin })}><Edit className="mr-2 h-4 w-4"/>Edit</Button>
                                                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeletingAdmin({ restaurantId: restaurant.id, admin })}><Trash2 className="mr-2 h-4 w-4"/>Delete</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {restaurant.admins.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground h-24">No administrators found for this restaurant.</TableCell></TableRow>}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                ))}
                {restaurants.length === 0 && (
                    <Card className="text-center py-20">
                        <CardContent>
                            <p className="text-muted-foreground">No restaurants found. Create one to get started.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
            
            <Dialog open={isRestaurantDialogOpen} onOpenChange={setRestaurantDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Create New Restaurant</DialogTitle></DialogHeader>
                    <form onSubmit={(e) => { e.preventDefault(); handleCreateRestaurant(new FormData(e.currentTarget)); }} className="space-y-4 pt-4">
                        <div className="space-y-2"><Label htmlFor="restaurantName">Restaurant Name</Label><Input id="restaurantName" name="restaurantName" required /></div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setRestaurantDialogOpen(false)}>Cancel</Button>
                            <Button type="submit">Create</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={!!isAddAdminOpen} onOpenChange={(isOpen) => !isOpen && setAddAdminOpen(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Add New Admin</DialogTitle></DialogHeader>
                    <AdminForm onFormSubmit={handleAddAdmin} onCancel={() => setAddAdminOpen(null)} />
                </DialogContent>
            </Dialog>

            <Dialog open={!!editingAdmin} onOpenChange={(isOpen) => !isOpen && setEditingAdmin(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Edit Admin</DialogTitle></DialogHeader>
                    <AdminForm admin={editingAdmin?.admin} onFormSubmit={handleUpdateAdmin} onCancel={() => setEditingAdmin(null)} />
                </DialogContent>
            </Dialog>
            
            <AlertDialog open={!!deletingRestaurant} onOpenChange={(isOpen) => !isOpen && setDeletingRestaurant(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the restaurant "{deletingRestaurant?.name}" and all its associated data. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteRestaurant}>Delete</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
             <AlertDialog open={!!deletingAdmin} onOpenChange={(isOpen) => !isOpen && setDeletingAdmin(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the admin "{deletingAdmin?.admin.name}".</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteAdmin}>Delete</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </div>
    );
}


export default function SuperAdminPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isChecking, setIsChecking] = useState(true);
    const [isPending, setIsPending] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        try {
            const authStatus = sessionStorage.getItem('superAdminAuthenticated');
            if (authStatus === 'true') {
                setIsAuthenticated(true);
            }
        } finally {
            setIsChecking(false);
        }
    }, []);

    const handleLogin = async (formData: FormData) => {
        setIsPending(true);
        const password = formData.get('password') as string;
        const result = await verifySuperAdminPassword(password);
        if (result.success) {
            sessionStorage.setItem('superAdminAuthenticated', 'true');
            setIsAuthenticated(true);
        } else {
            toast({
                variant: 'destructive',
                title: 'Access Denied',
                description: result.error,
            });
        }
        setIsPending(false);
    };

    if (isChecking) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>
    }

    if (!isAuthenticated) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
                <Card className="w-full max-w-sm mx-auto shadow-2xl">
                    <CardHeader className="text-center">
                        <div className="flex justify-center items-center gap-3 mb-2">
                            <ShieldCheck className="h-10 w-10 text-primary"/>
                            <CardTitle className="text-3xl font-headline text-primary">Super Admin</CardTitle>
                        </div>
                        <CardDescription>Enter the master password to manage restaurants.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form action={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input id="password" name="password" type="password" required disabled={isPending} />
                            </div>
                            <Button type="submit" className="w-full h-12 text-lg mt-4" disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                                <KeyRound className="mr-2 h-5 w-5" />
                                Unlock
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return <SuperAdminDashboard />;
}
