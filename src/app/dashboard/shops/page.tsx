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

interface Shop {
    id: string;
    name: string;
    address: string;
    phone: string;
    status: string;
}

export default function ShopsPage() {
    const [shops, setShops] = useState<Shop[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingShop, setEditingShop] = useState<Shop | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        address: '',
        phone: '',
        status: 'Active'
    });

    const fetchShops = async () => {
        setIsLoading(true);
        const { data, error } = await supabase.from('shops').select('*').order('name');
        if (error) {
            // If error is code 42P01 (undefined_table), it means user didn't create table yet.
            if (error.code === '42P01') {
                toast.error('DB Error: "shops" table missing. Please run the SQL provided.');
            } else {
                toast.error('Failed to load shops');
            }
            console.error(error);
        } else {
            setShops(data || []);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchShops();
    }, []);

    const handleOpenModal = (shop?: Shop) => {
        if (shop) {
            setEditingShop(shop);
            setFormData({
                name: shop.name || '',
                address: shop.address || '',
                phone: shop.phone || '',
                status: shop.status || 'Active'
            });
        } else {
            setEditingShop(null);
            setFormData({
                name: '',
                address: '',
                phone: '',
                status: 'Active'
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            name: formData.name,
            address: formData.address,
            phone: formData.phone,
            status: formData.status
        };

        try {
            if (editingShop) {
                const { error } = await supabase
                    .from('shops')
                    .update(payload)
                    .eq('id', editingShop.id);
                if (error) throw error;
                toast.success('Shop updated');
            } else {
                const { error } = await supabase
                    .from('shops')
                    .insert([payload]);
                if (error) throw error;
                toast.success('Shop created');
            }
            setIsModalOpen(false);
            fetchShops();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this shop?')) return;

        try {
            const { error } = await supabase.from('shops').delete().eq('id', id);
            if (error) throw error;
            toast.success('Shop deleted');
            fetchShops();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Shops</h1>
                <Button onClick={() => handleOpenModal()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Shop
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Shops</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Address</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {shops.length === 0 && !isLoading && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        No shops found.
                                    </TableCell>
                                </TableRow>
                            )}
                            {shops.map((shop) => (
                                <TableRow key={shop.id}>
                                    <TableCell className="font-medium">{shop.name}</TableCell>
                                    <TableCell>{shop.address}</TableCell>
                                    <TableCell>{shop.phone}</TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${shop.status === 'Active'
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                                            }`}>
                                            {shop.status}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button variant="ghost" size="icon" onClick={() => handleOpenModal(shop)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(shop.id)}>
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
                            <CardTitle>{editingShop ? 'Edit Shop' : 'Add Shop'}</CardTitle>
                            <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent className="p-6">
                            <form onSubmit={handleSave} className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Shop Name</Label>
                                    <Input
                                        id="name"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Main Street Branch"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="address">Address</Label>
                                    <Input
                                        id="address"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        placeholder="123 Chicken St"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input
                                        id="phone"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="555-0100"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="status">Status</Label>
                                    <select
                                        id="status"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Maintenance">Maintenance</option>
                                        <option value="Closed">Closed</option>
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
