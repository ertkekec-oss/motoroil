"use client";

import { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#6366f1'];

export default function SupplierReportContent() {
    const { suppliers, transactions, branches } = useApp();
    const [selectedBranch, setSelectedBranch] = useState('all');
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            const d = new Date(t.date);
            const start = new Date(dateRange.start);
            const end = new Date(dateRange.end);
            end.setHours(23, 59, 59, 999);
            const dateMatch = d >= start && d <= end;
            const branchMatch = selectedBranch === 'all' || (t as any).branch === selectedBranch;
            return dateMatch && branchMatch && t.supplierId;
        });
    }, [transactions, dateRange, selectedBranch]);

    const supplierStats = useMemo(() => {
        const stats: Record<string, { id: string, name: string, totalPurchase: number, totalPayment: number, balance: number, count: number }> = {};

        suppliers.forEach(s => {
            if (selectedBranch !== 'all' && s.branch !== selectedBranch) return;
            stats[s.id] = { id: s.id.toString(), name: s.name, totalPurchase: 0, totalPayment: 0, balance: Number(s.balance), count: 0 };
        });

        filteredTransactions.forEach(t => {
            if (!t.supplierId) return;
            const sId = t.supplierId.toString();
            if (!stats[sId]) return;

            if (t.type === 'Purchase' || t.type === 'Expense') {
                stats[sId].totalPurchase += Number(t.amount);
                stats[sId].count += 1;
            } else if (t.type === 'Payment') {
                stats[sId].totalPayment += Number(t.amount);
            }
        });

        return Object.values(stats).sort((a, b) => b.totalPurchase - a.totalPurchase);
    }, [suppliers, filteredTransactions, selectedBranch]);

    const topSuppliersData = useMemo(() => {
        return supplierStats.slice(0, 5).map(s => ({ name: s.name, value: s.totalPurchase }));
    }, [supplierStats]);

    const totalStats = useMemo(() => {
        const totalPurchase = supplierStats.reduce((a, b) => a + b.totalPurchase, 0);
        const totalPayment = supplierStats.reduce((a, b) => a + b.totalPayment, 0);
        const totalDebt = suppliers
            .filter(s => (selectedBranch === 'all' || s.branch === selectedBranch) && Number(s.balance) < 0)
            .reduce((a, b) => a + Math.abs(Number(b.balance)), 0);

        return { totalPurchase, totalPayment, totalDebt };
    }, [supplierStats, suppliers, selectedBranch]);

    return (
        <div>
            <header style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                <div>
                    <h1 className="text-gradient" style={{ fontSize: '32px', fontWeight: '900', margin: 0 }}>🚚 Tedarikçi Raporları</h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Satın alma hacmi, ödeme dengesi ve performans analizi</p>
                </div>

                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <select
                        value={selectedBranch}
                        onChange={e => setSelectedBranch(e.target.value)}
                        style={{ padding: '10px', borderRadius: '8px', background: 'var(--bg-card)', color: 'white', border: '1px solid var(--border-light)' }}
                    >
                        <option value="all">Tüm Şubeler</option>
                        {branches.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
                    </select>

                    <div style={{ display: 'flex', gap: '10px', background: 'var(--bg-card)', padding: '10px', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
                        <input type="date" value={dateRange.start} onChange={e => setDateRange({ ...dateRange, start: e.target.value })} style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', fontSize: '13px' }} />
                        <span style={{ color: 'var(--text-muted)' }}>→</span>
                        <input type="date" value={dateRange.end} onChange={e => setDateRange({ ...dateRange, end: e.target.value })} style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', fontSize: '13px' }} />
                    </div>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
                <div className="card glass-plus" style={{ padding: '24px', borderLeft: '4px solid var(--primary)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'bold' }}>DÖNEMLİK ALIM HACMİ</div>
                    <div style={{ fontSize: '32px', fontWeight: '900', marginTop: '5px' }}>₺{totalStats.totalPurchase.toLocaleString()}</div>
                </div>
                <div className="card glass-plus" style={{ padding: '24px', borderLeft: '4px solid var(--success)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'bold' }}>DÖNEMLİK ÖDEMELER</div>
                    <div style={{ fontSize: '32px', fontWeight: '900', marginTop: '5px' }}>₺{totalStats.totalPayment.toLocaleString()}</div>
                </div>
                <div className="card glass-plus" style={{ padding: '24px', borderLeft: '4px solid var(--error)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'bold' }}>GÜNCEL TOPLAM BORÇ</div>
                    <div style={{ fontSize: '32px', fontWeight: '900', marginTop: '5px', color: 'var(--error)' }}>₺{totalStats.totalDebt.toLocaleString()}</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '30px' }}>
                <div className="card glass" style={{ padding: '24px' }}>
                    <h3 style={{ marginBottom: '20px' }}>📊 En Çok Alım Yapılan Tedarikçiler</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={supplierStats.slice(0, 8)}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 10 }} />
                            <YAxis stroke="rgba(255,255,255,0.3)" />
                            <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #333' }} />
                            <Bar dataKey="totalPurchase" name="Alım Tutarı" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="card glass" style={{ padding: '24px' }}>
                    <h3 style={{ marginBottom: '20px' }}>🥧 Tedarikçi Dağılımı</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={topSuppliersData}
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {topSuppliersData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="card glass" style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ padding: '20px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between' }}>
                    <h3 style={{ margin: 0 }}>📝 Tedarikçi Detay Listesi</h3>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.02)', textAlign: 'left', fontSize: '13px', color: 'var(--text-muted)' }}>
                            <th style={{ padding: '15px 20px' }}>Tedarikçi Firma</th>
                            <th>İşlem Adedi</th>
                            <th>Dönem Alım</th>
                            <th>Dönem Ödeme</th>
                            <th>Güncel Bakiye</th>
                            <th style={{ textAlign: 'right', paddingRight: '20px' }}>Durum</th>
                        </tr>
                    </thead>
                    <tbody>
                        {supplierStats.map(s => (
                            <tr key={s.id} style={{ borderBottom: '1px solid var(--border-light)' }} className="hover:bg-white/5">
                                <td style={{ padding: '15px 20px', fontWeight: 'bold' }}>{s.name}</td>
                                <td>{s.count}</td>
                                <td>₺{s.totalPurchase.toLocaleString()}</td>
                                <td>₺{s.totalPayment.toLocaleString()}</td>
                                <td style={{ color: s.balance < 0 ? 'var(--error)' : 'var(--success)', fontWeight: 'bold' }}>
                                    ₺{Math.abs(s.balance).toLocaleString()}
                                </td>
                                <td style={{ textAlign: 'right', paddingRight: '20px' }}>
                                    <span style={{ fontSize: '10px', padding: '4px 8px', borderRadius: '12px', background: s.balance < 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: s.balance < 0 ? 'var(--error)' : 'var(--success)' }}>
                                        {s.balance < 0 ? 'BORÇLUYUZ' : 'ALACAKLIYIZ'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
