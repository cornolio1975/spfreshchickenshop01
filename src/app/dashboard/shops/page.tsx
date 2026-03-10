'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Plus, X, Pencil, Trash2, Receipt } from 'lucide-react';
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

interface Expense {
    id: string;
    shop_id: string;
    expense_type: string;
    amount: number;
    expense_date: string;
    description: string;
}

export default function ShopsPage() {
    const [shops, setShops] = useState<Shop[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingShop, setEditingShop] = useState<Shop | null>(null);

    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [selectedExpenseShop, setSelectedExpenseShop] = useState<Shop | null>(null);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [isExpenseLoading, setIsExpenseLoading] = useState(false);

    const [expenseForm, setExpenseForm] = useState({
        expense_type: 'Employee',
        amount: '',
        expense_date: new Date().toISOString().split('T')[0],
        description: ''
    });

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

    // --- Expenses Management ---
    const fetchExpenses = async (shopId: string) => {
        setIsExpenseLoading(true);
        const { data, error } = await supabase
            .from('shop_expenses')
            .select('*')
            .eq('shop_id', shopId)
            .order('expense_date', { ascending: false });

        if (error) {
            if (error.code === '42P01') {
                toast.error('DB Error: "shop_expenses" table missing. Please run migration script.');
            } else {
                toast.error('Failed to load expenses');
            }
            console.error(error);
        } else {
            setExpenses(data || []);
        }
        setIsExpenseLoading(false);
    };

    const handleOpenExpenseModal = (shop: Shop) => {
        setSelectedExpenseShop(shop);
        setIsExpenseModalOpen(true);
        fetchExpenses(shop.id);
        // reset form
        setExpenseForm({
            expense_type: 'Employee',
            amount: '',
            expense_date: new Date().toISOString().split('T')[0],
            description: ''
        });
    };

    const handleSaveExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedExpenseShop) return;

        const amount = parseFloat(expenseForm.amount);
        if (isNaN(amount) || amount <= 0) {
            toast.error("Valid amount required");
            return;
        }

        try {
            const { error } = await supabase.from('shop_expenses').insert({
                shop_id: selectedExpenseShop.id,
                expense_type: expenseForm.expense_type,
                amount: amount,
                expense_date: expenseForm.expense_date,
                description: expenseForm.description
            });

            if (error) throw error;
            toast.success("Expense recorded successfully");
            fetchExpenses(selectedExpenseShop.id);
            setExpenseForm({
                expense_type: 'Employee',
                amount: '',
                expense_date: new Date().toISOString().split('T')[0],
                description: ''
            });
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    const handleDeleteExpense = async (expenseId: string) => {
        if (!confirm("Are you sure you want to delete this expense?")) return;
        try {
            const { error } = await supabase.from('shop_expenses').delete().eq('id', expenseId);
            if (error) throw error;
            toast.success("Expense deleted");
            if (selectedExpenseShop) fetchExpenses(selectedExpenseShop.id);
        } catch (err: any) {
            toast.error(err.message);
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
                                        <Button variant="outline" size="sm" onClick={() => handleOpenExpenseModal(shop)}>
                                            <Receipt className="h-4 w-4 mr-2" />
                                            Expenses
                                        </Button>
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

            {/* Expenses Management Modal */}
            {isExpenseModalOpen && selectedExpenseShop && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-2xl bg-background shadow-lg animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                        <CardHeader className="flex flex-row items-center justify-between border-b px-6 py-4 flex-shrink-0">
                            <div>
                                <CardTitle>Manage Expenses</CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">Shop: {selectedExpenseShop.name}</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setIsExpenseModalOpen(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent className="p-6 flex-1 overflow-auto space-y-8">

                            {/* Record New Expense Form */}
                            <div className="bg-muted/50 p-4 rounded-lg border">
                                <h3 className="text-sm font-semibold mb-3">Record New Expense</h3>
                                <form onSubmit={handleSaveExpense} className="grid sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Expense Date</Label>
                                        <Input type="date" required value={expenseForm.expense_date} onChange={e => setExpenseForm({ ...expenseForm, expense_date: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Type</Label>
                                        <select className="flex h-10 w-full rounded border px-3 text-sm" value={expenseForm.expense_type} onChange={e => setExpenseForm({ ...expenseForm, expense_type: e.target.value })}>
                                            <option value="Employee">Employee Salary</option>
                                            <option value="Rent">Shop Rent</option>
                                            <option value="Utilities">Utilities (Water/Elec)</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Amount (RM)</Label>
                                        <Input type="number" step="0.01" required value={expenseForm.amount} onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Description / Remarks</Label>
                                        <Input placeholder="Optional" value={expenseForm.description} onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })} />
                                    </div>
                                    <div className="sm:col-span-2 flex justify-end">
                                        <Button type="submit">Record Expense</Button>
                                    </div>
                                </form>
                            </div>

                            {/* Expense History Table */}
                            <div>
                                <h3 className="text-sm font-semibold mb-3">Recent Expenses</h3>
                                <div className="border rounded-lg overflow-hidden">
                                    <Table>
                                        <TableHeader className="bg-muted">
                                            <TableRow>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead>Description</TableHead>
                                                <TableHead className="text-right">Amount</TableHead>
                                                <TableHead className="text-right w-16"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {isExpenseLoading ? (
                                                <TableRow><TableCell colSpan={5} className="text-center py-4">Loading...</TableCell></TableRow>
                                            ) : expenses.length === 0 ? (
                                                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-4">No expenses recorded for this shop.</TableCell></TableRow>
                                            ) : (
                                                expenses.map(exp => (
                                                    <TableRow key={exp.id}>
                                                        <TableCell>{exp.expense_date}</TableCell>
                                                        <TableCell><span className="font-medium text-xs bg-secondary px-2 py-1 rounded">{exp.expense_type}</span></TableCell>
                                                        <TableCell className="max-w-[150px] truncate" title={exp.description}>{exp.description || '-'}</TableCell>
                                                        <TableCell className="text-right font-bold text-red-600">RM {Number(exp.amount).toFixed(2)}</TableCell>
                                                        <TableCell className="text-right">
                                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-700" onClick={() => handleDeleteExpense(exp.id)}>
                                                                <Trash2 className="h-3 w-3" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
