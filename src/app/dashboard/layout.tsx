'use client';

import * as React from 'react';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Store, Users, FileBarChart, LogOut, Menu, Package, Truck, Home, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
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
    { href: '/dashboard/sales', label: 'Sales History', icon: Receipt },
    { href: '/dashboard/purchases', label: 'Purchase History', icon: Truck },
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
            <div className="min-h-screen bg-background font-mono text-sm">
                {/* DESKTOP LAYOUT (Resizable) */}
                <div className="hidden md:flex h-screen overflow-hidden">
                    <ResizablePanelGroup orientation="horizontal">
                        <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="bg-card border-r">
                            <aside className="h-full flex flex-col">
                                <div className="flex h-14 items-center border-b border-border px-4">
                                    <span className="text-lg font-bold tracking-tight">Admin Console</span>
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
                        </ResizablePanel>

                        <ResizableHandle withHandle />

                        <ResizablePanel defaultSize={80}>
                            <div className="flex bg-background h-full flex-col min-h-0">
                                <header className="h-14 border-b border-border px-6 flex items-center justify-end shrink-0 bg-card">
                                    <Button variant="ghost" size="sm" onClick={() => router.push('/')} className="gap-2">
                                        <Home className="h-4 w-4" />
                                        Exit to Home
                                    </Button>
                                </header>
                                <main className="flex-1 overflow-auto p-6 min-h-0">
                                    {children}
                                </main>
                            </div>
                        </ResizablePanel>
                    </ResizablePanelGroup>
                </div>

                {/* MOBILE LAYOUT (Overlay) */}
                <div className="md:hidden flex flex-col min-h-screen">
                    {/* Mobile Header */}
                    <header className="flex h-14 items-center gap-4 border-b border-border bg-card px-4 sticky top-0 z-40 justify-between">
                        <div className="flex items-center gap-4">
                            <Button variant="outline" size="icon" onClick={() => setIsMobileMenuOpen(true)}>
                                <Menu className="h-4 w-4" />
                                <span className="sr-only">Toggle menu</span>
                            </Button>
                            <span className="font-semibold">Admin Console</span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => router.push('/')} title="Exit to Home">
                            <Home className="h-5 w-5" />
                        </Button>
                    </header>

                    {/* Mobile Sidebar Overlay */}
                    {isMobileMenuOpen && (
                        <div className="fixed inset-0 z-50 flex">
                            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
                            <aside className="relative w-64 flex-col border-r border-border bg-card transition-transform duration-300 ease-in-out h-full">
                                <div className="flex h-14 items-center justify-between border-b border-border px-4">
                                    <span className="text-lg font-bold tracking-tight">Admin Console</span>
                                    <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                                        <Menu className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="flex-1 overflow-auto py-4">
                                    <nav className="grid items-start px-2 text-sm font-medium space-y-1">
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
                        </div>
                    )}

                    <main className="flex-1 overflow-auto p-4 bg-background">
                        {children}
                    </main>
                </div>
            </div>
        </AuthGuard>
    );
}
