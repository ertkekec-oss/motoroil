
"use client";

import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useFinancials } from '@/contexts/FinancialContext';
import { useInventory } from '@/contexts/InventoryContext';
import { useCRM } from '@/contexts/CRMContext';

export default function TreasuryPage() {
    const { currentUser } = useApp();
    const { products } = useInventory();
    const { customers, suppliers } = useCRM();
    const { transactions } = useFinancials();
    const isSystemAdmin = currentUser === null || currentUser.role.toLowerCase().includes('admin') || currentUser.role.toLowerCase().includes('müdür');

    if (!isSystemAdmin) {
        return (
            <div className="flex-center" style={{ height: '100vh', background: 'var(--bg-deep)', color: 'var(--text-main)' }}>
                <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '24px', border: '1px solid #ef4444' }}>
                    <div style={{ fontSize: '64px', marginBottom: '20px' }}>🚫</div>
                    <h2 style={{ fontSize: '24px', fontWeight: '900' }}>YETKİSİZ ERİŞİM</h2>
                    <p className="text-muted" style={{ marginTop: '10px' }}>Hazine dairesine sadece sistem yöneticisi girebilir.</p>
                </div>
            </div>
        );
    }

    // Calculations
    const totalReceivables = customers.reduce((acc, c) => acc + (c.balance > 0 ? c.balance : 0), 0) +
        suppliers.reduce((acc, s) => acc + (s.balance > 0 ? s.balance : 0), 0);
    const totalPayables = suppliers.reduce((acc, s) => acc + (s.balance < 0 ? Math.abs(s.balance) : 0), 0) +
        customers.reduce((acc, c) => acc + (c.balance < 0 ? Math.abs(c.balance) : 0), 0);
    const inventoryValue = products.reduce((acc, p) => acc + ((p.buyPrice || 0) * (p.stock || 0)), 0);

    // Date based expenses
    const [dateRange, setDateRange] = useState('month'); // week, month, year, all

    const getExpenseTotal = () => {
        const now = new Date();
        let filtered = transactions.filter(t => t.type === 'Expense');

        if (dateRange === 'week') {
            const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            filtered = filtered.filter(t => new Date(t.date) >= lastWeek);
        } else if (dateRange === 'month') {
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            filtered = filtered.filter(t => new Date(t.date) >= lastMonth);
        } else if (dateRange === 'year') {
            const lastYear = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
            filtered = filtered.filter(t => new Date(t.date) >= lastYear);
        }

        return filtered.reduce((acc, t) => acc + Number(t.amount || 0), 0);
    };

    const expenseTotal = getExpenseTotal();

    return (
        <div className="container" style={{ padding: '40px' }}>
            <header className="mb-10">
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{
                        width: '64px', height: '64px', background: 'linear-gradient(135deg, #ffd700 0%, #b8860b 100%)',
                        borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px',
                        boxShadow: '0 10px 30px rgba(218, 165, 32, 0.3)'
                    }}>👑</div>
                    <div>
                        <h1 className="text-gradient" style={{ fontSize: '36px', fontWeight: '1000', letterSpacing: '-1px' }}>Hazine Dairesi</h1>
                        <p className="text-muted">Şirket varlık ve yükümlülüklerinin ana yönetim merkezi</p>
                    </div>
                </div>
            </header>

            {/* MAIN METRICS */}
            <div className="grid-cols-2 gap-8 mb-10">
                <div className="card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm animate-slide-up" style={{ padding: '40px', borderLeft: '6px solid #4ade80' }}>
                    <div className="text-muted" style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '2px', marginBottom: '15px' }}>TOPLAM ALACAKLAR (Cari)</div>
                    <div style={{ fontSize: '48px', fontWeight: '1000', color: 'var(--text-main)' }}>₺ {totalReceivables.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <p style={{ color: '#4ade80', fontSize: '12px', marginTop: '10px', fontWeight: '700' }}>📈 Tahsilat Bekleyen Toplam Tutar</p>
                </div>

                <div className="card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm animate-slide-up" style={{ padding: '40px', borderLeft: '6px solid #f87171', animationDelay: '0.1s' }}>
                    <div className="text-muted" style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '2px', marginBottom: '15px' }}>TOPLAM BORÇLAR (Tedarikçi)</div>
                    <div style={{ fontSize: '48px', fontWeight: '1000', color: 'var(--text-main)' }}>₺ {totalPayables.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <p style={{ color: '#f87171', fontSize: '12px', marginTop: '10px', fontWeight: '700' }}>📉 Ödenmesi Gereken Toplam Tutar</p>
                </div>

                <div className="card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm animate-slide-up" style={{ padding: '40px', borderLeft: '6px solid #60a5fa', animationDelay: '0.2s' }}>
                    <div className="text-muted" style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '2px', marginBottom: '15px' }}>ENVANTER SERMAYESİ</div>
                    <div style={{ fontSize: '48px', fontWeight: '1000', color: 'var(--text-main)' }}>₺ {inventoryValue.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <p style={{ color: '#60a5fa', fontSize: '12px', marginTop: '10px', fontWeight: '700' }}>💎 Rafta Bekleyen Değer (Maliyet Bazlı)</p>
                </div>

                <div className="card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm animate-slide-up" style={{ padding: '40px', borderLeft: '6px solid #fbbf24', animationDelay: '0.3s' }}>
                    <div className="flex-between mb-4">
                        <div className="text-muted" style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '2px' }}>GİDERLER TOPLAMI</div>
                        <select
                            value={dateRange}
                            onChange={e => setDateRange(e.target.value)}
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '6px 12px', borderRadius: '10px', fontSize: '12px', outline: 'none' }}
                        >
                            <option value="week">Son 7 Gün</option>
                            <option value="month">Son 30 Gün</option>
                            <option value="year">Son 1 Yıl</option>
                            <option value="all">Tüm Zamanlar</option>
                        </select>
                    </div>
                    <div style={{ fontSize: '48px', fontWeight: '1000', color: 'var(--text-main)' }}>₺ {expenseTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <p style={{ color: '#fbbf24', fontSize: '12px', marginTop: '10px', fontWeight: '700' }}>💸 Operasyonel Harcamalar</p>
                </div>
            </div>

            {/* NET WORTH SUMMARY */}
            <div className="card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm" style={{
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)',
                padding: '50px',
                textAlign: 'center',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                marginTop: '40px'
            }}>
                <div className="text-muted" style={{ fontSize: '14px', fontWeight: '800', letterSpacing: '4px', marginBottom: '20px' }}>NET ŞİRKET VARLIK DEĞERİ (P-L)</div>
                <div style={{
                    fontSize: '72px',
                    fontWeight: '1000',
                    color: (totalReceivables + inventoryValue - totalPayables) >= 0 ? 'var(--success)' : '#ef4444',
                    textShadow: '0 0 30px rgba(0,0,0,0.5)'
                }}>
                    ₺ {(totalReceivables + inventoryValue - totalPayables).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '30px', color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
                    <span>+ Alacaklar: {totalReceivables.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    <span>+ Envanter: {inventoryValue.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    <span>- Borçlar: {totalPayables.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
            </div>

            <style jsx>{`
                .container { max-width: 1200px; margin: 0 auto; }
            `}</style>
        </div>
    );
}
