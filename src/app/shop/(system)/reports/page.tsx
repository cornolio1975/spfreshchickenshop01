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
        todayCost: 0,
        monthCost: 0,
        yearCost: 0,
        totalTransactions: 0
    });

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setIsLoading(true);

        // Parallel Fetch: Sales & Purchases
        const [salesRes, purchasesRes] = await Promise.all([
            supabase.from('sales').select('id, total_amount, created_at').order('created_at', { ascending: false }),
            supabase.from('purchases').select('id, total_cost, created_at') // created_at or purchase_date? Using created_at for now to match sales logic
        ]);

        if (salesRes.error || purchasesRes.error) {
            console.error(salesRes.error, purchasesRes.error);
            toast.error('Failed to load data');
        } else {
            setSales(salesRes.data || []);
            calculateStats(salesRes.data || [], purchasesRes.data || []);
        }
        setIsLoading(false);
    };

    const calculateStats = (salesData: Sale[], purchaseData: any[]) => {
        const toMalaysiaDate = (dateStr: string) => {
            return new Date(dateStr).toLocaleDateString('en-CA', { timeZone: 'Asia/Kuala_Lumpur' }); // YYYY-MM-DD
        };

        const now = new Date();
        const todayMY = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kuala_Lumpur' });
        const currentMonthMY = now.toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', timeZone: 'Asia/Kuala_Lumpur' }).slice(0, 7); // YYYY-MM
        const currentYearMY = now.toLocaleDateString('en-CA', { year: 'numeric', timeZone: 'Asia/Kuala_Lumpur' }); // YYYY

        let todayTotal = 0;
        let monthTotal = 0;
        let yearTotal = 0;

        // Sales Aggregation
        salesData.forEach(sale => {
            const saleDateMY = toMalaysiaDate(sale.created_at);
            const saleMonthMY = saleDateMY.slice(0, 7);
            const saleYearMY = saleDateMY.slice(0, 4);
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

        // Purchases Aggregation
        let todayCost = 0;
        let monthCost = 0;
        let yearCost = 0;

        purchaseData.forEach(p => {
            const pDateMY = toMalaysiaDate(p.created_at);
            const pMonthMY = pDateMY.slice(0, 7);
            const pYearMY = pDateMY.slice(0, 4);
            const cost = Number(p.total_cost);

            if (pYearMY === currentYearMY) {
                yearCost += cost;
                if (pMonthMY === currentMonthMY) {
                    monthCost += cost;
                    if (pDateMY === todayMY) {
                        todayCost += cost;
                    }
                }
            }
        })

        setStats({
            today: todayTotal,
            month: monthTotal,
            year: yearTotal,
            todayCost,
            monthCost,
            yearCost,
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
            <h1 className="text-3xl font-bold tracking-tight">Sales & Profit Reports</h1>

            {/* Daily Net Profit Highlight */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-primary">Today's Net Profit</CardTitle>
                        <span className="text-primary/70 font-bold text-xs">
                            (Sales - Purchases)
                        </span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">
                            {formatMYCurrency(stats.today - stats.todayCost)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Revenue: {formatMYCurrency(stats.today)} <br />
                            Cost: {formatMYCurrency(stats.todayCost)}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatMYCurrency(stats.today)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatMYCurrency(stats.month)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Net: {formatMYCurrency(stats.month - stats.monthCost)}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Yearly Revenue</CardTitle>
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
