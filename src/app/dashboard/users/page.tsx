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
const users = [
    { id: '1', name: 'Admin User', email: 'admin@chicken.com', role: 'admin', shop: 'All Shops' },
    { id: '2', name: 'Manager Bob', email: 'bob@chicken.com', role: 'manager', shop: 'Main Street Chicken' },
    { id: '3', name: 'Cashier Alice', email: 'alice@chicken.com', role: 'cashier', shop: 'Main Street Chicken' },
];

export default function UsersPage() {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Users</h1>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add User
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Users</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Assigned Shop</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.name}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${user.role === 'admin'
                                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
                                                : user.role === 'manager'
                                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                                            }`}>
                                            {user.role}
                                        </span>
                                    </TableCell>
                                    <TableCell>{user.shop}</TableCell>
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
