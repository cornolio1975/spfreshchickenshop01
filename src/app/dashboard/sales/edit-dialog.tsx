'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface EditSaleDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    sale: any;
    onSuccess: () => void;
}

export function EditSaleDialog({ open, onOpenChange, sale, onSuccess }: EditSaleDialogProps) {
    const [items, setItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (sale && sale.sale_items) {
            // Clone items to avoid mutating props directly
            setItems(sale.sale_items.map((item: any) => ({ ...item, isDirty: false })));
        }
    }, [sale]);

    const handleQuantityChange = (itemId: string, newQtyString: string) => {
        const newQty = parseFloat(newQtyString);
        setItems(prev => prev.map(item => {
            if (item.id === itemId) {
                return { ...item, quantity: isNaN(newQty) ? 0 : newQty, isDirty: true };
            }
            return item;
        }));
    };

    const handleSaveItem = async (item: any) => {
        if (!item.isDirty) return;

        try {
            setIsLoading(true);
            // Call RPC to update quantity and adjust stock safely
            const { error } = await supabase.rpc('update_sale_item_quantity', {
                p_sale_item_id: item.id,
                p_new_quantity: item.quantity
            });

            if (error) throw error;

            toast.success(`Updated ${item.product_name}`);

            // Mark as not dirty locally
            setItems(prev => prev.map(i => i.id === item.id ? { ...i, isDirty: false } : i));

        } catch (error: any) {
            console.error(error);
            toast.error(`Failed to update item: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveAll = async () => {
        // Save status change if implemented, currently just saving items one by one for MVP simplicity
        // or loop through dirty items
        const dirtyItems = items.filter(i => i.isDirty);
        if (dirtyItems.length === 0) {
            onOpenChange(false);
            return;
        }

        setIsLoading(true);
        try {
            for (const item of dirtyItems) {
                const { error } = await supabase.rpc('update_sale_item_quantity', {
                    p_sale_item_id: item.id,
                    p_new_quantity: item.quantity
                });
                if (error) throw error;
            }
            toast.success('All changes saved');
            onSuccess();
        } catch (error: any) {
            console.error(error);
            toast.error(`Error saving changes: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Edit Sale #{sale?.id?.slice(0, 8)}</DialogTitle>
                    <DialogDescription>
                        Modify quantities. Stock will be adjusted automatically.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-auto py-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Product</TableHead>
                                <TableHead className="text-right">Price</TableHead>
                                <TableHead className="text-right w-[120px]">Qty</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">
                                        {item.product_name}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {item.unit_price?.toFixed(2)}
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            step="0.1"
                                            className="text-right h-8"
                                            value={item.quantity}
                                            onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                        />
                                    </TableCell>
                                    <TableCell className="text-right font-bold">
                                        {(item.quantity * item.unit_price).toFixed(2)}
                                    </TableCell>
                                    <TableCell>
                                        {item.isDirty && (
                                            <div className="w-2 h-2 rounded-full bg-blue-500 mx-auto" title="Unsaved changes" />
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSaveAll} disabled={isLoading}>
                        {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
