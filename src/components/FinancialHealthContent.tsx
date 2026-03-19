"use client";

import { useState, useEffect } from 'react';
import { 
    Activity, ShieldAlert, ShieldCheck, Scale, Wallet, 
    PieChart, Briefcase, Target, TrendingUp, AlertCircle, Building2
} from 'lucide-react';

// Card Component for each Ratio
const RatioCard = ({ title, value, unit, status, description, color, ideal, icon: Icon }: any) => {
    // Generate theme colors based on status
    const themes = {
        good: {
            bg: 'bg-emerald-50 dark:bg-emerald-500/10',
            text: 'text-emerald-600 dark:text-emerald-400',
            border: 'border-emerald-200 dark:border-emerald-500/20',
            bar: 'bg-emerald-500',
            label: 'İYİ DURUMDA'
        },
        warning: {
            bg: 'bg-amber-50 dark:bg-amber-500/10',
            text: 'text-amber-600 dark:text-amber-400',
            border: 'border-amber-200 dark:border-amber-500/20',
            bar: 'bg-amber-500',
            label: 'DİKKAT'
        },
        bad: {
            bg: 'bg-rose-50 dark:bg-rose-500/10',
            text: 'text-rose-600 dark:text-rose-400',
            border: 'border-rose-200 dark:border-rose-500/20',
            bar: 'bg-rose-500',
            label: 'RİSKLİ'
        }
    };

    const theme = themes[status as keyof typeof themes] || themes.bad;

    return (
        <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm p-5 relative overflow-hidden group hover:shadow-md transition-all duration-300 flex flex-col h-full">
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-[0.03] dark:opacity-[0.05] group-hover:scale-110 transition-transform ${theme.bg.split(' ')[0]}`} />
            
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${theme.bg} ${theme.text} ${theme.border}`}>
                        <Icon strokeWidth={2.5} className="w-4 h-4" />
                    </div>
                    <h3 className="text-slate-500 dark:text-slate-400 text-[11px] font-black uppercase tracking-widest">{title}</h3>
                </div>
            </div>

            <div className="flex items-baseline gap-1.5 mb-2 relative z-10">
                <span className={`text-3xl font-black tracking-tight ${theme.text}`}>
                    {value}
                </span>
                {unit && <span className="text-slate-400 text-sm font-bold">{unit}</span>}
            </div>

            {/* Health Status Bar */}
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mb-4 overflow-hidden relative z-10">
                <div
                    className={`h-full ${theme.bar} rounded-full transition-all duration-1000 ease-out`}
                    style={{ width: `${Math.min(Math.max((status === 'good' ? 85 : (status === 'warning' ? 50 : 25)), 0), 100)}%` }}
                />
            </div>

            <div className="flex justify-between items-center mb-4 relative z-10">
                <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${theme.bg} ${theme.text} ${theme.border}`}>
                    {theme.label}
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                    <Target className="w-3 h-3" /> Hedef: {ideal}
                </div>
            </div>

            <div className="mt-auto pt-4 border-t border-slate-100 dark:border-white/5 relative z-10">
                <p className="text-[12px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                    {description}
                </p>
            </div>
        </div>
    );
};

export default function FinancialHealthContent() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        const fetchHealth = async () => {
            try {
                const res = await fetch('/api/financials/reports/health');
                const json = await res.json();
                if (json.success) setData(json);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchHealth();
    }, []);

    if (loading) return (
        <div className="p-12 flex flex-col items-center justify-center text-slate-400 animate-pulse gap-3">
            <Activity className="w-8 h-8 opacity-50" />
            <span className="text-sm font-bold tracking-wide">FİNANSAL VERİLER ANALİZ EDİLİYOR...</span>
        </div>
    );
    if (!data) return (
        <div className="p-12 flex flex-col items-center justify-center text-rose-400 gap-3">
            <AlertCircle className="w-8 h-8" />
            <span className="text-sm font-bold tracking-wide">VERİ ALINAMADI</span>
        </div>
    );

    const { ratios, data: financials } = data;

    // --- EVALUATION LOGIC ---

    // 1. Current Ratio (Cari Oran): Ideal 1.5 - 2.0
    const cr = ratios.currentRatio;
    const crStatus = cr >= 1.5 ? 'good' : (cr >= 1.0 ? 'warning' : 'bad');
    const crMsg = crStatus === 'good'
        ? "Kısa vadeli borçlarınızı rahatça ödeyebilecek güce sahipsiniz. Likidite gayet sağlıklı."
        : (crStatus === 'warning' ? "Borç ödeme gücünüz sınırda. Nakit akışına dikkat edin." : "Likidite riski yüksek! Borçları çevirmekte zorlanabilirsiniz.");

    // 2. Profit Margin: Depends on sector, but >%5 is usually ok dashboard default
    const pm = ratios.profitMargin * 100; // Percentage
    const pmStatus = pm >= 20 ? 'good' : (pm >= 5 ? 'warning' : 'bad');
    const pmMsg = pmStatus === 'good'
        ? "Mükemmel karlılık! İşletme verimli çalışıyor ve net kar elde ediliyor."
        : (pmStatus === 'warning' ? "Karlılık makul seviyede ancak daha sıkı bir maliyet yönetimi planlanabilir." : "Şirket karsız veya zararda çalışıyor. Acil maliyet/fiyatlama analizi gerekli.");

    // 3. Debt Ratio (Kaldıraç): Ideal < 50%
    const dr = ratios.debtRatio * 100;
    const drStatus = dr <= 50 ? 'good' : (dr <= 75 ? 'warning' : 'bad');
    const drMsg = drStatus === 'good'
        ? "Şirket finansal açıdan bağımsız, özkaynak ağırlıklı sağlıklı bir büyüme sürecinde."
        : (drStatus === 'warning' ? "Aşırıya kaçmamak kaydıyla borç yükü tolere edilebilir seviyede." : "Şirket yüksek borç riski altında! Özkaynak yetersiz kalabilir, finansman giderleri takip edilmeli.");

    // 4. Cash Ratio: Ideal > 0.20
    const car = ratios.cashRatio;
    const carStatus = car >= 0.2 ? 'good' : 'bad'; // Simple logic
    const carMsg = carStatus === 'good'
        ? "Acil nakit ihtiyacını karşılayacak (stok satmadan ve alacak tahsil etmeden) kadar hazır paranız var."
        : "Nakit rezervleriniz çok düşük. Ani ve beklenmedik ödemelerde sıkışabilirsiniz.";


    return (
        <div className="animate-in fade-in duration-500 space-y-6">
            <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm p-6 flex flex-col md:flex-row md:items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                    <Activity className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                        Finansal Sağlık Karnesi
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">
                        İşletmenizin finansal röntgeni, performans göstergeleri ve likidite analizleri.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <RatioCard
                    title="CARİ ORAN (LİKİDİTE)"
                    value={cr.toFixed(2)}
                    unit="X"
                    status={crStatus}
                    ideal="1.50 ve Üzeri"
                    description={crMsg}
                    icon={Wallet}
                />

                <RatioCard
                    title="NET KAR MARJI"
                    value={pm.toFixed(1)}
                    unit="%"
                    status={pmStatus}
                    ideal="%20 ve Üzeri"
                    description={pmMsg}
                    icon={TrendingUp}
                />

                <RatioCard
                    title="KALDIRAÇ ORANI (BORÇ)"
                    value={dr.toFixed(0)}
                    unit="%"
                    status={drStatus}
                    ideal="%50 ve Altı"
                    description={drMsg}
                    icon={Scale}
                />

                <RatioCard
                    title="NAKİT ORANI"
                    value={car.toFixed(2)}
                    unit="X"
                    status={carStatus}
                    ideal="0.20 ve Üzeri"
                    description={carMsg}
                    icon={ShieldCheck}
                />
            </div>

            {/* Detailed Data Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* VARLIK YAPISI */}
                <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0f172a]/50 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        <h4 className="text-slate-700 dark:text-slate-300 text-[11px] font-black uppercase tracking-widest">VARLIK YAPISI
                        </h4>
                    </div>
                    <div className="p-5 flex-1 flex flex-col justify-center">
                        <div className="flex justify-between items-center py-2.5 border-b border-dashed border-slate-100 dark:border-white/5 last:border-0">
                            <span className="text-[13px] font-semibold text-slate-600 dark:text-slate-400">Dönen Varlıklar</span>
                            <span className="text-[13px] font-black text-slate-900 dark:text-white font-mono">{financials.currentAssets.toLocaleString('tr-TR')} ₺</span>
                        </div>
                        <div className="flex justify-between items-center py-2.5 border-b border-dashed border-slate-100 dark:border-white/5 last:border-0">
                            <span className="text-[13px] font-semibold text-slate-600 dark:text-slate-400">Duran Varlıklar</span>
                            <span className="text-[13px] font-black text-slate-900 dark:text-white font-mono">{(financials.totalAssets - financials.currentAssets).toLocaleString('tr-TR')} ₺</span>
                        </div>
                        <div className="flex justify-between items-center py-3 mt-1 bg-slate-50 dark:bg-slate-800/50 px-3 rounded-lg">
                            <span className="text-[11px] font-black uppercase text-slate-500">TOPLAM VARLIK</span>
                            <span className="text-sm font-black text-slate-900 dark:text-white font-mono">{financials.totalAssets.toLocaleString('tr-TR')} ₺</span>
                        </div>
                    </div>
                </div>

                {/* KAYNAK YAPISI */}
                <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0f172a]/50 flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-slate-400" />
                        <h4 className="text-slate-700 dark:text-slate-300 text-[11px] font-black uppercase tracking-widest">KAYNAK YAPISI
                        </h4>
                    </div>
                    <div className="p-5 flex-1 flex flex-col justify-center">
                        <div className="flex justify-between items-center py-2 border-b border-dashed border-slate-100 dark:border-white/5 last:border-0">
                            <span className="text-[13px] font-semibold text-slate-600 dark:text-slate-400">Kısa Vadeli Borçlar</span>
                            <span className="text-[13px] font-black text-slate-900 dark:text-white font-mono">{financials.shortTermLiabilities.toLocaleString('tr-TR')} ₺</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-dashed border-slate-100 dark:border-white/5 last:border-0">
                            <span className="text-[13px] font-semibold text-slate-600 dark:text-slate-400">Uzun Vadeli Borçlar</span>
                            <span className="text-[13px] font-black text-slate-900 dark:text-white font-mono">{(financials.totalDebt - financials.shortTermLiabilities).toLocaleString('tr-TR')} ₺</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-dashed border-slate-100 dark:border-white/5 last:border-0">
                            <span className="text-[13px] font-semibold text-slate-600 dark:text-slate-400">Özkaynaklar</span>
                            <span className="text-[13px] font-black text-slate-900 dark:text-white font-mono">{(financials.totalAssets - financials.totalDebt).toLocaleString('tr-TR')} ₺</span>
                        </div>
                        <div className="flex justify-between items-center py-3 mt-1 bg-slate-50 dark:bg-slate-800/50 px-3 rounded-lg">
                            <span className="text-[11px] font-black uppercase text-slate-500">TOPLAM KAYNAK</span>
                            <span className="text-sm font-black text-slate-900 dark:text-white font-mono">{financials.totalAssets.toLocaleString('tr-TR')} ₺</span>
                        </div>
                    </div>
                </div>

                {/* PERFORMANS ÖZETİ */}
                <div className="bg-gradient-to-br from-blue-900 to-slate-900 border border-blue-800/50 rounded-2xl shadow-lg shadow-blue-900/10 overflow-hidden flex flex-col relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-bl-full blur-2xl" />
                    
                    <div className="p-4 border-b border-white/10 bg-white/5 flex items-center gap-2 relative z-10">
                        <PieChart className="w-4 h-4 text-blue-300" />
                        <h4 className="text-blue-100 text-[11px] font-black uppercase tracking-widest">PERFORMANS ÖZETİ
                        </h4>
                    </div>
                    <div className="p-5 flex-1 flex flex-col justify-center relative z-10">
                        <div className="flex justify-between items-center py-3 border-b border-dashed border-white/10">
                            <span className="text-[13px] font-semibold text-blue-100/70">Net Satışlar (Ciro)</span>
                            <span className="text-[14px] font-black text-white font-mono">{financials.netSales.toLocaleString('tr-TR')} ₺</span>
                        </div>
                        <div className="flex justify-between items-center py-3">
                            <span className="text-[13px] font-semibold text-blue-100/70">Net Kar / Zarar</span>
                            <span className={`text-[15px] font-black font-mono px-2 py-0.5 rounded ${financials.netProfit >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                {financials.netProfit.toLocaleString('tr-TR')} ₺
                            </span>
                        </div>
                        
                        <div className="mt-auto pt-4 flex items-start gap-2">
                            <AlertCircle className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                            <p className="text-[10px] text-blue-300/60 leading-relaxed font-medium">
                                * Veriler sistemdeki onaylanmış "Genel Mizan" ve "Gelir Tablosu" dinamiklerinden anlık olarak derive edilmektedir.
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
