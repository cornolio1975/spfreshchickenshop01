"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { ShoppingBasket, BarChart3, Package, Settings, LogOut, Menu } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function ShopLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const params = useParams();
    const pathname = usePathname();
    const shopId = params.shopId as string;



    const navItems = [
        { name: "POS / Sale", href: `/shop/${shopId}/pos`, icon: ShoppingBasket },
        { name: "Inventory", href: `/shop/${shopId}/stock`, icon: Package },
        { name: "Reports", href: `/shop/${shopId}/reports`, icon: BarChart3 },
        { name: "Settings", href: `/shop/${shopId}/settings`, icon: Settings },
    ];

    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

    return (
        <div className="min-h-screen bg-background font-mono text-sm flex flex-col">
            {/* Shared Header with Logos */}
            <header className="border-b border-border bg-card px-4 py-4 flex items-center justify-between print:hidden">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMobileMenuOpen(true)}>
                        <Menu className="h-6 w-6" />
                    </Button>
                    <div className="flex-shrink-0">
                        <Image src="/assets/sp-logo.jpg" alt="SP Logo" width={60} height={60} className="block w-12 h-12 md:w-20 md:h-20" priority />
                    </div>
                </div>

                <div className="flex-1 text-center px-2">
                    <h1 className="text-xl md:text-2xl font-bold uppercase tracking-wider line-clamp-1">shop: {shopId}</h1>
                    <p className="text-muted-foreground text-xs mt-1 hidden md:block">Point of Sale System</p>
                </div>
                <div className="flex-shrink-0">
                    <Image src="/assets/poultry-logo.jpg" alt="Poultry Logo" width={60} height={60} className="block w-12 h-12 md:w-20 md:h-20" priority />
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden relative">
                {/* Sidebar - Desktop & Mobile Overlay */}
                <aside className={`
                    fixed inset-y-0 left-0 z-50 w-64 flex-col border-r border-border bg-background transition-transform duration-300 ease-in-out md:static md:flex md:w-56 md:translate-x-0
                    ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
                `}>
                    <div className="flex h-14 items-center justify-end border-b border-border px-4 md:hidden">
                        <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                            <Menu className="h-5 w-5" />
                        </Button>
                    </div>
                    <nav className="flex flex-col h-full bg-muted/30">
                        <div className="p-2 space-y-1">
                            {navItems.map((item) => {
                                const isActive = pathname.startsWith(item.href);
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-2 text-sm border border-transparent transition-colors hover:bg-muted hover:border-border hover:text-foreground",
                                            isActive
                                                ? "bg-primary/5 border-primary/20 text-primary font-bold"
                                                : "text-muted-foreground"
                                        )}
                                    >
                                        <item.icon className="h-4 w-4" />
                                        <span>{item.name}</span>
                                    </Link>
                                )
                            })}
                        </div>

                        <div className="mt-auto p-4 border-t border-border">
                            <Link href="/" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
                                <LogOut className="h-3 w-3" />
                                <span>Exit to Main Menu</span>
                            </Link>
                        </div>
                    </nav>
                </aside>

                {/* Mobile Overlay Backdrop */}
                {isMobileMenuOpen && (
                    <div
                        className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                )}

                {/* Main Content */}
                <main className="flex-1 overflow-auto p-4 print:p-0 print:overflow-visible bg-background relative w-full">
                    {children}
                </main>
            </div>
        </div>
    );
}
