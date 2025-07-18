
'use client';

import { useState, useOptimistic, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, MoreHorizontal, Trash2, Edit, Loader2 } from "lucide-react";
import type { Member, Admin } from "@/lib/types";
import { format } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { addUser, updateUser, deleteUser, getUsers } from '@/app/admin/users/actions';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription as AlertDialogDescriptionComponent } from "@/components/ui/alert-dialog";

function UserForm({ user, onFormSubmit, onCancel }: { user?: Member | null, onFormSubmit: (data: FormData) => void, onCancel: () => void }) {
    return (
        <form onSubmit={(e) => { e.preventDefault(); onFormSubmit(new FormData(e.currentTarget)); }} className="space-y-4">
             <input type="hidden" name="id" value={user?.id || ''} />
            <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" name="name" placeholder="John Doe" required defaultValue={user?.name} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" name="email" type="email" placeholder="name@example.com" required defaultValue={user?.email}/>
            </div>
            <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" name="phone" type="tel" placeholder="555-0101" defaultValue={user?.phone}/>
            </div>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button type="submit">{user ? 'Save Changes' : 'Add User'}</Button>
            </DialogFooter>
        </form>
    );
}

export default function UsersClient() {
    const { toast } = useToast();
    const [members, setMembers] = useState<Member[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentAdmin, setCurrentAdmin] = useState<Admin | null>(null);

    const [isAddDialogOpen, setAddDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<Member | null>(null);
    const [deletingUser, setDeletingUser] = useState<Member | null>(null);

    useEffect(() => {
        const adminData = localStorage.getItem('currentAdmin');
        if (adminData) {
            const admin = JSON.parse(adminData);
            setCurrentAdmin(admin);
            getUsers(admin.restaurantId).then(data => {
                setMembers(data);
                setIsLoading(false);
            });
        } else {
            setIsLoading(false);
        }
    }, []);

    const [optimisticMembers, manageOptimisticMembers] = useOptimistic<Member[], { action: 'add' | 'delete', member: Member }>(
        members,
        (state, { action, member }) => {
            switch(action) {
                case 'add':
                    return [...state, member].sort((a,b) => a.name.localeCompare(b.name));
                case 'delete':
                    return state.filter((m) => m.id !== member.id);
                default:
                    return state;
            }
        }
    );
     useEffect(() => {
        setMembers(members);
    }, [members]);

    const handleAddSubmit = async (formData: FormData) => {
        if (!currentAdmin) return;
        setAddDialogOpen(false);
        const result = await addUser(currentAdmin.restaurantId, formData);

        if (result.success) {
            toast({ title: 'User Added' });
            const data = await getUsers(currentAdmin.restaurantId);
            setMembers(data);
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
    };
    
    const handleEditSubmit = async (formData: FormData) => {
        if (!editingUser || !currentAdmin) return;
        setEditingUser(null);
        const result = await updateUser(currentAdmin.restaurantId, editingUser.id, formData);
        if (result.success) {
            toast({ title: 'User Updated' });
            const data = await getUsers(currentAdmin.restaurantId);
            setMembers(data);
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
    };

    const handleDelete = async () => {
        if (!deletingUser || !currentAdmin) return;
        const userToDelete = { ...deletingUser };
        manageOptimisticMembers({ action: 'delete', member: userToDelete });
        setDeletingUser(null);

        const result = await deleteUser(currentAdmin.restaurantId, userToDelete.id);
        if (result.success) {
            toast({ title: 'User Deleted' });
            setMembers(prev => prev.filter(m => m.id !== userToDelete.id));
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
            manageOptimisticMembers({ action: 'add', member: userToDelete });
        }
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }


    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold font-headline">User Management</h1>
                    <p className="text-muted-foreground">Manage your members and customers.</p>
                </div>
                <Button onClick={() => setAddDialogOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add New User
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>All Users</CardTitle>
                    <CardDescription>A list of all registered members from the database.</CardDescription>
                </CardHeader>
                <CardContent>
                   <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Member</TableHead>
                                <TableHead className="hidden sm:table-cell">Phone</TableHead>
                                <TableHead className="hidden md:table-cell">Joined Date</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {optimisticMembers.map((member) => (
                                <TableRow key={member.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9">
                                                <AvatarImage src={member.avatarUrl} alt={member.name} data-ai-hint={member.avatarHint} />
                                                <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div>{member.name}</div>
                                                <div className="text-sm text-muted-foreground">{member.email}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="hidden sm:table-cell">{member.phone}</TableCell>
                                    <TableCell className="hidden md:table-cell">{format(new Date(member.joined), 'PPP')}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => setEditingUser(member)}><Edit className="mr-2 h-4 w-4"/>Edit</DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive" onClick={() => setDeletingUser(member)}><Trash2 className="mr-2 h-4 w-4"/>Delete</DropdownMenuItem>
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
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New User</DialogTitle>
                        <DialogDescription>Fill in the details for the new user.</DialogDescription>
                    </DialogHeader>
                    <UserForm onFormSubmit={handleAddSubmit} onCancel={() => setAddDialogOpen(false)} user={null} />
                </DialogContent>
            </Dialog>

            <Dialog open={!!editingUser} onOpenChange={(isOpen) => !isOpen && setEditingUser(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                        <DialogDescription>Update the details for this user.</DialogDescription>
                    </DialogHeader>
                    <UserForm user={editingUser} onFormSubmit={handleEditSubmit} onCancel={() => setEditingUser(null)} />
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deletingUser} onOpenChange={(isOpen) => !isOpen && setDeletingUser(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescriptionComponent>This will permanently delete the user {deletingUser?.name}.</AlertDialogDescriptionComponent>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>Yes, Confirm</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
