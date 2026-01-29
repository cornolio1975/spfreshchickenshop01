'use client';

import { useSearchParams } from 'next/navigation';

import { useState } from 'react';
import { Search, ShoppingCart, Trash2, Plus, Minus, Printer, Home, Calendar, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

// @ts-ignore
// import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { supabase } from '@/lib/supabase';
import { useEffect } from 'react';

// Interface for Product
interface Product {
    id: string;
    name: string;
    base_price: number;
    category: string;
    unit_type?: 'Kg' | 'Qty';
    stock?: number;
}


// Interface for Vendor
interface Vendor {
    id: string;
    name: string;
}

export default function POSPage() {
    const searchParams = useSearchParams();
    const shopId = searchParams.get('shopId');
    const [shopName, setShopName] = useState<string>('');

    // Allow quantity to be string for input handling (e.g. "1.")
    const [cart, setCart] = useState<{ product: Product, quantity: number | string }[]>([]);
    const [search, setSearch] = useState('');
    const [products, setProducts] = useState<Product[]>([]);
    const [vendors, setVendors] = useState<Vendor[]>([]); // New Vendor State
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false); // Modal State

    // Purchase Form State
    const [purchaseData, setPurchaseData] = useState({
        vendor_id: '',
        product_id: '',
        quantity: '',
        unit_cost: '',
        remarks: ''
    });


    // Date Selection State (Defaults to Today in YYYY-MM-DD)
    const [saleDate, setSaleDate] = useState(() => {
        const now = new Date();
        const malaysiaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kuala_Lumpur' }));
        const year = malaysiaTime.getFullYear();
        const month = String(malaysiaTime.getMonth() + 1).padStart(2, '0');
        const day = String(malaysiaTime.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    });
    // const supabase = createClientComponentClient();

    useEffect(() => {
        const fetchProducts = async () => {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .ilike('name', `%${search}%`);

            if (data) {
                setProducts(data);
            }

            // Fetch Vendors
            const { data: vendData } = await supabase.from('vendors').select('id, name').eq('status', 'Active').order('name');
            if (vendData) setVendors(vendData);

            // Fetch Shop Name if shopId exists
            if (shopId) {
                const { data: shopData } = await supabase.from('shops').select('name').eq('id', shopId).single();
                if (shopData) setShopName(shopData.name);
            }
        };
        fetchProducts();
    }, [search, shopId]);

    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.product.id === product.id);
            if (existing) {
                return prev.map(item =>
                    item.product.id === product.id ? { ...item, quantity: Number(item.quantity) + 1 } : item
                );
            }
            return [...prev, { product, quantity: 1 }];
        });
    };

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(item => item.product.id !== productId));
    };

    const setItemQuantity = (productId: string, value: string) => {
        // Allow empty string or valid number format
        if (value === '' || /^\d*\.?\d*$/.test(value)) {
            setCart(prev => prev.map(item => {
                if (item.product.id === productId) {
                    return { ...item, quantity: value };
                }
                return item;
            }));
        }
    };

    const adjustQuantity = (product: Product, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.product.id === product.id) {
                const current = Number(item.quantity) || 0;
                const newQty = Math.max(0.1, parseFloat((current + delta).toFixed(2)));
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const total = cart.reduce((sum, item) => sum + (item.product.base_price * (Number(item.quantity) || 0)), 0);

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        setIsCheckingOut(true);

        try {
            // Construct Timestamp with selected date and current time (to preserve ordering or just default to chosen day)
            // We append current time to keep some order, but the date part comes from input.
            const now = new Date();
            const finalDate = new Date(`${saleDate}T${now.toTimeString().split(' ')[0]}`);

            // 1. Create Sale Record
            const { data: saleData, error: saleError } = await supabase
                .from('sales')
                .insert([
                    {
                        total_amount: total,
                        payment_method: 'cash', // Default to cash for now
                        status: 'completed',
                        created_at: finalDate.toISOString()
                    }
                ])
                .select()
                .single();

            if (saleError) throw saleError;

            // 2. Create Sale Items & Deduct Stock
            for (const item of cart) {
                const qty = Number(item.quantity) || 0;

                // A. Insert Sale Item
                const { error: itemError } = await supabase
                    .from('sale_items')
                    .insert([{
                        sale_id: saleData.id,
                        product_id: item.product.id,
                        product_name: item.product.name,
                        quantity: qty,
                        unit_price: item.product.base_price,
                        total_price: item.product.base_price * qty
                    }]);

                if (itemError) console.error('Error saving item:', itemError);

                // B. Deduct Stock (Fetch current first to be safe, or use RPC if available. Using fetch-update for simplicity)
                // Ideally this should be a DB trigger or RPC.
                const { data: currentProd } = await supabase.from('products').select('stock').eq('id', item.product.id).single();
                const currentStock = Number(currentProd?.stock) || 0;
                const newStock = currentStock - qty;

                await supabase.from('products').update({ stock: newStock }).eq('id', item.product.id);
            }

            toast.success(`Order processed! Total: RM ${total.toFixed(2)}`);
            setCart([]);
        } catch (error: any) {
            console.error('Checkout error:', error);
            toast.error(error.message || 'Failed to process checkout');
        } finally {
            setIsCheckingOut(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

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
                    remarks: `${purchaseData.remarks} (via POS)`
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
            // const product = products.find(p => p.id === purchaseData.product_id);
            // Actually let's just fetch fresh to be safe or assuming local update
            const { data: currentProd } = await supabase.from('products').select('stock').eq('id', purchaseData.product_id).single();
            const freshStock = Number(currentProd?.stock) || 0;
            const newStock = freshStock + qty;

            const { error: stockError } = await supabase
                .from('products')
                .update({ stock: newStock })
                .eq('id', purchaseData.product_id);

            if (stockError) throw stockError;

            toast.success('Stock Added Successfully');
            setIsPurchaseModalOpen(false);
            setPurchaseData({ vendor_id: '', product_id: '', quantity: '', unit_cost: '', remarks: '' });
            // trigger refresh logic if needed, simplify by re-fetching
            const { data: newData } = await supabase.from('products').select('*').ilike('name', `%${search}%`);
            if (newData) setProducts(newData);

        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Failed to record purchase');
        }
    };


    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="flex h-[calc(100vh-120px)] gap-4 flex-col md:flex-row">
            {/* Left: Product Table */}
            <div className="flex-1 flex flex-col border border-border bg-card rounded-sm overflow-hidden print:hidden">
                <div className="p-4 border-b border-border flex gap-2 items-center">
                    <div className="flex items-center gap-2 mr-2">
                        <Button variant="outline" size="icon" onClick={() => window.location.href = '/'} title="Go Home">
                            <Home className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => setIsPurchaseModalOpen(true)} title="Stock In (Purchase)">
                            <Truck className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Shop Label */}
                    {shopName && (
                        <div className="hidden md:block px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                            {shopName}
                        </div>
                    )}

                    {/* Date Picker */}
                    <div className="relative">
                        <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="date"
                            className="pl-9 h-9 w-[160px]"
                            value={saleDate}
                            onChange={(e) => setSaleDate(e.target.value)}
                        />
                    </div>

                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by product name..."
                            className="pl-8 h-9"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Product Name</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead className="text-right">Unit Price (RM)</TableHead>
                                <TableHead className="w-[100px]">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {products.map((product) => (
                                <TableRow key={product.id} className="hover:bg-muted/50">
                                    <TableCell className="font-medium">
                                        {product.name}
                                        {product.unit_type === 'Kg' && <span className="ml-2 text-xs text-muted-foreground border px-1 rounded">Kg</span>}
                                    </TableCell>
                                    <TableCell>{product.category}</TableCell>
                                    <TableCell className="text-right">
                                        RM {product.base_price.toFixed(2)}
                                        <span className="text-xs text-muted-foreground ml-1">/{product.unit_type || 'Qty'}</span>
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-7 text-xs"
                                            onClick={() => addToCart(product)}
                                        >
                                            Add
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Right: Invoice / Cart */}
            <div className="w-full md:w-[400px] flex flex-col border border-border bg-card rounded-sm print:w-full print:border-none">
                <div className="p-4 border-b border-border bg-muted/20">
                    <h2 className="font-bold flex items-center gap-2 uppercase tracking-wide text-sm">
                        <ShoppingCart className="h-4 w-4" />
                        Invoice / Order Summary
                    </h2>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 print:overflow-visible">
                    {cart.length === 0 ? (
                        <div className="text-center text-muted-foreground py-10 font-mono text-xs">
                            [ NO ITEMS IN CART ]
                        </div>
                    ) : (
                        <table className="w-full text-sm font-mono">
                            <thead>
                                <tr className="border-b border-border text-left">
                                    <th className="py-2">Item</th>
                                    <th className="py-2 text-right">Qty/Wt</th>
                                    <th className="py-2 text-right">Total</th>
                                    <th className="py-2 w-8 print:hidden"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {cart.map(item => {
                                    const isKg = item.product.unit_type === 'Kg';
                                    const step = isKg ? 0.1 : 1;
                                    return (
                                        <tr key={item.product.id} className="border-b border-border/50">
                                            <td className="py-2">
                                                <div className="font-medium">{item.product.name}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    @ RM {item.product.base_price.toFixed(2)} / {item.product.unit_type || 'Qty'}
                                                </div>
                                            </td>
                                            <td className="py-2 text-right">
                                                <div className="flex items-center justify-end gap-1 print:hidden">
                                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => adjustQuantity(item.product, -step)}>
                                                        <Minus className="h-3 w-3" />
                                                    </Button>
                                                    <Input
                                                        type="text"
                                                        className="w-16 h-7 text-center p-1 text-xs"
                                                        value={item.quantity}
                                                        onChange={(e) => setItemQuantity(item.product.id, e.target.value)}
                                                    />
                                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => adjustQuantity(item.product, step)}>
                                                        <Plus className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                                <span className="hidden print:block">{item.quantity} {item.product.unit_type}</span>
                                            </td>
                                            <td className="py-2 text-right font-medium">
                                                RM {(item.product.base_price * (Number(item.quantity) || 0)).toFixed(2)}
                                            </td>
                                            <td className="py-2 text-right print:hidden">
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destruct hover:text-destruct" onClick={() => removeFromCart(item.product.id)}>
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Totals Section */}
                <div className="p-4 border-t border-border bg-muted/20">
                    <div className="space-y-1 text-sm font-mono border-b border-border pb-4 mb-4">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Subtotal:</span>
                            <span>RM {total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Tax (0%):</span>
                            <span>RM 0.00</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg pt-2 border-t border-border/50">
                            <span>TOTAL DUE:</span>
                            <span>RM {total.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 print:hidden">
                        <Button variant="outline" onClick={handlePrint} disabled={cart.length === 0}>
                            <Printer className="w-4 h-4 mr-2" />
                            Print
                        </Button>
                        <Button onClick={handleCheckout} disabled={cart.length === 0 || isCheckingOut} className="bg-primary text-primary-foreground hover:bg-primary/90">
                            {isCheckingOut ? 'Processing...' : 'Checkout'}
                        </Button>
                    </div>
                </div>
            </div>
            {/* Purchase Modal */}
            <PurchaseModal
                isOpen={isPurchaseModalOpen}
                onClose={() => setIsPurchaseModalOpen(false)}
                onSubmit={handlePurchase}
                vendors={vendors}
                products={products}
                data={purchaseData}
                setData={setPurchaseData}
            />
        </div>
    );
}

// Sub-component for Modal to restart scope if needed or just inline
function PurchaseModal({ isOpen, onClose, onSubmit, vendors, products, data, setData }: any) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <Card className="w-full max-w-lg bg-background shadow-lg">
                <CardHeader>
                    <CardTitle>Stock In (Record Purchase)</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={onSubmit} className="space-y-4">
                        <div className="grid gap-2">
                            <Label>Select Vendor</Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={data.vendor_id}
                                onChange={(e) => setData({ ...data, vendor_id: e.target.value })}
                                required
                            >
                                <option value="">Select Vendor...</option>
                                {vendors.map((v: Vendor) => <option key={v.id} value={v.id}>{v.name}</option>)}
                            </select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Select Product</Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={data.product_id}
                                onChange={(e) => setData({ ...data, product_id: e.target.value })}
                                required
                            >
                                <option value="">Select Product...</option>
                                {products.map((p: Product) => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Quantity</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={data.quantity}
                                    onChange={(e) => setData({ ...data, quantity: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Unit Cost (RM)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={data.unit_cost}
                                    onChange={(e) => setData({ ...data, unit_cost: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                            <Button type="submit">Confirm Stock In</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
