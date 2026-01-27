export const dynamic = "force-static";
export const revalidate = false;

'use client';



export default function ShopLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            <header className="flex h-14 items-center border-b bg-white px-4 dark:bg-slate-950">
                <span className="font-bold">Fresh Chicken POS - Cashier Mode</span>
                <div className="ml-auto flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">Shop: Main St</span>
                    {/* Add User Profile / Logout here later */}
                </div>
            </header>
            <main className="p-4 md:p-6 h-[calc(100vh-3.5rem)] overflow-hidden">
                {children}
            </main>
        </div>
    );
}
