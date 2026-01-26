"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ReportsPage() {
    return (
        <div className="p-8 space-y-8">
            <h1 className="text-3xl font-bold tracking-tight">Reports</h1>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <span className="text-gray-500">$</span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$45,231.89</div>
                        <p className="text-xs text-gray-500">+20.1% from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Sales</CardTitle>
                        <span className="text-gray-500">+</span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+2350</div>
                        <p className="text-xs text-gray-500">+180.1% from last month</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Sales</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-500">
                            Recent transactions will appear here.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
