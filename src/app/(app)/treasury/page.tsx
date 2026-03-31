"use client";

import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useFinancials } from '@/contexts/FinancialContext';
import { useInventory } from '@/contexts/InventoryContext';
import { useCRM } from '@/contexts/CRMContext';
import { EnterpriseCard, EnterpriseSelect } from '@/components/ui/enterprise';

export default function TreasuryPage() {
    const { currentUser } = useApp();
    const { products } = useInventory();
    const { customers, suppliers } = useCRM();
    const { transactions } = useFinancials();
    const isSystemAdmin = currentUser === null || currentUser.role?.toLowerCase().includes('admin') || currentUser.role?.toLowerCase().includes('müdür');

    if (!isSystemAdmin) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-[#07090e] flex items-center justify-center p-6">
                <EnterpriseCard className="p-12 text-center max-w-lg border-red-500/30 bg-red-50 dark:bg-red-500/5">
                    <div className="text-6xl mb-6 grayscale opacity-80">🚫</div>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-widest mb-3">Yetkisiz Erişim</h2>
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Hazine dairesine sadece sistem yöneticisi girebilir.</p>
                </EnterpriseCard>
            </div>
        );
    }

    // Calculations
    const totalReceivables = customers.reduce((acc: number, c: any) => acc + (c.balance > 0 ? c.balance : 0), 0) +
        suppliers.reduce((acc: number, s: any) => acc + (s.balance > 0 ? s.balance : 0), 0);
    const totalPayables = suppliers.reduce((acc: number, s: any) => acc + (s.balance < 0 ? Math.abs(s.balance) : 0), 0) +
        customers.reduce((acc: number, c: any) => acc + (c.balance < 0 ? Math.abs(c.balance) : 0), 0);
    const inventoryValue = products.reduce((acc: number, p: any) => acc + ((p.buyPrice || 0) * (p.stock || 0)), 0);

    // Date based expenses
    const [dateRange, setDateRange] = useState('month'); // week, month, year, all

    const getExpenseTotal = () => {
        const now = new Date();
        let filtered = transactions.filter((t: any) => t.type === 'Expense');

        if (dateRange === 'week') {
            const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            filtered = filtered.filter((t: any) => new Date(t.date) >= lastWeek);
        } else if (dateRange === 'month') {
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            filtered = filtered.filter((t: any) => new Date(t.date) >= lastMonth);
        } else if (dateRange === 'year') {
            const lastYear = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
            filtered = filtered.filter((t: any) => new Date(t.date) >= lastYear);
        }

        return filtered.reduce((acc: number, t: any) => acc + Number(t.amount || 0), 0);
    };

    const expenseTotal = getExpenseTotal();
    const netWorth = totalReceivables + inventoryValue - totalPayables;

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-[#07090e] pb-16">
            <div className="sticky top-0 z-40 bg-white/80 dark:bg-[#0b101a]/80 backdrop-blur-xl border-b border-light dark:border-white/5 pt-8 pb-6 px-4 md:px-8 xl:px-12 transition-all">
                <div className="max-w-[1400px] mx-auto w-full flex flex-col gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400/20 to-orange-500/20 dark:from-amber-400/10 dark:to-orange-500/10 flex items-center justify-center text-3xl shadow-inner border border-amber-500/30">
                            👑
                        </div>
                        <div className="flex flex-col gap-1">
                            <h1 className="text-[32px] md:text-[40px] font-black text-slate-900 dark:text-white leading-tight tracking-tight">
                                Hazine Dairesi
                            </h1>
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                                Şirket varlık ve yükümlülüklerinin ana yönetim merkezi.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-[1400px] w-full mx-auto px-4 md:px-8 xl:px-12 mt-8 flex flex-col gap-8">
                {/* MAIN METRICS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <EnterpriseCard className="p-8 border-l-[6px] border-l-emerald-400 dark:border-l-emerald-500 border-slate-200 dark:border-white/5 bg-white dark:bg-[#0f172a] shadow-lg relative overflow-hidden group">
                        <div className="absolute -right-6 -top-6 text-8xl opacity-[0.03] dark:opacity-[0.02] grayscale group-hover:scale-110 transition-transform">📈</div>
                        <div className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Toplam Alacaklar (Cari)</div>
                        <div className="text-4xl md:text-5xl font-black text-slate-800 dark:text-white tracking-tight flex items-baseline gap-2">
                            <span className="text-2xl opacity-50">₺</span>
                            {totalReceivables.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-[11px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mt-4 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                            Tahsilat Bekleyen Toplam Tutar
                        </div>
                    </EnterpriseCard>

                    <EnterpriseCard className="p-8 border-l-[6px] border-l-red-400 dark:border-l-red-500 border-slate-200 dark:border-white/5 bg-white dark:bg-[#0f172a] shadow-lg relative overflow-hidden group">
                        <div className="absolute -right-6 -top-6 text-8xl opacity-[0.03] dark:opacity-[0.02] grayscale group-hover:scale-110 transition-transform">📉</div>
                        <div className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Toplam Borçlar (Tedarikçi)</div>
                        <div className="text-4xl md:text-5xl font-black text-slate-800 dark:text-white tracking-tight flex items-baseline gap-2">
                            <span className="text-2xl opacity-50">₺</span>
                            {totalPayables.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-[11px] font-black uppercase tracking-widest text-red-600 dark:text-red-400 mt-4 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                            Ödenmesi Gereken Toplam Tutar
                        </div>
                    </EnterpriseCard>

                    <EnterpriseCard className="p-8 border-l-[6px] border-l-blue-400 dark:border-l-blue-500 border-slate-200 dark:border-white/5 bg-white dark:bg-[#0f172a] shadow-lg relative overflow-hidden group">
                        <div className="absolute -right-6 -top-6 text-8xl opacity-[0.03] dark:opacity-[0.02] grayscale group-hover:scale-110 transition-transform">💎</div>
                        <div className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Envanter Sermayesi</div>
                        <div className="text-4xl md:text-5xl font-black text-slate-800 dark:text-white tracking-tight flex items-baseline gap-2">
                            <span className="text-2xl opacity-50">₺</span>
                            {inventoryValue.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-[11px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 mt-4 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                            Rafta Bekleyen Değer (Maliyet Bazlı)
                        </div>
                    </EnterpriseCard>

                    <EnterpriseCard className="p-8 border-l-[6px] border-l-amber-400 dark:border-l-amber-500 border-slate-200 dark:border-white/5 bg-white dark:bg-[#0f172a] shadow-lg relative overflow-hidden group flex flex-col justify-between">
                        <div className="absolute -right-6 -top-6 text-8xl opacity-[0.03] dark:opacity-[0.02] grayscale group-hover:scale-110 transition-transform">💸</div>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-2">Giderler Toplamı</div>
                            <div className="w-32">
                                <EnterpriseSelect
                                    value={dateRange}
                                    onChange={(e) => setDateRange(e.target.value)}
                                >
                                    <option value="week">Son 7 Gün</option>
                                    <option value="month">Son 30 Gün</option>
                                    <option value="year">Son 1 Yıl</option>
                                    <option value="all">Tüm Zamanlar</option>
                                </EnterpriseSelect>
                            </div>
                        </div>
                        <div className="text-4xl md:text-5xl font-black text-slate-800 dark:text-white tracking-tight flex items-baseline gap-2 relative z-10 mt-auto">
                            <span className="text-2xl opacity-50">₺</span>
                            {expenseTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-[11px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-500 mt-4 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                            Operasyonel Harcamalar
                        </div>
                    </EnterpriseCard>
                </div>

                {/* NET WORTH SUMMARY */}
                <div className="relative overflow-hidden mt-8 p-12 md:p-16 rounded-[32px] bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 shadow-2xl text-center">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 mix-blend-overlay pointer-events-none"></div>
                    <div className="text-xs font-black tracking-[4px] text-slate-400 uppercase mb-8 relative z-10">
                        Net Şirket Varlık Değeri (P-L)
                    </div>
                    <div className={`text-5xl md:text-7xl lg:text-[80px] font-black tracking-tighter drop-shadow-2xl relative z-10 flex justify-center items-center gap-4 ${netWorth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        <span className="text-3xl md:text-5xl opacity-50 font-bold">₺</span>
                        {netWorth.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    
                    <div className="mt-12 flex flex-col md:flex-row justify-center items-center gap-4 md:gap-8 text-[11px] font-black uppercase tracking-widest text-slate-400 relative z-10">
                        <div className="flex items-center gap-2 bg-slate-800/80 px-4 py-2 rounded-xl backdrop-blur-md border border-slate-700">
                            <span className="text-emerald-400">+</span> Alacaklar: {totalReceivables.toLocaleString('tr-TR', { minimumFractionDigits: 0 })} ₺
                        </div>
                        <div className="flex items-center gap-2 bg-slate-800/80 px-4 py-2 rounded-xl backdrop-blur-md border border-slate-700">
                            <span className="text-blue-400">+</span> Envanter: {inventoryValue.toLocaleString('tr-TR', { minimumFractionDigits: 0 })} ₺
                        </div>
                        <div className="flex items-center gap-2 bg-slate-800/80 px-4 py-2 rounded-xl backdrop-blur-md border border-slate-700">
                            <span className="text-red-400">-</span> Borçlar: {totalPayables.toLocaleString('tr-TR', { minimumFractionDigits: 0 })} ₺
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
