import Link from "next/link";
import { cn } from "@/lib/utils";
import { Receipt, ShoppingBasket, Home, Settings, Users, Package, Truck } from "lucide-react";
import Image from "next/image";

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    return (
        <div className="flex flex-col h-screen bg-background font-mono text-sm">
            {/* Top Header - Printed on Invoices */}
            <header className="flex-none border-b border-border bg-card px-6 py-4 flex items-center justify-between print:flex print:border-none">

                {/* Left Logo - SP */}
                <div className="flex-shrink-0">
                    <Image
                        src="/assets/sp-logo.jpg"
                        alt="SP Fresh Chicken"
                        width={80}
                        height={80}
                        className="block"
                        priority
                    />
                </div>

                {/* Center - Title/Nav (Hidden on print usually, but let's keep title) */}
                <div className="flex-1 text-center px-4">
                    <h1 className="text-2xl font-bold uppercase tracking-wider">SP Fresh Chicken</h1>
                    <p className="text-muted-foreground text-xs mt-1">Inventory & Sales Management System</p>
                </div>

                {/* Right Logo - Poultry */}
                <div className="flex-shrink-0">
                    <Image
                        src="/assets/poultry-logo.jpg"
                        alt="Fresh Poultry"
                        width={80}
                        height={80}
                        className="block"
                        priority
                    />
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar Navigation - Hidden on Print */}
                <aside className="w-64 border-r border-border bg-muted/30 p-4 hidden md:block overflow-y-auto print:hidden">
                    <nav className="space-y-2">
                        <NavItem href="/" icon={<Home className="w-4 h-4" />} label="Dashboard" />
                        <NavItem href="/shop" icon={<ShoppingBasket className="w-4 h-4" />} label="Shop / Order" />
                        <NavItem href="/dashboard/products" icon={<Package className="w-4 h-4" />} label="Products" />
                        <NavItem href="/dashboard/orders" icon={<Receipt className="w-4 h-4" />} label="Orders" />
                        <NavItem href="/dashboard/customers" icon={<Users className="w-4 h-4" />} label="Customers" />
                        <div className="h-px bg-border my-4" />
                        <NavItem href="/dashboard/vendors" icon={<Truck className="w-4 h-4" />} label="Vendors" />
                        <NavItem href="/dashboard/inventory" icon={<Package className="w-4 h-4" />} label="Inventory" />
                        <div className="h-px bg-border my-4" />
                        <NavItem href="/shop/reports" icon={<Receipt className="w-4 h-4" />} label="Reports" />
                        <NavItem href="/dashboard/settings" icon={<Settings className="w-4 h-4" />} label="Settings" />
                    </nav>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto p-6 print:p-0 print:overflow-visible">
                    {children}
                </main>
            </div>
        </div>
    );
}

function NavItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
    return (
        <Link
            href={href}
            className="flex items-center gap-3 px-3 py-2 hover:bg-muted rounded-none border border-transparent hover:border-border transition-colors text-foreground/80 hover:text-foreground"
        >
            {icon}
            <span>{label}</span>
        </Link>
    )
}
