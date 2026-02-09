"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useInventory, Product } from './InventoryContext';
import { useFinancials } from './FinancialContext';
import { useCRM } from './CRMContext';
import { useModal } from './ModalContext';
import { useAuth } from './AuthContext';
import { apiFetch } from '@/lib/api-client';

export interface SuspendedSale {
    id: string;
    label: string;
    items: { product: Product, qty: number }[];
    customer: any | null;
    timestamp: Date;
    total: number;
}

interface SalesContextType {
    processSale: (saleData: any) => Promise<boolean>;
    suspendedSales: SuspendedSale[];
    refreshSuspended: () => Promise<void>;
    suspendSale: (label: string, items: any[], customer: any | null, total: number) => Promise<void>;
    removeSuspendedSale: (id: string) => Promise<void>;
}

const SalesContext = createContext<SalesContextType | undefined>(undefined);

export function SalesProvider({ children, activeBranchName }: { children: React.ReactNode, activeBranchName: string }) {
    const { setProducts, refreshProducts } = useInventory();
    const { addTransaction, refreshKasalar, refreshTransactions } = useFinancials();
    const { refreshCustomers } = useCRM();
    const { addNotification } = useModal() as any;

    const [suspendedSales, setSuspendedSales] = useState<SuspendedSale[]>([]);

    const refreshSuspended = async () => {
        try {
            const res = await apiFetch('/api/suspended-sales');
            const data = await res.json();
            if (Array.isArray(data)) {
                setSuspendedSales(data.map((s: any) => ({ ...s, timestamp: new Date(s.createdAt) })));
            }
        } catch (e) { console.error('Suspended sales fetch failed', e); }
    };

    const suspendSale = async (label: string, items: any[], customer: any | null, total: number) => {
        try {
            await apiFetch('/api/suspended-sales', {
                method: 'POST',
                body: JSON.stringify({ label, items, customer, total, branch: activeBranchName })
            });
            await refreshSuspended();
        } catch (e) { console.error('Suspend sale failed', e); }
    };

    const removeSuspendedSale = async (id: string) => {
        try {
            await apiFetch(`/api/suspended-sales?id=${id}`, { method: 'DELETE' });
            setSuspendedSales(prev => prev.filter(s => s.id !== id));
        } catch (e) { console.error('Remove suspended sale failed', e); }
    };

    const { isAuthenticated } = useAuth();
    useEffect(() => {
        if (isAuthenticated) {
            refreshSuspended();
        }
    }, [isAuthenticated]);

    const processSale = async (saleData: any) => {
        const saleBranch = saleData.branch || activeBranchName || 'Merkez';

        // Optimistic UI update for products
        setProducts(prev => prev.map(p => {
            const item = saleData.items.find((si: any) => String(si.productId) === String(p.id));
            if (item) {
                // Update legacy stock
                const newStock = (p.stock || 0) - item.qty;

                // Update multi-branch stocks optimistically
                const newStocks = (p.stocks || []).map((s: any) => {
                    if (s.branch === saleBranch) {
                        return { ...s, quantity: (s.quantity || 0) - item.qty };
                    }
                    return s;
                });

                // If branch wasn't found in stocks, consider adding it if it's Merkez or similar
                // But for optimistic, we usually expect it to exist if they are selling from it.

                return {
                    ...p,
                    stock: newStock,
                    stocks: newStocks,
                    status: newStock <= 0 ? 'out' : (newStock < 5 ? 'low' : 'ok')
                };
            }
            return p;
        }));

        addTransaction({
            type: 'Sales',
            description: saleData.description,
            amount: saleData.total,
            kasaId: saleData.kasaId,
            branch: saleBranch
        } as any);

        try {
            const res = await apiFetch('/api/sales/create', {
                method: 'POST',
                body: JSON.stringify({ ...saleData, branch: saleBranch })
            });

            const data = await res.json();
            if (data.success) {
                await Promise.all([refreshKasalar(), refreshCustomers(), refreshTransactions(), refreshProducts()]);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Sale process failed', error);
            addNotification({ type: 'danger', icon: '⚠️', text: 'Satış kaydedilemedi (Offline Mod).' });
            return false;
        }
    };

    return (
        <SalesContext.Provider value={{
            processSale,
            suspendedSales,
            refreshSuspended,
            suspendSale,
            removeSuspendedSale
        }}>
            {children}
        </SalesContext.Provider>
    );
}

export function useSales() {
    const context = useContext(SalesContext);
    if (context === undefined) {
        throw new Error('useSales must be used within a SalesProvider');
    }
    return context;
}
