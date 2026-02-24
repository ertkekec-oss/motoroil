"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useModal } from './ModalContext';
import { useAuth } from './AuthContext';
import { FinancialProvider } from './FinancialContext';
import { InventoryProvider, Product } from './InventoryContext';
import { CRMProvider, Customer, Supplier } from './CRMContext';
import { SalesProvider } from './SalesContext';
import { SettingsProvider } from './SettingsContext';
import { apiFetch } from '@/lib/api-client';

// Re-export core types for backward compatibility
export type { Product, Customer, Supplier };

export interface Branch {
    id: number;
    name: string;
    type: string;
    city?: string;
    district?: string;
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
    phone?: string;
    salary?: number | string;
    earnings?: number;
    performance?: number;
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
    hasFeature: (featureKey: string) => boolean;
    subscription: any;
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
    isInitialLoading: boolean;

    // Impersonation (Platform Admin Only)
    activeTenantId: string | null;
    setActiveTenantId: (id: string | null) => void;
    availableTenants: any[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
    const { showError } = useModal();
    const { user: authUser, isAuthenticated, isLoading: authLoading } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const isAdminPath = pathname?.startsWith('/admin');

    // IMPERSONATION STATE
    const [activeTenantId, setActiveTenantIdState] = useState<string | null>(() => {
        if (typeof window !== 'undefined') return localStorage.getItem('periodya_activeTenantId');
        return null;
    });
    const [availableTenants, setAvailableTenants] = useState<any[]>([]);

    const setActiveTenantId = (id: string | null) => {
        setActiveTenantIdState(id);
        if (id) localStorage.setItem('periodya_activeTenantId', id);
        else localStorage.removeItem('periodya_activeTenantId');

        // When tenant changes, we should probably reset other states or trigger a full reload
        if (typeof window !== 'undefined') window.location.reload();
    };

    // Feature to Path Mapping for redirection
    const featurePathMap: Record<string, string> = {
        '/': 'pos',
        '/accounting': 'financials',
        '/inventory': 'inventory',
        '/service': 'service_desk',
        '/sales': 'sales',
        '/reports': 'analytics',
        '/reports/ceo': 'ceo_intel',
        '/customers': 'current_accounts',
        '/suppliers': 'suppliers',
        '/field-sales': 'field_sales',
        '/advisor': 'accountant',
        '/fintech/control-tower': 'fintech_tower',
        '/fintech/smart-pricing': 'smart_pricing',
        '/fintech/profitability-heatmap': 'pnl_heatmap',
        '/quotes': 'quotes',
        '/settings': 'system_settings',
        '/staff': 'team_management'
    };

    // 1. BRANCH STATE
    const [branches, setBranches] = useState<Branch[]>([]);

    // Improved Initialization: Try to get branch name IMMEDIATELY for faster parallel loading
    const [activeBranchName, setActiveBranchName] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('periodya_activeBranch') || localStorage.getItem('motoroil_activeBranch') || '';
        }
        return '';
    });

    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [subscription, setSubscription] = useState<any>(null);

    const refreshSubscription = async () => {
        try {
            const res = await apiFetch('/api/billing/subscription');
            const data = await res.json();
            if (data && !data.error) {
                setSubscription(data);
            }
        } catch (err) {
            console.error('Subscription fetch failed', err);
        }
    };

    const refreshBranches = async () => {
        try {
            const res = await apiFetch('/api/branches', { cache: 'no-store' });
            const data = await res.json();
            if (data.success) {
                setBranches(data.branches || []);
            }
        } catch (error) { console.error('Branches fetch failed', error); }
    };

    const refreshTenants = async () => {
        const isPlatformAdmin = authUser?.tenantId === 'PLATFORM_ADMIN' || authUser?.role === 'SUPER_ADMIN';
        if (!isPlatformAdmin) return;

        try {
            const res = await fetch('/api/admin/tenants');
            const data = await res.json();
            if (data.data) setAvailableTenants(data.data);
        } catch (e) { console.error('Tenants fetch failed', e); }
    };

    const handleSetActiveBranchName = (name: string) => {
        setActiveBranchName(name);
        localStorage.setItem('periodya_activeBranch', name);
    };

    // 2. STAFF & USER STATE
    const [staff, setStaff] = useState<Staff[]>([]);
    const [currentUser, setCurrentUser] = useState<Staff | null>(null);

    const refreshStaff = async () => {
        try {
            const res = await apiFetch('/api/staff', { cache: 'no-store' });
            const data = await res.json();
            if (data.success && Array.isArray(data.staff)) {
                setStaff(data.staff);
            } else if (Array.isArray(data.data)) {
                setStaff(data.data);
            } else if (Array.isArray(data)) {
                setStaff(data);
            }
        } catch (err) { console.error('Staff refresh failed', err); }
    };

    const hasPermission = (permId: string) => {
        if (!currentUser) return true;
        // ADMIN and SUPER_ADMIN roles have all permissions
        if (currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN') return true;

        const perms = currentUser.permissions || [];
        return perms.includes('*') || perms.includes(permId);
    };

    const hasFeature = (featureKey: string) => {
        if (!subscription) return true; // Default to true while loading
        if (subscription.plan?.name === 'Super Admin') return true;
        return subscription.features?.includes(featureKey);
    };

    useEffect(() => {
        if (isAuthenticated) {
            // CRM/POS data fetching - Skip blocking for admin paths
            if (isAdminPath) {
                setIsInitialLoading(false);
                return;
            }

            // CRITICAL: Ensure loading screen is visible during transition
            setIsInitialLoading(true);

            // Parallel start
            if (!activeBranchName && authUser?.branch) {
                setActiveBranchName(authUser.branch);
            }

            // Load all core requirements in parallel
            Promise.all([refreshBranches(), refreshStaff(), refreshSubscription(), refreshTenants()]).finally(() => {
                const savedBranch = localStorage.getItem('periodya_activeBranch') || localStorage.getItem('motoroil_activeBranch');

                if (!activeBranchName) {
                    if (savedBranch) {
                        setActiveBranchName(savedBranch);
                    } else if (authUser?.branch) {
                        setActiveBranchName(authUser.branch);
                    } else {
                        setActiveBranchName('Merkez');
                    }
                }

                setIsInitialLoading(false);
            });
        } else if (!authLoading) {
            setIsInitialLoading(false);
        }
    }, [isAuthenticated, authLoading, authUser?.branch, isAdminPath]);

    // ROUTE PROTECTION Gating
    useEffect(() => {
        if (!isInitialLoading && isAuthenticated && subscription && !isAdminPath) {
            const requiredFeature = featurePathMap[pathname];
            if (requiredFeature && !hasFeature(requiredFeature)) {
                console.warn(`[Plan Gate] Access to ${pathname} restricted by plan. Required: ${requiredFeature}`);
                router.push('/billing?upsell=' + requiredFeature);
            }
        }
    }, [pathname, isInitialLoading, isAuthenticated, subscription, isAdminPath]);

    useEffect(() => {
        if (authUser) {
            // Priority 1: Match by userId if available
            // Priority 2: Match by username or email
            const freshUser = staff.find(s =>
                (s as any).userId === authUser.id ||
                s.username === authUser.username ||
                s.email === authUser.username
            );

            if (freshUser) {
                setCurrentUser(freshUser);
            } else {
                setCurrentUser({
                    id: authUser.id || authUser.username,
                    name: authUser.name,
                    role: authUser.role,
                    branch: authUser.branch,
                    permissions: authUser.permissions || [],
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
            const res = await apiFetch('/api/notifications');
            const data = await res.json();
            if (Array.isArray(data.data)) {
                setNotifications(data.data);
            } else if (Array.isArray(data)) {
                setNotifications(data);
            }
        } catch (err) { console.error('Notifications fetch failed', err); }
    };

    const addNotification = async (n: Omit<AppNotification, 'id' | 'timestamp'>) => {
        try {
            await apiFetch('/api/notifications', {
                method: 'POST',
                body: JSON.stringify(n)
            });
            refreshNotifications();
        } catch (err) { console.error('Add notification failed', err); }
    };

    const removeNotification = async (id: string) => {
        try {
            await apiFetch(`/api/notifications?id=${id}`, { method: 'DELETE' });
            refreshNotifications();
        } catch (err) { console.error('Remove notification failed', err); }
    };

    useEffect(() => {
        if (isAuthenticated) {
            refreshNotifications();
        }
    }, [isAuthenticated]);

    // 4. SECURITY
    const [suspiciousEvents, setSuspiciousEvents] = useState<SuspiciousEvent[]>([]);
    const [lastSaleTime, setLastSaleTime] = useState<Date | null>(null);

    const refreshSecurity = async () => {
        try {
            const res = await apiFetch('/api/security/events');
            const data = await res.json();
            if (data.success && Array.isArray(data.events)) {
                setSuspiciousEvents(data.events);
            } else if (Array.isArray(data)) {
                setSuspiciousEvents(data);
            }
        } catch (err) { console.error('Security fetch failed', err); }
    };

    useEffect(() => {
        if (isAuthenticated) {
            refreshSecurity();
        }
    }, [isAuthenticated]);

    const addSuspiciousEvent = async (event: SuspiciousEvent) => {
        try {
            await apiFetch('/api/security/events', {
                method: 'POST',
                body: JSON.stringify(event)
            });
            setSuspiciousEvents(prev => [event, ...prev].slice(0, 100));
        } catch (err) { console.error('Security event save failed', err); }
    };

    const clearSuspiciousEvents = async (id?: string) => {
        try {
            await apiFetch(`/api/security/events${id ? `?id=${id}` : ''}`, { method: 'DELETE' });
            if (id) setSuspiciousEvents(prev => prev.filter(e => e.id !== id));
            else setSuspiciousEvents([]);
        } catch (err) { console.error('Clear security events failed', err); }
    };

    const recordSale = () => setLastSaleTime(new Date());

    if (!isAdminPath && (isInitialLoading || authLoading) && isAuthenticated) {
        return (
            <div style={{
                background: 'var(--bg-deep)',
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontFamily: "'Outfit', sans-serif"
            }}>
                <div style={{ fontSize: '40px', marginBottom: '20px' }}>⏳</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>Verileriniz Hazırlanıyor</div>
                <div style={{ fontSize: '14px', opacity: 0.6 }}>Lütfen bekleyin, şube ve personel ayarları senkronize ediliyor...</div>
                <div style={{
                    marginTop: '30px',
                    width: '200px',
                    height: '4px',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '2px',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        width: '40%',
                        height: '100%',
                        background: 'var(--primary)',
                        animation: 'loading-bar 2s infinite ease-in-out'
                    }}></div>
                </div>
                <style jsx>{`
                    @keyframes loading-bar {
                        0% { transform: translateX(-100%); width: 30%; }
                        50% { width: 60%; }
                        100% { transform: translateX(330%); width: 30%; }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <AppContext.Provider value={{
            currentUser, setCurrentUser, hasPermission, hasFeature, subscription, staff, refreshStaff,
            branches, activeBranchName, setActiveBranchName: handleSetActiveBranchName, refreshBranches,
            notifications, addNotification, removeNotification,
            suspiciousEvents, addSuspiciousEvent, clearSuspiciousEvents, lastSaleTime, recordSale,
            isSidebarOpen, setIsSidebarOpen, isInitialLoading,
            activeTenantId, setActiveTenantId, availableTenants
        }}>
            <InventoryProvider>
                <CRMProvider>
                    <SettingsProvider>
                        <FinancialProvider activeBranchName={activeBranchName || ''}>
                            <SalesProvider activeBranchName={activeBranchName || ''}>
                                {(activeBranchName || !isAuthenticated || isAdminPath) ? children : null}
                            </SalesProvider>
                        </FinancialProvider>
                    </SettingsProvider>
                </CRMProvider>
            </InventoryProvider>
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
