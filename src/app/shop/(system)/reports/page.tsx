'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useSearchParams } from 'next/navigation';

interface Sale {
    id: string;
    total_amount: number;
    created_at: string;
}

export default function ReportsPage() {
    const searchParams = useSearchParams();
    const shopId = searchParams.get('shopId');

    const [sales, setSales] = useState<Sale[]>([]);
    const [purchases, setPurchases] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [dateRange, setDateRange] = useState({
        start: new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0') + '-01',
        end: new Date().toISOString().split('T')[0]
    });

    const [stats, setStats] = useState({
        revenue: 0,
        cost: 0,
        profit: 0,
        count: 0
    });

    useEffect(() => {
        fetchAllData();
    }, [shopId]);

    useEffect(() => {
        calculateStats();
    }, [sales, purchases, dateRange]);

    const fetchAllData = async () => {
        setIsLoading(true);

        // Parallel Fetch: Sales & Purchases
        let salesQuery = supabase.from('sales').select('id, total_amount, created_at').order('created_at', { ascending: false });
        let purchasesQuery = supabase.from('purchases').select('id, total_cost, created_at');

        if (shopId) {
            salesQuery = salesQuery.eq('shop_id', shopId);
            purchasesQuery = purchasesQuery.eq('shop_id', shopId);
        }

        const [salesRes, purchasesRes] = await Promise.all([
            salesQuery,
            purchasesQuery
        ]);

        if (salesRes.error || purchasesRes.error) {
            console.error(salesRes.error, purchasesRes.error);
            toast.error('Failed to load data');
        } else {
            setSales(salesRes.data || []);
            setPurchases(purchasesRes.data || []);
            // Stats calculation triggered by useEffect
        }
        setIsLoading(false);
    };

    const calculateStats = () => {
        const start = dateRange.start ? new Date(dateRange.start + 'T00:00:00') : new Date('1970-01-01');
        const end = dateRange.end ? new Date(dateRange.end + 'T23:59:59') : new Date('2100-01-01');

        let revenue = 0;
        let cost = 0;
        let count = 0;

        // Filter Sales
        const filteredSales = sales.filter(s => {
            const d = new Date(s.created_at);
            return d >= start && d <= end;
        });

        filteredSales.forEach(s => {
            revenue += Number(s.total_amount);
        });
        count = filteredSales.length;

        // Filter Purchases
        purchases.filter(p => {
            const d = new Date(p.created_at);
            return d >= start && d <= end;
        }).forEach(p => {
            cost += Number(p.total_cost);
        });

        setStats({
            revenue,
            cost,
            profit: revenue - cost,
            count
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
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <h1 className="text-3xl font-bold tracking-tight">Sales & Profit Reports</h1>

                {/* Date Filter */}
                <div className="flex gap-2 items-center bg-card p-2 rounded-lg border shadow-sm">
                    <div className="grid gap-1">
                        <Label className="text-xs">Start Date</Label>
                        <Input
                            type="date"
                            className="h-8 w-[140px]"
                            value={dateRange.start}
                            onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
                        />
                    </div>
                    <div className="grid gap-1">
                        <Label className="text-xs">End Date</Label>
                        <Input
                            type="date"
                            className="h-8 w-[140px]"
                            value={dateRange.end}
                            onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-primary">Net Profit</CardTitle>
                        <span className="text-primary/70 font-bold text-xs">
                            (Revenue - Cost)
                        </span>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${stats.profit >= 0 ? 'text-primary' : 'text-red-600'}`}>
                            {formatMYCurrency(stats.profit)}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{formatMYCurrency(stats.revenue)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{formatMYCurrency(stats.cost)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Transactions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.count}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Transactions in Period</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="text-sm text-muted-foreground">Loading...</div>
                        ) : stats.count === 0 ? (
                            <div className="text-sm text-muted-foreground">No sales in selected period.</div>
                        ) : (
                            <div className="space-y-4">
                                {sales
                                    .filter(s => {
                                        const d = new Date(s.created_at);
                                        const start = dateRange.start ? new Date(dateRange.start + 'T00:00:00') : new Date('1970-01-01');
                                        const end = dateRange.end ? new Date(dateRange.end + 'T23:59:59') : new Date('2100-01-01');
                                        return d >= start && d <= end;
                                    })
                                    .slice(0, 50) // Limit to 50 for UI performance
                                    .map(sale => (
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
