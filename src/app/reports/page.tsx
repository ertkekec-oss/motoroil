"use client";

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/contexts/AppContext';
import { useModal } from '@/contexts/ModalContext';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, Legend
} from 'recharts';

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

export default function ReportsPage() {
    const { transactions, products, customers, suppliers, kasalar, branches, currentUser, hasPermission } = useApp();
    const { showSuccess, showError } = useModal();

    const isSystemAdmin = currentUser === null;
    const canViewAll = isSystemAdmin || !hasPermission('branch_isolation');

    // States
    const [activeTab, setActiveTab] = useState<'overview' | 'sales' | 'finance' | 'inventory' | 'customers' | 'cashflow' | 'daily' | 'suppliers'>('overview');
    const [reportScope, setReportScope] = useState<'all' | 'single'>(canViewAll ? 'all' : 'single');
    const [selectedBranch, setSelectedBranch] = useState(currentUser?.branch || 'Merkez');
    const [dateRange, setDateRange] = useState({
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });
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

    // Filter products by branch
    const filteredProducts = useMemo(() => {
        if (reportScope === 'all') {
            return products;
        }
        return products.filter(p => p.branch === selectedBranch || (!p.branch && selectedBranch === 'Merkez'));
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
        <div style={{ minHeight: '100vh', background: 'var(--bg-main)', padding: '20px' }}>
            <div style={{ maxWidth: '1600px', margin: '0 auto' }}>


                {/* Header */}
                <header style={{ marginBottom: '30px' }}>
                    {/* Scope Selector (if admin) */}
                    {canViewAll && (
                        <div style={{ background: 'var(--bg-card)', padding: '16px 24px', borderRadius: '12px', marginBottom: '20px', border: '1px solid var(--border-light)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        onClick={() => setReportScope('all')}
                                        className={reportScope === 'all' ? 'btn-primary' : 'btn-ghost'}
                                        style={{ padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: '600' }}
                                    >
                                        🌍 KONSOLİDE (Tüm Şirket)
                                    </button>
                                    <button
                                        onClick={() => setReportScope('single')}
                                        className={reportScope === 'single' ? 'btn-primary' : 'btn-ghost'}
                                        style={{ padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: '600' }}
                                    >
                                        📍 ŞUBE BAZLI
                                    </button>
                                </div>

                                {/* Branch Selector (when single mode) */}
                                {reportScope === 'single' && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Şube:</span>
                                        <select
                                            value={selectedBranch}
                                            onChange={(e) => setSelectedBranch(e.target.value)}
                                            style={{
                                                background: 'var(--bg-deep)',
                                                color: 'white',
                                                border: '1px solid var(--border-light)',
                                                borderRadius: '8px',
                                                padding: '8px 16px',
                                                fontSize: '14px',
                                                fontWeight: '600',
                                                outline: 'none',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {availableBranches.map(branch => (
                                                <option key={branch} value={branch}>{branch}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                                    {reportScope === 'all'
                                        ? `📊 ${availableBranches.length} şube konsolide görünümü`
                                        : `📍 ${selectedBranch} şubesi`}
                                </div>
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                        <div>
                            <h1 style={{ fontSize: '32px', fontWeight: '900', marginBottom: '8px', background: 'linear-gradient(135deg, var(--primary), var(--success))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                📊 Veri Analizi
                            </h1>
                            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                                {reportScope === 'all' ? '🌍 Tüm Şirket (Konsolide)' : `📍 ${selectedBranch}`} • {dateRange.start} - {dateRange.end}
                            </p>
                        </div>

                        {/* Date Range Picker */}
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'var(--bg-card)', padding: '12px 20px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                            <input
                                type="date"
                                value={dateRange.start}
                                onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
                                style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '13px', outline: 'none' }}
                            />
                            <span style={{ color: 'var(--text-muted)' }}>→</span>
                            <input
                                type="date"
                                value={dateRange.end}
                                onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
                                style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '13px', outline: 'none' }}
                            />
                        </div>
                    </div>

                    {/* Tabs */}
                    <div style={{ display: 'flex', gap: '10px', marginTop: '20px', overflowX: 'auto', paddingBottom: '10px' }}>
                        {[
                            { id: 'overview', icon: '📈', label: 'Genel Bakış' },
                            { id: 'daily', icon: '📅', label: 'Gün Sonu Raporu' },
                            { id: 'suppliers', icon: '🚚', label: 'Tedarikçi Raporları' },
                            { id: 'sales', icon: '💰', label: 'Satış Analizi' },
                            { id: 'finance', icon: '💎', label: 'Finansal Durum' },
                            { id: 'inventory', icon: '📦', label: 'Envanter' },
                            { id: 'customers', icon: '👥', label: 'Müşteriler' },
                            { id: 'cashflow', icon: '🏦', label: 'Nakit Akışı' },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={activeTab === tab.id ? 'btn-primary' : 'btn-ghost'}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: '10px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    whiteSpace: 'nowrap',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </div>
                </header>

                {/* Content */}
                <div className="animate-fade-in">

                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                            {/* KPI Cards */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                                <div className="glass-plus" style={{ padding: '24px', borderRadius: '16px', borderLeft: `4px solid ${COLORS.primary}` }}>
                                    <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', letterSpacing: '1px', marginBottom: '8px' }}>TOPLAM CİRO</div>
                                    <div style={{ fontSize: '32px', fontWeight: '900', color: 'white', marginBottom: '4px' }}>
                                        ₺{financialSummary.revenue.toLocaleString()}
                                    </div>
                                    <div style={{ fontSize: '12px', color: COLORS.success }}>
                                        📈 {salesAnalytics.count} işlem
                                    </div>
                                </div>

                                <div className="glass-plus" style={{ padding: '24px', borderRadius: '16px', borderLeft: `4px solid ${COLORS.success}` }}>
                                    <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', letterSpacing: '1px', marginBottom: '8px' }}>NET KAR</div>
                                    <div style={{ fontSize: '32px', fontWeight: '900', color: COLORS.success, marginBottom: '4px' }}>
                                        ₺{financialSummary.netProfit.toLocaleString()}
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                        %{financialSummary.profitMargin.toFixed(1)} kar marjı
                                    </div>
                                </div>

                                <div className="glass-plus" style={{ padding: '24px', borderRadius: '16px', borderLeft: `4px solid ${COLORS.warning}` }}>
                                    <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', letterSpacing: '1px', marginBottom: '8px' }}>ORTALAMA SEPET</div>
                                    <div style={{ fontSize: '32px', fontWeight: '900', color: 'white', marginBottom: '4px' }}>
                                        ₺{salesAnalytics.avgTicket.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                        İşlem başına
                                    </div>
                                </div>

                                <div className="glass-plus" style={{ padding: '24px', borderRadius: '16px', borderLeft: `4px solid ${COLORS.danger}` }}>
                                    <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', letterSpacing: '1px', marginBottom: '8px' }}>TOPLAM GİDER</div>
                                    <div style={{ fontSize: '32px', fontWeight: '900', color: 'white', marginBottom: '4px' }}>
                                        ₺{financialSummary.expenses.toLocaleString()}
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                        Kayıtlı giderler
                                    </div>
                                </div>
                            </div>

                            {/* Charts Row */}
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                                {/* Sales Trend */}
                                <div className="glass card" style={{ padding: '24px', borderRadius: '16px' }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '20px' }}>📊 Satış Trendi</h3>
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
                                <div className="glass card" style={{ padding: '24px', borderRadius: '16px' }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '20px' }}>🍰 Gider Dağılımı</h3>
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

                            {/* Recent Transactions */}
                            <div className="glass card" style={{ padding: '24px', borderRadius: '16px' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '20px' }}>🕐 Son İşlemler</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                                    {recentTransactions.map((tx, i) => (
                                        <div key={i} className="glass" style={{ padding: '16px', borderRadius: '12px', borderLeft: `3px solid ${tx.type === 'Sales' ? COLORS.success : COLORS.danger}` }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                    {new Date(tx.date).toLocaleDateString('tr-TR')}
                                                </span>
                                                <span style={{ fontSize: '11px', fontWeight: '700', color: tx.type === 'Sales' ? COLORS.success : COLORS.danger }}>
                                                    {tx.type}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                                                {tx.description || 'İşlem'}
                                            </div>
                                            <div style={{ fontSize: '18px', fontWeight: '900', color: tx.type === 'Sales' ? COLORS.success : 'white' }}>
                                                ₺{Number(tx.amount).toLocaleString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Sales Tab */}
                    {activeTab === 'sales' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div className="glass card" style={{ padding: '24px', borderRadius: '16px' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '20px' }}>📊 Günlük Satış Detayı</h3>
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
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                            {/* Financial Detailed Table */}
                            <div className="glass-plus" style={{ padding: '32px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <h3 style={{ fontSize: '20px', fontWeight: '900', marginBottom: '24px' }}>🏛️ Detaylı Finansal Tablo</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>

                                    <div className="glass" style={{ padding: '24px', borderRadius: '16px' }}>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>CİRO VE KARLILIK</div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <div className="flex-between"><span>Toplam Ciro</span> <span style={{ fontWeight: '700' }}>₺{financialSummary.revenue.toLocaleString()}</span></div>
                                            <div className="flex-between"><span>Tahmini Maliyet (COGS)</span> <span style={{ color: COLORS.danger }}>-₺{financialSummary.cogs.toLocaleString()}</span></div>
                                            <div className="flex-between"><span>Operasyonel Giderler</span> <span style={{ color: COLORS.danger }}>-₺{financialSummary.expenses.toLocaleString()}</span></div>
                                            <div className="flex-between" style={{ paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)', color: COLORS.success, fontWeight: '900' }}>
                                                <span>Net Dönem Karı</span> <span>₺{financialSummary.netProfit.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="glass" style={{ padding: '24px', borderRadius: '16px' }}>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>ALACAK VE BORÇ DURUMU</div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <div className="flex-between"><span>Müşteri Alacakları (Güncel)</span> <span style={{ fontWeight: '700' }}>₺{financialSummary.receivable.toLocaleString()}</span></div>
                                            <div className="flex-between"><span>Tedarikçi/Cari Borçlar</span> <span style={{ color: COLORS.danger }}>-₺{financialSummary.payable.toLocaleString()}</span></div>
                                            <div className="flex-between" style={{ paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                                <span>Cari Net Durum</span> <span style={{ fontWeight: '700', color: (financialSummary.receivable - financialSummary.payable) >= 0 ? COLORS.success : COLORS.danger }}>₺{(financialSummary.receivable - financialSummary.payable).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="glass" style={{ padding: '24px', borderRadius: '16px' }}>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>PLANLI (GELECEK) ÖDEMELER</div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <div className="flex-between"><span>Planlı Alacaklar (Taksitler)</span> <span style={{ fontWeight: '700', color: COLORS.success }}>₺{financialSummary.plannedReceivable.toLocaleString()}</span></div>
                                            <div className="flex-between"><span>Planlı Borçlar (Taksitler)</span> <span style={{ color: COLORS.danger }}>-₺{financialSummary.plannedDebt.toLocaleString()}</span></div>
                                            <div className="flex-between" style={{ paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)', fontWeight: '900' }}>
                                                <span>Toplam Net Alacak</span> <span style={{ color: COLORS.primary }}>₺{(financialSummary.totalReceivable - financialSummary.totalPayable).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                </div>

                                <div style={{ marginTop: '30px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div className="glass-plus" style={{ padding: '24px', borderRadius: '16px', background: 'rgba(16, 185, 129, 0.05)', border: `1px solid ${COLORS.success}55` }}>
                                        <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px' }}>TOPLAM ŞİRKET ALACAĞI</div>
                                        <div style={{ fontSize: '36px', fontWeight: '900', color: COLORS.success }}>₺{financialSummary.totalReceivable.toLocaleString()}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Cari + Gelecek Taksitler</div>
                                    </div>
                                    <div className="glass-plus" style={{ padding: '24px', borderRadius: '16px', background: 'rgba(239, 68, 68, 0.05)', border: `1px solid ${COLORS.danger}55` }}>
                                        <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px' }}>TOPLAM ŞİRKET BORCU</div>
                                        <div style={{ fontSize: '36px', fontWeight: '900', color: COLORS.danger }}>₺{financialSummary.totalPayable.toLocaleString()}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Cari + Gelecek Taksitler</div>
                                    </div>
                                </div>
                            </div>

                            {/* Hidden Costs Breakdown */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                                <div className="glass card" style={{ padding: '24px', borderRadius: '16px', borderLeft: `4px solid ${COLORS.indigo}` }}>
                                    <div style={{ fontSize: '24px', marginBottom: '12px' }}>💳</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>POS KOMİSYON (Tahmini)</div>
                                    <div style={{ fontSize: '28px', fontWeight: '900' }}>₺{financialSummary.hiddenCosts.pos.toLocaleString()}</div>
                                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>%2.5 ortalama komisyon</p>
                                </div>

                                <div className="glass card" style={{ padding: '24px', borderRadius: '16px', borderLeft: `4px solid ${COLORS.warning}` }}>
                                    <div style={{ fontSize: '24px', marginBottom: '12px' }}>🧾</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>E-BELGE MALİYETİ</div>
                                    <div style={{ fontSize: '28px', fontWeight: '900' }}>₺{financialSummary.hiddenCosts.eDoc.toLocaleString()}</div>
                                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>{salesAnalytics.count} işlem × ₺1.25</p>
                                </div>

                                <div className="glass card" style={{ padding: '24px', borderRadius: '16px', borderLeft: `4px solid ${COLORS.pink}` }}>
                                    <div style={{ fontSize: '24px', marginBottom: '12px' }}>🖨️</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>KAĞIT/TONER</div>
                                    <div style={{ fontSize: '28px', fontWeight: '900' }}>₺{financialSummary.hiddenCosts.paper.toLocaleString()}</div>
                                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>{salesAnalytics.count} işlem × ₺0.50</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Inventory Tab */}
                    {activeTab === 'inventory' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div className="glass-plus" style={{ padding: '24px', borderRadius: '16px', borderLeft: `4px solid ${COLORS.primary}` }}>
                                    <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', letterSpacing: '1px', marginBottom: '8px' }}>TOPLAM ENVANTER DEĞERİ (ALIŞ)</div>
                                    <div style={{ fontSize: '36px', fontWeight: '900', color: 'white' }}>₺{inventoryStats.totalValue.toLocaleString()}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Tüm stokların maliyet bedeli toplamı</div>
                                </div>
                                <div className="glass-plus" style={{ padding: '24px', borderRadius: '16px', borderLeft: `4px solid ${COLORS.warning}` }}>
                                    <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', letterSpacing: '1px', marginBottom: '8px' }}>TOPLAM STOK ADEDİ</div>
                                    <div style={{ fontSize: '36px', fontWeight: '900', color: 'white' }}>{inventoryStats.totalQty.toLocaleString()}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Şu an depoda bulunan toplam ürün sayısı</div>
                                </div>
                            </div>

                            <div className="glass card" style={{ padding: '24px', borderRadius: '16px' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '20px' }}>📦 En Yüksek Stok Değerine Sahip Ürünler</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                                    {inventoryStats.topProducts.map((product, i) => (
                                        <div key={i} className="glass" style={{ padding: '20px', borderRadius: '12px', borderLeft: `4px solid ${COLORS.primary}` }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                                <span style={{ fontSize: '24px' }}>📦</span>
                                                <span style={{ fontSize: '11px', fontWeight: '700', color: Number(product.stock) < Number(product.minStock) ? COLORS.danger : COLORS.success }}>
                                                    {Number(product.stock) < Number(product.minStock) ? 'DÜŞÜK' : 'NORMAL'}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '8px' }}>{product.name}</div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                                                <span>Stok: {product.stock}</span>
                                                <span>Alış: ₺{Number(product.buyPrice || product.price).toLocaleString()}</span>
                                            </div>
                                            <div style={{ fontSize: '20px', fontWeight: '900', color: COLORS.primary }}>
                                                ₺{product.stockValue.toLocaleString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Customers Tab */}
                    {activeTab === 'customers' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div className="glass card" style={{ padding: '24px', borderRadius: '16px' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '20px' }}>👥 Cari Bakiye Durumu</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '16px' }}>
                                    {topCustomers.map((customer, i) => (
                                        <div key={i} className="glass-plus" style={{ padding: '24px', borderRadius: '16px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                                <div>
                                                    <div style={{ fontSize: '18px', fontWeight: '800', marginBottom: '4px' }}>{customer.name}</div>
                                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{customer.phone || 'Telefon yok'}</div>
                                                </div>
                                                <div style={{ fontSize: '24px' }}>👤</div>
                                            </div>
                                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px' }}>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>BAKİYE DURUMU</div>
                                                <div style={{ fontSize: '24px', fontWeight: '900', color: Number(customer.balance) > 0 ? COLORS.success : Number(customer.balance) < 0 ? COLORS.danger : 'white' }}>
                                                    {Number(customer.balance) > 0 ? '+' : ''}₺{Number(customer.balance).toLocaleString()}
                                                </div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                                    {Number(customer.balance) > 0 ? 'Alacak' : Number(customer.balance) < 0 ? 'Borç' : 'Dengede'}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Cash Flow Tab */}
                    {activeTab === 'cashflow' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div className="glass card" style={{ padding: '24px', borderRadius: '16px' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '20px' }}>🏦 Nakit Akış Analizi</h3>
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
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                                {filteredKasalar.map((kasa, i) => (
                                    <div key={i} className="glass card" style={{ padding: '24px', borderRadius: '16px', borderLeft: `4px solid ${COLORS.cyan}` }}>
                                        <div style={{ fontSize: '24px', marginBottom: '12px' }}>🏦</div>
                                        <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '8px' }}>{kasa.name}</div>
                                        <div style={{ fontSize: '28px', fontWeight: '900', color: COLORS.cyan }}>
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
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div className="glass card" style={{ padding: '0', borderRadius: '16px', overflow: 'hidden', minHeight: '800px' }}>
                                <iframe
                                    src="/reports/daily?embedded=true"
                                    style={{ width: '100%', height: '800px', border: 'none' }}
                                    title="Gün Sonu Raporu"
                                />
                            </div>
                        </div>
                    )}

                    {/* Suppliers Report Tab */}
                    {activeTab === 'suppliers' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div className="glass card" style={{ padding: '0', borderRadius: '16px', overflow: 'hidden', minHeight: '800px' }}>
                                <iframe
                                    src="/reports/suppliers?embedded=true"
                                    style={{ width: '100%', height: '800px', border: 'none' }}
                                    title="Tedarikçi Raporları"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
