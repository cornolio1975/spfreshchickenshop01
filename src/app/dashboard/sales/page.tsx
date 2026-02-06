'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Search, Filter, Pencil, Trash2, Eye } from 'lucide-react';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { EditSaleDialog } from './edit-dialog';

export default function SalesHistoryPage() {
    const [sales, setSales] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [dateFilter, setDateFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedSale, setSelectedSale] = useState<any>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    const fetchSales = async () => {
        setIsLoading(true);
        let query = supabase
            .from('sales')
            .select(`
                *,
                shops (name),
                sale_items (*)
            `)
            .order('created_at', { ascending: false });

        if (dateFilter) {
            // Filter by specific date (start to end of day)
            const start = `${dateFilter}T00:00:00`;
            const end = `${dateFilter}T23:59:59`;
            query = query.gte('created_at', start).lte('created_at', end);
        }

        if (statusFilter !== 'all') {
            query = query.eq('status', statusFilter);
        }

        const { data, error } = await query;

        if (error) {
            console.error(error);
            toast.error('Failed to load sales history');
        } else {
            setSales(data || []);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchSales();
    }, [dateFilter, statusFilter]);

    const handleEdit = (sale: any) => {
        setSelectedSale(sale);
        setIsEditDialogOpen(true);
    };

    const handleDelete = async (saleId: string) => {
        if (!confirm('Are you sure you want to delete this sale? Stock will be returned.')) return;

        try {
            // Call the custom RPC function we created
            const { error } = await supabase.rpc('delete_sale', { p_sale_id: saleId });

            if (error) throw error;

            toast.success('Sale deleted and stock restored');
            fetchSales();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Failed to delete sale');
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold tracking-tight">Sales History</h1>
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
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="refunded">Refunded</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={() => { setDateFilter(''); setStatusFilter('all'); }}>
                        Reset
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date/Time</TableHead>
                                <TableHead>Shop</TableHead>
                                <TableHead>Ref ID</TableHead>
                                <TableHead>Items</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sales.length === 0 && !isLoading && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                        No sales found for the selected criteria.
                                    </TableCell>
                                </TableRow>
                            )}
                            {sales.map((sale) => (
                                <TableRow key={sale.id}>
                                    <TableCell className="font-medium">
                                        {format(new Date(sale.created_at), 'dd MMM yyyy')}
                                        <div className="text-xs text-muted-foreground">
                                            {format(new Date(sale.created_at), 'hh:mm a')}
                                        </div>
                                    </TableCell>
                                    <TableCell>{sale.shops?.name || 'Unknown Shop'}</TableCell>
                                    <TableCell className="font-mono text-xs text-muted-foreground">
                                        {sale.id.slice(0, 8)}...
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm">
                                            {sale.sale_items?.length || 0} items
                                        </span>
                                    </TableCell>
                                    <TableCell className="font-bold">
                                        RM {sale.total_amount?.toFixed(2)}
                                    </TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize 
                                            ${sale.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                sale.status === 'refunded' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                            {sale.status}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right space-x-1">
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(sale)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-destruct hover:text-destruct" onClick={() => handleDelete(sale.id)}>
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
            {isEditDialogOpen && selectedSale && (
                <EditSaleDialog
                    open={isEditDialogOpen}
                    onOpenChange={setIsEditDialogOpen}
                    sale={selectedSale}
                    onSuccess={() => { setIsEditDialogOpen(false); fetchSales(); }}
                />
            )}
        </div>
    );
}
