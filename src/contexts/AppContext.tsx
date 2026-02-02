"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useModal } from './ModalContext';
import { useAuth } from './AuthContext';
import { FinancialProvider } from './FinancialContext';
import { InventoryProvider } from './InventoryContext';
import { CRMProvider } from './CRMContext';
import { SalesProvider } from './SalesContext';
import { SettingsProvider } from './SettingsContext';

import { Product, PendingProduct } from './InventoryContext';
import { Kasa } from './FinancialContext';
import { Customer } from './CRMContext';
import { SuspendedSale } from './SalesContext';

export interface Branch {
    id: number;
    name: string;
    type: string;
    city?: string;
    address?: string;
    phone?: string;
    manager?: string;
    status: string;
}

export interface Staff {
    id: string | number;
    name: string;
    role: string;
    branch: string;
    permissions: string[];
    status: string;
    currentJob: string;
    username?: string;
    email?: string;
}

export interface SuspiciousEvent {
    id: string;
    timestamp: Date;
    detectedPhrase: string;
    confidence: number;
    hasSaleInLast5Min: boolean;
    branch: string;
    staff: string;
    details?: string;
}

interface AppNotification {
    id: string;
    type: 'info' | 'success' | 'warning' | 'danger';
    icon: string;
    text: string;
    timestamp: Date;
}

interface AppContextType {
    // Base Identity & Auth
    currentUser: Staff | null;
    setCurrentUser: (user: Staff | null) => void;
    hasPermission: (permId: string) => boolean;
    staff: Staff[];
    refreshStaff: () => Promise<void>;

    // Branches
    branches: Branch[];
    activeBranchName: string;
    setActiveBranchName: (name: string) => void;
    refreshBranches: () => Promise<void>;

    // Global Notifications
    notifications: AppNotification[];
    addNotification: (n: Omit<AppNotification, 'id' | 'timestamp'>) => void;
    removeNotification: (id: string) => void;

    // Security
    suspiciousEvents: SuspiciousEvent[];
    addSuspiciousEvent: (event: SuspiciousEvent) => void;
    clearSuspiciousEvents: (id?: string) => void;
    lastSaleTime: Date | null;
    recordSale: () => void;

    // UI state
    isSidebarOpen: boolean;
    setIsSidebarOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
    const { showError } = useModal();
    const { user: authUser } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // 1. BRANCH STATE
    const [branches, setBranches] = useState<Branch[]>([]);
    const [activeBranchName, setActiveBranchName] = useState<string>('Merkez');

    const refreshBranches = async () => {
        try {
            const res = await fetch('/api/branches', { cache: 'no-store' });
            const data = await res.json();
            if (data.success) {
                setBranches(data.branches || []);
            }
        } catch (error) { console.error('Branches fetch failed', error); }
    };

    const handleSetActiveBranchName = (name: string) => {
        setActiveBranchName(name);
        localStorage.setItem('periodya_activeBranch', name);
    };

    useEffect(() => {
        const savedBranch = localStorage.getItem('periodya_activeBranch') || localStorage.getItem('motoroil_activeBranch');
        if (savedBranch) setActiveBranchName(savedBranch);
        refreshBranches();
    }, []);

    // 2. STAFF & USER STATE
    const [staff, setStaff] = useState<Staff[]>([]);
    const [currentUser, setCurrentUser] = useState<Staff | null>(null);

    const refreshStaff = async () => {
        try {
            const res = await fetch('/api/staff', { cache: 'no-store' });
            const data = await res.json();
            if (Array.isArray(data)) setStaff(data);
        } catch (err) { console.error('Staff refresh failed', err); }
    };

    const hasPermission = (permId: string) => {
        if (currentUser === null) return true;
        return currentUser.permissions.includes('*') || currentUser.permissions.includes(permId);
    };

    useEffect(() => {
        refreshStaff();
    }, []);

    useEffect(() => {
        if (authUser) {
            const freshUser = staff.find(s => s.username === authUser.username || s.email === authUser.username);
            if (freshUser) {
                setCurrentUser(freshUser);
            } else {
                setCurrentUser({
                    id: authUser.username,
                    name: authUser.name,
                    role: authUser.role,
                    branch: authUser.branch,
                    permissions: authUser.permissions,
                    status: 'Active',
                    currentJob: '',
                    username: authUser.username
                });
            }
        } else {
            setCurrentUser(null);
        }
    }, [authUser, staff]);

    // 3. NOTIFICATIONS
    const [notifications, setNotifications] = useState<AppNotification[]>([]);

    const refreshNotifications = async () => {
        try {
            const res = await fetch('/api/notifications');
            const data = await res.json();
            if (Array.isArray(data)) setNotifications(data);
        } catch (err) { console.error('Notifications fetch failed', err); }
    };

    const addNotification = async (n: Omit<AppNotification, 'id' | 'timestamp'>) => {
        try {
            await fetch('/api/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(n)
            });
            refreshNotifications();
        } catch (err) { console.error('Add notification failed', err); }
    };

    const removeNotification = async (id: string) => {
        try {
            await fetch(`/api/notifications?id=${id}`, { method: 'DELETE' });
            refreshNotifications();
        } catch (err) { console.error('Remove notification failed', err); }
    };

    useEffect(() => {
        refreshNotifications();
    }, []);

    // 4. SECURITY
    const [suspiciousEvents, setSuspiciousEvents] = useState<SuspiciousEvent[]>([]);
    const [lastSaleTime, setLastSaleTime] = useState<Date | null>(null);

    const refreshSecurity = async () => {
        try {
            const res = await fetch('/api/security/events');
            const data = await res.json();
            if (Array.isArray(data)) setSuspiciousEvents(data);
        } catch (err) { console.error('Security fetch failed', err); }
    };

    useEffect(() => {
        refreshSecurity();
    }, []);

    const addSuspiciousEvent = async (event: SuspiciousEvent) => {
        try {
            await fetch('/api/security/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(event)
            });
            setSuspiciousEvents(prev => [event, ...prev].slice(0, 100));
        } catch (err) { console.error('Security event save failed', err); }
    };

    const clearSuspiciousEvents = async (id?: string) => {
        try {
            await fetch(`/api/security/events${id ? `?id=${id}` : ''}`, { method: 'DELETE' });
            if (id) setSuspiciousEvents(prev => prev.filter(e => e.id !== id));
            else setSuspiciousEvents([]);
        } catch (err) { console.error('Clear security events failed', err); }
    };

    const recordSale = () => setLastSaleTime(new Date());

    return (
        <AppContext.Provider value={{
            currentUser, setCurrentUser, hasPermission, staff, refreshStaff,
            branches, activeBranchName, setActiveBranchName: handleSetActiveBranchName, refreshBranches,
            notifications, addNotification, removeNotification,
            suspiciousEvents, addSuspiciousEvent, clearSuspiciousEvents, lastSaleTime, recordSale,
            isSidebarOpen, setIsSidebarOpen
        }}>
            <FinancialProvider activeBranchName={activeBranchName}>
                <InventoryProvider>
                    <CRMProvider>
                        <SalesProvider activeBranchName={activeBranchName}>
                            <SettingsProvider>
                                {children}
                            </SettingsProvider>
                        </SalesProvider>
                    </CRMProvider>
                </InventoryProvider>
            </FinancialProvider>
        </AppContext.Provider>
    );
}

export function useApp() {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
}
