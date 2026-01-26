'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
    { name: 'Mon', revenue: 4000 },
    { name: 'Tue', revenue: 3000 },
    { name: 'Wed', revenue: 2000 },
    { name: 'Thu', revenue: 2780 },
    { name: 'Fri', revenue: 1890 },
    { name: 'Sat', revenue: 2390 },
    { name: 'Sun', revenue: 3490 },
];

const transactions = [
    { id: '1', shop: 'Main St', amount: 45.00, time: '10:30 AM', status: 'Completed' },
    { id: '2', shop: 'Westside', amount: 12.50, time: '10:35 AM', status: 'Completed' },
    { id: '3', shop: 'Main St', amount: 78.00, time: '10:45 AM', status: 'Completed' },
    { id: '4', shop: 'Main St', amount: 110.00, time: '11:00 AM', status: 'Completed' },
    { id: '5', shop: 'Downtown', amount: 33.00, time: '11:15 AM', status: 'Refunded' },
];

export default function ReportsPage() {
    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold tracking-tight">Reports & Analytics</h1>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Weekly Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
                                        itemStyle={{ color: 'var(--foreground)' }}
                                    />
                                    <Bar dataKey="revenue" fill="currentColor" className="fill-primary" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Sales by Shop</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                            Pie Chart Placeholder
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Transaction ID</TableHead>
                                <TableHead>Shop</TableHead>
                                <TableHead>Time</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.map((tx) => (
                                <TableRow key={tx.id}>
                                    <TableCell className="font-medium">#{tx.id}</TableCell>
                                    <TableCell>{tx.shop}</TableCell>
                                    <TableCell>{tx.time}</TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tx.status === 'Completed'
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                            }`}>
                                            {tx.status}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">${tx.amount.toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
