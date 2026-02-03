'use client';

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from '@/lib/supabase';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, Pencil, Truck, AlertTriangle } from "lucide-react";
import { toast } from 'sonner';
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

interface Product {
    id: string;
    name: string;
    category: string;
    base_price: number;
    unit_type: string;
    // Shop specific fields
    stock: number;
}

interface Vendor {
    id: string;
    name: string;
}

export default function StockPage() {
    const searchParams = useSearchParams();
    const shopId = searchParams.get('shopId');

    const [search, setSearch] = useState("");
    const [products, setProducts] = useState<Product[]>([]);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modals
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
    const [isLossModalOpen, setIsLossModalOpen] = useState(false);
    const [lastError, setLastError] = useState<string | null>(null);

    // Form States
    const [purchaseData, setPurchaseData] = useState({
        vendor_id: '',
        product_id: '',
        quantity: '',
        unit_cost: '',
        purchase_date: new Date().toISOString().split('T')[0], // Default to today
        remarks: ''
    });

    const [lossData, setLossData] = useState({
        product_id: '',
        quantity: '',
        reason: 'Damaged',
        remarks: ''
    });

    // 1. Fetch Vendors
    const fetchVendors = async () => {
        const { data } = await supabase.from('vendors').select('id, name').eq('status', 'Active').order('name');
        if (data) setVendors(data);
    };

    // 2. Fetch Products & Shop Inventory
    const fetchModels = async () => {
        if (!shopId) return;
        setIsLoading(true);
        setLastError(null);

        try {
            // Get all products
            let query = supabase.from('products').select('*').order('name');
            if (search) query = query.ilike('name', `%${search}%`);

            const { data: globalProducts, error: pError } = await query;
            if (pError) throw pError;

            // Get shop inventory
            const { data: inventory, error: iError } = await supabase
                .from('inventory')
                .select('product_id, quantity')
                .eq('shop_id', shopId);

            if (iError) throw iError;

            // Merge Data
            const inventoryMap = new Map(inventory?.map(i => [i.product_id, i.quantity]));

            const merged = globalProducts.map(p => ({
                ...p,
                stock: inventoryMap.get(p.id) || 0 // Default to 0 if no record
            }));

            setProducts(merged);

        } catch (error: any) {
            console.error('Error:', error);
            const msg = `Load Failed: ${error.message}`;
            setLastError(msg);
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (shopId) {
            fetchModels();
            fetchVendors();
        }
    }, [shopId, search]);

    // HANDLER: Record Purchase (Stock In)
    const handlePurchase = async (e: React.FormEvent) => {
        e.preventDefault();
        const qty = parseFloat(purchaseData.quantity);
        const cost = parseFloat(purchaseData.unit_cost);

        if (!shopId || !purchaseData.product_id || qty <= 0) {
            toast.error('Invalid purchase data');
            return;
        }

        try {
            // 1. Create Purchase Record
            const { data: purchase, error: pErr } = await supabase
                .from('purchases')
                .insert({
                    shop_id: shopId,
                    vendor_id: purchaseData.vendor_id,
                    total_cost: qty * cost,
                    purchase_date: purchaseData.purchase_date, // Save Date
                    remarks: purchaseData.remarks
                })
                .select()
                .single();
            if (pErr) throw pErr;

            // 2. Insert Item
            const { error: iErr } = await supabase.from('purchase_items').insert({
                purchase_id: purchase.id,
                product_id: purchaseData.product_id,
                quantity: qty,
                unit_cost: cost,
                total_cost: qty * cost
            });
            if (iErr) throw iErr;

            // 3. Update Inventory (Using database function or upsert)
            // Using existing logic concept: Get current -> Add -> Update
            // Optimistic update via UPSERT specifically for inventory table

            // Fetch current to be safe, or use upsert if implemented.
            // Let's use the RPC function we created if possible, or standard upsert.
            // Since I created update_shop_inventory, let's use it.

            const { error: rpcErr } = await supabase.rpc('update_shop_inventory', {
                p_shop_id: shopId,
                p_product_id: purchaseData.product_id,
                p_quantity_change: qty
            });

            if (rpcErr) {
                // Fallback to manual fetch-update if RPC fails/doesn't exist
                console.warn("RPC failed, trying manual", rpcErr);
                const { data: currentInv } = await supabase.from('inventory').select('quantity').match({ shop_id: shopId, product_id: purchaseData.product_id }).single();
                const newStock = (currentInv?.quantity || 0) + qty;
                const { error: upsertErr } = await supabase.from('inventory').upsert({
                    shop_id: shopId,
                    product_id: purchaseData.product_id,
                    quantity: newStock,
                    last_updated: new Date().toISOString()
                });
                if (upsertErr) throw upsertErr;
            }

            toast.success('Stock In Recorded');
            setIsPurchaseModalOpen(false);
            setPurchaseData({ vendor_id: '', product_id: '', quantity: '', unit_cost: '', purchase_date: new Date().toISOString().split('T')[0], remarks: '' });
            fetchModels();

        } catch (error: any) {
            toast.error(error.message);
        }
    };

    // HANDLER: Report Loss (Stock Out)
    const handleLoss = async (e: React.FormEvent) => {
        e.preventDefault();
        const qty = parseFloat(lossData.quantity);

        if (!shopId || !lossData.product_id || qty <= 0) {
            toast.error('Invalid data');
            return;
        }

        try {
            // 1. Create Adjustment Record
            const { error: adjErr } = await supabase.from('inventory_adjustments').insert({
                shop_id: shopId,
                product_id: lossData.product_id,
                quantity: qty, // Positive number representing loss amount
                reason: lossData.reason,
                remarks: lossData.remarks
            });
            if (adjErr) throw adjErr;

            // 2. Deduct Inventory
            const { error: rpcErr } = await supabase.rpc('update_shop_inventory', {
                p_shop_id: shopId,
                p_product_id: lossData.product_id,
                p_quantity_change: -qty // Negative for deduction
            });

            if (rpcErr) {
                const { data: currentInv } = await supabase.from('inventory').select('quantity').match({ shop_id: shopId, product_id: lossData.product_id }).single();
                const newStock = (currentInv?.quantity || 0) - qty;
                const { error: upsertErr } = await supabase.from('inventory').upsert({
                    shop_id: shopId,
                    product_id: lossData.product_id,
                    quantity: newStock,
                    last_updated: new Date().toISOString()
                });
                if (upsertErr) throw upsertErr;
            }

            toast.success('Loss Reported');
            setIsLossModalOpen(false);
            setLossData({ product_id: '', quantity: '', reason: 'Damaged', remarks: '' });
            fetchModels();

        } catch (error: any) {
            toast.error(error.message);
        }
    };

    if (!shopId || shopId === 'Unknown') {
        return <div className="p-8 text-red-500 font-bold">Error: Missing Shop ID in URL</div>;
    }

    return (
        <div className="p-4 md:p-8 space-y-6 md:space-y-8">
            {lastError && <div className="text-red-500 bg-red-100 p-4 rounded">{lastError}</div>}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Stock Management</h1>
                    <p className="text-muted-foreground font-mono text-sm mt-1">Shop: {shopId}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="destructive" size="sm" onClick={() => setIsLossModalOpen(true)}>
                        <AlertTriangle className="mr-2 h-4 w-4" />
                        Report Loss
                    </Button>
                    <Button size="sm" onClick={() => setIsPurchaseModalOpen(true)}>
                        <Truck className="mr-2 h-4 w-4" />
                        Record Purchase
                    </Button>
                </div>
            </div>

            <div className="flex items-center space-x-4">
                <Input
                    placeholder="Search products..."
                    className="max-w-sm"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Shop Inventory</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead className="hidden md:table-cell">Category</TableHead>
                                    <TableHead className="hidden sm:table-cell">Unit</TableHead>
                                    <TableHead className="text-right">Current Stock</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {products.map(product => (
                                    <TableRow key={product.id}>
                                        <TableCell className="font-medium">{product.name}</TableCell>
                                        <TableCell className="hidden md:table-cell">{product.category}</TableCell>
                                        <TableCell className="hidden sm:table-cell">{product.unit_type || 'Qty'}</TableCell>
                                        <TableCell className="text-right font-bold text-lg">
                                            {Number(product.stock || 0).toFixed(2)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* PURCHASE MODAL */}
            {isPurchaseModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
                    <Card className="w-full max-w-lg bg-background my-8">
                        <CardHeader><CardTitle>Record Purchase (Stock In)</CardTitle></CardHeader>
                        <CardContent>
                            <form onSubmit={handlePurchase} className="space-y-4">
                                <div className="grid gap-2">
                                    <Label>Vendor</Label>
                                    <select className="flex h-10 w-full border rounded px-3" value={purchaseData.vendor_id} onChange={e => setPurchaseData({ ...purchaseData, vendor_id: e.target.value })}>
                                        <option value="">Select Vendor</option>
                                        {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                    </select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Purchase Date (Invoice Date)</Label>
                                    <Input
                                        type="date"
                                        value={purchaseData.purchase_date}
                                        onChange={e => setPurchaseData({ ...purchaseData, purchase_date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Product</Label>
                                    <select className="flex h-10 w-full border rounded px-3" value={purchaseData.product_id} onChange={e => setPurchaseData({ ...purchaseData, product_id: e.target.value })}>
                                        <option value="">Select Product</option>
                                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Quantity</Label>
                                        <Input type="number" step="0.01" value={purchaseData.quantity} onChange={e => setPurchaseData({ ...purchaseData, quantity: e.target.value })} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Unit Cost</Label>
                                        <Input type="number" step="0.01" value={purchaseData.unit_cost} onChange={e => setPurchaseData({ ...purchaseData, unit_cost: e.target.value })} />
                                    </div>
                                </div>
                                <Input placeholder="Remarks / Invoice #" value={purchaseData.remarks} onChange={e => setPurchaseData({ ...purchaseData, remarks: e.target.value })} />
                                <div className="flex justify-end gap-2 pt-2">
                                    <Button type="button" variant="outline" onClick={() => setIsPurchaseModalOpen(false)}>Cancel</Button>
                                    <Button type="submit">Save</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* LOSS MODAL */}
            {isLossModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
                    <Card className="w-full max-w-lg bg-background my-8">
                        <CardHeader><CardTitle className="text-destructive">Report Loss (Stock Out)</CardTitle></CardHeader>
                        <CardContent>
                            <form onSubmit={handleLoss} className="space-y-4">
                                <div className="grid gap-2">
                                    <Label>Product</Label>
                                    <select className="flex h-10 w-full border rounded px-3" value={lossData.product_id} onChange={e => setLossData({ ...lossData, product_id: e.target.value })}>
                                        <option value="">Select Product</option>
                                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Quantity</Label>
                                    <Input type="number" step="0.01" value={lossData.quantity} onChange={e => setLossData({ ...lossData, quantity: e.target.value })} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Reason</Label>
                                    <select className="flex h-10 w-full border rounded px-3" value={lossData.reason} onChange={e => setLossData({ ...lossData, reason: e.target.value })}>
                                        <option value="Damaged">Damaged</option>
                                        <option value="Dead">Dead</option>
                                        <option value="Theft">Theft</option>
                                        <option value="Expired">Expired</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <Input placeholder="Remarks" value={lossData.remarks} onChange={e => setLossData({ ...lossData, remarks: e.target.value })} />
                                <div className="flex justify-end gap-2 pt-2">
                                    <Button type="button" variant="outline" onClick={() => setIsLossModalOpen(false)}>Cancel</Button>
                                    <Button type="submit" variant="destructive">Confirm Loss</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
