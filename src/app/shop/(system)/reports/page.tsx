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
        const toMalaysiaDate = (dateStr: string) => {
            return new Date(dateStr).toLocaleDateString('en-CA', { timeZone: 'Asia/Kuala_Lumpur' }); // YYYY-MM-DD in MY
        };

        const now = new Date();
        const todayMY = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kuala_Lumpur' });
        const currentMonthMY = now.toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', timeZone: 'Asia/Kuala_Lumpur' }).slice(0, 7); // YYYY-MM
        const currentYearMY = now.toLocaleDateString('en-CA', { year: 'numeric', timeZone: 'Asia/Kuala_Lumpur' }); // YYYY

        let todayTotal = 0;
        let monthTotal = 0;
        let yearTotal = 0;

        salesData.forEach(sale => {
            const saleDateMY = toMalaysiaDate(sale.created_at); // YYYY-MM-DD
            const saleMonthMY = saleDateMY.slice(0, 7); // YYYY-MM
            const saleYearMY = saleDateMY.slice(0, 4); // YYYY
            const amount = Number(sale.total_amount);

            if (saleYearMY === currentYearMY) {
                yearTotal += amount;
                if (saleMonthMY === currentMonthMY) {
                    monthTotal += amount;
                    if (saleDateMY === todayMY) {
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

    const formatMYCurrency = (amount: number) => {
        return `RM ${amount.toFixed(2)}`;
    };

    const formatMYDateTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('en-MY', {
            timeZone: 'Asia/Kuala_Lumpur',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    return (
        <div className="p-8 space-y-8">
            <h1 className="text-3xl font-bold tracking-tight">Sales Reports</h1>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
                        <span className="text-gray-500 font-bold text-xs">
                            {new Date().toLocaleDateString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' })}
                        </span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatMYCurrency(stats.today)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">This Month</CardTitle>
                        <span className="text-gray-500 font-bold text-xs">{new Date().toLocaleString('en-MY', { month: 'long', timeZone: 'Asia/Kuala_Lumpur' })}</span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatMYCurrency(stats.month)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">This Year</CardTitle>
                        <span className="text-gray-500 font-bold text-xs">{new Date().getFullYear()}</span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatMYCurrency(stats.year)}</div>
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
                                                {formatMYDateTime(sale.created_at)}
                                            </p>
                                        </div>
                                        <div className="font-bold">
                                            {formatMYCurrency(sale.total_amount)}
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
