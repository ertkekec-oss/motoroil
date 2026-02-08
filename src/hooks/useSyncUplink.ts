
import { useEffect, useState } from 'react';
import { fieldDb } from '@/lib/field-db';

export function useSyncUplink() {
    const [uploading, setUploading] = useState(false);

    const syncUp = async () => {
        if (typeof navigator !== 'undefined' && !navigator.onLine) return;

        try {
            const pendingOrders = await fieldDb.orders.where('synced').equals(0).toArray();
            if (pendingOrders.length === 0) return;

            setUploading(true);

            for (const order of pendingOrders) {
                try {
                    const res = await fetch('/api/field-sales/orders/create', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            visitId: order.visitId,
                            customerId: order.customerId,
                            items: order.items,
                            total: order.total,
                            notes: order.notes
                        })
                    });

                    if (res.ok) {
                        await fieldDb.orders.update(order.id!, { synced: true });
                    }
                } catch (e) {
                    console.error('Error syncing order', order.id, e);
                }
            }
        } catch (e) {
            console.error('Sync Uplink failed', e);
        } finally {
            setUploading(false);
        }
    };

    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Sync on mount
        syncUp();

        // Sync on online event
        const onOnline = () => syncUp();
        window.addEventListener('online', onOnline);

        // Periodic sync (every 60s)
        const interval = setInterval(syncUp, 60000);

        return () => {
            window.removeEventListener('online', onOnline);
            clearInterval(interval);
        };
    }, []);

    return { syncUp, uploading };
}
