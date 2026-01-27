'use client';

import { useState, useEffect } from 'react';
import { Plus, X, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface Profile {
    id: string;
    full_name: string;
    role: string;
    email?: string; // Note: Profiles table might not have email, usually joined from auth.users but RLS prevents reading auth.users directly easily.
    // We will display what we have.
}

export default function UsersPage() {
    const [users, setUsers] = useState<Profile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<Profile | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        full_name: '',
        role: 'user'
    });

    const fetchUsers = async () => {
        setIsLoading(true);
        // Fetch profiles. Note: Email is not in profiles table by default unless synced.
        // For this minimal setup, we just show name and role.
        const { data, error } = await supabase.from('profiles').select('*').order('full_name');
        if (error) {
            toast.error('Failed to load users');
            console.error(error);
        } else {
            setUsers(data || []);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleOpenModal = (user: Profile) => {
        setEditingUser(user);
        setFormData({
            full_name: user.full_name || '',
            role: user.role || 'user'
        });
        setIsModalOpen(true);
    };

    // Note: We only support EDITING profiles here. Creating users must happen via Sign Up (Auth)
    // to generate the generic UID.
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!editingUser) return;

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: formData.full_name,
                    role: formData.role
                })
                .eq('id', editingUser.id);

            if (error) throw error;
            toast.success('User updated');

            setIsModalOpen(false);
            fetchUsers();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this user? This removes their profile data only.')) return;

        try {
            // Note: This only deletes the profile. Auth user remains unless trigger is set.
            // But for this requirement, we just delete the profile record.
            const { error } = await supabase.from('profiles').delete().eq('id', id);
            if (error) throw error;
            toast.success('Profile deleted');
            fetchUsers();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Users</h1>
                {/* User creation is done via Sign Up page linkage, or we could add a manual create modal that uses admin API if configured. 
                    For now, disabling "Add User" to force standard flow or keep it simple. */}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Users</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.length === 0 && !isLoading && (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                        No users found.
                                    </TableCell>
                                </TableRow>
                            )}
                            {users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.full_name}</TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${user.role === 'admin'
                                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
                                            : user.role === 'manager'
                                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                                                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                                            }`}>
                                            {user.role}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button variant="ghost" size="icon" onClick={() => handleOpenModal(user)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(user.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-lg bg-background shadow-lg animate-in fade-in zoom-in duration-200">
                        <CardHeader className="flex flex-row items-center justify-between border-b px-6 py-4">
                            <CardTitle>Edit User</CardTitle>
                            <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent className="p-6">
                            <form onSubmit={handleSave} className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="fullname">Full Name</Label>
                                    <Input
                                        id="fullname"
                                        required
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="role">Role</Label>
                                    <select
                                        id="role"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    >
                                        <option value="user">User</option>
                                        <option value="cashier">Cashier</option>
                                        <option value="manager">Manager</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div className="flex justify-end gap-2 pt-4">
                                    <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                                    <Button type="submit">Save Changes</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
