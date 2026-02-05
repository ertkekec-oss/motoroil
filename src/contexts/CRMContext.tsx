"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

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
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

export function CRMProvider({ children }: { children: React.ReactNode }) {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [custClasses, setCustClasses] = useState<string[]>([]);
    const [suppClasses, setSuppClasses] = useState<string[]>([]);

    const refreshCustomers = async () => {
        try {
            const res = await fetch(`/api/customers?t=${Date.now()}`);
            const data = await res.json();
            if (data.success) setCustomers(data.customers);
        } catch (error) { console.error('Customers fetch failed', error); }
    };

    const refreshSuppliers = async () => {
        try {
            const res = await fetch(`/api/suppliers?t=${Date.now()}`);
            const data = await res.json();
            if (data.success) setSuppliers(data.suppliers);
        } catch (err) { console.error('Suppliers refresh failed', err); }
    };

    const refreshClasses = async () => {
        try {
            const res = await fetch('/api/settings');
            const data = await res.json();
            if (data && !data.error) {
                if (data.custClasses) setCustClasses(data.custClasses);
                if (data.suppClasses) setSuppClasses(data.suppClasses);
            }
        } catch (e) { console.error('Classes fetch failed', e); }
    };

    const { isAuthenticated } = useAuth();

    useEffect(() => {
        if (isAuthenticated) {
            // Parallel fetch for better performance
            Promise.all([
                refreshCustomers(),
                refreshSuppliers(),
                refreshClasses()
            ]);
        }
    }, [isAuthenticated]);

    return (
        <CRMContext.Provider value={{
            customers, setCustomers, refreshCustomers,
            suppliers, setSuppliers, refreshSuppliers,
            custClasses, setCustClasses,
            suppClasses, setSuppClasses,
            refreshClasses
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
