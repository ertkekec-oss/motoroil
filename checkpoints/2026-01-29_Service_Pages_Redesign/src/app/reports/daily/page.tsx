
"use client";

import { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';

export default function DailyReportPage() {
    const { currentUser, hasPermission, transactions, kasalar } = useApp();
    const isSystemAdmin = currentUser === null;
    const canViewAll = isSystemAdmin || !hasPermission('branch_isolation');

    const [adminActiveTab, setAdminActiveTab] = useState<'overall' | 'branch'>(canViewAll ? 'overall' : 'branch');
    const [selectedBranch, setSelectedBranch] = useState(currentUser?.branch || 'Merkez');

    // Filter transactions for today
    const todayStr = new Date().toLocaleDateString('tr-TR');

    const todayTransactions = useMemo(() => {
        return transactions.filter(t => new Date(t.date).toLocaleDateString('tr-TR') === todayStr);
    }, [transactions, todayStr]);

    const stats = useMemo(() => {
        const filtered = canViewAll && adminActiveTab === 'overall'
            ? todayTransactions
            : todayTransactions; // For now simplified, later can filter by branch if transactions had branch field

        const sales = filtered.filter(t => t.type === 'Sales').reduce((a, b) => a + b.amount, 0);
        const expenses = filtered.filter(t => t.type === 'Expense').reduce((a, b) => a + b.amount, 0);
        const collections = filtered.filter(t => t.type === 'Collection').reduce((a, b) => a + b.amount, 0);

        // Real profit calculation would require cost of goods sold (COGS)
        const profit = 0;

        return {
            sales,
            expenses,
            collections,
            profit,
            net: profit - expenses
        };
    }, [todayTransactions, adminActiveTab, canViewAll]);

    return (
        <div className="container" style={{ padding: '40px 20px' }}>
            <header style={{ marginBottom: '32px' }}>
                <div className="flex-between">
                    <div>
                        <h1 className="text-gradient">Gün Özet Raporu (Canlı)</h1>
                        <p className="text-muted">Rapor Tarihi: {todayStr}</p>
                    </div>

                    {canViewAll && (
                        <div className="flex-center" style={{ background: 'var(--bg-card)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
                            <button
                                onClick={() => setAdminActiveTab('overall')}
                                style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: adminActiveTab === 'overall' ? 'var(--primary)' : 'transparent', color: 'white', cursor: 'pointer' }}
                            >
                                🏢 Konsolide
                            </button>
                            <button
                                onClick={() => setAdminActiveTab('branch')}
                                style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: adminActiveTab === 'branch' ? 'var(--primary)' : 'transparent', color: 'white', cursor: 'pointer' }}
                            >
                                🔧 Şubeler
                            </button>
                        </div>
                    )}
                </div>
            </header>

            <div className="grid-cols-2 gap-6" style={{ marginBottom: '32px' }}>
                <div className="glass-plus" style={{ padding: '40px', borderRadius: '28px', textAlign: 'center', background: 'rgba(255, 85, 0, 0.05)', border: '1px solid rgba(255, 85, 0, 0.1)' }}>
                    <div style={{ fontSize: '11px', fontWeight: '900', color: 'var(--primary)', letterSpacing: '2px', marginBottom: '15px' }}>GÜNLÜK SATIŞ</div>
                    <div style={{ fontSize: '42px', fontWeight: '950' }}>₺ {stats.sales.toLocaleString()}</div>
                    <div style={{ fontSize: '12px', color: 'var(--success)', marginTop: '10px', fontWeight: '800' }}>Canlı Akış</div>
                </div>
                <div className="glass-plus" style={{ padding: '40px', borderRadius: '28px', textAlign: 'center', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                    <div style={{ fontSize: '11px', fontWeight: '900', color: 'var(--success)', letterSpacing: '2px', marginBottom: '15px' }}>TAHMİNİ BRÜT KAR</div>
                    <div style={{ fontSize: '42px', fontWeight: '950', color: 'var(--success)' }}>₺ {stats.profit.toLocaleString()}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '10px', fontWeight: '800' }}>Marj: %35</div>
                </div>
                <div className="glass-plus" style={{ padding: '40px', borderRadius: '28px', textAlign: 'center', background: 'rgba(255, 51, 51, 0.05)', border: '1px solid rgba(255, 51, 51, 0.1)' }}>
                    <div style={{ fontSize: '11px', fontWeight: '900', color: 'var(--danger)', letterSpacing: '2px', marginBottom: '15px' }}>GÜNLÜK GİDER</div>
                    <div style={{ fontSize: '42px', fontWeight: '950', color: 'var(--danger)' }}>₺ {stats.expenses.toLocaleString()}</div>
                    <div style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '10px', fontWeight: '800' }}>Kayıtlı Giderler</div>
                </div>
                <div className="glass-plus" style={{ padding: '40px', borderRadius: '28px', textAlign: 'center', border: '2px solid var(--primary)', background: 'linear-gradient(135deg, rgba(255, 85, 0, 0.1), rgba(0,0,0,0))' }}>
                    <div style={{ fontSize: '11px', fontWeight: '900', color: 'var(--primary)', letterSpacing: '2px', marginBottom: '15px' }}>OPERASYONEL NET</div>
                    <div style={{ fontSize: '42px', fontWeight: '950' }}>₺ {stats.net.toLocaleString()}</div>
                    <div style={{ fontSize: '12px', color: 'var(--primary)', marginTop: '10px', fontWeight: '800' }}>Anlık Durum</div>
                </div>
            </div>

            <div className="card glass">
                <h3 className="mb-6">Anlık İşlem Takibi</h3>
                <div className="flex-col gap-4">
                    {todayTransactions.length > 0 ? (
                        todayTransactions.slice(0, 10).map((t, i) => (
                            <div key={i} className="flex-between p-4" style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div className="flex gap-4 items-center">
                                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: t.type === 'Sales' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {t.type === 'Sales' ? '💰' : '🧾'}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 'bold' }}>{t.description?.split(' | REF:')[0]}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(t.date).toLocaleTimeString('tr-TR')}</div>
                                    </div>
                                </div>
                                <div style={{ fontWeight: 'bold', color: t.type === 'Sales' ? 'var(--success)' : (t.type === 'Expense' ? 'var(--danger)' : 'white') }}>
                                    {t.type === 'Sales' ? '+' : (t.type === 'Expense' ? '-' : '')} ₺ {t.amount.toLocaleString()}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center p-12 text-muted">Bugün henüz bir işlem gerçekleştirilmedi.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
