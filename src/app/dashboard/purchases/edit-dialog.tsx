'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface EditPurchaseDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    purchase: any;
    onSuccess: () => void;
}

export function EditPurchaseDialog({ open, onOpenChange, purchase, onSuccess }: EditPurchaseDialogProps) {
    const [items, setItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (purchase && purchase.purchase_items) {
            setItems(purchase.purchase_items.map((item: any) => ({ ...item, isDirty: false })));
        }
    }, [purchase]);

    const handleQuantityChange = (itemId: string, newQtyString: string) => {
        const newQty = parseFloat(newQtyString);
        setItems(prev => prev.map(item => {
            if (item.id === itemId) {
                return { ...item, quantity: isNaN(newQty) ? 0 : newQty, isDirty: true };
            }
            return item;
        }));
    };

    const handleSaveAll = async () => {
        const dirtyItems = items.filter(i => i.isDirty);
        if (dirtyItems.length === 0) {
            onOpenChange(false);
            return;
        }

        setIsLoading(true);
        try {
            for (const item of dirtyItems) {
                const { error } = await supabase.rpc('update_purchase_item_quantity', {
                    p_item_id: item.id,
                    p_new_qty: item.quantity
                });
                if (error) throw error;
            }
            toast.success('Purchase updated & Stock adjusted');
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
                    <DialogTitle>Edit Purchase (Stock In)</DialogTitle>
                    <DialogDescription>
                        Updating quantities here will adjust global stock levels.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-auto py-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Product</TableHead>
                                <TableHead className="text-right">Unit Cost</TableHead>
                                <TableHead className="text-right w-[120px]">Qty</TableHead>
                                <TableHead className="text-right">Total Cost</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">
                                        {item.products?.name} <span className="text-xs text-muted-foreground">({item.products?.unit_type})</span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {item.unit_cost?.toFixed(2)}
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
                                        {(item.quantity * item.unit_cost).toFixed(2)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSaveAll} disabled={isLoading}>
                        {isLoading ? 'Saving...' : 'Save & Adjust Stock'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
