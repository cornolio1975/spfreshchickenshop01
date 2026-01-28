'use client';

export const dynamic = "force-static";

import Link from 'next/link';
import { Store, ArrowRight, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface Shop {
    id: string;
    name: string;
    address: string;
    status: string;
}

export default function ShopSelectPage() {
    const [shops, setShops] = useState<Shop[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchShops = async () => {
            try {
                const { data, error } = await supabase
                    .from('shops')
                    .select('*')
                    .eq('status', 'Active')
                    .order('name');

                if (error) throw error;
                setShops(data || []);
            } catch (error) {
                console.error('Error fetching shops:', error);
                toast.error('Failed to load shops');
            } finally {
                setIsLoading(false);
            }
        };

        fetchShops();
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container max-w-4xl py-10 space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Select Shop</h1>
                <p className="text-muted-foreground">Choose a location to open the Point of Sale (POS) system.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {shops.length === 0 ? (
                    <div className="col-span-full text-center py-10 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                        No active shops found. Please add a shop in the Dashboard.
                    </div>
                ) : (
                    shops.map((shop) => (
                        <Card key={shop.id} className="hover:border-primary/50 transition-colors">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Store className="h-5 w-5 text-primary" />
                                    {shop.name}
                                </CardTitle>
                                <CardDescription>{shop.address}</CardDescription>
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
                    ))
                )}
            </div>

            <div className="border-t border-border pt-6 mt-6">
                <Link href="/" className="text-sm text-muted-foreground hover:text-primary">
                    ← Back to Dashboard
                </Link>
            </div>
        </div>
    );
}

