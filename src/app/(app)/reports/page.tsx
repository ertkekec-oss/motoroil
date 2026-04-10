"use client";

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/contexts/AppContext';
import { useFinancials } from '@/contexts/FinancialContext';
import { useInventory } from '@/contexts/InventoryContext';
import { useCRM } from '@/contexts/CRMContext';
import { useModal } from '@/contexts/ModalContext';
import DailyReportContent from '@/components/DailyReportContent';
import SupplierReportContent from '@/components/SupplierReportContent';
import ExportReportsContent from '@/components/ExportReportsContent';
import ManufacturingReportContent from '@/components/ManufacturingReportContent';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, Legend
} from 'recharts';
import { BarChart3, PieChart as PieChartIcon, LineChart as LineChartIcon, Target, Building2, Store, Users, FileText, Factory, Presentation, Package, FileDown, Briefcase, Activity } from 'lucide-react';

// Chart Colors
const COLORS = {
    primary: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    purple: '#8b5cf6',
    pink: '#ec4899',
    cyan: '#06b6d4',
    indigo: '#6366f1',
};


const REPORT_CATEGORIES = [
    {
        id: 'finance',
        label: 'Finans & İş Zekası',
        reports: [
            { id: 'overview', label: 'Genel Kurumsal Özet', icon: <Presentation className="w-4 h-4" /> },
            { id: 'finance', label: 'Detaylı Finansal Durum', icon: <BarChart3 className="w-4 h-4" /> },
            { id: 'cashflow', label: 'Nakit Akış Analizi', icon: <Activity className="w-4 h-4" /> },
        ]
    },
    {
        id: 'operations',
        label: 'Saha & Operasyon',
        reports: [
            { id: 'daily', label: 'Gün Sonu & Kasa Ana Ekranı', icon: <Store className="w-4 h-4" /> },
            { id: 'sales', label: 'Satış İşlemleri', icon: <LineChartIcon className="w-4 h-4" /> },
            { id: 'customers', label: 'Müşteri Skor & Performans', icon: <Users className="w-4 h-4" /> },
        ]
    },
    {
        id: 'mrp',
        label: 'Üretim (MRP) & Envanter',
        reports: [
            { id: 'manufacturing', label: 'Üretim & İstasyon Verimi', icon: <Factory className="w-4 h-4" /> },
            { id: 'inventory', label: 'Stok Devir & Atıl Yük', icon: <Package className="w-4 h-4" /> },
            { id: 'suppliers', label: 'Tedarikçi Ağı Performansı', icon: <Briefcase className="w-4 h-4" /> },
        ]
    },
    {
        id: 'system',
        label: 'Sistem & Dışa Aktarımlar',
        reports: [
            { id: 'exports', label: 'Arşiv ve Excel/PDF Çıktıları', icon: <FileDown className="w-4 h-4" /> },
        ]
    }
];

export default function ReportsPage() {
    const { branches, currentUser, hasPermission, hasFeature } = useApp();
    const router = useRouter();

    useEffect(() => {
        if (!hasFeature('analytics') && currentUser !== null) {
            router.push('/billing?upsell=analytics');
        }
    }, [hasFeature, currentUser, router]);

    const { transactions, kasalar } = useFinancials();
    const { products } = useInventory();
    const { customers, suppliers } = useCRM();
    const { showSuccess, showError } = useModal();

    const isSystemAdmin = currentUser === null;
    const canViewAll = isSystemAdmin || !hasPermission('branch_isolation');

    // States
    const [activeTab, setActiveTab] = useState<'overview' | 'sales' | 'finance' | 'inventory' | 'customers' | 'cashflow' | 'daily' | 'suppliers' | 'exports' | 'manufacturing'>('overview');
    const [reportScope, setReportScope] = useState<'all' | 'single'>(canViewAll ? 'all' : 'single');
    const [selectedBranch, setSelectedBranch] = useState(currentUser?.branch || 'Merkez');
    const [dateRange, setDateRange] = useState({
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });
    // Performance Optimization: Debounce date changes
    const [localDateRange, setLocalDateRange] = useState(dateRange);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDateRange(localDateRange);
        }, 800);
        return () => clearTimeout(timer);
    }, [localDateRange]);
    const [paymentPlans, setPaymentPlans] = useState<any[]>([]);

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const res = await fetch('/api/financials/payment-plans');
                const data = await res.json();
                if (data.success) setPaymentPlans(data.plans);
            } catch (err) { console.error('Plans fetch error:', err); }
        };
        fetchPlans();
    }, []);

    // Get unique branches from data
    const availableBranches = useMemo(() => {
        const branchSet = new Set<string>();
        transactions.forEach(t => {
            const branch = (t as any).branch;
            if (branch) branchSet.add(branch);
        });
        products.forEach(p => {
            if (p.branch) branchSet.add(p.branch);
        });
        customers.forEach(c => {
            if (c.branch) branchSet.add(c.branch);
        });
        // Add branches from branches table
        branches.forEach(b => branchSet.add(b.name));

        return Array.from(branchSet).sort();
    }, [transactions, products, customers, branches]);

    // Filter transactions by date range AND branch
    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            // Date filter
            const tDate = new Date(t.date);
            const start = new Date(dateRange.start);
            const end = new Date(dateRange.end);
            end.setHours(23, 59, 59, 999);
            const dateMatch = tDate >= start && tDate <= end;

            // Branch filter
            if (reportScope === 'all') {
                return dateMatch;
            } else {
                const tBranch = (t as any).branch;
                const branchMatch = tBranch === selectedBranch || (!tBranch && selectedBranch === 'Merkez');
                return dateMatch && branchMatch;
            }
        });
    }, [transactions, dateRange, reportScope, selectedBranch]);

    // Filter and process products by branch/stock
    const filteredProducts = useMemo(() => {
        return products.map(p => {
            let effectiveStock = 0;
            if (reportScope === 'all') {
                // If there are branch-specific stocks, use their sum. Otherwise fallback to p.stock
                if (p.stocks && p.stocks.length > 0) {
                    effectiveStock = p.stocks.reduce((sum: number, s: any) => sum + Number(s.quantity), 0);
                } else {
                    effectiveStock = Number(p.stock);
                }
            } else {
                // Find stock for specific branch
                const branchStock = p.stocks?.find((s: any) => s.branch === selectedBranch);
                if (branchStock) {
                    effectiveStock = Number(branchStock.quantity);
                } else {
                    // Fallback to p.stock ONLY if branch names match (legacy data)
                    const pBranch = (p as any).branch || 'Merkez';
                    effectiveStock = (pBranch === selectedBranch) ? Number(p.stock) : 0;
                }
            }
            return { ...p, stock: effectiveStock };
        }).filter(p => {
            // Only show products that actually exist in this scope (positive stock or belongs to branch)
            if (reportScope === 'all') return true;
            const branchMatches = (p as any).branch === selectedBranch || (!(p as any).branch && selectedBranch === 'Merkez');
            return branchMatches || p.stock > 0;
        });
    }, [products, reportScope, selectedBranch]);

    // Filter customers by branch
    const filteredCustomers = useMemo(() => {
        if (reportScope === 'all') {
            return customers;
        }
        return customers.filter(c => c.branch === selectedBranch || (!c.branch && selectedBranch === 'Merkez'));
    }, [customers, reportScope, selectedBranch]);

    // Filter kasalar by branch (if they have branch property)
    const filteredKasalar = useMemo(() => {
        if (reportScope === 'all') {
            return kasalar;
        }
        // Kasalar might not have branch, so we show all for now
        return kasalar;
    }, [kasalar, reportScope, selectedBranch]);


    // Sales Analytics
    const salesAnalytics = useMemo(() => {
        const salesTx = filteredTransactions.filter(t => t.type === 'Sales');
        const revenue = salesTx.reduce((sum, t) => sum + Number(t.amount), 0);
        const count = salesTx.length;
        const avgTicket = count > 0 ? revenue / count : 0;

        // Daily breakdown
        const dailyStats: Record<string, { date: string; revenue: number; count: number; profit: number }> = {};
        salesTx.forEach(t => {
            const dateKey = new Date(t.date).toLocaleDateString('tr-TR');
            if (!dailyStats[dateKey]) {
                dailyStats[dateKey] = { date: dateKey, revenue: 0, count: 0, profit: 0 };
            }
            dailyStats[dateKey].revenue += Number(t.amount);
            dailyStats[dateKey].count += 1;
            dailyStats[dateKey].profit += Number(t.amount) * 0.35; // 35% estimated margin
        });

        const dailyData = Object.values(dailyStats).sort((a, b) =>
            new Date(a.date.split('.').reverse().join('-')).getTime() -
            new Date(b.date.split('.').reverse().join('-')).getTime()
        );

        return { revenue, count, avgTicket, dailyData };
    }, [filteredTransactions]);

    // Expense Analytics
    const expenseAnalytics = useMemo(() => {
        const expenseTx = filteredTransactions.filter(t => t.type === 'Expense');
        const total = expenseTx.reduce((sum, t) => sum + Number(t.amount), 0);

        // Category breakdown
        const byCategory: Record<string, number> = {};
        expenseTx.forEach(t => {
            const cat = t.category || 'Genel';
            byCategory[cat] = (byCategory[cat] || 0) + Number(t.amount);
        });

        const categoryData = Object.entries(byCategory).map(([name, value]) => ({ name, value }));

        return { total, byCategory, categoryData };
    }, [filteredTransactions]);

    // Financial Summary
    const financialSummary = useMemo(() => {
        const revenue = salesAnalytics.revenue;
        const expenses = expenseAnalytics.total;
        const cogs = revenue * 0.65; // 65% COGS estimate
        const grossProfit = revenue - cogs;
        const hiddenCosts = {
            pos: revenue * 0.025, // 2.5% POS commission estimate
            eDoc: salesAnalytics.count * 1.25, // 1.25 TL per invoice
            paper: salesAnalytics.count * 0.50, // 0.50 TL per printout
            returns: revenue * 0.01 // 1% returns estimate
        };

        const totalHiddenCosts = Object.values(hiddenCosts).reduce((a, b) => a + Number(b), 0);
        const netProfit = (revenue - cogs - expenses) - totalHiddenCosts;
        const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

        // Detailed Financial Status
        const receivable = filteredCustomers.filter(c => Number(c.balance) > 0).reduce((a, b) => a + Number(b.balance), 0);
        const payable = Math.abs(filteredCustomers.filter(c => Number(c.balance) < 0).reduce((a, b) => a + Number(b.balance), 0)) +
            Math.abs(suppliers.filter(s => Number(s.balance) < 0).reduce((a, b) => a + Number(b.balance), 0));

        let plannedReceivable = 0;
        let plannedDebt = 0;

        paymentPlans.forEach(plan => {
            const isMatched = reportScope === 'all' || plan.branch === selectedBranch;
            if (!isMatched) return;

            plan.installments.forEach((inst: any) => {
                if (inst.status === 'Pending') {
                    if (plan.direction === 'IN') plannedReceivable += Number(inst.amount);
                    else plannedDebt += Number(inst.amount);
                }
            });
        });

        const totalReceivable = receivable + plannedReceivable;
        const totalPayable = payable + plannedDebt;

        return {
            revenue,
            expenses,
            cogs,
            grossProfit,
            netProfit,
            profitMargin,
            hiddenCosts,
            receivable,
            payable,
            plannedReceivable,
            plannedDebt,
            totalReceivable,
            totalPayable
        };
    }, [salesAnalytics, expenseAnalytics, filteredCustomers, suppliers, paymentPlans, reportScope, selectedBranch]);

    // Inventory Stats
    const inventoryStats = useMemo(() => {
        const totalQty = filteredProducts.reduce((a, b) => a + Number(b.stock), 0);
        const totalValue = filteredProducts.reduce((a, b) => a + (Number(b.buyPrice || b.price) * Number(b.stock)), 0);
        const lowStockCount = filteredProducts.filter(p => Number(p.stock) <= Number(p.minStock)).length;

        const topProducts = [...filteredProducts]
            .map(p => ({
                ...p,
                stockValue: Number(p.price) * Number(p.stock)
            }))
            .sort((a, b) => b.stockValue - a.stockValue)
            .slice(0, 8);

        return { totalQty, totalValue, lowStockCount, topProducts };
    }, [filteredProducts]);

    // Top Customers by Balance (filtered by branch)
    const topCustomers = useMemo(() => {
        return [...filteredCustomers]
            .sort((a, b) => Math.abs(Number(b.balance)) - Math.abs(Number(a.balance)))
            .slice(0, 6);
    }, [filteredCustomers]);

    // Recent Transactions
    const recentTransactions = useMemo(() => {
        return [...filteredTransactions]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 10);
    }, [filteredTransactions]);

    // Cash Flow Data
    const cashFlowData = useMemo(() => {
        const dailyFlow: Record<string, { date: string; income: number; expense: number; net: number }> = {};

        filteredTransactions.forEach(t => {
            const dateKey = new Date(t.date).toLocaleDateString('tr-TR');
            if (!dailyFlow[dateKey]) {
                dailyFlow[dateKey] = { date: dateKey, income: 0, expense: 0, net: 0 };
            }

            if (t.type === 'Sales' || t.type === 'Collection') {
                dailyFlow[dateKey].income += Number(t.amount);
            } else if (t.type === 'Expense' || t.type === 'Payment') {
                dailyFlow[dateKey].expense += Number(t.amount);
            }
            dailyFlow[dateKey].net = dailyFlow[dateKey].income - dailyFlow[dateKey].expense;
        });

        return Object.values(dailyFlow).sort((a, b) =>
            new Date(a.date.split('.').reverse().join('-')).getTime() -
            new Date(b.date.split('.').reverse().join('-')).getTime()
        );
    }, [filteredTransactions]);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0B1220] p-4 sm:p-6 lg:p-8 pb-24 animate-in fade-in duration-300 flex flex-col xl:flex-row gap-8 items-start">
            
            {/* Left Sidebar - Report Studio Index */}
            <aside className="w-full xl:w-72 shrink-0 space-y-8 sticky top-8">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        Rapor Stüdyosu
                    </h1>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                        Tüm işletme zekası ve anlık veriler
                    </p>
                </div>

                <div className="space-y-6">
                    {REPORT_CATEGORIES.map(category => (
                        <div key={category.id}>
                            <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-3 mb-2">{category.label}</div>
                            <div className="space-y-1">
                                {category.reports.map(report => (
                                    <button
                                        key={report.id}
                                        onClick={() => setActiveTab(report.id as any)}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === report.id ? 'bg-white shadow border border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-white/5 border border-transparent'}`}
                                    >
                                        <span className={activeTab === report.id ? 'text-blue-500' : 'text-slate-400'}>{report.icon}</span>
                                        {report.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </aside>

            {/* Right Main Content */}
            <main className="flex-1 min-w-0 w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 shadow-sm rounded-3xl p-6 lg:p-8">
                
                {/* Context & Filters Bar */}
                <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-white/5 mb-8">
                    
                    {/* Scope Title */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                            <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-sm font-black text-slate-900 dark:text-white">
                                {REPORT_CATEGORIES.flatMap(c => c.reports).find(r => r.id === activeTab)?.label}
                            </div>
                            <div className="text-xs font-semibold text-slate-500">
                                {reportScope === 'all' ? 'Tüm Organizasyon Verisi' : `${selectedBranch} Şubesi Verisi`}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                        {/* Scope Selector (if admin) */}
                        {canViewAll && (
                            <div className="flex items-center gap-1 bg-white dark:bg-[#0f172a] p-1 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm">
                                <button
                                    onClick={() => setReportScope('all')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${reportScope === 'all' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                                >
                                    Tüm Organizasyon
                                </button>
                                <button
                                    onClick={() => setReportScope('single')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${reportScope === 'single' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                                >
                                    Şube Bazlı
                                </button>
                                
                                {reportScope === 'single' && (
                                    <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
                                )}
                                
                                {reportScope === 'single' && (
                                    <select
                                        value={selectedBranch}
                                        onChange={(e) => setSelectedBranch(e.target.value)}
                                        className="bg-transparent text-slate-900 dark:text-white text-xs font-bold outline-none cursor-pointer pr-4 pl-1"
                                    >
                                        {availableBranches.map(branch => (
                                            <option key={branch} value={branch} className="text-slate-900">{branch}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        )}

                        {/* Date Range Picker */}
                        <div className="flex items-center gap-2 bg-white dark:bg-[#0f172a] px-3 py-2 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm shrink-0">
                            <input
                                type="date"
                                value={localDateRange.start}
                                onChange={e => setLocalDateRange({ ...localDateRange, start: e.target.value })}
                                className="bg-transparent border-none text-slate-900 dark:text-white text-xs font-bold outline-none cursor-pointer"
                            />
                            <span className="text-slate-300 dark:text-slate-600 font-bold">→</span>
                            <input
                                type="date"
                                value={localDateRange.end}
                                onChange={e => setLocalDateRange({ ...localDateRange, end: e.target.value })}
                                className="bg-transparent border-none text-slate-900 dark:text-white text-xs font-bold outline-none cursor-pointer"
                            />
                        </div>
                    </div>
                </header>

<div className="animate-fade-in">

                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <div className="flex flex-col gap-6">

                            {/* KPI Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 shadow-sm rounded-2xl p-6 flex flex-col justify-center transition-all hover:shadow-md relative overflow-hidden">
                                    <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 z-10 relative">Toplam Ciro</div>
                                    <div className="text-3xl font-black text-slate-900 dark:text-white mb-1 z-10 relative">₺{financialSummary.revenue.toLocaleString()}</div>
                                    <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 z-10 relative">{salesAnalytics.count} işlem hacmi</div>
                                    <div className="absolute top-0 right-0 p-4 opacity-5 text-4xl">📈</div>
                                </div><div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 shadow-sm rounded-2xl p-6 flex flex-col justify-center transition-all hover:shadow-md relative overflow-hidden">
                                    <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 z-10 relative">Net Kâr</div>
                                    <div className="text-3xl font-black text-emerald-600 mb-1 z-10 relative">₺{financialSummary.netProfit.toLocaleString()}</div>
                                    <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 z-10 relative">% {financialSummary.profitMargin.toFixed(1)} kâr marjı</div>
                                    <div className="absolute top-0 right-0 p-4 opacity-5 text-4xl">💰</div>
                                </div><div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 shadow-sm rounded-2xl p-6 flex flex-col justify-center transition-all hover:shadow-md relative overflow-hidden">
                                    <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 z-10 relative">Ortalama Sepet</div>
                                    <div className="text-3xl font-black text-slate-900 dark:text-white mb-1 z-10 relative">₺{salesAnalytics.avgTicket.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                                    <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 z-10 relative">İşlem başına tutar</div>
                                    <div className="absolute top-0 right-0 p-4 opacity-5 text-4xl">💳</div>
                                </div><div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 shadow-sm rounded-2xl p-6 flex flex-col justify-center transition-all hover:shadow-md relative overflow-hidden">
                                    <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 z-10 relative">Toplam Gider</div>
                                    <div className="text-3xl font-black text-slate-900 dark:text-white mb-1 z-10 relative">₺{financialSummary.expenses.toLocaleString()}</div>
                                    <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 z-10 relative">Kayıtlı giderler toplamı</div>
                                    <div className="absolute top-0 right-0 p-4 opacity-5 text-4xl">📉</div>
                                </div>
                            </div>

                            {/* Charts Row */}
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                                {/* Sales Trend */}
                                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 shadow-sm rounded-2xl p-6">
                                    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-5 tracking-tight border-b border-slate-100 dark:border-white/5 pb-3">Satış Trendi</h3>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <AreaChart data={salesAnalytics.dailyData}>
                                            <defs>
                                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                                            <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} />
                                            <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} tickFormatter={(val) => `₺${(val / 1000).toFixed(0)}k`} />
                                            <Tooltip
                                                contentStyle={{ background: 'rgba(23, 23, 23, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                                formatter={(value: any) => [`₺${Number(value).toLocaleString()}`, 'Ciro']}
                                            />
                                            <Area type="monotone" dataKey="revenue" stroke={COLORS.primary} strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Expense Breakdown */}
                                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 shadow-sm rounded-2xl p-6">
                                    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-5 tracking-tight border-b border-slate-100 dark:border-white/5 pb-3">Gider Dağılımı</h3>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={expenseAnalytics.categoryData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={90}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {expenseAnalytics.categoryData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index % Object.values(COLORS).length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ background: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px' }}
                                                formatter={(value: any) => `₺${Number(value).toLocaleString()}`}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            
                            {/* Recent Transactions DataGrid */}
                            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 shadow-sm rounded-2xl overflow-hidden flex flex-col">
                                <div className="p-5 border-b border-slate-100 dark:border-white/5">
                                    <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Son Tamamlanan İşlemler</h3>
                                    <p className="text-xs text-slate-500 font-semibold mt-0.5">İşlemlere tıklayarak detayına (Drill-down) inebilirsiniz.</p>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-white/5">
                                                <th className="p-4 whitespace-nowrap">Tarih</th>
                                                <th className="p-4 whitespace-nowrap">Tür</th>
                                                <th className="p-4 whitespace-nowrap">Açıklama / Kategori</th>
                                                <th className="p-4 whitespace-nowrap text-right">Tutar</th>
                                                <th className="p-4 whitespace-nowrap text-right">Aksiyon</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recentTransactions.map((tx: any, i) => (
                                                <tr key={i} className="group border-b border-slate-100 dark:border-white/5 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer" onClick={() => {
                                                    if(tx.type === 'Sales') router.push('/sales');
                                                    if(tx.type === 'Expense') router.push('/expenses');
                                                }}>
                                                    <td className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">
                                                        {new Date(tx.date).toLocaleString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${tx.type === 'Sales' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'}`}>
                                                            {tx.type}
                                                        </span>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">{tx.description || 'Sistem İşlemi'}</div>
                                                        <div className="text-xs text-slate-400 font-semibold">{tx.category || '-'}</div>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <div className={`text-base font-black ${tx.type === 'Sales' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                                                            {tx.type === 'Sales' ? '+' : '-'}₺{Number(tx.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <button className="text-slate-400 group-hover:text-blue-500 transition-colors text-xs font-bold uppercase tracking-wider">İncele →</button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {recentTransactions.length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className="p-8 text-center text-slate-400 text-sm font-semibold">Bu dönemde işlem kaydı bulunamadı.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Sales Tab */}
                    {activeTab === 'sales' && (
                        <div className="flex flex-col gap-6">
                            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 shadow-sm rounded-2xl p-6">
                                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-5 tracking-tight border-b border-slate-100 dark:border-white/5 pb-3">Günlük Satış Detayı</h3>
                                <ResponsiveContainer width="100%" height={400}>
                                    <BarChart data={salesAnalytics.dailyData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                                        <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} />
                                        <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} />
                                        <Tooltip
                                            contentStyle={{ background: 'rgba(23, 23, 23, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                        />
                                        <Legend />
                                        <Bar dataKey="revenue" name="Ciro (₺)" fill={COLORS.primary} radius={[8, 8, 0, 0]} />
                                        <Bar dataKey="count" name="İşlem Sayısı" fill={COLORS.success} radius={[8, 8, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* Finance Tab */}
                    {activeTab === 'finance' && (
                        <div className="flex flex-col gap-6">

                            {/* Financial Detailed Table */}
                            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 shadow-sm rounded-2xl p-8">
                                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6 tracking-tight border-b border-slate-100 dark:border-white/5 pb-4">Detaylı Finansal Tablo</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>

                                    <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-xl p-5">
                                        <div className="text-xs text-slate-500 font-bold mb-2 tracking-wide">CİRO VE KARLILIK</div>
                                        <div className="flex flex-col gap-3">
                                            <div className="flex-between"><span>Toplam Ciro</span> <span className="font-bold text-slate-900 dark:text-white">₺{financialSummary.revenue.toLocaleString()}</span></div>
                                            <div className="flex-between"><span>Tahmini Maliyet (COGS)</span> <span className="font-bold text-red-600 dark:text-red-500">-₺{financialSummary.cogs.toLocaleString()}</span></div>
                                            <div className="flex-between"><span>Operasyonel Giderler</span> <span className="font-bold text-red-600 dark:text-red-500">-₺{financialSummary.expenses.toLocaleString()}</span></div>
                                            <div className="flex-between" style={{ paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)', color: COLORS.success, fontWeight: '900' }}>
                                                <span>Net Dönem Karı</span> <span>₺{financialSummary.netProfit.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-xl p-5">
                                        <div className="text-xs text-slate-500 font-bold mb-2 tracking-wide">ALACAK VE BORÇ DURUMU</div>
                                        <div className="flex flex-col gap-3">
                                            <div className="flex-between"><span>Müşteri Alacakları (Güncel)</span> <span className="font-bold text-slate-900 dark:text-white">₺{financialSummary.receivable.toLocaleString()}</span></div>
                                            <div className="flex-between"><span>Tedarikçi/Cari Borçlar</span> <span className="font-bold text-red-600 dark:text-red-500">-₺{financialSummary.payable.toLocaleString()}</span></div>
                                            <div className="flex-between" style={{ paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                                <span>Cari Net Durum</span> <span className={`font-black ${(financialSummary.receivable - financialSummary.payable) >= 0 ? "text-emerald-600 dark:text-emerald-500" : "text-red-600 dark:text-red-500"}`}>₺{(financialSummary.receivable - financialSummary.payable).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-xl p-5">
                                        <div className="text-xs text-slate-500 font-bold mb-2 tracking-wide">PLANLI (GELECEK) ÖDEMELER</div>
                                        <div className="flex flex-col gap-3">
                                            <div className="flex-between"><span>Planlı Alacaklar (Taksitler)</span> <span className="font-bold text-emerald-600 dark:text-emerald-500">₺{financialSummary.plannedReceivable.toLocaleString()}</span></div>
                                            <div className="flex-between"><span>Planlı Borçlar (Taksitler)</span> <span className="font-bold text-red-600 dark:text-red-500">-₺{financialSummary.plannedDebt.toLocaleString()}</span></div>
                                            <div className="flex-between" style={{ paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)', fontWeight: '900' }}>
                                                <span>Toplam Net Alacak</span> <span className="font-bold text-blue-600 dark:text-blue-500">₺{(financialSummary.totalReceivable - financialSummary.totalPayable).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                </div>

                                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="bg-white dark:bg-[#0f172a] border border-emerald-200 dark:border-emerald-900 shadow-sm rounded-2xl p-6 flex flex-col justify-center">
                                        <div className="text-sm font-bold text-slate-500 tracking-wide uppercase mb-2 z-10 relative"></div>
                                        <div className="text-4xl font-black text-emerald-600 dark:text-emerald-500 z-10 relative">₺{financialSummary.totalReceivable.toLocaleString()}</div>
                                        <div className="text-xs font-medium text-slate-400 mt-2 z-10 relative">Cari + Gelecek Taksitler</div>
                                    </div>
                                    <div className="bg-white dark:bg-[#0f172a] border border-red-200 dark:border-red-900 shadow-sm rounded-2xl p-6 flex flex-col justify-center">
                                        <div className="text-sm font-bold text-slate-500 tracking-wide uppercase mb-2 z-10 relative"></div>
                                        <div className="text-4xl font-black text-red-600 dark:text-red-500 z-10 relative">₺{financialSummary.totalPayable.toLocaleString()}</div>
                                        <div className="text-xs font-medium text-slate-400 mt-2 z-10 relative">Cari + Gelecek Taksitler</div>
                                    </div>
                                </div>
                            </div>

                            {/* Hidden Costs Breakdown */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 shadow-sm rounded-2xl p-6 flex flex-col justify-center">
                                    
                                    <div className="text-xs text-slate-500 font-bold mb-2 tracking-wide">POS KOMİSYON (Tahmini)</div>
                                    <div className="text-2xl font-black text-slate-900 dark:text-white">₺{financialSummary.hiddenCosts.pos.toLocaleString()}</div>
                                    <p className="text-xs font-semibold text-slate-400 mt-2">%2.5 ortalama komisyon</p>
                                </div>

                                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 shadow-sm rounded-2xl p-6 flex flex-col justify-center">
                                    
                                    <div className="text-xs text-slate-500 font-bold mb-2 tracking-wide">E-BELGE MALİYETİ</div>
                                    <div className="text-2xl font-black text-slate-900 dark:text-white">₺{financialSummary.hiddenCosts.eDoc.toLocaleString()}</div>
                                    <p className="text-xs font-semibold text-slate-400 mt-2">{salesAnalytics.count} işlem × ₺1.25</p>
                                </div>

                                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 shadow-sm rounded-2xl p-6 flex flex-col justify-center">
                                    
                                    <div className="text-xs text-slate-500 font-bold mb-2 tracking-wide">KAĞIT/TONER</div>
                                    <div className="text-2xl font-black text-slate-900 dark:text-white">₺{financialSummary.hiddenCosts.paper.toLocaleString()}</div>
                                    <p className="text-xs font-semibold text-slate-400 mt-2">{salesAnalytics.count} işlem × ₺0.50</p>
                                </div>
                            </div>
                        </div>
                    )}

                    
                    {/* Inventory Tab */}
                    {activeTab === 'inventory' && (
                        <div className="flex flex-col gap-6">

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 shadow-sm rounded-2xl p-6 flex flex-col justify-center relative overflow-hidden">
                                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 z-10 relative">TOPLAM ENVANTER DEĞERİ (ALIŞ)</div>
                                    <div className="text-4xl font-black text-slate-900 dark:text-white z-10 relative mb-1">₺{inventoryStats.totalValue.toLocaleString()}</div>
                                    <div className="text-xs font-medium text-slate-400 mt-2 z-10 relative">Tüm stokların maliyet bedeli toplamı</div>
                                </div>
                                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 shadow-sm rounded-2xl p-6 flex flex-col justify-center relative overflow-hidden">
                                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 z-10 relative">TOPLAM STOK ADEDİ</div>
                                    <div className="text-4xl font-black text-slate-900 dark:text-white z-10 relative mb-1">{inventoryStats.totalQty.toLocaleString()}</div>
                                    <div className="text-xs font-medium text-slate-400 mt-2 z-10 relative">Şu an depoda bulunan toplam ürün sayısı</div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 shadow-sm rounded-2xl overflow-hidden flex flex-col">
                                <div className="p-5 border-b border-slate-100 dark:border-white/5 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                    <div>
                                        <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">En Yüksek Değerli Envanter (Top 8)</h3>
                                        <p className="text-xs text-slate-500 font-semibold mt-0.5">Depo ve maliyet değeri en yüksek operasyonel emtialar.</p>
                                    </div>
                                    <button onClick={() => router.push('/inventory')} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-bold transition-colors">
                                        Tüm Stoğu Aç
                                    </button>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-white/5">
                                                <th className="p-4 whitespace-nowrap">Ürün Referansı</th>
                                                <th className="p-4 whitespace-nowrap">Stok Miktarı</th>
                                                <th className="p-4 whitespace-nowrap">Birim Maliyet</th>
                                                <th className="p-4 whitespace-nowrap text-right">Toplam Değer</th>
                                                <th className="p-4 whitespace-nowrap text-right">Durum</th>
                                                <th className="p-4 whitespace-nowrap text-right">Aksiyon</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {inventoryStats.topProducts.map((product: any, i: number) => {
                                                const isLow = Number(product.stock) < Number(product.minStock);
                                                return (
                                                <tr key={i} className="group border-b border-slate-100 dark:border-white/5 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer" onClick={() => router.push(`/inventory/${product.id || ''}`)}>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-center text-slate-400 font-black text-[10px]">
                                                                SKU
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors max-w-[200px] truncate" title={product.name}>{product.name}</div>
                                                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{product.barcode || 'BARKODSUZ'}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-sm font-black text-slate-700 dark:text-slate-300">
                                                        {product.stock} {product.unit || 'Adet'}
                                                    </td>
                                                    <td className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">
                                                        ₺{Number(product.buyPrice || product.price).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <div className="text-base font-black text-slate-900 dark:text-white">
                                                            ₺{product.stockValue.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${isLow ? 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'}`}>
                                                            {isLow ? 'KRİTİK' : 'NORMAL'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <button className="text-slate-400 group-hover:text-blue-500 transition-colors text-xs font-bold uppercase tracking-wider">İncele →</button>
                                                    </td>
                                                </tr>
                                            )})}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Customers Tab */}
                    {activeTab === 'customers' && (
                        <div className="flex flex-col gap-6">
                            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 shadow-sm rounded-2xl overflow-hidden flex flex-col">
                                <div className="p-5 border-b border-slate-100 dark:border-white/5 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                    <div>
                                        <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Kritik Cari Bakiyeler</h3>
                                        <p className="text-xs text-slate-500 font-semibold mt-0.5">Sadece bakiyesi olan veya borcu bulunan müşteri (Cari) listesi. Detaylar için Drill-down özelliğini kullanın.</p>
                                    </div>
                                    <button onClick={() => router.push('/customers')} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-bold transition-colors">
                                        Tüm Müşterileri Aç
                                    </button>
                                </div>
                                
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-white/5">
                                                <th className="p-4 whitespace-nowrap">Müşteri / Cari Ünvan</th>
                                                <th className="p-4 whitespace-nowrap">İletişim</th>
                                                <th className="p-4 whitespace-nowrap">Durum Tipi</th>
                                                <th className="p-4 whitespace-nowrap text-right">Açık Bakiye</th>
                                                <th className="p-4 whitespace-nowrap text-right">Aksiyon</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {topCustomers.map((customer: any, i: number) => {
                                                const balance = Number(customer.balance);
                                                return (
                                                <tr key={i} className="group border-b border-slate-100 dark:border-white/5 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer" onClick={() => router.push(`/customers/${customer.id}`)}>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 font-black text-xs">
                                                                {customer.name?.slice(0, 2).toUpperCase() || 'CR'}
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">{customer.name}</div>
                                                                <div className="text-xs text-slate-400 font-semibold">{customer.taxNumber ? `VKN: ${customer.taxNumber}` : 'Kayıtsız VKN'}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">
                                                        {customer.phone || 'Girilmemiş'}
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${balance > 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : balance < 0 ? 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'}`}>
                                                            {balance > 0 ? 'Alacaklıyız' : balance < 0 ? 'Borçluyuz' : 'Dengede'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <div className={`text-base font-black ${balance > 0 ? 'text-emerald-600 dark:text-emerald-400' : balance < 0 ? 'text-red-600 dark:text-red-500' : 'text-slate-900 dark:text-white'}`}>
                                                            {balance > 0 ? '+' : ''}₺{balance.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <button className="text-slate-400 group-hover:text-blue-500 transition-colors text-xs font-bold uppercase tracking-wider">Cari Ekstresi →</button>
                                                    </td>
                                                </tr>
                                            )})}
                                            {topCustomers.length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className="p-8 text-center text-slate-400 text-sm font-semibold">Aktif cari veya bakiye kaydı bulunamadı.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Cash Flow Tab */}
                    {activeTab === 'cashflow' && (
                        <div className="flex flex-col gap-6">
                            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 shadow-sm rounded-2xl p-6">
                                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-5 tracking-tight border-b border-slate-100 dark:border-white/5 pb-3">Nakit Akış Analizi</h3>
                                <ResponsiveContainer width="100%" height={400}>
                                    <LineChart data={cashFlowData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                                        <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} />
                                        <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} />
                                        <Tooltip
                                            contentStyle={{ background: 'rgba(23, 23, 23, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                            formatter={(value: any) => `₺${Number(value).toLocaleString()}`}
                                        />
                                        <Legend />
                                        <Line type="monotone" dataKey="income" name="Gelir" stroke={COLORS.success} strokeWidth={2} dot={{ r: 4 }} />
                                        <Line type="monotone" dataKey="expense" name="Gider" stroke={COLORS.danger} strokeWidth={2} dot={{ r: 4 }} />
                                        <Line type="monotone" dataKey="net" name="Net" stroke={COLORS.primary} strokeWidth={3} dot={{ r: 5 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Cash Summary */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                                {filteredKasalar.map((kasa, i) => (
                                    <div key={i} className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 shadow-sm rounded-2xl p-6 flex flex-col justify-center">
                                        
                                        <div className="text-base font-bold text-slate-900 dark:text-white mb-2">{kasa.name}</div>
                                        <div className="text-3xl font-black text-slate-900 dark:text-white">
                                            ₺{Number(kasa.balance).toLocaleString()}
                                        </div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
                                            {kasa.type || 'Kasa'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Daily Report Tab */}
                    {activeTab === 'daily' && (
                        <DailyReportContent />
                    )}

                    {/* Manufacturing Tab */}
                    {activeTab === 'manufacturing' && (
                        <ManufacturingReportContent />
                    )}

                    {/* Suppliers Report Tab */}
                    {activeTab === 'suppliers' && (
                        <SupplierReportContent />
                    )}

                    {/* Export Reports Tab */}
                    {activeTab === 'exports' && (
                        <ExportReportsContent />
                    )}
                </div></main></div>);}