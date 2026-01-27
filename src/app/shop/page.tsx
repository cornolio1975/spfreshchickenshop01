export const dynamic = "force-static";

'use client';

import Link from 'next/link';
import { Store, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Mock shops for selection - in real app, fetch from Supabase
const shops = [
    { id: '1', name: 'Main Street Chicken', location: '123 Main St' },
    { id: '2', name: 'Westside Market', location: '456 West Ave' },
    { id: '3', name: 'Downtown Branch', location: '789 Center Blvd' },
];

export default function ShopSelectPage() {
    return (
        <div className="container max-w-4xl py-10 space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Select Shop</h1>
                <p className="text-muted-foreground">Choose a location to open the Point of Sale (POS) system.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {shops.map((shop) => (
                    <Card key={shop.id} className="hover:border-primary/50 transition-colors">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Store className="h-5 w-5 text-primary" />
                                {shop.name}
                            </CardTitle>
                            <CardDescription>{shop.location}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Link
                                href={`/shop/pos?shopId=${shop.id}`}
                                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-600 disabled:pointer-events-none disabled:opacity-50 bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm h-9 px-4 py-2 w-full"
                            >
                                Open POS <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="border-t border-border pt-6 mt-6">
                <Link href="/" className="text-sm text-muted-foreground hover:text-primary">
                    ← Back to Dashboard
                </Link>
            </div>
        </div>
    );
}
