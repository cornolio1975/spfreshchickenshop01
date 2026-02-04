"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Home, LayoutDashboard, ShoppingBasket, Package, Receipt, Truck, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function MobileNav() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="md:hidden">
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(true)}>
                <Menu className="w-6 h-6" />
                <span className="sr-only">Open menu</span>
            </Button>

            {isOpen && (
                <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
                    <div className="fixed inset-y-0 left-0 z-50 w-3/4 max-w-sm border-r border-border bg-background p-6 shadow-lg sm:max-w-sm transition-transform duration-300 ease-in-out">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-lg font-bold">Menu</h2>
                            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                                <X className="w-6 h-6" />
                                <span className="sr-only">Close menu</span>
                            </Button>
                        </div>
                        <nav className="space-y-4 flex flex-col">
                            <MobileLink href="/" onClick={() => setIsOpen(false)} icon={<Home className="w-5 h-5" />}>
                                Home
                            </MobileLink>
                            <MobileLink href="/dashboard" onClick={() => setIsOpen(false)} icon={<LayoutDashboard className="w-5 h-5" />}>
                                Overview
                            </MobileLink>
                            <MobileLink href="/shop" onClick={() => setIsOpen(false)} icon={<ShoppingBasket className="w-5 h-5" />}>
                                Shop / Order
                            </MobileLink>
                            <MobileLink href="/dashboard/products" onClick={() => setIsOpen(false)} icon={<Package className="w-5 h-5" />}>
                                Products
                            </MobileLink>
                            <MobileLink href="/dashboard/orders" onClick={() => setIsOpen(false)} icon={<Receipt className="w-5 h-5" />}>
                                Orders
                            </MobileLink>

                            <div className="h-px bg-border my-2" />

                            <MobileLink href="/dashboard/vendors" onClick={() => setIsOpen(false)} icon={<Truck className="w-5 h-5" />}>
                                Vendors
                            </MobileLink>
                            <MobileLink href="/dashboard/inventory" onClick={() => setIsOpen(false)} icon={<Package className="w-5 h-5" />}>
                                Inventory
                            </MobileLink>

                            <div className="h-px bg-border my-2" />

                            <MobileLink href="/shop/reports" onClick={() => setIsOpen(false)} icon={<Receipt className="w-5 h-5" />}>
                                Reports
                            </MobileLink>
                            <MobileLink href="/dashboard/settings" onClick={() => setIsOpen(false)} icon={<Settings className="w-5 h-5" />}>
                                Settings
                            </MobileLink>
                        </nav>
                    </div>
                </div>
            )}
        </div>
    );
}

interface MobileLinkProps {
    href: string;
    onClick?: () => void;
    children: React.ReactNode;
    icon: React.ReactNode;
}

function MobileLink({ href, onClick, children, icon }: MobileLinkProps) {
    return (
        <Link
            href={href}
            onClick={onClick}
            className="flex items-center gap-4 text-lg font-medium hover:text-primary transition-colors p-2 hover:bg-muted/50 rounded-sm"
        >
            {icon}
            {children}
        </Link>
    );
}
