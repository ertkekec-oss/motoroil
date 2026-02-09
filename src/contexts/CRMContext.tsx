"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { apiFetch } from '@/lib/api-client';

export interface Customer {
    id: number | string;
    name: string;
    phone: string;
    branch: string;
    balance: number;
    email?: string;
    address?: string;
    taxNumber?: string;
    taxOffice?: string;
    contactPerson?: string;
    iban?: string;
    customerClass?: string;
    city?: string;
    district?: string;
    referredByCode?: string;
    category?: string;
    points?: number;
    referralCode?: string;
    checks?: any[];
}

export interface Supplier {
    id: string | number;
    name: string;
    category: string;
    balance: number;
    phone?: string;
    email?: string;
    address?: string;
    taxNumber?: string;
    taxOffice?: string;
    contactPerson?: string;
    iban?: string;
    city?: string;
    district?: string;
    branch?: string;
    isActive?: boolean;
}

interface CRMContextType {
    customers: Customer[];
    setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
    refreshCustomers: () => Promise<void>;
    suppliers: Supplier[];
    setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
    refreshSuppliers: () => Promise<void>;
    custClasses: string[];
    setCustClasses: React.Dispatch<React.SetStateAction<string[]>>;
    suppClasses: string[];
    setSuppClasses: React.Dispatch<React.SetStateAction<string[]>>;
    refreshClasses: () => Promise<void>;
    isInitialLoading: boolean;
    error: Error | null; // GLOBAL ERROR GATE EXPOSURE
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

export function CRMProvider({ children }: { children: React.ReactNode }) {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [custClasses, setCustClasses] = useState<string[]>([]);
    const [suppClasses, setSuppClasses] = useState<string[]>([]);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const refreshCustomers = async () => {
        try {
            // Correct API endpoint
            const res = await apiFetch('/api/customers');
            if (!res.ok) throw new Error('CRM_CUSTOMERS_Failed to fetch customer data');
            const data = await res.json();

            // Check for success property wrapper if your API uses it, or direct array
            const customers = data.customers || (Array.isArray(data) ? data : []);

            setCustomers(customers);
            setError(null);
        } catch (err: any) {
            console.error('CRM Critical Error:', err);
            setError(err);
        }
    };

    const refreshSuppliers = async () => {
        try {
            // Correct API endpoint
            const res = await apiFetch('/api/suppliers');
            if (!res.ok) throw new Error('CRM_SUPPLIERS_Failed to fetch supplier data');
            const data = await res.json();

            const suppliers = data.suppliers || (Array.isArray(data) ? data : []);

            setSuppliers(suppliers);
            setError(null);
        } catch (err: any) {
            console.error('CRM Critical Error:', err);
            setError(err);
        }
    };

    const refreshClasses = async () => {
        // Use static definitions instead of failing API call
        // This prevents the global error gate from locking up the app due to missing endpoint
        setCustClasses(['A Sınıfı', 'B Sınıfı', 'C Sınıfı', 'VIP', 'Kurumsal']);
        setSuppClasses(['Resmi', 'Spot', 'İthalatçı', 'Yerel']);
        setError(null);
    };

    const { isAuthenticated } = useAuth();

    useEffect(() => {
        if (isAuthenticated) {
            setIsInitialLoading(true);
            // Parallel fetch for better performance
            Promise.all([
                refreshCustomers(),
                refreshSuppliers(),
                refreshClasses()
            ])
                .catch((err) => {
                    console.error("CRM Initialization Failed", err);
                    setError(new Error("CRM_INIT_FAILURE"));
                })
                .finally(() => {
                    setIsInitialLoading(false);
                    // COLD START METRIC END (CRM)
                    // performance.mark("crm_ready");
                });
        } else {
            setIsInitialLoading(false);
        }
    }, [isAuthenticated]);

    return (
        <CRMContext.Provider value={{
            customers, setCustomers, refreshCustomers,
            suppliers, setSuppliers, refreshSuppliers,
            custClasses, setCustClasses,
            suppClasses, setSuppClasses,
            refreshClasses,
            isInitialLoading,
            error
        }}>
            {children}
        </CRMContext.Provider>
    );
}

export function useCRM() {
    const context = useContext(CRMContext);
    if (context === undefined) {
        throw new Error('useCRM must be used within a CRMProvider');
    }
    return context;
}
