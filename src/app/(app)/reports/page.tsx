"use client";

import React, { useState } from 'react';
import { 
    TrendingUp, Calculator, Clock, Map, Package, Factory, 
    ArrowRight, Activity, WalletCards, ShieldAlert,
    ChevronUp, ChevronDown, CheckCircle2, XCircle
} from 'lucide-react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Legend, PieChart, Pie, Cell
} from 'recharts';
import { useRouter } from 'next/navigation';

const REVENUE_DATA = [
    { name: 'Pzt', income: 4000, expense: 2400 },
    { name: 'Sal', income: 3000, expense: 1398 },
    { name: 'Çar', income: 2000, expense: 9800 },
    { name: 'Per', income: 2780, expense: 3908 },
    { name: 'Cum', income: 1890, expense: 4800 },
    { name: 'Cmt', income: 2390, expense: 3800 },
    { name: 'Paz', income: 3490, expense: 4300 },
];

const TARGET_DATA = [
    { name: 'Kazanılan', value: 65, color: '#10b981' },
    { name: 'Kaybedilen', value: 15, color: '#ef4444' },
    { name: 'Bekleyen', value: 20, color: '#f59e0b' },
];

export default function ReportsDashboardPage() {
    const router = useRouter();
    const [timeRange, setTimeRange] = useState('Bu Hafta');

    return (
        <div className="p-4 sm:p-6 lg:p-8 animate-in fade-in duration-300 max-w-[1600px] mx-auto w-full">
            
            {/* Context Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Genel Özet Panosu</h2>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                        Şirketin güncel temel performans göstergeleri (KPI) ve özet analizleri
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <select 
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option>Bugün</option>
                        <option>Bu Hafta</option>
                        <option>Bu Ay</option>
                        <option>Bu Yıl</option>
                    </select>
                    <button 
                        onClick={() => router.push('/reports/ceo')}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-5 py-2 flex items-center gap-2 rounded-lg transition-colors shadow-sm"
                    >
                        Strateji Merkezi <ArrowRight size={16} />
                    </button>
                </div>
            </div>

            {/* KPI Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
                {/* KPI 1 */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
                    <div className="flex items-start justify-between mb-2">
                        <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <TrendingUp size={20} strokeWidth={2.5} />
                        </div>
                        <span className="flex items-center gap-1 text-[12px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">
                            <ChevronUp size={14} /> +12.5%
                        </span>
                    </div>
                    <h3 className="text-[13px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-4">Toplam Ciro</h3>
                    <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">₺2.4M</div>
                </div>

                {/* KPI 2 */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
                    <div className="flex items-start justify-between mb-2">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                            <WalletCards size={20} strokeWidth={2.5} />
                        </div>
                        <span className="flex items-center gap-1 text-[12px] font-bold text-red-500 bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded-full">
                            <ChevronDown size={14} /> -2.1%
                        </span>
                    </div>
                    <h3 className="text-[13px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-4">Aktif Alacaklar</h3>
                    <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">₺850K</div>
                </div>

                {/* KPI 3 */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
                    <div className="flex items-start justify-between mb-2">
                        <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                            <Clock size={20} strokeWidth={2.5} />
                        </div>
                        <span className="flex items-center gap-1 text-[12px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">
                            On Track
                        </span>
                    </div>
                    <h3 className="text-[13px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-4">Açık SLA & İş Emri</h3>
                    <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">1,248</div>
                </div>

                {/* KPI 4 */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
                    <div className="flex items-start justify-between mb-2">
                        <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center">
                            <ShieldAlert size={20} strokeWidth={2.5} />
                        </div>
                        <span className="flex items-center gap-1 text-[12px] font-bold text-red-600 bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded-full">
                            Riskli
                        </span>
                    </div>
                    <h3 className="text-[13px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-4">Sistem Anomalisi</h3>
                    <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">12<span className="text-lg text-slate-400 ml-1">Vaka</span></div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
                {/* Main Graph (Takes 2 columns) */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-[16px] font-black text-slate-900 dark:text-white">Gelir Gider Analizi</h3>
                            <p className="text-[12px] font-medium text-slate-500">Günlük bazda kârlılık ve nakit akış trendi</p>
                        </div>
                    </div>
                    <div className="flex-1 min-h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={REVENUE_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10}  />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                                />
                                <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                                <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pie Chart / Target Column */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm flex flex-col">
                    <div className="mb-6">
                        <h3 className="text-[16px] font-black text-slate-900 dark:text-white">Teklif Durumları</h3>
                        <p className="text-[12px] font-medium text-slate-500">Dönüşüm oranları ve satış pipeline'ı</p>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center min-h-[300px]">
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie
                                    data={TARGET_DATA}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {TARGET_DATA.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontWeight: 'bold' }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="w-full mt-4 space-y-3">
                            {TARGET_DATA.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                                        <span className="text-[13px] font-bold text-slate-700 dark:text-slate-300">{item.name}</span>
                                    </div>
                                    <span className="text-[13px] font-black text-slate-900 dark:text-white">%{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Action Alerts Rows */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
                    <h3 className="text-[14px] font-black uppercase tracking-widest text-slate-400 mb-5">Hızlı Rapor Kısayolları</h3>
                    <div className="space-y-2">
                        {[
                            { title: 'Dünkü Kârlılık Özeti', icon: <Calculator size={16} className="text-amber-500"/>, path: '/reports/finance/profitability' },
                            { title: 'Saha Personeli Performans Listesi', icon: <Map size={16} className="text-blue-500" />, path: '/reports/sales/salesx' },
                            { title: 'Geciken Müşteri Ödemeleri', icon: <ShieldAlert size={16} className="text-red-500" />, path: '/reports/finance/aging' }
                        ].map((link, i) => (
                            <div 
                                key={i}
                                onClick={() => router.push(link.path)} 
                                className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent hover:border-slate-100 dark:hover:border-white/5 cursor-pointer transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                        {link.icon}
                                    </div>
                                    <span className="text-[13px] font-bold text-slate-700 dark:text-slate-300 group-hover:text-blue-600 transition-colors">{link.title}</span>
                                </div>
                                <ArrowRight size={16} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
                    <h3 className="text-[14px] font-black uppercase tracking-widest text-slate-400 mb-5">Operasyonel Durum</h3>
                    <div className="space-y-4">
                        <div className="flex items-start gap-4">
                            <CheckCircle2 size={20} className="text-emerald-500 mt-0.5 shrink-0" />
                            <div>
                                <h4 className="text-[13px] font-bold text-slate-900 dark:text-white">Banka Entegrasyonları Aktif</h4>
                                <p className="text-[12px] font-medium text-slate-500 mt-0.5">Tüm banka API metrikleri son 24 saat erişilebilir.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <XCircle size={20} className="text-red-500 mt-0.5 shrink-0" />
                            <div>
                                <h4 className="text-[13px] font-bold text-slate-900 dark:text-white">2 Mutabakat Bekliyor</h4>
                                <p className="text-[12px] font-medium text-slate-500 mt-0.5">E-Fatura BA/BS eşleşmesinde ihtilaflı faturalar tespit edildi.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}