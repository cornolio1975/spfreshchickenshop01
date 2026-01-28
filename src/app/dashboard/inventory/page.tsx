'use client';

import { useState, useEffect } from 'react';
import { Filter, Plus, Truck } from 'lucide-react';
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

    // Purchase Form State
    const [purchaseData, setPurchaseData] = useState({
        vendor_id: '',
        product_id: '',
        quantity: '',
        unit_cost: '',
        remarks: ''
    });

    const fetchData = async () => {
        setIsLoading(true);
        // Fetch Products with Stock
        const { data: prodData } = await supabase.from('products').select('*').order('name');
        if (prodData) setProducts(prodData);

        // Fetch Vendors for dropdown
        const { data: vendData } = await supabase.from('vendors').select('id, name').eq('status', 'Active').order('name');
        if (vendData) setVendors(vendData);

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
            // Using RPC for atomic increment would be better, but for now fetch-update is acceptable for single user
            // We'll update passing the new value.
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
            fetchData(); // Refresh list

        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Failed to record purchase');
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Inventory Level</h1>
                <Button onClick={() => setIsPurchaseModalOpen(true)}>
                    <Truck className="mr-2 h-4 w-4" />
                    Record Purchase (Stock In)
                </Button>
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
                            </TableRow>
                        </TableHeader>
                        <TableBody>
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
        </div>
    );
}
