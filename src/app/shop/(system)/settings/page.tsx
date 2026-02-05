'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import { Printer, Save, AlertTriangle, User } from 'lucide-react';

export default function SettingsPage() {
    const searchParams = useSearchParams();
    const shopId = searchParams.get('shopId');
    const router = useRouter();

    // Shop Profile State
    const [shopData, setShopData] = useState({
        name: '',
        address: '',
        phone: ''
    });
    const [isLoadingProfile, setIsLoadingProfile] = useState(false);

    // User Profile State
    const [userProfile, setUserProfile] = useState({
        fullName: '',
        role: ''
    });
    const [isLoadingUser, setIsLoadingUser] = useState(false);

    // Report State
    const [report, setReport] = useState({
        totalSales: 0,
        totalPurchases: 0,
        netProfit: 0,
        transactionCount: 0
    });
    const [dateRange, setDateRange] = useState({
        start: new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0') + '-01', // Default to 1st of current month
        end: new Date().toISOString().split('T')[0] // Default to today
    });
    const [isLoadingReport, setIsLoadingReport] = useState(true);
    const [reportError, setReportError] = useState<string | null>(null);

    // Delete State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [confirmText, setConfirmText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (shopId) {
            fetchShopDetails();
            fetchReportData();
            fetchUserProfile();
        }
    }, [shopId, dateRange]);

    const fetchShopDetails = async () => {
        if (!shopId) return;
        setIsLoadingProfile(true);
        const { data, error } = await supabase.from('shops').select('name, address, phone').eq('id', shopId).single();
        if (error) {
            console.error('Error fetching shop:', error);
            toast.error('Failed to load shop details');
        } else if (data) {
            setShopData({
                name: data.name || '',
                address: data.address || '',
                phone: data.phone || ''
            });
        }
        setIsLoadingProfile(false);
    };

    const fetchUserProfile = async () => {
        setIsLoadingUser(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('full_name, role')
                .eq('id', user.id)
                .single();
            if (profile) {
                setUserProfile({
                    fullName: profile.full_name || '',
                    role: profile.role || 'staff'
                });
            }
        }
        setIsLoadingUser(false);
    };

    const fetchReportData = async () => {
        if (!shopId) return;
        setIsLoadingReport(true);
        setReportError(null);

        try {
            // Build queries
            let salesQuery = supabase
                .from('sales')
                .select('total_amount')
                .eq('shop_id', shopId);

            let purchasesQuery = supabase
                .from('purchases')
                .select('total_cost')
                .eq('shop_id', shopId);

            // Apply Date Filter
            if (dateRange.start) {
                const startDate = `${dateRange.start}T00:00:00`;
                salesQuery = salesQuery.gte('created_at', startDate);
                purchasesQuery = purchasesQuery.gte('created_at', startDate); // purchases uses created_at ? Yes, confirmed in schema
            }
            if (dateRange.end) {
                const endDate = `${dateRange.end}T23:59:59`;
                salesQuery = salesQuery.lte('created_at', endDate);
                purchasesQuery = purchasesQuery.lte('created_at', endDate);
            }

            // Execute in parallel
            const [salesRes, purchasesRes] = await Promise.all([salesQuery, purchasesQuery]);

            if (salesRes.error) throw salesRes.error;
            if (purchasesRes.error) throw purchasesRes.error;

            const sales = salesRes.data || [];
            const purchases = purchasesRes.data || [];

            const totalSales = sales.reduce((sum, s) => sum + Number(s.total_amount), 0);
            const totalPurchases = purchases.reduce((sum, p) => sum + Number(p.total_cost), 0);

            setReport({
                totalSales,
                totalPurchases,
                netProfit: totalSales - totalPurchases,
                transactionCount: sales.length
            });

        } catch (error: any) {
            console.error('Report Fetch Error:', error);
            setReportError(error.message || "Failed to load report.");
        } finally {
            setIsLoadingReport(false);
        }
    };

    const handleUpdateProfile = async () => {
        if (!shopId) return;
        setIsLoadingProfile(true);
        const { error } = await supabase.from('shops').update(shopData).eq('id', shopId);
        if (error) {
            toast.error('Failed to update profile');
            console.error(error);
        } else {
            toast.success('Shop profile updated');
        }
        setIsLoadingProfile(false);
    };

    const handleUpdateUser = async () => {
        setIsLoadingUser(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { error } = await supabase
                .from('user_profiles')
                .update({ full_name: userProfile.fullName })
                .eq('id', user.id);

            if (error) {
                toast.error('Failed to update user profile');
            } else {
                toast.success('User profile updated');
                // Force a reload to update the header
                window.location.reload();
            }
        }
        setIsLoadingUser(false);
    };

    const handleDeleteData = async () => {
        if (confirmText !== 'DELETE') {
            toast.error("Please type DELETE to confirm");
            return;
        }
        if (!shopId) return;

        setIsDeleting(true);
        try {
            const { error } = await supabase.rpc('reset_shop_data', { p_shop_id: shopId });
            if (error) throw error;

            toast.success("Shop data has been reset successfully.");
            setIsDeleteModalOpen(false);
            setConfirmText("");
            fetchReportData(); // Refresh report to show zeros
        } catch (error: any) {
            console.error(error);
            toast.error(`Reset failed: ${error.message}`);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="p-8 space-y-8 print:p-0 print:space-y-4">
            <div className="flex justify-between items-center print:hidden">
                <h1 className="text-3xl font-bold tracking-tight">Shop Settings</h1>
            </div>

            <div className="grid gap-6 md:grid-cols-2">

                {/* 0. User Settings (New) */}
                <Card className="print:hidden">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            User Settings
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label>Display Name (Shop ID)</Label>
                            <Input
                                value={userProfile.fullName}
                                onChange={(e) => setUserProfile({ ...userProfile, fullName: e.target.value })}
                                placeholder="Your Name or ID"
                            />
                            <p className="text-xs text-muted-foreground">This name will be displayed in the header.</p>
                        </div>
                        <div className="grid gap-2">
                            <Label>Role</Label>
                            <Input
                                value={userProfile.role}
                                disabled
                                className="bg-muted"
                            />
                        </div>
                        <Button onClick={handleUpdateUser} disabled={isLoadingUser} className="w-full">
                            <Save className="mr-2 h-4 w-4" />
                            {isLoadingUser ? 'Saving...' : 'Save User Profile'}
                        </Button>
                    </CardContent>
                </Card>

                {/* 1. Shop Profile Settings */}
                <Card className="print:hidden">
                    <CardHeader>
                        <CardTitle>Shop Profile</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label>Shop Name</Label>
                            <Input
                                value={shopData.name}
                                onChange={(e) => setShopData({ ...shopData, name: e.target.value })}
                                placeholder="My Chicken Shop"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Address</Label>
                            <Input
                                value={shopData.address}
                                onChange={(e) => setShopData({ ...shopData, address: e.target.value })}
                                placeholder="123 Jalan Ayam"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Phone</Label>
                            <Input
                                value={shopData.phone}
                                onChange={(e) => setShopData({ ...shopData, phone: e.target.value })}
                                placeholder="+60 12-345 6789"
                            />
                        </div>
                        <Button onClick={handleUpdateProfile} disabled={isLoadingProfile} className="w-full">
                            <Save className="mr-2 h-4 w-4" />
                            {isLoadingProfile ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </CardContent>
                </Card>

                {/* 2. Profit & Loss Report */}
                <Card className="print:border-none print:shadow-none">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle>Profit & Loss Statement</CardTitle>
                        <Button variant="outline" size="icon" onClick={() => window.print()} className="print:hidden" title="Print Report">
                            <Printer className="h-4 w-4" />
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Date Selection (Screen Only) */}
                        <div className="flex gap-4 items-end print:hidden bg-muted/20 p-4 rounded-md">
                            <div className="grid gap-2 flex-1">
                                <Label>Start Date</Label>
                                <Input
                                    type="date"
                                    value={dateRange.start}
                                    onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2 flex-1">
                                <Label>End Date</Label>
                                <Input
                                    type="date"
                                    value={dateRange.end}
                                    onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Print Header */}
                        <div className="print:block hidden mb-4">
                            <h2 className="text-2xl font-bold">{shopData.name}</h2>
                            <p className="text-sm text-muted-foreground">{shopData.address}</p>
                            <p className="text-sm text-muted-foreground">{shopData.phone}</p>
                            <div className="border-b my-2" />
                            <p className="text-sm font-bold">Report Period: {dateRange.start || 'All'} to {dateRange.end || 'Now'}</p>
                            <p className="text-xs text-muted-foreground">Generated on: {new Date().toLocaleString()}</p>
                        </div>

                        {isLoadingReport ? (
                            <div className="text-center py-4">Loading report...</div>
                        ) : reportError ? (
                            <div className="text-center py-4 text-destructive font-medium border border-destructive/20 bg-destructive/5 rounded-md p-4">
                                <p>{reportError}</p>
                                <p className="text-xs text-muted-foreground mt-1">Check console for details.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg print:bg-transparent print:border-b print:rounded-none">
                                    <span className="font-medium">Total Revenue (Sales)</span>
                                    <span className="text-green-600 font-bold text-lg">{formatCurrency(report.totalSales)}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg print:bg-transparent print:border-b print:rounded-none">
                                    <span className="font-medium">Total Cost (Purchases)</span>
                                    <span className="text-red-600 font-bold text-lg">({formatCurrency(report.totalPurchases)})</span>
                                </div>
                                <div className="flex justify-between items-center p-4 bg-primary/5 border border-primary/20 rounded-lg print:bg-transparent print:border-t-2 print:border-black print:rounded-none">
                                    <span className="font-bold text-lg">Net Profit</span>
                                    <span className={`font-bold text-2xl ${report.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {formatCurrency(report.netProfit)}
                                    </span>
                                </div>
                                <div className="text-xs text-muted-foreground text-center pt-2">
                                    Based on {report.transactionCount} sales transactions.
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* 3. Danger Zone (Delete Data) */}
                <Card className="md:col-span-2 border-destructive/50 print:hidden">
                    <CardHeader>
                        <CardTitle className="text-destructive flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            Danger Zone
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-md bg-destructive/5">
                            <div>
                                <h4 className="font-bold text-destructive">Delete All Shop Data</h4>
                                <p className="text-sm text-muted-foreground max-w-xl">
                                    Permanently delete ALL sales, inventory history, and transaction logs.
                                    Products and Shop Profile are preserved.
                                </p>
                            </div>
                            <Button variant="destructive" onClick={() => setIsDeleteModalOpen(true)}>
                                Delete Data
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 print:hidden">
                    <Card className="w-full max-w-md bg-background shadow-lg border-destructive">
                        <CardHeader>
                            <CardTitle className="text-destructive">Confirm Data Deletion</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm">
                                To confirm, please type <span className="font-bold select-all">DELETE</span> in the box below.
                            </p>
                            <Input
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                                placeholder="Type DELETE"
                                className="border-destructive/50 focus-visible:ring-destructive"
                            />
                            <div className="flex justify-end gap-2 pt-2">
                                <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
                                <Button
                                    variant="destructive"
                                    disabled={confirmText !== 'DELETE' || isDeleting}
                                    onClick={handleDeleteData}
                                >
                                    {isDeleting ? "Deleting..." : "Confirm Delete"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
