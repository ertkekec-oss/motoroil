
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';

export default function DailyReportPage() {
    const { currentUser, hasPermission, transactions, kasalar } = useApp();
    const isSystemAdmin = currentUser === null || currentUser.role === 'ADMIN' || currentUser.role === 'Sistem Sahibi';
    const canViewAll = isSystemAdmin || !hasPermission('branch_isolation');

    const [adminActiveTab, setAdminActiveTab] = useState<'overall' | 'branch'>(canViewAll ? 'overall' : 'branch');
    const [selectedBranch, setSelectedBranch] = useState(currentUser?.branch || 'Merkez');

    // Filter transactions for today
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 30000);
        return () => clearInterval(timer);
    }, []);

    const todayStr = useMemo(() => now.toLocaleDateString('tr-TR'), [now]);
    const currentTimeStr = useMemo(() => now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }), [now]);

    const todayTransactions = useMemo(() => {
        return transactions.filter(t => new Date(t.date).toLocaleDateString('tr-TR') === todayStr);
    }, [transactions, todayStr]);

    // Functional Branch Filtering
    const filteredTransactions = useMemo(() => {
        if (canViewAll && adminActiveTab === 'overall') return todayTransactions;

        return todayTransactions.filter(t => {
            const kasa = kasalar.find(k => String(k.id) === String(t.kasaId));
            return kasa?.branch === selectedBranch;
        });
    }, [todayTransactions, adminActiveTab, canViewAll, selectedBranch, kasalar]);

    const stats = useMemo(() => {
        const sales = filteredTransactions.filter(t => t.type === 'Sales').reduce((a, b) => a + Number(b.amount), 0);
        const expenses = filteredTransactions.filter(t => t.type === 'Expense' || t.type === 'Payment').reduce((a, b) => a + Number(b.amount), 0);
        const collections = filteredTransactions.filter(t => t.type === 'Collection').reduce((a, b) => a + Number(b.amount), 0);
        const payments = filteredTransactions.filter(t => t.type === 'Payment').reduce((a, b) => a + Number(b.amount), 0);

        return {
            sales,
            expenses, // Direct expenses (like bills)
            collections, // Cash/Bank entry not from sale
            net: (sales + collections) - (expenses + payments)
        };
    }, [filteredTransactions]);

    return (
        <div className="p-6 pb-32 animate-fade-in">
            <style jsx>{`
                .glass-card {
                    background: rgba(15, 17, 30, 0.4);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 24px;
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .glass-card:hover {
                    border-color: var(--primary);
                    transform: translateY(-5px);
                    background: rgba(15, 17, 30, 0.6);
                    box-shadow: 0 20px 40px -20px var(--primary-glow);
                }
                .pulse-box {
                    width: 8px;
                    height: 8px;
                    background: var(--primary);
                    border-radius: 50%;
                    box-shadow: 0 0 0 rgba(255, 85, 0, 0.4);
                    animation: pulse 1.5s infinite;
                }
                @keyframes pulse {
                    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255, 85, 0, 0.7); }
                    70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(255, 85, 0, 0); }
                    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255, 85, 0, 0); }
                }
                .stat-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 24px;
                }
                .gradient-text-orange { background: linear-gradient(135deg, #FF8800, #FF5500); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
                .gradient-text-green { background: linear-gradient(135deg, #10B981, #059669); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
                .gradient-text-red { background: linear-gradient(135deg, #FF4B2B, #FF416C); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
                .gradient-text-cyan { background: linear-gradient(135deg, #00F0FF, #00B4D8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }

                .select-premium {
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    color: white;
                    border-radius: 12px;
                    padding: 8px 16px;
                    font-size: 12px;
                    font-weight: 700;
                    outline: none;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .select-premium:focus { border-color: var(--primary); background: rgba(255,255,255,0.1); }
            `}</style>

            <header className="flex justify-between items-end mb-10 overflow-hidden">
                <div className="animate-in fade-in slide-in-from-left duration-700">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="pulse-box"></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Canlı Akış Aktif</span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-white mb-1">Gün Özet Raporu</h1>
                    <p className="text-white/40 font-medium">Şu an: {currentTimeStr} • Veriler anlık olarak güncellenmektedir.</p>
                </div>

                <div className="flex items-center gap-4 bg-white/5 p-1 rounded-2xl border border-white/5 animate-in fade-in slide-in-from-right duration-700">
                    {adminActiveTab === 'branch' && canViewAll && (
                        <select
                            className="select-premium mr-2"
                            value={selectedBranch}
                            onChange={(e) => setSelectedBranch(e.target.value)}
                        >
                            {branches?.map((b: any) => (
                                <option key={b.id} value={b.name} style={{ background: '#080911' }}>{b.name}</option>
                            ))}
                        </select>
                    )}
                    {canViewAll && (
                        <div className="flex bg-black/20 rounded-xl p-1">
                            <button
                                onClick={() => setAdminActiveTab('overall')}
                                className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${adminActiveTab === 'overall' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-white/40 hover:text-white'}`}
                            >
                                KONSOLİDE
                            </button>
                            <button
                                onClick={() => setAdminActiveTab('branch')}
                                className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${adminActiveTab === 'branch' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-white/40 hover:text-white'}`}
                            >
                                ŞUBE BAZLI
                            </button>
                        </div>
                    )}
                </div>
            </header>

            <div className="stat-grid mb-10">
                <div className="glass-card p-8 group">
                    <div className="text-[10px] font-black tracking-widest text-primary mb-6 flex justify-between">
                        <span>TOPLAM CİRO</span>
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity">↗</span>
                    </div>
                    <div className="text-4xl font-black text-white mb-2">
                        ₺ <span className="gradient-text-orange">{stats.sales.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-white/20">
                        <span className="w-4 h-0.5 bg-primary/20"></span>
                        GÜNLÜK SATIŞ HACMİ
                    </div>
                </div>

                <div className="glass-card p-8 group">
                    <div className="text-[10px] font-black tracking-widest text-emerald-400 mb-6 flex justify-between">
                        <span>TOPLAM TAHSİLAT</span>
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity">↗</span>
                    </div>
                    <div className="text-4xl font-black text-white mb-2">
                        ₺ <span className="gradient-text-green">{stats.collections.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-white/20">
                        <span className="w-4 h-0.5 bg-emerald-400/20"></span>
                        KASA GİRİŞLERİ
                    </div>
                </div>

                <div className="glass-card p-8 group">
                    <div className="text-[10px] font-black tracking-widest text-red-500 mb-6 flex justify-between">
                        <span>TOPLAM GİDER</span>
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity">↘</span>
                    </div>
                    <div className="text-4xl font-black text-white mb-2">
                        ₺ <span className="gradient-text-red">{stats.expenses.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-white/20">
                        <span className="w-4 h-0.5 bg-red-500/20"></span>
                        TÜM ÇIKIŞLAR
                    </div>
                </div>

                <div className="glass-card p-8 group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000"></div>
                    <div className="text-[10px] font-black tracking-widest text-cyan-400 mb-6 flex justify-between">
                        <span>BAKİYE DEĞİŞİMİ</span>
                        <span className="px-2 py-0.5 rounded-full bg-cyan-400/10 text-[8px]">NET</span>
                    </div>
                    <div className="text-4xl font-black text-white mb-2">
                        ₺ <span className="gradient-text-cyan">{stats.net.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-white/20">
                        <span className="w-4 h-0.5 bg-cyan-400/20"></span>
                        GÜNLÜK NET OPERASYON
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 glass-card p-10">
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h3 className="text-xl font-black text-white mb-1">Anlık İşlem Takibi</h3>
                            <p className="text-sm text-white/30 truncate max-w-[200px] md:max-w-none">
                                {adminActiveTab === 'overall' ? 'Tüm şubelerden gelen konsolide akış.' : `${selectedBranch} şubesi finansal akışı.`}
                            </p>
                        </div>
                        <div className="text-[10px] font-black text-white/20 uppercase tracking-widest bg-white/5 px-4 py-2 rounded-full border border-white/5">Bugün: {filteredTransactions.length} İşlem</div>
                    </div>

                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                        {filteredTransactions.length > 0 ? (
                            filteredTransactions.slice(0, 20).map((t, i) => (
                                <div key={i} className="flex-between p-5 group rounded-2xl bg-white/[0.02] border border-white/[0.03] hover:bg-white/[0.05] hover:border-white/10 hover:translate-x-1 transition-all">
                                    <div className="flex gap-5 items-center">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-lg ${t.type === 'Sales' ? 'bg-orange-500/10 text-orange-400 shadow-orange-500/5' :
                                            t.type === 'Expense' ? 'bg-red-500/10 text-red-400 shadow-red-500/5' :
                                                t.type === 'Collection' ? 'bg-emerald-500/10 text-emerald-400 shadow-emerald-500/5' :
                                                    'bg-white/10 text-white shadow-white/5'
                                            }`}>
                                            {t.type === 'Sales' ? '💰' : t.type === 'Expense' ? '🧾' : t.type === 'Collection' ? '📥' : '💼'}
                                        </div>
                                        <div>
                                            <div className="font-bold text-white/90 group-hover:text-white transition-colors">{t.description?.split(' | REF:')[0]}</div>
                                            <div className="flex items-center gap-3">
                                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${t.type === 'Sales' ? 'bg-orange-500/20 text-orange-400' :
                                                    t.type === 'Collection' ? 'bg-emerald-500/20 text-emerald-400' :
                                                        'bg-red-500/20 text-red-400'
                                                    }`}>{t.type}</span>
                                                <span className="w-1 h-1 rounded-full bg-white/10"></span>
                                                <span className="text-[10px] text-white/40 font-bold">{new Date(t.date).toLocaleTimeString('tr-TR')}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`text-lg font-black tracking-tight ${t.type === 'Sales' || t.type === 'Collection' ? 'text-emerald-400' : 'text-red-400'
                                        }`}>
                                        {t.type === 'Sales' || t.type === 'Collection' ? '+' : '-'} ₺ {Number(t.amount).toLocaleString()}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-white/20 border-2 border-dashed border-white/5 rounded-3xl">
                                <span className="text-4xl mb-4">🌑</span>
                                <p className="text-sm font-bold uppercase tracking-widest">Henüz bir işlem gerçekleştirilmedi.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="glass-card p-10">
                        <h3 className="text-lg font-black text-white mb-6">Kasa Dağılımı</h3>
                        <div className="space-y-7">
                            {kasalar.filter(k => (canViewAll && adminActiveTab === 'overall') ? true : k.branch === selectedBranch).slice(0, 6).map((kasa, i) => {
                                const relevantKasas = kasalar.filter(k => (canViewAll && adminActiveTab === 'overall') ? true : k.branch === selectedBranch);
                                const totalWeight = relevantKasas.reduce((a, b) => a + Math.abs(Number(b.balance)), 0) || 1;
                                const percentage = (Math.abs(Number(kasa.balance)) / totalWeight) * 100;
                                return (
                                    <div key={i} className="space-y-2 group">
                                        <div className="flex justify-between items-end">
                                            <span className="text-[11px] font-black text-white/50 uppercase tracking-widest group-hover:text-white/80 transition-colors">{kasa.name}</span>
                                            <span className="text-xs font-black text-white">₺ {Number(kasa.balance).toLocaleString()}</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full bg-gradient-to-r ${i % 2 === 0 ? 'from-primary to-orange-400' : 'from-emerald-400 to-green-600'} shadow-[0_0_10px_var(--primary-glow)] transition-all duration-1000`}
                                                style={{ width: `${percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })}

                            {kasalar.filter(k => (canViewAll && adminActiveTab === 'overall') ? true : k.branch === selectedBranch).length === 0 && (
                                <p className="text-center text-white/20 text-xs font-bold py-10 uppercase tracking-widest">Kasa Bulunamadı</p>
                            )}
                        </div>
                    </div>

                    <div className="glass-card p-10 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl group-hover:rotate-12 transition-transform">💡</div>
                        <h3 className="text-lg font-black text-white mb-4">Analitik Özet</h3>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <span className="text-emerald-400 mt-1">✓</span>
                                <p className="text-xs text-white/60 leading-relaxed font-medium">
                                    Bugün için <span className="text-white font-bold">{filteredTransactions.filter(t => t.type === 'Sales').length}</span> başarılı satış kapatıldı.
                                </p>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="text-orange-400 mt-1">!</span>
                                <p className="text-xs text-white/60 leading-relaxed font-medium">
                                    Ortalama işlem tutarı ₺ <span className="text-white font-bold">
                                        {filteredTransactions.length ? Math.round(stats.sales / (filteredTransactions.filter(t => t.type === 'Sales').length || 1)).toLocaleString() : '0'}
                                    </span> seviyesinde.
                                </p>
                            </div>
                        </div>
                        <button className="w-full mt-8 py-3 rounded-xl bg-primary text-white text-[10px] font-black tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20">
                            DETAYLI RAPOR İNDİR
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
