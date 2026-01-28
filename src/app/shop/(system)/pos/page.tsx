'use client';

import { useState } from 'react';
import { Search, ShoppingCart, Trash2, Plus, Minus, Printer, Home } from 'lucide-react';
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
}

export default function POSPage() {
    // Allow quantity to be string for input handling (e.g. "1.")
    const [cart, setCart] = useState<{ product: Product, quantity: number | string }[]>([]);
    const [search, setSearch] = useState('');
    const [products, setProducts] = useState<Product[]>([]);
    const [isCheckingOut, setIsCheckingOut] = useState(false);
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
        };
        fetchProducts();
    }, [search]);

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
            // 1. Create Sale Record
            const { data: saleData, error: saleError } = await supabase
                .from('sales')
                .insert([
                    {
                        total_amount: total,
                        payment_method: 'cash', // Default to cash for now
                        status: 'completed'
                    }
                ])
                .select()
                .single();

            if (saleError) throw saleError;
            if (!saleData) throw new Error('Failed to create sale record');

            // 2. Create Sale Items
            const itemsToInsert = cart.map(item => ({
                sale_id: saleData.id,
                product_id: item.product.id,
                product_name: item.product.name,
                quantity: Number(item.quantity) || 0,
                unit_price: item.product.base_price,
                total_price: item.product.base_price * (Number(item.quantity) || 0)
            }));

            const { error: itemsError } = await supabase
                .from('sale_items')
                .insert(itemsToInsert);

            if (itemsError) throw itemsError;

            toast.success(`Sale recorded! ID: ${saleData.id.slice(0, 8)}`);
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

    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="flex h-[calc(100vh-120px)] gap-4 flex-col md:flex-row">
            {/* Left: Product Table */}
            <div className="flex-1 flex flex-col border border-border bg-card rounded-sm overflow-hidden print:hidden">
                <div className="p-4 border-b border-border flex gap-2 items-center">
                    <Button variant="outline" size="icon" onClick={() => window.location.href = '/'} title="Go Home">
                        <Home className="h-4 w-4" />
                    </Button>
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
                                <TableHead className="text-right">Unit Price</TableHead>
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
                                        ${product.base_price.toFixed(2)}
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
                                                    @ ${item.product.base_price.toFixed(2)} / {item.product.unit_type || 'Qty'}
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
                                                ${(item.product.base_price * (Number(item.quantity) || 0)).toFixed(2)}
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
                            <span>${total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Tax (0%):</span>
                            <span>$0.00</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg pt-2 border-t border-border/50">
                            <span>TOTAL DUE:</span>
                            <span>${total.toFixed(2)}</span>
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
        </div>
    );
}
