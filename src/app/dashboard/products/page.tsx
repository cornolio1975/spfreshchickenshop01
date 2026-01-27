'use client';

import { useState, useEffect } from 'react';
import { Plus, Package, X, Pencil, Trash2 } from 'lucide-react';
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
    category: string;
    base_price: number; // Note: DB column is base_price based on POS page
    stock_status: string;
    unit_type: 'Kg' | 'Qty';
}

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        base_price: '',
        stock_status: 'In Stock',
        unit_type: 'Qty'
    });

    const fetchProducts = async () => {
        setIsLoading(true);
        const { data, error } = await supabase.from('products').select('*').order('name');
        if (error) {
            toast.error('Failed to load products');
            console.error(error);
        } else {
            setProducts(data || []);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleOpenModal = (product?: Product) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                name: product.name,
                category: product.category || '',
                base_price: product.base_price.toString(),
                stock_status: product.stock_status || 'In Stock',
                unit_type: product.unit_type || 'Qty'
            });
        } else {
            setEditingProduct(null);
            setFormData({
                name: '',
                category: '',
                base_price: '',
                stock_status: 'In Stock',
                unit_type: 'Qty'
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const price = parseFloat(formData.base_price);
        if (isNaN(price)) {
            toast.error('Invalid price');
            return;
        }

        const payload = {
            name: formData.name,
            category: formData.category,
            base_price: price, // Ensure this matches DB column (base_price vs price)
            stock_status: formData.stock_status,
            unit_type: formData.unit_type
        };

        try {
            if (editingProduct) {
                const { error } = await supabase
                    .from('products')
                    .update(payload)
                    .eq('id', editingProduct.id);
                if (error) throw error;
                toast.success('Product updated');
            } else {
                const { error } = await supabase
                    .from('products')
                    .insert([payload]);
                if (error) throw error;
                toast.success('Product created');
            }
            setIsModalOpen(false);
            fetchProducts();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this product?')) return;

        try {
            const { error } = await supabase.from('products').delete().eq('id', id);
            if (error) throw error;
            toast.success('Product deleted');
            fetchProducts();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Products</h1>
                <Button onClick={() => handleOpenModal()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Product
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Global Catalog</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="relative w-full overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Unit</TableHead>
                                    <TableHead>Base Price ($)</TableHead>
                                    <TableHead>Global Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {products.length === 0 && !isLoading && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            No products found. Add one to get started.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {products.map((product) => (
                                    <TableRow key={product.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <Package className="h-4 w-4 text-muted-foreground" />
                                                {product.name}
                                            </div>
                                        </TableCell>
                                        <TableCell>{product.category}</TableCell>
                                        <TableCell>{product.unit_type || 'Qty'}</TableCell>
                                        <TableCell>{product.base_price?.toFixed(2)}</TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${product.stock_status === 'In Stock'
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                                : product.stock_status === 'Low Stock'
                                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                                                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                                }`}>
                                                {product.stock_status || 'In Stock'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleOpenModal(product)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(product.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Simple Modal Overlay */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-lg bg-background shadow-lg animate-in fade-in zoom-in duration-200">
                        <CardHeader className="flex flex-row items-center justify-between border-b px-6 py-4">
                            <CardTitle>{editingProduct ? 'Edit Product' : 'Add Product'}</CardTitle>
                            <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent className="p-6">
                            <form onSubmit={handleSave} className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Name</Label>
                                    <Input
                                        id="name"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Chicken Breast"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="category">Category</Label>
                                        <Input
                                            id="category"
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            placeholder="Raw, Parts"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="unit_type">Unit Type</Label>
                                        <select
                                            id="unit_type"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            value={formData.unit_type}
                                            onChange={(e) => setFormData({ ...formData, unit_type: e.target.value })}
                                        >
                                            <option value="Qty">Qty (Pcs)</option>
                                            <option value="Kg">Weight (Kg)</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="price">Base Price ({formData.unit_type === 'Kg' ? 'per Kg' : 'per Item'})</Label>
                                    <Input
                                        id="price"
                                        type="number"
                                        step="0.01"
                                        required
                                        value={formData.base_price}
                                        onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="status">Global Stock Status</Label>
                                    <select
                                        id="status"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={formData.stock_status}
                                        onChange={(e) => setFormData({ ...formData, stock_status: e.target.value })}
                                    >
                                        <option value="In Stock">In Stock</option>
                                        <option value="Low Stock">Low Stock</option>
                                        <option value="Out of Stock">Out of Stock</option>
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
        </div>
    );
}
