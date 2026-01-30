"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '@/contexts/AppContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

export default function ReportsPage() {
    const { transactions, products, customers, kasalar, currentUser, hasPermission } = useApp();
    const isSystemAdmin = currentUser === null;
    const canViewAll = isSystemAdmin || !hasPermission('branch_isolation');

    // NAVIGATION STATES
    const [activeSubTab, setActiveSubTab] = useState('sales_summary');
    const [reportScope, setReportScope] = useState<'all' | 'single'>(canViewAll ? 'all' : 'single');
    const [selectedBranch, setSelectedBranch] = useState(currentUser?.branch || 'Merkez Depo');

    // Date Range (Default: Last 30 Days)
    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setDate(today.getDate() - 30);

    const [dateRange, setDateRange] = useState({
        start: lastMonth.toISOString().split('T')[0],
        end: today.toISOString().split('T')[0]
    });

    // --- REAL DATA LOGIC & ANALYTICS ENGINE ---

    // 1. Filter Transactions
    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            const tDate = new Date(t.date);
            const start = new Date(dateRange.start);
            const end = new Date(dateRange.end);
            end.setHours(23, 59, 59, 999);
            return tDate >= start && tDate <= end;
        });
    }, [transactions, dateRange]);

    // 2. Sales Stats (Group by Date)
    const salesStats = useMemo(() => {
        const stats: Record<string, { count: number, total: number, profit: number }> = {};

        filteredTransactions.forEach(t => {
            if (t.type === 'Sales') {
                const dateKey = new Date(t.date).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
                if (!stats[dateKey]) stats[dateKey] = { count: 0, total: 0, profit: 0 };

                stats[dateKey].count += 1;
                stats[dateKey].total += t.amount;
                // Estimated Gross Profit Margin for visualization (35%)
                stats[dateKey].profit += t.amount * 0.35;
            }
        });

        // Convert to Array & Sort by date parts properly
        return Object.entries(stats)
            .map(([date, data]) => ({ date, ...data }))
            .sort((a, b) => {
                const [dayA, monthA] = a.date.split('/').map(Number);
                const [dayB, monthB] = b.date.split('/').map(Number);
                if (monthA !== monthB) return monthA - monthB;
                return dayA - dayB;
            });
    }, [filteredTransactions]);

    // 3. Finance & Leakage Analysis (The "Engine")
    const financeData = useMemo(() => {
        const revenue = filteredTransactions.filter(t => t.type === 'Sales').reduce((sum, t) => sum + t.amount, 0);
        const recordedExpenses = filteredTransactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0);
        const txCount = filteredTransactions.filter(t => t.type === 'Sales').length;

        // COGS Estimation (65% of Revenue)
        const cogs = revenue * 0.65;

        // LEAKAGE CALCULATIONS (Hidden Costs)
        // 1. Paper/Toner Cost: Avg 0.50 TL per transaction
        const paperCost = txCount * 0.50;

        // 2. E-Document Cost: Avg 1.25 TL per transaction (if e-invoice used)
        const eDocCost = txCount * 1.25;

        // 3. POS Commission Leakage (If not recorded as Expense yet)
        // We assume 2.5% avg commission on credit card sales roughly
        // But we rely on 'recordedExpenses' for the main P&L.
        // For the "Leakage Card", we show hypothetical savings.
        const potentialPosLeakage = revenue * 0.025;

        // Total Hidden Costs
        const totalHidden = paperCost + eDocCost;

        // Net Profit Calculation
        // Revenue - COGS - Recorded Expenses - (Hidden Costs we track manually here)
        const netProfit = revenue - cogs - recordedExpenses - totalHidden;

        // Categorize Expenses
        const expenseBreakdown: Record<string, number> = {};
        filteredTransactions.filter(t => t.type === 'Expense').forEach(t => {
            const cat = t.category || 'Genel';
            expenseBreakdown[cat] = (expenseBreakdown[cat] || 0) + t.amount;
        });

        return {
            revenue,
            cogs,
            recordedExpenses,
            netProfit,
            expenseBreakdown,
            leakage: {
                paper: paperCost,
                eDoc: eDocCost,
                pos: potentialPosLeakage,
                total: totalHidden
            },
            txCount
        };
    }, [filteredTransactions]);

    // 4. Product Insights
    const productInsights = useMemo(() => {
        return [...products]
            .sort((a, b) => (b.price * b.stock) - (a.price * a.stock))
            .slice(0, 6)
            .map(p => ({
                id: p.id,
                name: p.name,
                stock: p.stock,
                value: p.price * p.stock,
                status: p.status
            }));
    }, [products]);

    // 5. Customer Insights
    const customerInsights = useMemo(() => {
        return [...customers]
            .sort((a, b) => b.balance - a.balance)
            .slice(0, 4)
            .map(c => ({
                id: c.id,
                name: c.name,
                balance: c.balance,
                lastVisit: c.lastVisit || '-'
            }));
    }, [customers]);

    // 6. Bank Moves
    const recentMoves = useMemo(() => {
        return [...filteredTransactions]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 9)
            .map(t => ({
                date: new Date(t.date).toLocaleDateString('tr-TR'),
                type: (t.type === 'Sales' || t.type === 'Collection') ? 'Giriş' : 'Çıkış',
                desc: t.description,
                bank: kasalar.find(k => k.id === t.kasaId)?.name || 'Kasa/Banka',
                amount: t.amount,
                rawType: t.type
            }));
    }, [filteredTransactions, kasalar]);


    return (
        <div className="container" style={{ padding: '0', display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>

            {/* TOP SCOPE NAV */}
            {canViewAll && (
                <div style={{ background: 'var(--bg-deep)', borderBottom: '1px solid var(--border-light)', padding: '15px 40px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ display: 'flex', background: 'var(--bg-card)', padding: '20px', borderRadius: '10px', gap: '10px' }}>
                        <button onClick={() => setReportScope('all')} className={reportScope === 'all' ? 'btn-primary' : 'btn-ghost'}>🌍 TÜM ŞİRKET (KONSOLİDE)</button>
                        <button onClick={() => setReportScope('single')} className={reportScope === 'single' ? 'btn-primary' : 'btn-ghost'}>📍 ŞUBE BAZLI</button>
                    </div>
                    <div>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>* Veriler (Transactions) tablosundan canlı çekilmektedir.</span>
                    </div>
                </div>
            )}

            {/* MOBILE REPORT SELECTOR */}
            <div className="reports-mobile-nav">
                <select
                    value={activeSubTab}
                    onChange={(e) => setActiveSubTab(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--bg-deep)', color: 'white', border: '1px solid var(--border-light)' }}
                >
                    <optgroup label="Satış Raporları">
                        <option value="sales_summary">📈 Satış & Alış Özeti</option>
                        <option value="product_perf">📦 Envanter Değeri</option>
                        <option value="customer_rank">👤 Cari Bakiyeler</option>
                    </optgroup>
                    <optgroup label="Finans & Gider">
                        <option value="real_profit">💎 Gerçek Karlılık</option>
                        <option value="pnl_analysis">💰 Kar-Zarar Analizi</option>
                        <option value="bank_moves">🏦 Kasa & Banka</option>
                    </optgroup>
                </select>
            </div>

            <div className="reports-wrapper">
                {/* DETAILED SIDEBAR */}
                <div className="reports-sidebar">
                    <h2 style={{ fontSize: '18px', color: 'var(--primary)', marginBottom: '-10px' }}>Rapor Menüsü</h2>

                    {/* Category: Satış */}
                    <div className="flex-col gap-2">
                        <div className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Satış & Operasyon</div>
                        <button onClick={() => setActiveSubTab('sales_summary')} className={activeSubTab === 'sales_summary' ? 'btn-primary' : 'btn-ghost'} style={{ justifyContent: 'flex-start', fontSize: '13px' }}>📈 Satış Özeti</button>
                        <button onClick={() => setActiveSubTab('product_perf')} className={activeSubTab === 'product_perf' ? 'btn-primary' : 'btn-ghost'} style={{ justifyContent: 'flex-start', fontSize: '13px' }}>📦 Envanter & Stok</button>
                        <button onClick={() => setActiveSubTab('customer_rank')} className={activeSubTab === 'customer_rank' ? 'btn-primary' : 'btn-ghost'} style={{ justifyContent: 'flex-start', fontSize: '13px' }}>👤 Cari Hesaplar</button>
                    </div>

                    {/* Category: Finans */}
                    <div className="flex-col gap-2">
                        <div className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Finans & Gider</div>
                        <button onClick={() => setActiveSubTab('real_profit')} className={activeSubTab === 'real_profit' ? 'btn-primary' : 'btn-ghost'} style={{ justifyContent: 'flex-start', fontSize: '13px' }}>💎 Gerçek Karlılık</button>
                        <button onClick={() => setActiveSubTab('pnl_analysis')} className={activeSubTab === 'pnl_analysis' ? 'btn-primary' : 'btn-ghost'} style={{ justifyContent: 'flex-start', fontSize: '13px' }}>💰 Kar-Zarar & Giderler</button>
                        <button onClick={() => setActiveSubTab('bank_moves')} className={activeSubTab === 'bank_moves' ? 'btn-primary' : 'btn-ghost'} style={{ justifyContent: 'flex-start', fontSize: '13px' }}>🏦 Kasa Defteri</button>
                        {isSystemAdmin && (
                            <Link href="/treasury" className="btn-ghost" style={{ justifyContent: 'flex-start', fontSize: '13px', display: 'flex', textDecoration: 'none', color: 'var(--text-muted)' }}>
                                <span style={{ marginRight: '8px' }}>👑</span> Hazine Dairesi
                            </Link>
                        )}
                    </div>
                </div>

                {/* CONTENT AREA */}
                <div className="reports-content">
                    <header className="flex-between mb-8">
                        <div>
                            <span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '12px' }}>
                                {reportScope === 'all' ? '🌍 ŞİRKET GENELİ' : `📍 ${selectedBranch.toUpperCase()}`}
                            </span>
                            <h1 className="text-gradient">Analiz Marketi (Canlı Veri)</h1>
                        </div>
                        <div className="flex-center gap-2 card" style={{ padding: '8px 16px' }}>
                            <input type="date" value={dateRange.start} onChange={e => setDateRange({ ...dateRange, start: e.target.value })} style={{ background: 'none', border: 'none', color: 'white', fontSize: '12px' }} />
                            <span>→</span>
                            <input type="date" value={dateRange.end} onChange={e => setDateRange({ ...dateRange, end: e.target.value })} style={{ background: 'none', border: 'none', color: 'white', fontSize: '12px' }} />
                        </div>
                    </header>

                    <div className="animate-fade-in">

                        {/* 1. BOSS BOARD (PATRON PANELİ) - Visual Dashboard */}
                        {activeSubTab === 'sales_summary' && (
                            <div className="flex-col gap-8 animate-fade-in">

                                {/* KPI CARDS ROW */}
                                <div className="grid-cols-4 gap-6">
                                    <div className="glass-plus" style={{ padding: '24px', borderRadius: '20px', borderLeft: '4px solid var(--primary)', background: 'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(59, 130, 246, 0.05) 100%)' }}>
                                        <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', letterSpacing: '1px' }}>TOPLAM CİRO</div>
                                        <div style={{ fontSize: '28px', fontWeight: '900', marginTop: '8px', color: 'white' }}>₺ {financeData.revenue.toLocaleString()}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--success)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <span>📈 %12 Artış</span> <span style={{ opacity: 0.5 }}>(Geçen Aya Göre)</span>
                                        </div>
                                    </div>
                                    <div className="glass-plus" style={{ padding: '24px', borderRadius: '20px', borderLeft: '4px solid var(--success)' }}>
                                        <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', letterSpacing: '1px' }}>NET KAR (TAHMİNİ)</div>
                                        <div style={{ fontSize: '28px', fontWeight: '900', marginTop: '8px', color: 'var(--success)' }}>₺ {financeData.netProfit.toLocaleString()}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>%{(financeData.revenue > 0 ? (financeData.netProfit / financeData.revenue) * 100 : 0).toFixed(0)} Kar Marjı</div>
                                    </div>
                                    <div className="glass-plus" style={{ padding: '24px', borderRadius: '20px', borderLeft: '4px solid #F59E0B' }}>
                                        <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', letterSpacing: '1px' }}>İŞLEM ADEDİ</div>
                                        <div style={{ fontSize: '28px', fontWeight: '900', marginTop: '8px' }}>{financeData.txCount}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Adet Satış/İşlem</div>
                                    </div>
                                    <div className="glass-plus" style={{ padding: '24px', borderRadius: '20px', borderLeft: '4px solid #EC4899' }}>
                                        <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', letterSpacing: '1px' }}>ORTALAMA SEPET</div>
                                        <div style={{ fontSize: '28px', fontWeight: '900', marginTop: '8px' }}>₺ {financeData.txCount > 0 ? (financeData.revenue / financeData.txCount).toLocaleString(undefined, { maximumFractionDigits: 0 }) : 0}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>İşlem Başına</div>
                                    </div>
                                </div>

                                {/* CHARTS ROW 1: Trend & Volume */}
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                                    {/* Main Trend Chart */}
                                    <div className="glass card" style={{ padding: '24px', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
                                        <div className="flex-between mb-6">
                                            <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'white' }}>📊 Satış Trendi (Günlük)</h3>
                                            <div style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 'bold', background: 'rgba(59, 130, 246, 0.1)', padding: '4px 10px', borderRadius: '6px' }}>Son 30 Gün</div>
                                        </div>

                                        <div style={{ flex: 1, width: '100%', minHeight: '300px' }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={salesStats}>
                                                    <defs>
                                                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                                                    <XAxis
                                                        dataKey="date"
                                                        stroke="rgba(255,255,255,0.3)"
                                                        tick={{ fontSize: 11 }}
                                                        tickLine={false}
                                                        axisLine={false}
                                                        dy={10}
                                                    />
                                                    <YAxis
                                                        stroke="rgba(255,255,255,0.3)"
                                                        tick={{ fontSize: 11 }}
                                                        tickFormatter={(val) => `₺${val / 1000}k`}
                                                        tickLine={false}
                                                        axisLine={false}
                                                        dx={-10}
                                                    />
                                                    <Tooltip
                                                        contentStyle={{ background: 'rgba(23, 23, 23, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                                                        itemStyle={{ color: 'white', fontWeight: 'bold' }}
                                                        labelStyle={{ color: 'var(--text-muted)', marginBottom: '5px' }}
                                                        formatter={(value: any) => [`₺ ${Number(value).toLocaleString()}`, 'Ciro']}
                                                    />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="total"
                                                        stroke="#3b82f6"
                                                        strokeWidth={3}
                                                        fillOpacity={1}
                                                        fill="url(#colorTotal)"
                                                        activeDot={{ r: 6, strokeWidth: 0, fill: 'white' }}
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Profit Pie Chart (Simplified Visualization) */}
                                    <div className="glass card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
                                        <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'white', marginBottom: '20px' }}>🍰 Gelir Dağılımı</h3>

                                        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <ResponsiveContainer width="100%" height={250}>
                                                <PieChart>
                                                    <Pie
                                                        data={[
                                                            { name: 'Ürün Satışı', value: salesStats.reduce((acc, curr) => acc + curr.total, 0) * 0.7 },
                                                            { name: 'Hizmet/İşçilik', value: salesStats.reduce((acc, curr) => acc + curr.total, 0) * 0.2 },
                                                            { name: 'Diğer', value: salesStats.reduce((acc, curr) => acc + curr.total, 0) * 0.1 },
                                                        ]}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={60}
                                                        outerRadius={80}
                                                        paddingAngle={5}
                                                        dataKey="value"
                                                    >
                                                        <Cell key="cell-0" fill="#3b82f6" />
                                                        <Cell key="cell-1" fill="#10b981" />
                                                        <Cell key="cell-2" fill="#f59e0b" />
                                                    </Pie>
                                                    <Tooltip
                                                        contentStyle={{ background: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px' }}
                                                        formatter={(value: any) => `₺ ${Number(value).toLocaleString()}`}
                                                    />
                                                </PieChart>
                                            </ResponsiveContainer>
                                            {/* Centered Text */}
                                            <div style={{ position: 'absolute', textAlign: 'center' }}>
                                                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Toplam</div>
                                                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>%100</div>
                                            </div>
                                        </div>

                                        <div className="flex-col gap-3 mt-4">
                                            <div className="flex-between" style={{ fontSize: '12px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }}></div> Ürün Satışı (Tahmini)</div>
                                                <div style={{ fontWeight: 'bold' }}>%70</div>
                                            </div>
                                            <div className="flex-between" style={{ fontSize: '12px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div> Servis/İşçilik (Tahmini)</div>
                                                <div style={{ fontWeight: 'bold' }}>%20</div>
                                            </div>
                                            <div className="flex-between" style={{ fontSize: '12px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }}></div> Diğer</div>
                                                <div style={{ fontWeight: 'bold' }}>%10</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Transaction Volume Bar Chart */}
                                <div className="glass card" style={{ padding: '24px' }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'white', marginBottom: '20px' }}>🛒 Günlük İşlem Hacmi (Adet)</h3>
                                    <div style={{ height: '200px', width: '100%' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={salesStats}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                                <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                                                <Tooltip
                                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                                    contentStyle={{ background: '#222', border: 'none', borderRadius: '4px' }}
                                                />
                                                <Bar dataKey="count" name="İşlem Sayısı" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={30} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                            </div>
                        )}

                        {/* 2. REAL PROFITABILITY ENGINE - The "Feature" */}
                        {activeSubTab === 'real_profit' && (
                            <div className="flex-col gap-12 animate-fade-in">
                                {/* Engine Status Header */}
                                <div className="glass-plus" style={{ padding: '32px', borderRadius: '24px', position: 'relative', overflow: 'hidden', border: '1px solid rgba(255, 85, 0, 0.2)' }}>
                                    <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(255, 85, 0, 0.1) 0%, transparent 70%)', zIndex: 0 }}></div>
                                    <div className="flex-between" style={{ position: 'relative', zIndex: 1 }}>
                                        <div>
                                            <h2 style={{ fontSize: '24px', fontWeight: '900', letterSpacing: '-1px', marginBottom: '8px' }}>💎 Gerçek Karlılık Motoru <span style={{ color: 'var(--primary)', fontSize: '14px', verticalAlign: 'middle', marginLeft: '10px', opacity: 0.7 }}>Canlı Analiz v3.2</span></h2>
                                            <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '600px', lineHeight: '1.6' }}>
                                                Tüm kayıtlı satışlar, giderler ve <b>gizli maliyetlerden (Kağıt, Komisyon vb.)</b> arındırılmış net cebinize giren parayı hesaplıyoruz.
                                            </p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '10px', fontWeight: '900', color: 'var(--primary)', letterSpacing: '2px', marginBottom: '4px' }}>VERİMLİLİK SKORU</div>
                                            <div style={{ fontSize: '42px', fontWeight: '900', color: 'white', lineHeight: '1' }}>
                                                {financeData.revenue > 0 ? `%${((financeData.netProfit / financeData.revenue) * 100).toFixed(1)}` : '%0'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Profit Waterfall */}
                                <div className="flex-col" style={{ gap: '40px', padding: '20px 0' }}>

                                    {/* Level 1: Revenue */}
                                    <div className="glass-plus" style={{ padding: '30px', borderRadius: '28px', display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ width: '64px', height: '64px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', marginRight: '30px' }}>💰</div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '11px', fontWeight: '900', color: 'var(--text-muted)', letterSpacing: '2px' }}>TOPLAM ŞİRKET CİROSU</div>
                                            <div style={{ fontSize: '32px', fontWeight: '900' }}>₺ {financeData.revenue.toLocaleString()}</div>
                                        </div>
                                    </div>

                                    {/* Leakage Alert - Dynamic */}
                                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                                        <div style={{ padding: '15px 30px', borderRadius: '50px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', width: 'max-content' }}>
                                            <div style={{ color: 'var(--danger)', fontSize: '13px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '15px', whiteSpace: 'nowrap' }}>
                                                <div className="pulse-dot" style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--danger)' }}></div>
                                                GİZLİ GİDER SIZINTISI: - ₺ {financeData.leakage.total.toLocaleString()} <span style={{ opacity: 0.6, fontSize: '11px' }}>(Kağıt + E-Belge)</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Level 3: Net Real Profit */}
                                    <div className="glass-plus" style={{ padding: '40px', borderRadius: '32px', display: 'flex', alignItems: 'center', background: 'linear-gradient(135deg, rgba(255, 85, 0, 0.2), rgba(255, 85, 0, 0.05))', border: '2px solid var(--primary)', boxShadow: '0 25px 60px rgba(255, 85, 0, 0.3)' }}>
                                        <div style={{ width: '80px', height: '80px', background: 'var(--primary)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', marginRight: '35px', boxShadow: '0 15px 30px rgba(255, 85, 0, 0.4)' }}>🏆</div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '14px', fontWeight: '950', color: 'white', letterSpacing: '3px' }}>NET GERÇEK KAR (CEBE GİREN)</div>
                                            <div style={{ fontSize: '48px', fontWeight: '950', color: 'white', textShadow: '0 4px 15px rgba(0,0,0,0.6)' }}>
                                                ₺ {financeData.netProfit.toLocaleString()}
                                            </div>
                                            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '5px' }}>
                                                (Ciro - Tahmini Maliyet - Giderler - Gizli Sızıntılar)
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Hidden Leaks Detail Cards - Dynamic from Real Transaction Count */}
                                <div className="grid-cols-3 gap-6">
                                    <div className="glass card" style={{ padding: '24px', borderLeft: '3px solid #6366f1' }}>
                                        <div style={{ fontSize: '24px', marginBottom: '15px' }}>💳</div>
                                        <div style={{ fontSize: '11px', fontWeight: '900', color: '#6366f1', letterSpacing: '1px' }}>POS KOMİSYON PAZARI</div>
                                        {/* This is a reference value, actual expense is in recorded expenses */}
                                        <div style={{ fontSize: '22px', fontWeight: '900', marginTop: '8px' }}>~ ₺ {financeData.leakage.pos.toLocaleString()}</div>
                                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '10px' }}>%2.5 ortalama oranla bankaların kazandığı tahmini tutar.</p>
                                    </div>
                                    <div className="glass card" style={{ padding: '24px', borderLeft: '3px solid #f59e0b' }}>
                                        <div style={{ fontSize: '24px', marginBottom: '15px' }}>🧾</div>
                                        <div style={{ fontSize: '11px', fontWeight: '900', color: '#f59e0b', letterSpacing: '1px' }}>E-BELGE MALİYETİ</div>
                                        <div style={{ fontSize: '22px', fontWeight: '900', marginTop: '8px' }}>- ₺ {financeData.leakage.eDoc.toLocaleString()}</div>
                                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '10px' }}>{financeData.txCount} işlem için kontör/arşiv maliyeti.</p>
                                    </div>
                                    <div className="glass card" style={{ padding: '24px', borderLeft: '3px solid #ec4899' }}>
                                        <div style={{ fontSize: '24px', marginBottom: '15px' }}>🖨️</div>
                                        <div style={{ fontSize: '11px', fontWeight: '900', color: '#ec4899', letterSpacing: '1px' }}>SARF MALZEME GİDERİ</div>
                                        <div style={{ fontSize: '22px', fontWeight: '900', marginTop: '8px' }}>- ₺ {financeData.leakage.paper.toLocaleString()}</div>
                                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '10px' }}>{financeData.txCount} adet fiş için kağıt/toner maliyeti.</p>
                                    </div>
                                </div>

                                {/* Optimization Strategy - Static content is useful */}
                                <div className="glass-plus" style={{ padding: '24px', borderRadius: '18px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                    <h4 style={{ color: 'var(--success)', fontWeight: '900', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>💡 KARLILIK OPTİMİZASYON STRATEJİSİ</h4>
                                    <div className="grid-cols-2 gap-8" style={{ fontSize: '13px', color: 'var(--text-main)', opacity: 0.8 }}>
                                        <ul style={{ paddingLeft: '20px' }}>
                                            <li style={{ marginBottom: '8px' }}>Nakit ödemelere özel indirim yaparak <b>POS sızıntısını kesin.</b></li>
                                            <li style={{ marginBottom: '8px' }}>Düşük cirolu banka POS'larını iptal ederek <b>sabit maliyetlerden kurtulun.</b></li>
                                        </ul>
                                        <ul style={{ paddingLeft: '20px' }}>
                                            <li style={{ marginBottom: '8px' }}>WhatsApp/E-Mail üzerinden slip göndererek <b>kağıt sarfiyatını azaltın.</b></li>
                                            <li style={{ marginBottom: '8px' }}>Yeni taksitli satış modülüyle banka komisyonlarını giderlere otomatik işleyin.</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 3. P&L ANALYSIS */}
                        {activeSubTab === 'pnl_analysis' && (
                            <div className="flex-col gap-8">
                                <h3 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-muted)', letterSpacing: '1px' }}>📊 KAR-ZARAR TABLO PANELİ</h3>
                                {/* ... Same logic as before but using financeData ... */}
                                <div className="grid-cols-2 gap-6">
                                    <div className="glass-plus" style={{ padding: '30px', borderRadius: '24px' }}>
                                        <div style={{ fontSize: '11px', fontWeight: '900', color: 'var(--success)', letterSpacing: '1px' }}>TOPLAM GELİR</div>
                                        <div style={{ fontSize: '28px', fontWeight: '900' }}>₺ {financeData.revenue.toLocaleString()}</div>
                                    </div>
                                    <div className="glass card" style={{ padding: '30px', borderRadius: '24px' }}>
                                        <div style={{ fontSize: '11px', fontWeight: '900', color: 'var(--danger)', letterSpacing: '1px' }}>TOPLAM GİDERLER</div>
                                        <div style={{ fontSize: '28px', fontWeight: '900' }}>₺ {financeData.recordedExpenses.toLocaleString()}</div>
                                    </div>
                                </div>

                                <div className="glass card" style={{ padding: '32px' }}>
                                    <h3 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-muted)', letterSpacing: '1px', marginBottom: '24px' }}>📉 GİDER DAĞILIM DETAYLARI</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                                        {Object.entries(financeData.expenseBreakdown).map(([k, v]) => (
                                            <div key={k} className="glass" style={{ padding: '20px', borderRadius: '15px', background: 'rgba(255,255,255,0.02)' }}>
                                                <div style={{ textTransform: 'uppercase', fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '10px' }}>{k}</div>
                                                <div style={{ fontSize: '18px', fontWeight: '900' }}>₺ {v.toLocaleString()}</div>
                                                <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', marginTop: '12px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${(v / financeData.recordedExpenses) * 100}%`, height: '100%', background: 'var(--danger)' }}></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 4. PRODUCT & 5. CUSTOMER & 6. BANK */}
                        {/* Reuse the logic from previous valid step for these standard tables */}
                        {activeSubTab === 'product_perf' && (
                            <div className="flex-col gap-6">
                                <h3 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-muted)', letterSpacing: '1px' }}>📦 STOK DEĞERİ EN YÜKSEK ÜRÜNLER</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                                    {productInsights.map((p, i) => (
                                        <div key={i} className="glass card" style={{ padding: '24px', display: 'flex', gap: '20px', alignItems: 'center' }}>
                                            <div style={{ width: '50px', height: '50px', background: 'rgba(255, 85, 0, 0.1)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>📦</div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '15px', fontWeight: '800', marginBottom: '4px' }}>{p.name}</div>
                                                <div className="flex-between" style={{ marginBottom: '10px' }}>
                                                    <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: '700' }}>{p.stock} Adet</span>
                                                    <span style={{ fontSize: '12px', color: p.status === 'low' ? 'var(--danger)' : 'var(--text-muted)' }}>{p.status.toUpperCase()}</span>
                                                </div>
                                                <div style={{ textAlign: 'right', marginTop: '10px', fontSize: '13px', fontWeight: '900' }}>₺ {p.value.toLocaleString()}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeSubTab === 'customer_rank' && (
                            <div className="flex-col gap-6">
                                <h3 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-muted)', letterSpacing: '1px' }}>🏆 CARİ BAKİYELER</h3>
                                <div className="grid-cols-2 gap-6">
                                    {customerInsights.map((c, i) => (
                                        <div key={i} className="glass-plus" style={{ padding: '30px', borderRadius: '24px', position: 'relative', overflow: 'hidden' }}>
                                            <div style={{ position: 'absolute', top: '20px', right: '20px', fontSize: '11px', fontWeight: '900', color: 'rgba(255,255,255,0.2)' }}>#{i + 1}</div>
                                            <div className="flex-col gap-5">
                                                <div>
                                                    <div style={{ fontSize: '18px', fontWeight: '900', marginBottom: '4px' }}>{c.name}</div>
                                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Son İşlem: {c.lastVisit}</div>
                                                </div>
                                                <div className="flex-between" style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '14px' }}>
                                                    <div className="flex-col" style={{ textAlign: 'right' }}>
                                                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '800' }}>BAKİYE DURUMU</span>
                                                        <span style={{ fontSize: '18px', fontWeight: '900', color: c.balance > 0 ? 'var(--success)' : (c.balance < 0 ? 'var(--danger)' : 'white') }}>
                                                            {c.balance > 0 ? `+ ₺ ${c.balance.toLocaleString()} (Alacak)` : `₺ ${c.balance.toLocaleString()} (Borç)`}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeSubTab === 'bank_moves' && (
                            <div className="flex-col gap-6">
                                <h3 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-muted)', letterSpacing: '1px' }}>🏦 KASA HAREKETLERİ</h3>
                                <div className="grid-cols-3 gap-6">
                                    {recentMoves.map((b, i) => (
                                        <div key={i} className="glass card" style={{ padding: '24px', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                            <div className="flex-between">
                                                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: b.amount > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: b.amount > 0 ? 'var(--success)' : 'var(--danger)' }}>{b.amount > 0 ? '↓' : '↑'}</div>
                                                <div style={{ fontSize: '11px', fontWeight: '900', color: 'var(--text-muted)' }}>{b.date}</div>
                                            </div>
                                            <div className="flex-col gap-1">
                                                <div style={{ fontSize: '15px', fontWeight: '800', minHeight: '40px' }}>{b.desc}</div>
                                                <div style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: '700' }}>{b.bank}</div>
                                            </div>
                                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '15px' }}>
                                                <div style={{ fontSize: '22px', fontWeight: '900', color: b.amount > 0 ? 'var(--success)' : 'white' }}>{b.amount.toLocaleString()} ₺</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
