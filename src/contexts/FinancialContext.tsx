"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useModal } from './ModalContext';

export interface Transaction {
    id: string;
    date: string;
    type: 'Sales' | 'Purchase' | 'Expense' | 'Collection' | 'Payment' | 'SalesInvoice' | 'Transfer';
    description: string;
    amount: number;
    kasaId: number | string;
    customerId?: string;
    supplierId?: string;
    targetKasaId?: string;
    category?: string;
}

export interface Kasa {
    id: number | string;
    name: string;
    balance: number;
    type: string;
    branch?: string;
}

export interface PaymentMethod {
    id: string;
    label: string;
    type: 'cash' | 'card' | 'transfer';
    linkedKasaId?: string;
    icon?: string;
    description?: string;
}

export interface Check {
    id: string;
    type: 'In' | 'Out';
    number: string;
    bank: string;
    dueDate: string | Date;
    amount: number;
    status: string;
    customerId?: string;
    supplierId?: string;
    branch?: string;
    description?: string;
    customer?: { name: string };
    supplier?: { name: string };
}

interface FinancialContextType {
    kasalar: Kasa[];
    setKasalar: React.Dispatch<React.SetStateAction<Kasa[]>>;
    refreshKasalar: () => Promise<void>;
    transactions: Transaction[];
    setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
    refreshTransactions: () => Promise<void>;
    addTransaction: (t: Omit<Transaction, 'id' | 'date'>) => void;
    checks: Check[];
    refreshChecks: () => Promise<void>;
    addFinancialTransaction: (data: any) => Promise<any>;
    addCheck: (checkData: any) => Promise<any>;
    collectCheck: (checkId: string, targetKasaId: string) => Promise<any>;
    paymentMethods: PaymentMethod[];
    updatePaymentMethods: (methods: PaymentMethod[]) => Promise<void>;
    kasaTypes: string[];
    setKasaTypes: React.Dispatch<React.SetStateAction<string[]>>;
    salesExpenses: any;
    updateSalesExpenses: (settings: any) => Promise<void>;
    isInitialLoading: boolean;
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);


export function FinancialProvider({ children, activeBranchName }: { children: React.ReactNode, activeBranchName: string }) {
    const { showError } = useModal();

    const [kasalar, setKasalar] = useState<Kasa[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [checks, setChecks] = useState<Check[]>([]);
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    const addTransaction = (t: Omit<Transaction, 'id' | 'date'>) => {
        const newT: Transaction = {
            ...t as any,
            id: `TR-${Math.random().toString(36).substr(2, 9)}`,
            date: new Date().toISOString(),
            branch: (t as any).branch || activeBranchName || 'Merkez'
        };
        setTransactions(prev => [newT, ...prev]);

        // Optimistic Kasa update
        setKasalar(prev => prev.map(k => {
            if (String(k.id || '') === String(t.kasaId || '')) {
                const isPositive = ['Sales', 'Collection'].includes(t.type);
                const effect = isPositive ? t.amount : -t.amount;
                return { ...k, balance: k.balance + effect };
            }
            return k;
        }));
    };
    const [kasaTypes, setKasaTypes] = useState<string[]>(['Nakit', 'Banka', 'POS', 'Kredi Kartı', 'Emanet']);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
        { id: 'default_cash', label: 'Nakit', type: 'cash', icon: '💵' },
        { id: 'default_card', label: 'Kredi Kartı', type: 'card', icon: '💳' },
        { id: 'default_transfer', label: 'Havale/EFT', type: 'transfer', icon: '🏦' }
    ]);
    const [salesExpenses, setSalesExpenses] = useState<any>({
        posCommissions: [],
        eInvoiceCost: 0,
        printingCost: 0,
        otherCosts: []
    });

    const refreshKasalar = async () => {
        try {
            const res = await fetch(`/api/kasalar?t=${Date.now()}`, { cache: 'no-store' });
            const data = await res.json();
            if (data.success) setKasalar(data.kasalar);
        } catch (err) { console.error('Kasalar fetch failed', err); }
    };

    const refreshTransactions = async () => {
        try {
            const res = await fetch(`/api/financials/transactions?t=${Date.now()}`, { cache: 'no-store' });
            const data = await res.json();
            if (data.success) setTransactions(data.transactions);
        } catch (err) { console.error('Transactions fetch failed', err); }
    };

    const refreshChecks = async () => {
        try {
            const res = await fetch(`/api/financials/checks?t=${Date.now()}`, { cache: 'no-store' });
            const data = await res.json();
            if (data.success) setChecks(data.checks);
        } catch (err) { console.error('Checks fetch failed', err); }
    };

    const addFinancialTransaction = async (data: any) => {
        try {
            const res = await fetch('/api/financials/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...data, branch: data.branch || activeBranchName || 'Merkez' })
            });
            const result = await res.json();
            if (result.success) {
                // Don't await these, let them run in background to keep UI snappy
                Promise.all([refreshKasalar(), refreshTransactions()]).catch(e => console.error('Background refresh failed', e));
                return result;
            }
            return result; // Return error result if success is false
        } catch (error) {
            console.error('Transaction failed', error);
            return { success: false, error: 'Ağ hatası veya sunucu yanıt vermiyor.' };
        }
    };

    const addCheck = async (data: any) => {
        try {
            const res = await fetch('/api/financials/checks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...data, branch: data.branch || activeBranchName || 'Merkez' })
            });
            const result = await res.json();
            if (result.success) {
                await Promise.all([refreshKasalar(), refreshTransactions(), refreshChecks()]);
                return result;
            }
        } catch (error) { console.error('Add check failed', error); }
    };

    const collectCheck = async (checkId: string, targetKasaId: string) => {
        try {
            const check = checks.find(c => c.id === checkId);
            const newStatus = check?.type === 'Out' ? 'Ödendi' : 'Tahsil Edildi';
            const res = await fetch(`/api/financials/checks/${checkId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus, kasaId: targetKasaId })
            });
            const result = await res.json();
            if (result.success) {
                await Promise.all([refreshKasalar(), refreshTransactions(), refreshChecks()]);
                return result;
            }
            return result;
        } catch (error) { console.error('Collect check failed', error); return { success: false, error: 'Sunucu hatası' }; }
    };

    const updatePaymentMethods = async (methods: PaymentMethod[]) => {
        setPaymentMethods(methods);
        try {
            await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paymentMethods: methods })
            });
        } catch (e) { console.error('Payment methods save error', e); }
    };

    const updateSalesExpenses = async (settings: any) => {
        setSalesExpenses(settings);
        try {
            await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ salesExpenses: settings })
            });
        } catch (e) { console.error('Sales expenses save error', e); }
    };

    const { isAuthenticated } = useAuth();

    useEffect(() => {
        if (isAuthenticated) {
            setIsInitialLoading(true);
            Promise.all([
                refreshKasalar(),
                refreshTransactions(),
                refreshChecks()
            ]).finally(() => setIsInitialLoading(false));
        } else {
            setIsInitialLoading(false);
        }
    }, [isAuthenticated]);

    return (
        <FinancialContext.Provider value={{
            kasalar, setKasalar, refreshKasalar, transactions, setTransactions, refreshTransactions,
            addTransaction, checks, refreshChecks,
            addFinancialTransaction, addCheck, collectCheck, paymentMethods, updatePaymentMethods,
            kasaTypes, setKasaTypes, salesExpenses, updateSalesExpenses,
            isInitialLoading
        }}>
            {children}
        </FinancialContext.Provider>
    );
}

export function useFinancials() {
    const context = useContext(FinancialContext);
    if (context === undefined) {
        throw new Error('useFinancials must be used within a FinancialProvider');
    }
    return context;
}
