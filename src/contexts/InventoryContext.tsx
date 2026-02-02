"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useModal } from './ModalContext';
import { useAuth } from './AuthContext';

export interface Product {
    id: number | string;
    code: string;
    barcode?: string;
    name: string;
    brand?: string;
    category: string;
    type: string;
    stock: number;
    price: number;
    buyPrice: number;
    status: 'ok' | 'low' | 'out' | 'warning';
    supplier: string;
    branch?: string;
    salesVat?: number;
    salesVatIncluded?: boolean;
    purchaseVat?: number;
    purchaseVatIncluded?: boolean;
    salesOtv?: number;
    otvType?: string;
    salesOiv?: number;
    minStock?: number;
    stocks?: any[];
}

export interface StockTransfer {
    id: string;
    productId: string;
    productName: string;
    productCode: string;
    qty: number;
    fromBranch: string;
    toBranch: string;
    status: 'IN_TRANSIT' | 'RECEIVED' | 'CANCELLED';
    shippedAt: string;
    receivedAt?: string;
    receivedBy?: string;
    requestedBy?: string;
    notes?: string;
}

export interface PendingProduct {
    id: string;
    requestedBy: string;
    requestedAt: string;
    productData: Omit<Product, 'id'>;
    status: 'pending' | 'approved' | 'rejected';
}

interface InventoryContextType {
    products: Product[];
    setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
    refreshProducts: () => Promise<void>;
    stockTransfers: StockTransfer[];
    refreshStockTransfers: () => Promise<void>;
    startStockTransfer: (data: any) => Promise<boolean>;
    finalizeTransfer: (id: string, action: string) => Promise<boolean>;
    pendingProducts: PendingProduct[];
    refreshPending: () => Promise<void>;
    requestProductCreation: (productData: Omit<Product, 'id'>) => Promise<void>;
    approveProduct: (pendingId: string) => Promise<void>;
    rejectProduct: (pendingId: string) => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export function InventoryProvider({ children }: { children: React.ReactNode }) {
    const [products, setProducts] = useState<Product[]>([]);
    const [stockTransfers, setStockTransfers] = useState<StockTransfer[]>([]);
    const [pendingProducts, setPendingProducts] = useState<PendingProduct[]>([]);
    const { user } = useAuth();

    const refreshProducts = async () => {
        try {
            const res = await fetch(`/api/products?t=${Date.now()}`);
            const data = await res.json();
            if (data.success) setProducts(data.products);
        } catch (err) { console.error('Products fetch failed', err); }
    };

    const refreshStockTransfers = async () => {
        try {
            const res = await fetch('/api/inventory/transfer');
            const data = await res.json();
            if (data.success) setStockTransfers(data.transfers);
        } catch (err) { console.error('Stock transfers refresh failed', err); }
    };

    const startStockTransfer = async (data: any) => {
        try {
            const res = await fetch('/api/inventory/transfer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await res.json();
            if (result.success) {
                await Promise.all([refreshStockTransfers(), refreshProducts()]);
                return true;
            }
            return false;
        } catch (err) { console.error('Start transfer failed', err); return false; }
    };

    const finalizeTransfer = async (id: string, action: string) => {
        try {
            const res = await fetch('/api/inventory/transfer', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, action })
            });
            const data = await res.json();
            if (data.success) {
                await Promise.all([refreshStockTransfers(), refreshProducts()]);
                return true;
            }
            return false;
        } catch (err) { console.error('Finalize transfer failed', err); return false; }
    };

    const refreshPending = async () => {
        try {
            const res = await fetch('/api/inventory/pending?type=products');
            const data = await res.json();
            if (Array.isArray(data)) setPendingProducts(data);
        } catch (e) { console.error('Pending fetch failed', e); }
    };

    const requestProductCreation = async (productData: Omit<Product, 'id'>) => {
        try {
            await fetch('/api/inventory/pending', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'product', productData, requestedBy: user?.name || 'Bilinmeyen' })
            });
            await refreshPending();
        } catch (e) { console.error('Product request failed', e); }
    };

    const approveProduct = async (id: string) => {
        try {
            const res = await fetch('/api/inventory/pending', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, type: 'product', status: 'approved' })
            });
            const data = await res.json();
            if (!data.error) {
                await Promise.all([refreshPending(), refreshProducts()]);
            }
        } catch (e) { console.error('Product approval failed', e); }
    };

    const rejectProduct = async (id: string) => {
        try {
            await fetch('/api/inventory/pending', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, type: 'product', status: 'rejected' })
            });
            await refreshPending();
        } catch (e) { console.error('Product rejection failed', e); }
    };


    useEffect(() => {
        refreshProducts();
        refreshStockTransfers();
        refreshPending();
    }, []);

    return (
        <InventoryContext.Provider value={{
            products, setProducts, refreshProducts,
            stockTransfers, refreshStockTransfers,
            startStockTransfer, finalizeTransfer,
            pendingProducts,
            refreshPending,
            requestProductCreation,
            approveProduct,
            rejectProduct
        }}>
            {children}
        </InventoryContext.Provider>
    );
}

export function useInventory() {
    const context = useContext(InventoryContext);
    if (context === undefined) {
        throw new Error('useInventory must be used within an InventoryProvider');
    }
    return context;
}
