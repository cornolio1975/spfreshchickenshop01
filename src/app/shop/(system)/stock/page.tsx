'use client';

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from '@/lib/supabase';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, Pencil } from "lucide-react";
import { toast } from 'sonner';
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
    price: number;
    stock: number;
    unit_type: string;
}

export default function StockPage() {
    const params = useParams();
    const [search, setSearch] = useState("");
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Edit Form State
    const [editData, setEditData] = useState({
        product_id: '',
        new_stock: ''
    });

    const fetchProducts = async () => {
        setIsLoading(true);
        let query = supabase.from('products').select('*').order('name');

        if (search) {
            query = query.ilike('name', `%${search}%`);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching products:', error);
            toast.error('Failed to load stock');
        } else {
            setProducts(data || []);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchProducts();
    }, [search]);

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
            fetchProducts();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Failed to update stock');
        }
    };

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Stock Management (Shop)</h1>
            </div>

            <div className="flex items-center space-x-4">
                <Input
                    placeholder="Search stock..."
                    className="max-w-sm"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Current Inventory</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead className="text-right">In Stock</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {products.map(product => (
                                    <TableRow key={product.id}>
                                        <TableCell className="font-medium">{product.name}</TableCell>
                                        <TableCell>{product.category}</TableCell>
                                        <TableCell>${product.base_price?.toFixed(2) || 0.00}</TableCell>
                                        <TableCell className="text-right font-bold text-lg">
                                            {Number(product.stock || 0).toFixed(2)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => openEditModal(product)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {products.length === 0 && !isLoading && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            No products found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

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
