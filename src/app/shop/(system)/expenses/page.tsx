'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Trash2 } from 'lucide-react';
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

interface Expense {
    id: string;
    shop_id: string;
    expense_type: string;
    amount: number;
    expense_date: string;
    description: string;
}

export default function ExpensesPage() {
    const searchParams = useSearchParams();
    const shopId = searchParams.get('shopId');

    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [expenseForm, setExpenseForm] = useState({
        expense_type: 'Employee',
        amount: '',
        expense_date: new Date().toISOString().split('T')[0],
        description: ''
    });

    const fetchExpenses = async () => {
        if (!shopId) return;
        setIsLoading(true);
        const { data, error } = await supabase
            .from('shop_expenses')
            .select('*')
            .eq('shop_id', shopId)
            .order('expense_date', { ascending: false });

        if (error) {
            toast.error('Failed to load expenses');
            console.error(error);
        } else {
            setExpenses(data || []);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchExpenses();
    }, [shopId]);

    const handleSaveExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!shopId) return;

        const amount = parseFloat(expenseForm.amount);
        if (isNaN(amount) || amount <= 0) {
            toast.error("Valid amount required");
            return;
        }

        try {
            const { error } = await supabase.from('shop_expenses').insert({
                shop_id: shopId,
                expense_type: expenseForm.expense_type,
                amount: amount,
                expense_date: expenseForm.expense_date,
                description: expenseForm.description
            });

            if (error) throw error;
            toast.success("Expense recorded successfully");
            fetchExpenses();
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
            fetchExpenses();
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    return (
        <div className="p-8 space-y-8 max-w-6xl">
            <h1 className="text-3xl font-bold tracking-tight">Shop Expenses</h1>

            <div className="grid md:grid-cols-3 gap-8">
                {/* Add Expense Form */}
                <Card className="md:col-span-1 h-fit">
                    <CardHeader>
                        <CardTitle className="text-xl">Record New</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSaveExpense} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Expense Date</Label>
                                <Input type="date" required value={expenseForm.expense_date} onChange={e => setExpenseForm({ ...expenseForm, expense_date: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Type</Label>
                                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" value={expenseForm.expense_type} onChange={e => setExpenseForm({ ...expenseForm, expense_type: e.target.value })}>
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
                            <Button type="submit" className="w-full">Record Expense</Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Expense History Table */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-xl">Recent Expenses</CardTitle>
                    </CardHeader>
                    <CardContent>
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
                                    {isLoading ? (
                                        <TableRow><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow>
                                    ) : expenses.length === 0 ? (
                                        <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No expenses recorded for this shop.</TableCell></TableRow>
                                    ) : (
                                        expenses.map(exp => (
                                            <TableRow key={exp.id}>
                                                <TableCell>{exp.expense_date}</TableCell>
                                                <TableCell><span className="font-medium text-xs bg-secondary px-2 py-1 rounded-md border">{exp.expense_type}</span></TableCell>
                                                <TableCell className="max-w-[200px] truncate" title={exp.description}>{exp.description || '-'}</TableCell>
                                                <TableCell className="text-right font-bold text-red-600">RM {Number(exp.amount).toFixed(2)}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteExpense(exp.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
