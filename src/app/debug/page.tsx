'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DebugPage() {
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (msg: string) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);

    const runTests = async () => {
        setLogs([]);
        addLog('Starting Diagnostics...');

        try {
            // 1. Check Connection
            addLog('1. Checking Connection...');
            const { data: health, error: healthError } = await supabase.from('products').select('count', { count: 'exact', head: true });

            if (healthError) {
                addLog(`❌ Connection Failed: ${healthError.message}`);
                addLog(`Details: ${JSON.stringify(healthError)}`);
                return;
            }
            addLog(`✅ Connection OK. Product Count Valid.`);

            // 2. Test Insert
            addLog('2. Testing Product Insert (Dummy Data)...');
            const dummyProduct = {
                name: `Debug Product ${Date.now()}`,
                base_price: 10.50,
                stock: 100,
                stock_status: 'In Stock',
                unit_type: 'Qty',
                category: 'Debug'
            };

            const { data: insertData, error: insertError } = await supabase
                .from('products')
                .insert([dummyProduct])
                .select()
                .single();

            if (insertError) {
                addLog(`❌ Insert Failed: ${insertError.message}`);
                addLog(`Details: ${JSON.stringify(insertError)}`);
                addLog(`Hint: Check RLS Policies or Missing Columns.`);
            } else {
                addLog(`✅ Insert Success! Created ID: ${insertData.id}`);

                // Cleanup
                addLog('3. Cleaning up (Deleting dummy)...');
                await supabase.from('products').delete().eq('id', insertData.id);
                addLog('✅ Cleanup Done.');
            }

        } catch (err: any) {
            addLog(`❌ CRITICAL EXCEPTION: ${err.message}`);
        }
    };

    return (
        <div className="p-10 max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>System Diagnostics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button onClick={runTests} className="w-full">Run Diagnostics</Button>

                    <div className="bg-black/90 text-green-400 p-4 rounded-md font-mono text-xs min-h-[300px] overflow-auto whitespace-pre-wrap">
                        {logs.length === 0 ? 'Ready to test...' : logs.join('\n')}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
