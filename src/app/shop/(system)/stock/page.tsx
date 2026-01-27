"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
// @ts-ignore
// import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { supabase } from '@/lib/supabase';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search } from "lucide-react";

export default function StockPage() {
    const params = useParams();
    const shopId = params.shopId as string;
    const [search, setSearch] = useState("");
    const [products, setProducts] = useState<any[]>([]); // Replace 'any' with Product interface if available
    // const supabase = createClientComponentClient();

    useEffect(() => {
        const fetchProducts = async () => {
            // In a real scenario, you'd filter by shopId here too if products were shop-specific
            let query = supabase.from('products').select('*');

            if (search) {
                query = query.ilike('name', `%${search}%`);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching products:', error);
            } else {
                setProducts(data || []);
            }
        };

        fetchProducts();
    }, [search]);

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Stock Management</h1>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add Product
                </Button>
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
                        <div className="relative w-full overflow-auto">
                            <table className="w-full caption-bottom text-sm text-left">
                                <thead className="[&_tr]:border-b">
                                    <tr className="border-b transition-colors hover:bg-gray-100/50 data-[state=selected]:bg-gray-100 dark:hover:bg-zinc-800/50 dark:data-[state=selected]:bg-zinc-800">
                                        <th className="h-12 px-4 align-middle font-medium text-gray-500 dark:text-gray-400">Product</th>
                                        <th className="h-12 px-4 align-middle font-medium text-gray-500 dark:text-gray-400">Category</th>
                                        <th className="h-12 px-4 align-middle font-medium text-gray-500 dark:text-gray-400">Price</th>
                                        <th className="h-12 px-4 align-middle font-medium text-gray-500 dark:text-gray-400 text-right">In Stock</th>
                                        <th className="h-12 px-4 align-middle font-medium text-gray-500 dark:text-gray-400 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="[&_tr:last-child]:border-0">
                                    {products.map(product => (
                                        <tr key={product.id} className="border-b transition-colors hover:bg-gray-100/50 dark:hover:bg-zinc-800/50">
                                            <td className="p-4 align-middle font-medium">{product.name}</td>
                                            <td className="p-4 align-middle">{product.category}</td>
                                            <td className="p-4 align-middle">${product.base_price?.toFixed(2) || product.price?.toFixed(2)}</td>
                                            <td className="p-4 align-middle text-right">
                                                {/* Mock stock for now - in real app fetch from inventory table */}
                                                {Math.floor(Math.random() * 50)}
                                            </td>
                                            <td className="p-4 align-middle text-right">
                                                <Button variant="ghost" size="sm">Edit</Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
