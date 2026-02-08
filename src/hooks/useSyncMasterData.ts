
import { useEffect, useState } from 'react';
import { fieldDb } from '@/lib/field-db';

export function useSyncMasterData() {
    const [syncing, setSyncing] = useState(false);
    const [lastSync, setLastSync] = useState<Date | null>(null);

    const sync = async () => {
        if (typeof navigator !== 'undefined' && !navigator.onLine) return;
        setSyncing(true);
        try {
            // Products
            const pRes = await fetch('/api/products');
            const pData = await pRes.json();
            if (pData.success) {
                const products = pData.products.map((p: any) => ({
                    id: p.id,
                    name: p.name,
                    price: Number(p.price),
                    stock: Number(p.stock),
                    category: p.category || 'Genel'
                }));
                await fieldDb.products.clear();
                await fieldDb.products.bulkPut(products);
            }

            // Customers
            const cRes = await fetch('/api/customers?limit=1000');
            const cData = await cRes.json();
            if (cData.success) {
                const customers = cData.customers.map((c: any) => ({
                    id: c.id,
                    name: c.name,
                    balance: Number(c.balance),
                    address: c.address || '',
                    location: (c.latitude && c.longitude) ? { lat: c.latitude, lng: c.longitude } : undefined
                }));
                await fieldDb.customers.clear();
                await fieldDb.customers.bulkPut(customers);
            }

            const now = new Date();
            setLastSync(now);
            localStorage.setItem('field_last_sync', now.toISOString());

        } catch (e) {
            console.error('Sync failed', e);
        } finally {
            setSyncing(false);
        }
    };

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const last = localStorage.getItem('field_last_sync');
        if (last) setLastSync(new Date(last));

        // Auto sync if stale (> 1 hour)
        if (!last || (new Date().getTime() - new Date(last).getTime() > 3600000)) {
            sync();
        }
    }, []);

    return { sync, syncing, lastSync };
}
