'use client';

import * as React from 'react';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Store, Users, FileBarChart, LogOut, Menu, Package, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
// @ts-ignore
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const sidebarItems = [
    { href: '/', label: 'Home / Landing', icon: Store },
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/dashboard/shops', label: 'Shops Management', icon: Store },
    { href: '/dashboard/products', label: 'Global Products', icon: Package },
    { href: '/dashboard/vendors', label: 'Vendor Management', icon: Truck },
    { href: '/dashboard/inventory', label: 'Inventory Level', icon: FileBarChart },
    { href: '/dashboard/users', label: 'User Access', icon: Users },
];

import AuthGuard from '@/components/auth/AuthGuard';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    // const supabase = createClientComponentClient();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            router.push('/login');
            toast.success('Logged out successfully');
        } catch (error) {
            toast.error('Error logging out');
        }
    };

    return (
        <AuthGuard>
            <div className="flex min-h-screen bg-background font-mono text-sm">
                {/* Sidebar - Desktop & Mobile Overlay */}
                <aside className={`
                    fixed inset-y-0 left-0 z-50 w-64 flex-col border-r border-border bg-card transition-transform duration-300 ease-in-out md:static md:flex md:translate-x-0
                    ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
                `}>
                    <div className="flex h-14 items-center justify-between border-b border-border px-4 bg-card">
                        <span className="text-lg font-bold tracking-tight">Admin Console</span>
                        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
                            <Menu className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="flex-1 overflow-auto py-4">
                        <nav className="grid items-start px-2 text-sm font-medium lg:px-4 space-y-1">
                            {sidebarItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`flex items-center gap-3 px-3 py-2 transition-all border border-transparent hover:bg-muted hover:border-border ${isActive
                                            ? 'bg-primary/5 text-primary border-primary/20 font-bold'
                                            : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                    >
                                        <Icon className="h-4 w-4" />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                    <div className="mt-auto border-t border-border p-4 bg-muted/10">
                        <Button variant="ghost" className="w-full justify-start gap-2 text-destruct hover:text-destruct hover:bg-destruct/10" onClick={handleLogout}>
                            <LogOut className="h-4 w-4" />
                            Logout
                        </Button>
                    </div>
                </aside>

                {/* Mobile Overlay Backdrop */}
                {isMobileMenuOpen && (
                    <div
                        className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                )}

                {/* Main Content */}
                <div className="flex flex-1 flex-col overflow-hidden">
                    {/* Mobile Header */}
                    <header className="flex h-14 items-center gap-4 border-b border-border bg-card px-4 md:hidden">
                        <Button variant="outline" size="icon" className="md:hidden" onClick={() => setIsMobileMenuOpen(true)}>
                            <Menu className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                        </Button>
                        <span className="font-semibold">Admin Console</span>
                    </header>

                    <main className="flex-1 overflow-auto p-4 md:p-6 bg-background">
                        {children}
                    </main>
                </div>
            </div>
        </AuthGuard>
    );
}
