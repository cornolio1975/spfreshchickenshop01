'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
    return (
        <div className="p-8 space-y-8">
            <h1 className="text-3xl font-bold tracking-tight">Shop Settings</h1>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle>General Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 border rounded-md bg-muted/20">
                            <p className="text-sm text-muted-foreground">
                                Settings functionality (printers, receipts, etc.) will be implemented here.
                            </p>
                        </div>
                        <Button variant="outline" disabled>Save Changes</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
