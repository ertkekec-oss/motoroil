"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useModal } from './ModalContext';
import { apiFetch } from '@/lib/api-client';

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
    currency?: string;
    bankConnectionId?: string;
    iban?: string;
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
    bankTransactions: any[];
    refreshBankTransactions: () => Promise<void>;
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
    error: Error | null;
    isDataValid: boolean; // SEMANTIC READINESS
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);


export function FinancialProvider({ children, activeBranchName }: { children: React.ReactNode, activeBranchName: string }) {
    const { showError } = useModal();

    // SEMANTIC READINESS: Track which branch this data belongs to
    const [dataVersion, setDataVersion] = useState<string>('');

    const [kasalar, setKasalar] = useState<Kasa[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [bankTransactions, setBankTransactions] = useState<any[]>([]);
    const [checks, setChecks] = useState<Check[]>([]);

    // Global Error Gate State
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

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
            // Correct API endpoint
            const res = await apiFetch(`/api/kasalar?t=${Date.now()}`, { cache: 'no-store' });
            if (!res.ok) throw new Error('FINANCIAL_KASA_Failed to fetch accounts');
            const data = await res.json();
            setKasalar(data.kasalar || []); // Ensure array
            setError(null);
        } catch (err: any) {
            console.error('Kasalar fetch failed', err);
            setError(err);
        }
    };

    const refreshTransactions = async () => {
        try {
            // Correct API endpoint for transactions
            const res = await apiFetch(`/api/financials/transactions?t=${Date.now()}`, { cache: 'no-store' });
            if (!res.ok) throw new Error('FINANCIAL_TX_Failed to fetch transactions');
            const data = await res.json();

            // Validate Structure
            const txList = data.transactions || [];
            if (!Array.isArray(txList)) throw new Error('FINANCIAL_INVALID_DATA_STRUCTURE');

            setTransactions(txList);
            setError(null);
        } catch (err: any) {
            console.error('Transactions fetch failed', err);
            setError(err);
        }
    };

    const refreshBankTransactions = async () => {
        try {
            const res = await apiFetch(`/api/fintech/banking/transactions?t=${Date.now()}`, { cache: 'no-store' });
            if (!res.ok) throw new Error('FINANCIAL_BANK_TX_Failed to fetch bank transactions');
            const data = await res.json();
            setBankTransactions(data.transactions || []);
            setError(null);
        } catch (err: any) {
            console.error('Bank Transactions fetch failed', err);
            setError(err);
        }
    };

    const refreshChecks = async () => {
        try {
            const res = await apiFetch(`/api/checks?t=${Date.now()}`, { cache: 'no-store' });
            if (!res.ok) throw new Error('FINANCIAL_CHECKS_Failed to fetch checks');
            const data = await res.json();
            setChecks(data.checks || []);
            setError(null);
        } catch (err: any) {
            console.error('Checks fetch failed', err);
            setError(err);
        }
    };

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

    const addFinancialTransaction = async (data: any) => {
        try {
            const res = await apiFetch('/api/financials/transactions', {
                method: 'POST',
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
            const res = await apiFetch('/api/financials/checks', {
                method: 'POST',
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
            const res = await apiFetch(`/api/financials/checks/${checkId}/status`, {
                method: 'PATCH',
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
            await apiFetch('/api/settings', {
                method: 'POST',
                body: JSON.stringify({ paymentMethods: methods })
            });
        } catch (e) { console.error('Payment methods save error', e); }
    };

    const updateSalesExpenses = async (settings: any) => {
        setSalesExpenses(settings);
        try {
            await apiFetch('/api/settings', {
                method: 'POST',
                body: JSON.stringify({ salesExpenses: settings })
            });
            setError(null);
        } catch (e: any) {
            console.error('Sales expenses save error', e);
            setError(e);
        }
    };

    const refreshSalesExpenses = async () => {
        try {
            const res = await apiFetch(`/api/settings?t=${Date.now()}`, { cache: 'no-store' });
            const data = await res.json();
            if (data && data.salesExpenses) {
                setSalesExpenses(data.salesExpenses);
            }
        } catch (err) {
            console.error('Sales expenses fetch failed', err);
        }
    };

    const { isAuthenticated } = useAuth();

    // SEMANTIC READINESS: Invalidate stale data immediately on branch change
    useEffect(() => {
        // Branch changed → old data is now INVALID
        if (activeBranchName && dataVersion !== activeBranchName) {
            // CRITICAL: Clear stale data IMMEDIATELY to prevent showing wrong branch data
            setKasalar([]);
            setTransactions([]);
            setChecks([]);
            setIsInitialLoading(true);
        }
    }, [activeBranchName]);

    useEffect(() => {
        if (isAuthenticated && activeBranchName) {
            setIsInitialLoading(true);
            Promise.all([
                refreshTransactions(),
                refreshBankTransactions(),
                refreshKasalar(),
                refreshChecks(),
                refreshSalesExpenses()
            ])
                .then(() => {
                    // Mark data as belonging to this branch
                    setDataVersion(activeBranchName);
                    setError(null);
                })
                .catch((err) => {
                    console.error("Financial Initialization Failed", err);
                    setError(new Error("FINANCIAL_INIT_FAILURE"));
                })
                .finally(() => {
                    setIsInitialLoading(false);
                });
        } else {
            setIsInitialLoading(false);
        }
    }, [isAuthenticated, activeBranchName]);

    // SEMANTIC READINESS CHECK: Is the data valid for current context?
    const isDataValid = dataVersion === activeBranchName && activeBranchName !== '';

    return (
        <FinancialContext.Provider value={{
            kasalar, setKasalar, refreshKasalar, transactions, setTransactions, refreshTransactions,
            bankTransactions, refreshBankTransactions,
            addTransaction, checks, refreshChecks,
            addFinancialTransaction, addCheck, collectCheck, paymentMethods, updatePaymentMethods,
            kasaTypes, setKasaTypes, salesExpenses, updateSalesExpenses,
            isInitialLoading,
            error,
            isDataValid // EXPOSE SEMANTIC READINESS
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
