'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface Sale {
    id: string;
    total_amount: number;
    created_at: string;
}

export default function ReportsPage() {
    const [sales, setSales] = useState<Sale[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [stats, setStats] = useState({
        today: 0,
        month: 0,
        year: 0,
        totalTransactions: 0
    });

    useEffect(() => {
        fetchSales();
    }, []);

    const fetchSales = async () => {
        setIsLoading(true);
        // Fetch all sales order by date desc. 
        // optimize: For production, we would filter by date range in query or use a materialized view.
        // For this scale, client side calc is fine.
        const { data, error } = await supabase
            .from('sales')
            .select('id, total_amount, created_at')
            .order('created_at', { ascending: false });

        if (error) {
            console.error(error);
            toast.error('Failed to load sales data');
        } else {
            setSales(data || []);
            calculateStats(data || []);
        }
        setIsLoading(false);
    };

    const calculateStats = (salesData: Sale[]) => {
        const now = new Date();
        const todayStr = now.toISOString().slice(0, 10); // YYYY-MM-DD
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        let todayTotal = 0;
        let monthTotal = 0;
        let yearTotal = 0;

        salesData.forEach(sale => {
            const saleDate = new Date(sale.created_at);
            const amount = Number(sale.total_amount);

            // Year
            if (saleDate.getFullYear() === currentYear) {
                yearTotal += amount;

                // Month
                if (saleDate.getMonth() === currentMonth) {
                    monthTotal += amount;

                    // Today - Check YYYY-MM-DD match
                    if (sale.created_at.startsWith(todayStr)) {
                        todayTotal += amount;
                    }
                }
            }
        });

        setStats({
            today: todayTotal,
            month: monthTotal,
            year: yearTotal,
            totalTransactions: salesData.length
        });
    };

    return (
        <div className="p-8 space-y-8">
            <h1 className="text-3xl font-bold tracking-tight">Sales Reports</h1>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
                        <span className="text-gray-500 font-bold text-xs">{new Date().toLocaleDateString()}</span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${stats.today.toFixed(2)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">This Month</CardTitle>
                        <span className="text-gray-500 font-bold text-xs">{new Date().toLocaleString('default', { month: 'long' })}</span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${stats.month.toFixed(2)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">This Year</CardTitle>
                        <span className="text-gray-500 font-bold text-xs">{new Date().getFullYear()}</span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${stats.year.toFixed(2)}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Transactions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="text-sm text-muted-foreground">Loading...</div>
                        ) : sales.length === 0 ? (
                            <div className="text-sm text-muted-foreground">No sales recorded yet.</div>
                        ) : (
                            <div className="space-y-4">
                                {sales.slice(0, 5).map(sale => (
                                    <div key={sale.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium leading-none">Order #{sale.id.slice(0, 8)}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(sale.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="font-bold">
                                            ${sale.total_amount.toFixed(2)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
