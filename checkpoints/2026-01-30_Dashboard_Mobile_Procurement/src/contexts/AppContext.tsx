
"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useModal } from './ModalContext';


// --- TYPES ---
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
}

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
    type: 'Nakit' | 'Banka' | 'Kredi Kartı';
    branch?: string;
}

export interface Customer {
    id: number | string;
    name: string;
    phone: string;
    branch: string;
    balance: number;
    vehicle?: string;
    lastVisit?: string;
    isCorporate?: boolean;
    isVIP?: boolean;
    category?: string;
    email?: string;
    points?: number;
    referralCode?: string;
}

export interface Supplier {
    id: string | number;
    name: string;
    category: string;
    balance: number;
    phone?: string;
    status?: string;
    isActive?: boolean;
    address?: string;
    taxNumber?: string;
    taxOffice?: string;
    contactPerson?: string;
    iban?: string;
}

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
    type?: string;
    earnings?: number;
    jobsCount?: number;
    performance?: number;
}

export interface Campaign {
    id: string;
    name: string;
    type: string;
    description?: string;
    conditions: any;
    discountRate?: number;
    pointsRate?: number;
    startDate: string;
    endDate?: string;
    isActive: boolean;
}

export interface Coupon {
    id: string;
    code: string;
    type: 'percent' | 'amount';
    value: number;
    minPurchaseAmount: number;
    customerCategoryId?: string;
    customerId?: string;
    expiryDate?: string;
    isUsed: boolean;
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

export interface PendingProduct {
    id: string;
    requestedBy: string;
    requestedAt: string;
    productData: Omit<Product, 'id'>;
    status: 'pending' | 'approved' | 'rejected';
}

interface AppNotification {
    id: string;
    type: 'info' | 'success' | 'warning' | 'danger';
    icon: string;
    text: string;
    timestamp: Date;
}

export interface PendingTransfer {
    id: string;
    requestedBy: string;
    requestedAt: string;
    transferData: {
        productId: number | string;
        from: string;
        to: string;
        qty: number;
    };
    status: 'pending' | 'approved' | 'rejected';
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
    requestedBy?: string;
    shippedAt: string;
    receivedAt?: string;
    receivedBy?: string;
    notes?: string;
}

interface AppContextType {
    products: Product[];
    setProducts: (products: Product[]) => void;
    kasalar: Kasa[];
    setKasalar: (kasalar: Kasa[]) => void;
    transactions: Transaction[];
    setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
    addTransaction: (t: Omit<Transaction, 'id' | 'date'>) => void;
    processSale: (saleData: { items: { productId: number | string, qty: number }[], total: number, discountAmount?: number, kasaId: number | string, description: string, paymentMode?: string, customerId?: string | number, customerName?: string, installments?: number, pointsUsed?: number, couponCode?: string }) => Promise<boolean>;
    staff: Staff[];
    setStaff: (staff: Staff[]) => void;
    currentUser: Staff | null; // null means System Admin
    setCurrentUser: (user: Staff | null) => void;
    hasPermission: (permId: string) => boolean;
    customers: Customer[];
    setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
    suppliers: Supplier[];
    setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
    pendingProducts: PendingProduct[];
    requestProductCreation: (productData: Omit<Product, 'id'>) => void;
    approveProduct: (pendingId: string) => void;
    rejectProduct: (pendingId: string) => void;

    // Security Shield States
    suspiciousEvents: SuspiciousEvent[];
    addSuspiciousEvent: (event: SuspiciousEvent) => void;
    clearSuspiciousEvents: (id?: string) => void;
    lastSaleTime: Date | null;
    recordSale: () => void;

    // Notifications
    notifications: AppNotification[];
    addNotification: (n: Omit<AppNotification, 'id' | 'timestamp'>) => void;
    clearNotification: (id: string) => void;
    removeNotification: (id: string) => void; // Added for compatibility

    // Financials
    addFinancialTransaction: (data: { type: string, amount: number, description: string, kasaId?: string, customerId?: string, supplierId?: string, targetKasaId?: string, isAccountTransaction?: boolean }) => Promise<any>;

    // Checks
    checks: any[];
    addCheck: (checkData: any) => Promise<any>;

    // Transfers
    pendingTransfers: PendingTransfer[];
    requestTransfer: (transferData: Omit<PendingTransfer, 'id' | 'requestedBy' | 'requestedAt' | 'status'>) => void;
    approveTransfer: (transferId: string) => void;
    rejectTransfer: (transferId: string) => void;
    stockTransfers: StockTransfer[];
    refreshStockTransfers: () => Promise<void>;
    startStockTransfer: (data: Omit<StockTransfer, 'id' | 'shippedAt' | 'status'>) => Promise<boolean>;
    finalizeTransfer: (id: string, action: 'RECEIVE' | 'CANCEL') => Promise<boolean>;

    // Branches
    branches: Branch[];
    activeBranchName: string;
    setActiveBranchName: (name: string) => void;
    refreshBranches: () => Promise<void>;
    refreshCustomers: () => Promise<void>;
    refreshTransactions: () => Promise<void>;
    refreshKasalar: () => Promise<void>;
    refreshSuppliers: () => Promise<void>;
    refreshStaff: () => Promise<void>;

    // Service Settings
    serviceSettings: { motoMaintenancePrice: number; bikeMaintenancePrice: number };
    updateServiceSettings: (settings: { motoMaintenancePrice: number; bikeMaintenancePrice: number }) => void;

    // Billing & POS Settings
    invoiceSettings: any;
    updateInvoiceSettings: (settings: any) => Promise<void>;
    salesExpenses: any;
    updateSalesExpenses: (settings: any) => Promise<void>;

    // Referral Settings
    referralSettings: { referrerDiscount: number, refereeGift: number };
    updateReferralSettings: (settings: { referrerDiscount: number, refereeGift: number }) => Promise<void>;

    // Definitions (Sync with DB /api/settings)
    brands: string[];
    setBrands: React.Dispatch<React.SetStateAction<string[]>>;
    prodCats: string[];
    setProdCats: React.Dispatch<React.SetStateAction<string[]>>;
    allBrands: string[]; // Combined brands from settings + products
    allCats: string[];   // Combined categories from settings + products
    custClasses: string[];
    setCustClasses: React.Dispatch<React.SetStateAction<string[]>>;
    suppClasses: string[];
    setSuppClasses: React.Dispatch<React.SetStateAction<string[]>>;

    // Campaigns & Coupons
    campaigns: Campaign[];
    refreshCampaigns: () => Promise<void>;
    coupons: Coupon[];
    refreshCoupons: () => Promise<void>;
    warranties: string[];
    setWarranties: React.Dispatch<React.SetStateAction<string[]>>;
    refreshSettings: () => Promise<void>;
    updateWarranties: (list: string[]) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
    const { showError } = useModal();
    // INITIAL MOCK DATA

    const [products, setProducts] = useState<(Product & { branch?: string })[]>([]);

    const refreshProducts = async () => {
        try {
            const t = Date.now();
            const res = await fetch(`/api/products?t=${t}`, { cache: 'no-store' });
            const data = await res.json();
            if (data.success && Array.isArray(data.products)) {
                setProducts(data.products.map((p: any) => ({
                    ...p,
                    id: p.id
                })));
            } else {
                setProducts([]);
            }
        } catch (err) {
            console.error('Products fetch failed', err);
            setProducts([]);
        }
    };

    useEffect(() => {
        refreshProducts();
    }, []);

    const [kasalar, setKasalar] = useState<Kasa[]>([]);

    const refreshKasalar = async () => {
        try {
            const t = Date.now();
            const res = await fetch(`/api/kasalar?t=${t}`, { cache: 'no-store' });
            const data = await res.json();
            if (data.success && Array.isArray(data.kasalar)) {
                setKasalar(data.kasalar);
            } else {
                setKasalar([]);
            }
        } catch (err) {
            console.error('Kasalar refresh failed', err);
            setKasalar([]);
        }
    };

    useEffect(() => {
        refreshKasalar();
    }, []);

    const [transactions, setTransactions] = useState<Transaction[]>([]);

    const refreshTransactions = async () => {
        try {
            const t = Date.now();
            const res = await fetch(`/api/financials/transactions?t=${t}`, { cache: 'no-store' });
            const data = await res.json();
            if (data.success && Array.isArray(data.transactions)) {
                setTransactions(data.transactions);
            } else {
                setTransactions([]);
            }
        } catch (err) {
            console.error('Transactions refresh failed', err);
            setTransactions([]);
        }
    };

    useEffect(() => {
        refreshTransactions();
    }, []);

    const [customers, setCustomers] = useState<Customer[]>([]);

    const refreshCustomers = async () => {
        try {
            const t = Date.now();
            const res = await fetch(`/api/customers?t=${t}`, { cache: 'no-store' });
            const data = await res.json();
            if (data.success && Array.isArray(data.customers)) {
                setCustomers(data.customers);
            } else {
                setCustomers([]);
            }
        } catch (error) {
            console.error('Customers fetch failed', error);
            setCustomers([]);
        }
    };

    useEffect(() => {
        refreshCustomers();
    }, []);

    const [suppliers, setSuppliers] = useState<Supplier[]>([]);

    const refreshSuppliers = async () => {
        try {
            const t = Date.now();
            const res = await fetch(`/api/suppliers?t=${t}`, { cache: 'no-store' });
            const data = await res.json();
            if (data.success) setSuppliers(data.suppliers);
        } catch (err) {
            console.error('Suppliers refresh failed', err);
        }
    };

    useEffect(() => {
        refreshSuppliers();
    }, []);

    const [checks, setChecks] = useState<any[]>([]);

    useEffect(() => {
        const t = Date.now();
        fetch(`/api/checks?t=${t}`, { cache: 'no-store' })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setChecks(data.checks);
                }
            })
            .catch(err => console.error('Checks fetch failed', err));
    }, []);

    const [staff, setStaff] = useState<Staff[]>([]);

    const refreshStaff = async () => {
        try {
            const res = await fetch('/api/staff', { cache: 'no-store' });
            const data = await res.json();
            if (Array.isArray(data)) setStaff(data);
        } catch (err) {
            console.error('Staff refresh failed', err);
        }
    };

    useEffect(() => {
        refreshStaff();
    }, []);

    const [currentUser, setCurrentUser] = useState<Staff | null>(null);

    const [pendingProducts, setPendingProducts] = useState<PendingProduct[]>([]);
    const [pendingTransfers, setPendingTransfers] = useState<PendingTransfer[]>([]);

    const refreshPending = async () => {
        try {
            const pRes = await fetch('/api/inventory/pending?type=products');
            const pData = await pRes.json();
            if (Array.isArray(pData)) setPendingProducts(pData);

            const tRes = await fetch('/api/inventory/pending?type=transfers');
            const tData = await tRes.json();
            if (Array.isArray(tData)) setPendingTransfers(tData);
        } catch (err) {
            console.error('Pending items refresh failed', err);
        }
    };

    const refreshSecurityEvents = async () => {
        try {
            const res = await fetch('/api/security/events');
            const data = await res.json();
            if (data.success) {
                setSuspiciousEvents(data.events);
            }
        } catch (err) {
            console.error('Security events refresh failed', err);
        }
    };

    useEffect(() => {
        refreshPending();
        refreshSecurityEvents();
        refreshStockTransfers();
    }, []);

    // --- BRANCHES ---
    const [branches, setBranches] = useState<Branch[]>([]);

    const refreshBranches = async () => {
        try {
            const res = await fetch('/api/branches', { cache: 'no-store' });
            const data = await res.json();
            if (data.success) {
                setBranches(data.branches);
            }
        } catch (error) {
            console.error('Branches fetch failed', error);
        }
    };

    const [activeBranchName, setActiveBranchName] = useState<string>('Merkez');

    useEffect(() => {
        if (currentUser?.branch) {
            setActiveBranchName(currentUser.branch);
        }
    }, [currentUser]);

    useEffect(() => {
        refreshBranches();
        refreshCampaigns();
        refreshCoupons();
    }, []);

    // Notifications State
    const [notifications, setNotifications] = useState<AppNotification[]>([]);

    const refreshNotifications = async () => {
        try {
            const res = await fetch('/api/notifications');
            const data = await res.json();
            if (Array.isArray(data)) setNotifications(data);
        } catch (err) {
            console.error('Notifications refresh failed', err);
        }
    };

    useEffect(() => {
        refreshNotifications();
    }, []);

    const addNotification = async (n: Omit<AppNotification, 'id' | 'timestamp'>) => {
        try {
            const res = await fetch('/api/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(n)
            });
            if (res.ok) refreshNotifications();
        } catch (err) {
            console.error('Add notification failed', err);
        }
    };

    const clearNotification = async (id: string) => {
        try {
            await fetch(`/api/notifications?id=${id}`, { method: 'DELETE' });
            refreshNotifications();
        } catch (err) {
            console.error('Clear notification failed', err);
        }
    };

    // Marketplace polling disabled to prevent mock data spam

    // Auto-generate alerts based on state
    useEffect(() => {
        const lowStockCount = products.filter(p => p.status === 'low' || p.status === 'out').length;
        if (lowStockCount > 0) {
            // We could add stock alert here, but keeping it clean for now.
        }

        // Fetch Service Alerts
        const fetchServiceAlerts = async () => {
            try {
                const res = await fetch('/api/services/upcoming');
                const data = await res.json();
                if (data.success && data.data && data.data.alerts && data.data.alerts.length > 0) {
                    data.data.alerts.forEach((alert: any) => {
                        // Check if already exists to prevent dups on re-renders (simple check by ID suffix)
                        setNotifications(prev => {
                            if (prev.some(n => n.id === alert.id)) return prev;
                            const newN: AppNotification = {
                                id: alert.id,
                                type: alert.type,
                                icon: alert.type === 'danger' ? '🚨' : (alert.type === 'warning' ? '⚠️' : '🔧'),
                                text: alert.text,
                                timestamp: new Date()
                            };
                            return [newN, ...prev];
                        });
                    });
                }
            } catch (e) {
                console.error("Service alerts fetch error", e);
            }
        };

        fetchServiceAlerts();

    }, [products]); // Re-run if products change? Maybe just on mount is enough, but products change implies app usage. 
    // Ideally separate useEffect with empty dependency or specific trigger.
    // Let's separate it to run ONCE or on window focus.


    // Security Shield Global States
    const [suspiciousEvents, setSuspiciousEvents] = useState<SuspiciousEvent[]>([]);
    const [lastSaleTime, setLastSaleTime] = useState<Date | null>(null);

    const addSuspiciousEvent = async (event: SuspiciousEvent) => {
        // Optimistic UI Update
        const localEvent = { ...event, id: event.id || `local-${Date.now()}` };
        setSuspiciousEvents(prev => [localEvent, ...prev].slice(0, 100));

        // Persist to DB
        try {
            await fetch('/api/security/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(event)
            });
        } catch (err) {
            console.error('Failed to persist security event', err);
        }

        // Also fire a window event for local components
        window.dispatchEvent(new CustomEvent('suspiciousActivity', { detail: event }));
    };

    const recordSale = () => {
        setLastSaleTime(new Date());
    };

    const clearSuspiciousEvents = async (id?: string) => {
        try {
            if (id) {
                setSuspiciousEvents(prev => prev.filter(e => e.id !== id));
                await fetch(`/api/security/events?id=${id}`, { method: 'DELETE' });
            } else {
                setSuspiciousEvents([]);
                await fetch('/api/security/events', { method: 'DELETE' });
            }
        } catch (err) {
            console.error('Clear security events failed', err);
        }
    };

    // Keep currentUser synced with staff list (in case permissions change)
    useEffect(() => {
        if (currentUser) {
            const updated = staff.find(s => s.id === currentUser.id);
            if (updated && JSON.stringify(updated) !== JSON.stringify(currentUser)) {
                setCurrentUser(updated);
            }
        }
    }, [staff]);

    const [stockTransfers, setStockTransfers] = useState<StockTransfer[]>([]);
    const refreshStockTransfers = async () => {
        try {
            const res = await fetch('/api/inventory/transfer');
            const data = await res.json();
            if (data.success) setStockTransfers(data.transfers);
        } catch (err) {
            console.error('Stock transfers refresh failed', err);
        }
    };

    const hasPermission = (permId: string) => {
        if (currentUser === null) return true; // Admin has all permissions
        return currentUser.permissions.includes(permId);
    };

    // Branch / Permission Filtering Logic
    const getVisibleProducts = () => {
        const isAdmin = currentUser === null || (currentUser.role && (currentUser.role.toLowerCase().includes('admin') || currentUser.role.toLowerCase().includes('müdür')));

        // Admin or non-restricted user
        if (isAdmin || !hasPermission('branch_isolation')) {
            if (activeBranchName === 'Tümü' || activeBranchName === 'Hepsi') return products;
            return products.filter(p => p.branch === activeBranchName);
        }

        // Restricted user logic
        const userBranch = currentUser?.branch || 'Merkez';
        return products.map(p => {
            const isMyBranch = p.branch === userBranch;
            const isMerkez = p.branch === 'Merkez';

            if (isMyBranch) return p;

            if (isMerkez) {
                return {
                    ...p,
                    price: 0,
                    buyPrice: 0,
                    _restricted: true
                };
            }

            return null;
        }).filter(p => p !== null) as Product[];
    };

    const getVisibleTransactions = () => {
        let filtered = transactions;

        // E-commerce visibility check
        if (!hasPermission('ecommerce_view')) {
            const ecommerceKasa = kasalar.find(k => k.name === 'E-ticaret');
            if (ecommerceKasa) {
                filtered = filtered.filter(t => String(t.kasaId || '') !== String(ecommerceKasa.id || ''));
            }
        }

        const isAdmin = currentUser === null || (currentUser.role && (currentUser.role.toLowerCase().includes('admin') || currentUser.role.toLowerCase().includes('müdür')));

        // Branch Isolation / Selection check
        if (isAdmin || hasPermission('branch_isolation')) {
            const filterBranch = isAdmin ? activeBranchName : (currentUser?.branch || 'Merkez');

            if (filterBranch !== 'Tümü' && filterBranch !== 'Hepsi') {
                const targetKasalar = kasalar.filter(k => k.branch === filterBranch || k.name.includes(filterBranch));
                const targetKasaIds = targetKasalar.map(k => k.id.toString());
                if (targetKasaIds.length > 0) {
                    filtered = filtered.filter(t => targetKasaIds.includes(String(t.kasaId || '')));
                }
            }
        }

        return filtered;
    };

    const getVisibleCustomers = () => {
        const isAdmin = currentUser === null || (currentUser.role && (currentUser.role.toLowerCase().includes('admin') || currentUser.role.toLowerCase().includes('müdür')));

        if (isAdmin || !hasPermission('branch_isolation')) {
            if (activeBranchName === 'Tümü' || activeBranchName === 'Hepsi') return customers;
            return customers.filter(c => (c.branch || 'Merkez') === activeBranchName);
        }

        const userBranch = currentUser?.branch || 'Merkez';
        return customers.filter(c => (c.branch || 'Merkez') === userBranch);
    };

    const getVisibleSuppliers = () => {
        if (currentUser === null) return suppliers;
        if (!hasPermission('supplier_view')) return [];
        return suppliers;
    };

    const getVisibleKasalar = () => {
        const isAdmin = currentUser === null || (currentUser.role && (currentUser.role.toLowerCase().includes('admin') || currentUser.role.toLowerCase().includes('müdür')));

        if (isAdmin || !hasPermission('branch_isolation')) {
            if (activeBranchName === 'Tümü' || activeBranchName === 'Hepsi') return kasalar;
            return kasalar.filter(k => (k.branch || 'Merkez') === activeBranchName || k.type === 'Banka');
        }

        const userBranch = currentUser?.branch || 'Merkez';
        return kasalar.filter(k => (k.branch || 'Merkez') === userBranch || k.type === 'Banka');
    };

    const addTransaction = (t: Omit<Transaction, 'id' | 'date'>) => {
        const newT: Transaction = {
            ...t as any,
            id: `TR-${Math.random().toString(36).substr(2, 9)}`,
            date: new Date().toISOString()
        };
        setTransactions(prev => [newT, ...prev]);

        // Update Kasa balance (Local Optimistic)
        setKasalar(prev => prev.map(k => {
            if (String(k.id || '') === String(t.kasaId || '')) {
                const isPositive = ['Sales', 'Collection'].includes(t.type);
                const effect = isPositive ? t.amount : -t.amount;
                return { ...k, balance: k.balance + effect };
            }
            return k;
        }));
    };

    const processSale = async (saleData: { items: { productId: number | string, qty: number }[], total: number, discountAmount?: number, kasaId: number | string, description: string, paymentMode?: string, customerId?: string | number, customerName?: string, installments?: number, pointsUsed?: number, couponCode?: string }) => {
        // 1. Update Local Inventory (Optimistic UI)
        setProducts(prevProducts => prevProducts.map(p => {
            const saleItem = saleData.items.find(si => si.productId === p.id);
            if (saleItem) {
                const newStock = p.stock - saleItem.qty;
                return {
                    ...p,
                    stock: newStock,
                    status: newStock <= 0 ? 'out' : (newStock < 5 ? 'low' : 'ok')
                };
            }
            return p;
        }));

        // 2. Add Transaction & Update Kasa (Local)
        addTransaction({
            type: 'Sales',
            description: saleData.description,
            amount: saleData.total,
            kasaId: saleData.kasaId
        } as any);

        // 3. Trigger Security Shield Sale Record
        recordSale();

        // 4. Save to Database (Async)
        try {
            // Find product details for proper JSON Log
            // Campaigns Logic
            let totalDiscount = 0;
            let earnedPoints = 0;

            const enrichedItems = saleData.items.map(item => {
                const p = products.find(prod => String(prod.id) === String(item.productId));
                const itemPrice = p ? Number(p.price) : 0;
                let itemDiscount = 0;
                let itemPoints = 0;

                // Check campaigns for this item
                campaigns.filter(c => c.isActive).forEach(camp => {
                    const matchBrand = camp.conditions.brands?.length ? camp.conditions.brands.includes(p?.brand) : true;
                    const matchCat = camp.conditions.categories?.length ? camp.conditions.categories.includes(p?.category) : true;
                    const matchPayment = camp.conditions.paymentMethod ? camp.conditions.paymentMethod === saleData.paymentMode : true;

                    if (matchBrand && matchCat && matchPayment) {
                        if (camp.type === 'payment_method_discount' && camp.discountRate) {
                            itemDiscount += itemPrice * camp.discountRate;
                        }
                        if (camp.type === 'loyalty_points' && camp.pointsRate) {
                            itemPoints += itemPrice * camp.pointsRate;
                        }
                    }
                });

                totalDiscount += itemDiscount * item.qty;
                earnedPoints += itemPoints * item.qty;

                return {
                    productId: item.productId,
                    name: p ? p.name : 'Bilinmeyen Ürün',
                    sku: p ? p.code : 'UNKNOWN',
                    qty: item.qty,
                    price: itemPrice,
                    vat: p ? (p.salesVat || 20) : 20,
                    earnedPoints: itemPoints * item.qty
                };
            });

            // Extract Customer Name from description if possible
            // Extract Customer Name logic improved
            const customerName = saleData.customerName || (saleData.description.includes('POS Satışı') ?
                saleData.description.split(':').pop()?.split('(')[0].trim() : 'Perakende Müşteri');

            const customer = customers.find(c => c.name === customerName);

            const res = await fetch('/api/sales/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...saleData,
                    items: enrichedItems,
                    total: saleData.total, // Already discounted in POS
                    customerName,
                    customerId: saleData.customerId || customer?.id,
                    paymentMode: saleData.paymentMode,
                    earnedPoints,
                    pointsUsed: saleData.pointsUsed || 0,
                    couponCode: saleData.couponCode
                })
            });

            const data = await res.json();
            if (data.success) {
                // Re-fetch kasalar to get updated balances
                const kRes = await fetch('/api/kasalar');
                const kData = await kRes.json();
                if (kData.success) setKasalar(kData.kasalar);

                // Re-fetch customers to get updated balances
                const cRes = await fetch('/api/customers');
                const cData = await cRes.json();
                if (cData.success) setCustomers(cData.customers);

                // Re-fetch transactions to sync IDs and everything
                const tRes = await fetch('/api/financials/transactions');
                const tData = await tRes.json();
                if (tData.success) setTransactions(tData.transactions);
                return true;
            }
            return false;

        } catch (error) {
            console.error('Database Sync Failed:', error);
            addNotification({ type: 'danger', icon: '⚠️', text: 'Satış veritabanına kaydedilemedi (Offline Mod).' });
            return false;
        }
    };

    const addFinancialTransaction = async (data: any) => {
        try {
            const res = await fetch('/api/financials/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await res.json();
            if (result.success) {
                // Refresh all related data
                await Promise.all([
                    refreshKasalar(),
                    refreshCustomers(),
                    refreshTransactions(),
                    refreshSuppliers()
                ]);

                return result;
            }
        } catch (error) {
            console.error('Transaction failed', error);
        }
    };

    const addCheck = async (data: any) => {
        try {
            const res = await fetch('/api/checks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await res.json();
            if (result.success) {
                const chRes = await fetch('/api/checks');
                const chData = await chRes.json();
                if (chData.success) setChecks(chData.checks);
                return result;
            }
        } catch (error) {
            console.error('Add check failed', error);
        }
    };

    const requestProductCreation = async (productData: Omit<Product, 'id'>) => {
        try {
            const res = await fetch('/api/inventory/pending', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'product',
                    productData,
                    requestedBy: currentUser?.name || 'Sistem'
                })
            });
            if (res.ok) {
                refreshPending();
                addNotification({ type: 'info', icon: '✨', text: 'Yeni ürün talebi oluşturuldu.' });
            }
        } catch (err) {
            console.error('Request product creation failed', err);
        }
    };

    const approveProduct = async (pendingId: string) => {
        try {
            const pending = pendingProducts.find(p => p.id === pendingId);
            if (!pending) return;

            const res = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pending.productData)
            });

            if (res.ok) {
                await fetch('/api/inventory/pending', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: pendingId, type: 'product', status: 'approved' })
                });
                refreshPending();
                const pRes = await fetch('/api/products');
                const pData = await pRes.json();
                if (pData.success) setProducts(pData.products);
                addNotification({ type: 'success', icon: '✅', text: `"${pending.productData.name}" ürünü onaylandı.` });
            }
        } catch (err) { console.error('Approve product failed', err); }
    };

    const rejectProduct = async (pendingId: string) => {
        try {
            await fetch('/api/inventory/pending', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: pendingId, type: 'product', status: 'rejected' })
            });
            refreshPending();
        } catch (err) { console.error('Reject product failed', err); }
    };

    const requestTransfer = async (transferData: Omit<PendingTransfer, 'id' | 'requestedBy' | 'requestedAt' | 'status'>) => {
        try {
            const res = await fetch('/api/inventory/pending', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'transfer',
                    transferData,
                    requestedBy: currentUser?.name || 'Sistem'
                })
            });
            if (res.ok) {
                refreshPending();
                addNotification({ type: 'info', icon: '📦', text: 'Stok transfer talebi oluşturuldu.' });
            }
        } catch (err) { console.error('Request transfer failed', err); }
    };

    const finalizeTransfer = async (id: string, action: 'RECEIVE' | 'CANCEL') => {
        try {
            const res = await fetch('/api/inventory/transfer', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, action, receivedBy: currentUser?.name || 'Sistem' })
            });
            const data = await res.json();
            if (data.success) {
                refreshStockTransfers();
                refreshProducts();
                return true;
            }
            return false;
        } catch (err) {
            console.error('Finalize transfer failed', err);
            return false;
        }
    };

    const startStockTransfer = async (data: Omit<StockTransfer, 'id' | 'shippedAt' | 'status'>) => {
        try {
            const res = await fetch('/api/inventory/transfer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await res.json();
            if (result.success) {
                refreshStockTransfers();
                refreshProducts();
                return true;
            }
            return false;
        } catch (err) {
            console.error('Start transfer failed', err);
            return false;
        }
    };

    const approveTransfer = async (transferId: string) => {
        try {
            const pending = pendingTransfers.find(t => t.id === transferId);
            if (!pending) return;

            const res = await fetch('/api/inventory/transfer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pending.transferData)
            });

            if (res.ok) {
                await fetch('/api/inventory/pending', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: transferId, type: 'transfer', status: 'approved' })
                });
                refreshPending();
                const pRes = await fetch('/api/products');
                const pData = await pRes.json();
                if (pData.success) setProducts(pData.products);
                addNotification({ type: 'success', icon: '✅', text: 'Stok transferi onaylandı.' });
            }
        } catch (err) { console.error('Approve transfer failed', err); }
    };

    const rejectTransfer = async (transferId: string) => {
        try {
            await fetch('/api/inventory/pending', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: transferId, type: 'transfer', status: 'rejected' })
            });
            refreshPending();
        } catch (err) { console.error('Reject transfer failed', err); }
    };

    // --- SETTINGS & DEFINITIONS ---
    const [serviceSettings, setServiceSettings] = useState({
        motoMaintenancePrice: 750,
        bikeMaintenancePrice: 350
    });
    const [brands, setBrands] = useState<string[]>([]);
    const [prodCats, setProdCats] = useState<string[]>([]);
    const [custClasses, setCustClasses] = useState<string[]>([]);
    const [suppClasses, setSuppClasses] = useState<string[]>([]);
    const [warranties, setWarranties] = useState<string[]>(['6 Ay', '1 Yıl', '2 Yıl', '3 Yıl', '5 Yıl']);

    const [invoiceSettings, setInvoiceSettings] = useState({
        kdvRates: [1, 10, 20],
        defaultNote: 'İşbu fatura 7 gün içinde itiraz edilmediği takdirde kabul edilmiş sayılır.',
        prefix: 'MTR',
        nextNumber: 2026001
    });

    const [salesExpenses, setSalesExpenses] = useState({
        posCommissions: [
            { installment: 'Tek Çekim', rate: 3.0 },
            { installment: '2 Taksit', rate: 3.5 },
            { installment: '3 Taksit', rate: 4.2 },
            { installment: '6 Taksit', rate: 5.8 },
            { installment: '9 Taksit', rate: 6.9 },
            { installment: '12 Taksit', rate: 7.8 },
        ],
        eInvoiceCost: 0.15,
        printingCost: 0.05,
        otherCosts: [
            { name: 'Poşet/Ambalaj', cost: 0.50 },
            { name: 'Kargo Maliyeti (Ortalama)', cost: 15.00 }
        ]
    });

    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [coupons, setCoupons] = useState<Coupon[]>([]);

    const refreshCampaigns = async () => {
        try {
            const res = await fetch('/api/campaigns');
            if (res.ok) setCampaigns(await res.json());
        } catch (e) { console.error('Campaigns fetch error', e); }
    };

    const refreshCoupons = async () => {
        try {
            const res = await fetch('/api/coupons');
            if (res.ok) setCoupons(await res.json());
        } catch (e) { console.error('Coupons fetch error', e); }
    };

    const refreshSettings = async () => {
        try {
            const res = await fetch('/api/settings');
            const data = await res.json();
            if (data && !data.error) {
                if (data.brands) setBrands(data.brands);
                if (data.prodCats) setProdCats(data.prodCats);
                if (data.custClasses) setCustClasses(data.custClasses);
                if (data.suppClasses) setSuppClasses(data.suppClasses);
                if (data.warranties) setWarranties(data.warranties);

                if (data.invoiceSettings) setInvoiceSettings(data.invoiceSettings);
                if (data.salesExpenses) setSalesExpenses(data.salesExpenses);

                if (data.motoMaintenancePrice !== undefined || data.bikeMaintenancePrice !== undefined) {
                    setServiceSettings(prev => ({
                        motoMaintenancePrice: data.motoMaintenancePrice !== undefined ? data.motoMaintenancePrice : prev.motoMaintenancePrice,
                        bikeMaintenancePrice: data.bikeMaintenancePrice !== undefined ? data.bikeMaintenancePrice : prev.bikeMaintenancePrice
                    }));
                }
                if (data.referralSettings) setReferralSettings(data.referralSettings);
            }
        } catch (e) { console.error('Settings fetch error:', e); }
        refreshCampaigns(); // Added as per instruction
        refreshCoupons();   // Added as per instruction
    };

    const allBrands = useMemo(() => {
        const fromProducts = Array.from(new Set(products.map(p => p.brand).filter(Boolean))) as string[];
        return Array.from(new Set([...brands, ...fromProducts])).sort();
    }, [brands, products]);

    const allCats = useMemo(() => {
        const fromProducts = Array.from(new Set(products.map(p => p.category).filter(Boolean))) as string[];
        return Array.from(new Set([...prodCats, ...fromProducts])).sort();
    }, [prodCats, products]);

    useEffect(() => {
        refreshSettings();
    }, []);

    const updateServiceSettings = async (newSettings: typeof serviceSettings) => {
        setServiceSettings(newSettings);
        try {
            await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newSettings)
            });
        } catch (e) { console.error('Service settings save error', e); }
    };

    const updateInvoiceSettings = async (settings: any) => {
        setInvoiceSettings(settings);
        try {
            await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ invoiceSettings: settings })
            });
        } catch (e) { console.error('Invoice settings save error', e); }
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

    const [referralSettings, setReferralSettings] = useState({
        referrerDiscount: 10, // %10
        refereeGift: 50       // 50 TL
    });

    const updateReferralSettings = async (settings: any) => {
        setReferralSettings(settings);
        try {
            await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ referralSettings: settings })
            });
        } catch (e) { console.error('Referral settings save error', e); }
    };

    const updateWarranties = async (list: string[]) => {
        setWarranties(list);
        try {
            await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ warranties: list })
            });
        } catch (e) { console.error('Warranties save error', e); }
    };

    const removeNotification = clearNotification;

    return (
        <AppContext.Provider value={{
            products: getVisibleProducts(),
            setProducts,
            kasalar: getVisibleKasalar(),
            setKasalar,
            transactions: getVisibleTransactions(),
            setTransactions,
            addTransaction,
            processSale,
            staff,
            setStaff,
            refreshStaff,
            currentUser,
            setCurrentUser,
            hasPermission,
            customers: getVisibleCustomers(),
            setCustomers,
            suppliers: getVisibleSuppliers(),
            setSuppliers,
            pendingProducts,
            requestProductCreation,
            approveProduct,
            rejectProduct,

            suspiciousEvents,
            addSuspiciousEvent,
            clearSuspiciousEvents,
            lastSaleTime,
            recordSale,
            notifications,
            addNotification,
            removeNotification,
            clearNotification: removeNotification,
            addFinancialTransaction,
            checks,
            addCheck,
            stockTransfers,
            refreshStockTransfers,
            startStockTransfer,
            finalizeTransfer,
            pendingTransfers,
            requestTransfer,
            approveTransfer,
            rejectTransfer,
            branches,
            refreshBranches,
            refreshCustomers,
            refreshTransactions,
            refreshKasalar,
            refreshSuppliers,
            serviceSettings,
            updateServiceSettings,
            invoiceSettings,
            updateInvoiceSettings,
            salesExpenses,
            updateSalesExpenses,
            brands,
            setBrands,
            prodCats,
            setProdCats,
            allBrands,
            allCats,
            custClasses,
            setCustClasses,
            suppClasses,
            setSuppClasses,
            warranties,
            setWarranties,
            refreshSettings,
            updateWarranties,
            activeBranchName,
            setActiveBranchName,
            campaigns,
            refreshCampaigns,
            coupons,
            refreshCoupons,
            referralSettings,
            updateReferralSettings
        }}>
            {children}
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
