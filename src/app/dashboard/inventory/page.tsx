'use client';

import { useState, useEffect } from 'react';
import { Truck, Pencil } from 'lucide-react';
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

interface Product {
    id: string;
    name: string;
    stock: number;
    unit_type: string;
    base_price: number;
}

interface Vendor {
    id: string;
    name: string;
}

export default function InventoryPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
    const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Error Logging
    const [lastError, setLastError] = useState<string | null>(null);

    // Edit Form State
    const [editData, setEditData] = useState({
        product_id: '',
        new_stock: ''
    });

    // Purchase Form State
    const [purchaseData, setPurchaseData] = useState({
        vendor_id: '',
        product_id: '',
        quantity: '',
        unit_cost: '',
        remarks: ''
    });

    // Adjustment Form State
    const [adjustmentData, setAdjustmentData] = useState({
        product_id: '',
        quantity: '',
        reason: 'Damaged',
        remarks: ''
    });

    const fetchData = async () => {
        setIsLoading(true);
        setLastError(null);

        // Fetch Products
        const { data: prodData, error: pErr } = await supabase.from('products').select('*').order('name');
        if (pErr) {
            const msg = `Product Fetch Error: ${pErr.message}`;
            setLastError(msg);
            toast.error(msg);
        } else {
            setProducts(prodData || []);
        }

        // Fetch Vendors
        const { data: vendData, error: vErr } = await supabase.from('vendors').select('id, name').eq('status', 'Active').order('name');
        if (vErr) {
            const msg = `Vendor Fetch Error: ${vErr.message}`;
            setLastError(msg);
            toast.error(msg);
        } else {
            setVendors(vendData || []);
        }

        setIsLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handlePurchase = async (e: React.FormEvent) => {
        e.preventDefault();
        const qty = Number(purchaseData.quantity);
        const cost = Number(purchaseData.unit_cost);
        const total = qty * cost;

        if (!purchaseData.vendor_id || !purchaseData.product_id || qty <= 0) {
            toast.error('Please fill all required fields');
            return;
        }

        try {
            // 1. Create Purchase Header
            const { data: purchase, error: pError } = await supabase
                .from('purchases')
                .insert([{
                    vendor_id: purchaseData.vendor_id,
                    total_cost: total,
                    remarks: purchaseData.remarks
                }])
                .select()
                .single();

            if (pError) throw pError;

            // 2. Create Purchase Item
            const { error: iError } = await supabase
                .from('purchase_items')
                .insert([{
                    purchase_id: purchase.id,
                    product_id: purchaseData.product_id,
                    quantity: qty,
                    unit_cost: cost,
                    total_cost: total
                }]);

            if (iError) throw iError;

            // 3. Update Product Stock (Increment)
            const product = products.find(p => p.id === purchaseData.product_id);
            const currentStock = Number(product?.stock) || 0;
            const newStock = currentStock + qty;

            const { error: stockError } = await supabase
                .from('products')
                .update({ stock: newStock })
                .eq('id', purchaseData.product_id);

            if (stockError) throw stockError;

            toast.success('Purchase recorded & Stock updated');
            setIsPurchaseModalOpen(false);
            setPurchaseData({ vendor_id: '', product_id: '', quantity: '', unit_cost: '', remarks: '' });
            fetchData();

        } catch (error: any) {
            console.error(error);
            const msg = `Purchase Failed: ${error.message || JSON.stringify(error)}`;
            setLastError(msg);
            toast.error(msg);
        }
    };

    const handleAdjustment = async (e: React.FormEvent) => {
        e.preventDefault();
        const qty = Number(adjustmentData.quantity);

        if (!adjustmentData.product_id || qty <= 0) {
            toast.error('Please select product and quantity');
            return;
        }

        try {
            // 1. Create Adjustment Record
            const { error: adjError } = await supabase
                .from('inventory_adjustments')
                .insert([{
                    product_id: adjustmentData.product_id,
                    quantity: qty,
                    reason: adjustmentData.reason,
                    remarks: adjustmentData.remarks
                }]);

            if (adjError) throw adjError;

            // 2. Deduct Stock
            const product = products.find(p => p.id === adjustmentData.product_id);
            const currentStock = Number(product?.stock) || 0;
            const newStock = currentStock - qty;

            const { error: stockError } = await supabase
                .from('products')
                .update({ stock: newStock })
                .eq('id', adjustmentData.product_id);

            if (stockError) throw stockError;

            toast.success('Loss reported & Stock deducted');
            setIsAdjustmentModalOpen(false);
            setAdjustmentData({ product_id: '', quantity: '', reason: 'Damaged', remarks: '' });
            fetchData();

        } catch (error: any) {
            console.error(error);
            const msg = `Adjustment Failed: ${error.message || JSON.stringify(error)}`;
            setLastError(msg);
            toast.error(msg);
        }
    };

    const openEditModal = (product: Product) => {
        setEditData({
            product_id: product.id,
            new_stock: product.stock ? product.stock.toString() : '0'
        });
        setIsEditModalOpen(true);
    };

    const handleQuickEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        const stockVal = parseFloat(editData.new_stock);

        if (isNaN(stockVal)) {
            toast.error('Invalid stock value');
            return;
        }

        try {
            const { error: stockError } = await supabase
                .from('products')
                .update({ stock: stockVal })
                .eq('id', editData.product_id);

            if (stockError) throw stockError;

            toast.success('Stock updated directly');
            setIsEditModalOpen(false);
            fetchData();
        } catch (error: any) {
            console.error(error);
            const msg = `Update Failed: ${error.message || JSON.stringify(error)}`;
            setLastError(msg);
            toast.error(msg);
        }
    };

    return (
        <div className="space-y-4">
            {lastError && (
                <div className="bg-destructive/15 text-destructive p-4 rounded-md border border-destructive/20 font-bold whitespace-pre-wrap">
                    CRITICAL ERROR: {lastError}
                </div>
            )}

            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Inventory Level</h1>
                <div className="space-x-2">
                    <Button variant="destructive" onClick={() => setIsAdjustmentModalOpen(true)}>
                        Report Loss
                    </Button>
                    <Button onClick={() => setIsPurchaseModalOpen(true)}>
                        <Truck className="mr-2 h-4 w-4" />
                        Record Purchase (Stock In)
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Current Stock</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Product Name</TableHead>
                                <TableHead>Unit</TableHead>
                                <TableHead>Current Stock</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {products.length === 0 && !isLoading && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                                        No inventory found.
                                    </TableCell>
                                </TableRow>
                            )}
                            {products.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.name}</TableCell>
                                    <TableCell>{item.unit_type}</TableCell>
                                    <TableCell className="font-bold text-lg">{Number(item.stock || 0).toFixed(2)}</TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${(item.stock || 0) > 10 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                            {(item.stock || 0) > 10 ? 'Good' : 'Low Stock'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => openEditModal(item)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Purchase Modal */}
            {isPurchaseModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-lg bg-background shadow-lg">
                        <CardHeader>
                            <CardTitle>Record New Purchase</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handlePurchase} className="space-y-4">
                                <div className="grid gap-2">
                                    <Label>Select Vendor</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={purchaseData.vendor_id}
                                        onChange={(e) => setPurchaseData({ ...purchaseData, vendor_id: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Vendor...</option>
                                        {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                    </select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Select Product</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={purchaseData.product_id}
                                        onChange={(e) => setPurchaseData({ ...purchaseData, product_id: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Product...</option>
                                        {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.unit_type})</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Quantity (Stock In)</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={purchaseData.quantity}
                                            onChange={(e) => setPurchaseData({ ...purchaseData, quantity: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Unit Cost (RM)</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={purchaseData.unit_cost}
                                            onChange={(e) => setPurchaseData({ ...purchaseData, unit_cost: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Remarks</Label>
                                    <Input
                                        value={purchaseData.remarks}
                                        onChange={(e) => setPurchaseData({ ...purchaseData, remarks: e.target.value })}
                                        placeholder="Invoice #123..."
                                    />
                                </div>
                                <div className="flex justify-end gap-2 pt-4">
                                    <Button type="button" variant="outline" onClick={() => setIsPurchaseModalOpen(false)}>Cancel</Button>
                                    <Button type="submit">Confirm Purchase</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Adjustment Modal (Report Loss) */}
            {isAdjustmentModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-lg bg-background shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-destruct">Report Stock Loss</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleAdjustment} className="space-y-4">
                                <div className="grid gap-2">
                                    <Label>Select Product</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={adjustmentData.product_id}
                                        onChange={(e) => setAdjustmentData({ ...adjustmentData, product_id: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Product...</option>
                                        {products.map(p => <option key={p.id} value={p.id}>{p.name} (Current: {Number(p.stock || 0).toFixed(2)})</option>)}
                                    </select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Quantity to Remove</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={adjustmentData.quantity}
                                        onChange={(e) => setAdjustmentData({ ...adjustmentData, quantity: e.target.value })}
                                        required
                                        placeholder="e.g. 1"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Reason</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={adjustmentData.reason}
                                        onChange={(e) => setAdjustmentData({ ...adjustmentData, reason: e.target.value })}
                                    >
                                        <option value="Damaged">Damaged</option>
                                        <option value="Dead">Dead (Poultry)</option>
                                        <option value="Expired">Expired</option>
                                        <option value="Theft">Theft</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Remarks</Label>
                                    <Input
                                        value={adjustmentData.remarks}
                                        onChange={(e) => setAdjustmentData({ ...adjustmentData, remarks: e.target.value })}
                                        placeholder="Details..."
                                    />
                                </div>
                                <div className="flex justify-end gap-2 pt-4">
                                    <Button type="button" variant="outline" onClick={() => setIsAdjustmentModalOpen(false)}>Cancel</Button>
                                    <Button type="submit" variant="destructive">Confirm Loss</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Quick Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-sm bg-background shadow-lg">
                        <CardHeader>
                            <CardTitle>Edit Stock Level</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleQuickEdit} className="space-y-4">
                                <div className="grid gap-2">
                                    <Label>New Stock Quantity</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={editData.new_stock}
                                        onChange={(e) => setEditData({ ...editData, new_stock: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="flex justify-end gap-2 pt-4">
                                    <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                                    <Button type="submit">Update Stock</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
