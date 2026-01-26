'use client';

import { useState } from 'react';
import { Plus, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

// Mock data
const products = [
    { id: '1', name: 'Whole Chicken', category: 'Raw', price: 15.00, stock_status: 'In Stock' },
    { id: '2', name: 'Chicken Breast (1kg)', category: 'Parts', price: 18.50, stock_status: 'In Stock' },
    { id: '3', name: 'Chicken Wings (1kg)', category: 'Parts', price: 12.00, stock_status: 'Low Stock' },
    { id: '4', name: 'Spicy Marinade', category: 'Condiments', price: 5.00, stock_status: 'Out of Stock' },
];

export default function ProductsPage() {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Products</h1>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Product
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Global Catalog</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Base Price ($)</TableHead>
                                <TableHead>Global Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {products.map((product) => (
                                <TableRow key={product.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <Package className="h-4 w-4 text-muted-foreground" />
                                            {product.name}
                                        </div>
                                    </TableCell>
                                    <TableCell>{product.category}</TableCell>
                                    <TableCell>{product.price.toFixed(2)}</TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${product.stock_status === 'In Stock'
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                                : product.stock_status === 'Low Stock'
                                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                                                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                            }`}>
                                            {product.stock_status}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm">Edit</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
