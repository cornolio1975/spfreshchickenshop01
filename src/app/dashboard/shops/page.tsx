'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
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

// Mock data for now
const shops = [
    { id: '1', name: 'Main Street Chicken', address: '123 Main St', phone: '555-0101', status: 'Active' },
    { id: '2', name: 'Westside Market', address: '456 West Ave', phone: '555-0102', status: 'Active' },
    { id: '3', name: 'Downtown Branch', address: '789 Center Blvd', phone: '555-0103', status: 'Maintenance' },
];

export default function ShopsPage() {
    const [searchTerm, setSearchTerm] = useState('');

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Shops</h1>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Shop
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Shops</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Address</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {shops.map((shop) => (
                                <TableRow key={shop.id}>
                                    <TableCell className="font-medium">{shop.name}</TableCell>
                                    <TableCell>{shop.address}</TableCell>
                                    <TableCell>{shop.phone}</TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${shop.status === 'Active'
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                                            }`}>
                                            {shop.status}
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
