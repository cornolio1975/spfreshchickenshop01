"use client";

import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { ShoppingBasket, Package, Users, ArrowRight } from "lucide-react";

export default function Home() {
    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto space-y-8">

                <div className="bg-card border border-border p-6 rounded-sm shadow-sm">
                    <h2 className="text-2xl font-bold tracking-tight">Welcome into System</h2>
                    <p className="text-muted-foreground mt-2">
                        Select an action below to proceed.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <DashboardCard
                        title="New Sale / Shop"
                        description="Create orders and browse inventory."
                        href="/shop"
                        icon={<ShoppingBasket className="w-8 h-8 text-primary" />}
                    />
                    <DashboardCard
                        title="Manage Products"
                        description="Update prices, stock, and details."
                        href="/dashboard/products"
                        icon={<Package className="w-8 h-8 text-primary" />}
                    />
                    <DashboardCard
                        title="Customer Database"
                        description="View customer history and details."
                        href="/dashboard/customers"
                        icon={<Users className="w-8 h-8 text-primary" />}
                    />
                </div>

                <div className="bg-muted/20 border border-border p-6 rounded-sm">
                    <h3 className="font-semibold mb-4">System Status</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex justify-between border-b border-border py-2">
                            <span className="text-muted-foreground">System Date:</span>
                            <span>{new Date().toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between border-b border-border py-2">
                            <span className="text-muted-foreground">User:</span>
                            <span>Guest / Admin</span>
                        </div>
                        <div className="flex justify-between border-b border-border py-2">
                            <span className="text-muted-foreground">Connection:</span>
                            <span className="text-green-600 font-bold">Online</span>
                        </div>
                    </div>
                </div>

            </div>
        </DashboardLayout>
    );
}

function DashboardCard({ title, description, href, icon }: { title: string, description: string, href: string, icon: React.ReactNode }) {
    return (
        <Link href={href} className="group block">
            <div className="bg-card border border-border p-6 rounded-sm hover:border-primary/50 transition-colors h-full flex flex-col items-start">
                <div className="mb-4 bg-primary/10 p-3 rounded-sm">
                    {icon}
                </div>
                <h3 className="text-lg font-bold group-hover:text-primary transition-colors">{title}</h3>
                <p className="text-sm text-muted-foreground mt-2 mb-4 flex-1">{description}</p>
                <div className="flex items-center text-xs font-medium text-primary uppercase tracking-wider mt-auto">
                    Access Module <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
            </div>
        </Link>
    )
}
