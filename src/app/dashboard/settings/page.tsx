"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Save, Upload, Download, RefreshCw, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [settingsId, setSettingsId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        address: "",
        phone: "",
        email: "",
        tax_id: "",
        website: ""
    });

    // File Input Ref for Import
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setIsLoading(true);
        const { data, error } = await supabase.from("company_settings").select("*").single();

        if (data) {
            setSettingsId(data.id);
            setFormData({
                name: data.name || "",
                address: data.address || "",
                phone: data.phone || "",
                email: data.email || "",
                tax_id: data.tax_id || "",
                website: data.website || ""
            });
        }
        setIsLoading(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (settingsId) {
                // Update
                const { error } = await supabase
                    .from("company_settings")
                    .update(formData)
                    .eq("id", settingsId);
                if (error) throw error;
            } else {
                // Insert (should ideally be done by migration, but fallback)
                const { data, error } = await supabase
                    .from("company_settings")
                    .insert([formData])
                    .select()
                    .single();
                if (error) throw error;
                if (data) setSettingsId(data.id);
            }
            toast.success("Company profile updated successfully.");
        } catch (error: any) {
            toast.error(error.message || "Failed to save settings.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            toast.info("Preparing backup...");

            // Fetch all data
            const [products, vendors, shops, inventory_adjustments] = await Promise.all([
                supabase.from('products').select('*'),
                supabase.from('vendors').select('*'),
                supabase.from('shops').select('*'),
                supabase.from('inventory_adjustments').select('*')
            ]);

            const backupData = {
                timestamp: new Date().toISOString(),
                version: "1.0",
                data: {
                    products: products.data || [],
                    vendors: vendors.data || [],
                    shops: shops.data || [],
                    inventory_adjustments: inventory_adjustments.data || []
                }
            };

            // Create blob and download
            const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `backup_sp_fresh_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast.success("Backup downloaded successfully.");
        } catch (error) {
            toast.error("Export failed.");
            console.error(error);
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!confirm("⚠️ WARNING: Importing data heavily relies on ID matching. This creates new records if not found. Continue?")) {
            e.target.value = "";
            return;
        }

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                if (!json.data) throw new Error("Invalid backup file format");

                toast.info("Starting restore...");

                // Restore Vendors First (Dependencies)
                if (json.data.vendors?.length) {
                    await supabase.from('vendors').upsert(json.data.vendors, { onConflict: 'id' });
                }

                // Restore Products
                if (json.data.products?.length) {
                    await supabase.from('products').upsert(json.data.products, { onConflict: 'id' });
                }

                // Restore Shops
                if (json.data.shops?.length) {
                    await supabase.from('shops').upsert(json.data.shops, { onConflict: 'id' });
                }

                toast.success("Restore completed! Please refresh.");
                setTimeout(() => window.location.reload(), 1500);

            } catch (error: any) {
                toast.error("Restore failed: " + error.message);
                console.error(error);
            }
        };
        reader.readAsText(file);
        e.target.value = ""; // Reset input
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">System Settings</h2>

            {/* COMPANY PROFILE */}
            <Card>
                <CardHeader>
                    <CardTitle>Company Profile</CardTitle>
                    <CardDescription>Details used for invoices and reports.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Company / Shop Name</Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="SP Fresh Chicken"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Phone Contact</Label>
                                <Input
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="+60..."
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label>Address</Label>
                                <Input
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    placeholder="Running No, Street..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Email (Optional)</Label>
                                <Input
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="admin@example.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Tax / Reg ID (Optional)</Label>
                                <Input
                                    value={formData.tax_id}
                                    onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                                    placeholder="SSM-12345"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                Save Profile
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* DATA MANAGEMENT */}
            <Card className="border-orange-200 bg-orange-50/10">
                <CardHeader>
                    <CardTitle className="text-orange-900">Data Management</CardTitle>
                    <CardDescription>Backup and restore your system data (Products, Vendors, Shops).</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col md:flex-row gap-4">
                    <Button variant="outline" onClick={handleExport} className="flex-1 bg-white hover:bg-gray-50">
                        <Download className="w-4 h-4 mr-2" />
                        Export Data (JSON)
                    </Button>

                    <div className="relative flex-1">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept=".json"
                            className="hidden"
                        />
                        <Button variant="outline" onClick={handleImportClick} className="w-full bg-white hover:bg-gray-50 border-dashed border-2">
                            <Upload className="w-4 h-4 mr-2" />
                            Import Data (Restore)
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="flex items-start gap-2 p-4 bg-muted/50 rounded-sm text-xs text-muted-foreground">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>
                    <strong>Note:</strong> Sales history and logs are not typically included in lightweight backups to prevent large file sizes.
                    Full database backups should be managed via the Supabase Dashboard.
                    This export is primarily for Catalog Data (Products, Vendors, Shops).
                </p>
            </div>
        </div>
    );
}
