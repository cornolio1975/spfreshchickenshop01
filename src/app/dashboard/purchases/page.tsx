'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Search, Filter, Pencil, Trash2, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { EditPurchaseDialog } from './edit-dialog';

export default function PurchaseHistoryPage() {
    const [purchases, setPurchases] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [dateFilter, setDateFilter] = useState('');
    const [selectedPurchase, setSelectedPurchase] = useState<any>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    const fetchPurchases = async () => {
        setIsLoading(true);
        let query = supabase
            .from('purchases')
            .select(`
                *,
                shops (name),
                vendors (name),
                purchase_items (
                    *,
                    products (name, unit_type)
                )
            `)
            .order('created_at', { ascending: false });

        if (dateFilter) {
            const start = `${dateFilter}T00:00:00`;
            const end = `${dateFilter}T23:59:59`;
            query = query.gte('created_at', start).lte('created_at', end);
        }

        const { data, error } = await query;

        if (error) {
            console.error(error);
            toast.error('Failed to load purchase history');
        } else {
            setPurchases(data || []);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchPurchases();
    }, [dateFilter]);

    const handleEdit = (purchase: any) => {
        setSelectedPurchase(purchase);
        setIsEditDialogOpen(true);
    };

    const handleDelete = async (purchaseId: string) => {
        if (!confirm('Are you sure? This will DEDUCT the added stock from inventory.')) return;

        try {
            const { error } = await supabase.rpc('delete_purchase', { p_purchase_id: purchaseId });

            if (error) throw error;

            toast.success('Purchase reversed and stock deducted');
            fetchPurchases();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Failed to delete purchase');
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold tracking-tight">Purchase History (Stock In)</h1>
                <div className="flex flex-wrap gap-2">
                    <div className="relative">
                        <CalendarIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="date"
                            className="pl-9 w-[180px]"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" onClick={() => setDateFilter('')}>
                        Reset
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Stock Replenishment Logs</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date/Time</TableHead>
                                <TableHead>Vendor</TableHead>
                                <TableHead>Ref / Remarks</TableHead>
                                <TableHead>Items</TableHead>
                                <TableHead>Total Cost</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {purchases.length === 0 && !isLoading && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        No purchase records found.
                                    </TableCell>
                                </TableRow>
                            )}
                            {purchases.map((purchase) => (
                                <TableRow key={purchase.id}>
                                    <TableCell className="font-medium">
                                        {format(new Date(purchase.created_at), 'dd MMM yyyy')}
                                        <div className="text-xs text-muted-foreground">
                                            {format(new Date(purchase.created_at), 'hh:mm a')}
                                        </div>
                                    </TableCell>
                                    <TableCell>{purchase.vendors?.name || 'Create'}</TableCell>
                                    <TableCell className="max-w-[200px] truncate" title={purchase.remarks}>
                                        {purchase.remarks || '-'}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            {purchase.purchase_items?.map((item: any) => (
                                                <span key={item.id} className="text-xs bg-muted px-1.5 py-0.5 rounded w-fit">
                                                    {item.products?.name}: {item.quantity} {item.products?.unit_type}
                                                </span>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-bold">
                                        RM {purchase.total_cost?.toFixed(2)}
                                    </TableCell>
                                    <TableCell className="text-right space-x-1">
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(purchase)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-destruct hover:text-destruct" onClick={() => handleDelete(purchase.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Dialog Component */}
            {isEditDialogOpen && selectedPurchase && (
                <EditPurchaseDialog
                    open={isEditDialogOpen}
                    onOpenChange={setIsEditDialogOpen}
                    purchase={selectedPurchase}
                    onSuccess={() => { setIsEditDialogOpen(false); fetchPurchases(); }}
                />
            )}
        </div>
    );
}
