'use client';

import { useState } from 'react';
import { Filter } from 'lucide-react';
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
const inventory = [
    { id: '1', shop: 'Main Street Chicken', product: 'Whole Chicken', quantity: 50, status: 'Good' },
    { id: '2', shop: 'Main Street Chicken', product: 'Chicken Breast (1kg)', quantity: 20, status: 'Low' },
    { id: '3', shop: 'Westside Market', product: 'Whole Chicken', quantity: 100, status: 'Good' },
    { id: '4', shop: 'Westside Market', product: 'Chicken Wings', quantity: 0, status: 'Out of Stock' },
];

export default function InventoryPage() {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
                <Button variant="outline">
                    <Filter className="mr-2 h-4 w-4" />
                    Filter by Shop
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Stock Levels</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Shop</TableHead>
                                <TableHead>Product</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {inventory.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.shop}</TableCell>
                                    <TableCell>{item.product}</TableCell>
                                    <TableCell>{item.quantity}</TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${item.status === 'Good'
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                                : item.status === 'Low'
                                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                                                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                            }`}>
                                            {item.status}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="outline" size="sm">Adjust</Button>
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
