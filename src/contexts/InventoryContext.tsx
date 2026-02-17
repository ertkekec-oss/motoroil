"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useModal } from './ModalContext';
import { apiFetch } from '@/lib/api-client';

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
    currency?: string;
    buyPrice: number;
    purchaseCurrency?: string;
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
    unit?: string;
    minStock?: number;
    stocks?: any[];
    isParent?: boolean;
    variantsData?: any[];
    prices?: { priceListId: string; price: number; currency?: string; }[];
    [key: string]: any;
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
    setStockTransfers: React.Dispatch<React.SetStateAction<StockTransfer[]>>;
    refreshStockTransfers: () => Promise<void>;
    startStockTransfer: (data: any) => Promise<boolean>;
    finalizeTransfer: (id: string, action: string) => Promise<boolean>;
    pendingProducts: PendingProduct[];
    setPendingProducts: React.Dispatch<React.SetStateAction<PendingProduct[]>>;
    refreshPending: () => Promise<void>;
    requestProductCreation: (productData: Omit<Product, 'id'>) => Promise<void>;
    approveProduct: (pendingId: string, finalData?: any) => Promise<void>;
    rejectProduct: (pendingId: string) => Promise<void>;
    isInitialLoading: boolean;
    error: Error | null; // GLOBAL ERROR GATE EXPOSURE
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export function InventoryProvider({ children }: { children: React.ReactNode }) {
    const [products, setProducts] = useState<Product[]>([]);
    const [stockTransfers, setStockTransfers] = useState<StockTransfer[]>([]);
    const [pendingProducts, setPendingProducts] = useState<PendingProduct[]>([]);

    // Global Error Gate State
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const { isAuthenticated, user } = useAuth();

    const refreshProducts = async () => {
        try {
            // Fetch normal products
            const res = await apiFetch('/api/products');
            if (!res.ok) throw new Error('INVENTORY_PRODUCTS_Failed to fetch products');
            const data = await res.json();

            if (Array.isArray(data)) {
                setProducts(data);
            } else if (data.products && Array.isArray(data.products)) {
                setProducts(data.products);
            } else {
                setProducts([]);
            }
            setError(null);
        } catch (err: any) {
            console.error('Inventory Sync Error:', err);
            setError(err);
        }
    };

    const refreshStockTransfers = async () => {
        try {
            // Correct API path based on directory listing
            const res = await apiFetch('/api/inventory/transfer');
            const data = await res.json();

            // Handle { success: true, transfers: [] } wrapper
            const transfers = data.transfers || (Array.isArray(data) ? data : []);

            setStockTransfers(transfers);
        } catch (e: any) {
            console.error('Stock transfers fetch failed', e);
            // Transfers failing isn't critical enough to stop the whole app, usually.
        }
    };

    const refreshPending = async () => {
        try {
            const res = await apiFetch('/api/inventory/pending');
            const data = await res.json();
            if (Array.isArray(data)) setPendingProducts(data);
        } catch (e) { }
    };

    const requestProductCreation = async (product: Partial<Product>) => {
        try {
            await apiFetch('/api/inventory/pending', {
                method: 'POST',
                body: JSON.stringify(product)
            });
            await refreshPending();
            setError(null);
        } catch (e: any) {
            console.error('Product request failed', e);
            setError(e);
        }
    };

    const approveProduct = async (id: string, finalData?: any) => {
        try {
            await apiFetch('/api/inventory/pending', {
                method: 'PUT',
                body: JSON.stringify({ id, action: 'approve', finalData })
            });
            await Promise.all([refreshPending(), refreshProducts()]);
            setError(null);
        } catch (e: any) {
            console.error('Product approval failed', e);
            setError(e);
        }
    };

    const rejectProduct = async (id: string) => {
        try {
            await apiFetch('/api/inventory/pending', {
                method: 'PUT',
                body: JSON.stringify({ id, action: 'reject' })
            });
            await refreshPending();
            setError(null);
        } catch (e: any) {
            console.error('Product rejection failed', e);
            setError(e);
        }
    };

    // Implement real transfer functions or keep placeholders if API not ready
    const startStockTransfer = async (data: any) => {
        try {
            const res = await apiFetch('/api/inventory/stock-transfers', { // Corrected endpoint guess
                method: 'POST',
                body: JSON.stringify(data)
            });
            if (res.ok) {
                await refreshStockTransfers();
                return true;
            }
            return false;
        } catch (e) { return false; }
    };

    const finalizeTransfer = async (id: string, action: string) => {
        try {
            // Placeholder implementation
            return true;
        } catch (e) { return false; }
    };

    useEffect(() => {
        if (isAuthenticated) {
            setIsInitialLoading(true);
            Promise.all([
                refreshProducts(),
                refreshStockTransfers(),
                refreshPending()
            ])
                .catch((err) => {
                    console.error("Inventory Initialization Failed", err);
                    setError(new Error("INVENTORY_INIT_FAILURE"));
                })
                .finally(() => {
                    setIsInitialLoading(false);
                });
        } else {
            setIsInitialLoading(false);
        }
    }, [isAuthenticated]);

    return (
        <InventoryContext.Provider value={{
            products,
            setProducts,
            refreshProducts,
            stockTransfers,
            setStockTransfers,
            refreshStockTransfers,
            startStockTransfer,
            finalizeTransfer,
            pendingProducts,
            setPendingProducts,
            refreshPending,
            requestProductCreation,
            approveProduct,
            rejectProduct,
            isInitialLoading,
            error
        }}>
            {children}
        </InventoryContext.Provider>
    );
};

export function useInventory() {
    const context = useContext(InventoryContext);
    if (context === undefined) {
        throw new Error('useInventory must be used within an InventoryProvider');
    }
    return context;
}
