"use client";

import { useState, useEffect } from 'react';
import { EnterpriseCard, EnterpriseSectionHeader, EnterpriseButton, EnterpriseInput } from '@/components/ui/enterprise';
import {
    IconActivity,
    IconShield,
    IconAlert,
    IconTrendingUp,
    IconClock,
    IconZap,
    IconCheck,
    IconBank,
    IconCreditCard,
    IconPackage,
    IconRefresh
} from '@/components/icons/PremiumIcons';

// --- SHARED UTILITIES ---
const ArrowUpRight = ({ className }: any) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19L19 5M19 5H10M19 5V14" /></svg>;
const ArrowDownRight = ({ className }: any) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 19l-7-7 7-7" /></svg>;
const ChevronRight = ({ className }: any) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>;
const Filter = ({ className }: any) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>;
const Layers = ({ className }: any) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>;

// --- CONTROL CENTER COMPONENTS ---
const MetricCard = ({ title, value, unit, subtitle, color, icon: Icon, trend }: any) => (
    <div className="bg-white dark:bg-[#1e293b] !border-none rounded-[24px] shadow-sm md:shadow-md p-6 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
        <div className={`absolute top-0 right-0 w-24 h-24 ${color} opacity-10 rounded-bl-full -mr-4 -mt-4 transition-all group-hover:opacity-20`} />
        <div className="relative">
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider">{title}</h3>
                <Icon className={`w-5 h-5 ${color.replace('bg-', 'text-')}`} />
            </div>
            <div className="flex items-baseline gap-2 mb-1">
                <span className="text-3xl font-black text-slate-900 dark:text-white">{value}</span>
                <span className="text-gray-500 font-bold">{unit}</span>
            </div>
            <p className="text-xs text-gray-400 mb-4">{subtitle}</p>
            {trend !== undefined && (
                <div className={`flex items-center gap-1 text-[10px] font-bold ${trend > 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    %{Math.abs(trend)} (Geçen haftaya göre)
                </div>
            )}
        </div>
    </div>
);

const HealthSnapshot = ({ data }: any) => (
    <div className="bg-white dark:bg-[#1e293b] !border-none rounded-[24px] shadow-sm md:shadow-md p-6 space-y-4">
        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider">Sistem Sağlık Özeti</h3>
        <div className="space-y-3">
            <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 font-medium">Bağlı Bankalar</span>
                <span className="text-sm font-black text-slate-900 dark:text-white">{data?.connectedBanks || 0}</span>
            </div>
            <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 font-medium">Otonom Eşleşme Oranı</span>
                <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">%{data?.todayMatchedPct?.toFixed(1) || '0.0'}</span>
            </div>
            <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 font-medium">Çalışma Modu</span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-black ${data?.autopilotState === 'LIVE' ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400' : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'}`}>
                    {data?.autopilotState === 'LIVE' ? 'CANLI (LIVE)' : 'DENEME (DRY_RUN)'}
                </span>
            </div>
        </div>
    </div>
);

const ConfidenceChart = ({ dist }: any) => {
    const total = (dist?.high || 0) + (dist?.medium || 0) + (dist?.low || 0) || 1;
    const hp = ((dist?.high || 0) / total) * 100;
    const mp = ((dist?.medium || 0) / total) * 100;
    const lp = ((dist?.low || 0) / total) * 100;

    return (
        <div className="bg-white dark:bg-[#1e293b] !border-none rounded-[24px] shadow-sm md:shadow-md p-6">
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-4">Eşleşme Doğruluğu</h3>
            <div className="h-4 w-full bg-slate-50 dark:bg-white/5 rounded-full overflow-hidden flex mb-4">
                <div style={{ width: `${hp}%` }} className="h-full bg-indigo-500" title="Yüksek" />
                <div style={{ width: `${mp}%` }} className="h-full bg-amber-500" title="Orta" />
                <div style={{ width: `${lp}%` }} className="h-full bg-rose-600 dark:bg-rose-500" title="Düşük" />
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
                <div><p className="text-[10px] text-gray-500 font-bold uppercase">Yüksek</p><p className="text-xs font-black text-indigo-600 dark:text-indigo-400">{dist?.high || 0}</p></div>
                <div><p className="text-[10px] text-gray-500 font-bold uppercase">Orta</p><p className="text-xs font-black text-amber-600 dark:text-amber-400">{dist?.medium || 0}</p></div>
                <div><p className="text-[10px] text-gray-500 font-bold uppercase">Düşük</p><p className="text-xs font-black text-rose-600 dark:text-rose-400">{dist?.low || 0}</p></div>
            </div>
        </div>
    );
};

const FlowAccuracy = ({ data }: any) => {
    const accuracy = data?.forecast > 0 ? (1 - Math.abs(data.actual - data.forecast) / data.forecast) * 100 : 0;
    return (
        <div className="bg-white dark:bg-[#1e293b] !border-none rounded-[24px] shadow-sm md:shadow-md p-6">
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-4">Tahmin vs Gerçekleşen</h3>
            <div className="space-y-3">
                <div className="flex justify-between items-end">
                    <p className="text-[10px] text-gray-500 font-bold uppercase">Günlük Hedef Giriş</p>
                    <p className="text-sm font-black text-slate-900 dark:text-white">{data?.forecast?.toLocaleString('tr-TR') || 0} ₺</p>
                </div>
                <div className="flex justify-between items-end">
                    <p className="text-[10px] text-gray-500 font-bold uppercase">Gerçekleşen Giriş</p>
                    <p className="text-sm font-black text-indigo-600 dark:text-indigo-400">{data?.actual?.toLocaleString('tr-TR') || 0} ₺</p>
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-white/5 flex justify-between items-center">
                    <span className="text-[10px] text-gray-500 font-bold uppercase">Model Başarımı</span>
                    <span className={`text-xs font-black ${accuracy > 80 ? 'text-indigo-600 dark:text-indigo-400' : 'text-amber-600 dark:text-amber-400'}`}>{accuracy.toFixed(1)}%</span>
                </div>
            </div>
        </div>
    );
};

// --- CONTENT COMPONENTS ---

const ControlCenterContent = ({ metrics, toggling, toggleLiveMode }: any) => {
    if (!metrics) return null;
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Otonom Başarı Mesajı */}
            {metrics.healthSnapshot.todayMatchedPct > 0 && (
                <div className="p-4 bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 dark:border-indigo-200 dark:border-indigo-500/20 rounded-2xl flex items-center justify-between group animate-in slide-in-from-top duration-700">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                            <IconZap className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-slate-900 dark:text-white">OTONOM BAŞARI</h4>
                            <p className="text-[10px] text-gray-500 font-bold uppercase">Sistem bugün banka hareketlerinin %{metrics.healthSnapshot.todayMatchedPct?.toFixed(0)}'ini insan müdahalesi olmadan işledi.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Performans ve Sağlık Paneli */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <HealthSnapshot data={metrics.healthSnapshot} />
                <ConfidenceChart dist={metrics.confidenceDist} />
                <FlowAccuracy data={metrics.flowReality} />
                <div className="bg-white dark:bg-[#1e293b] !border-none rounded-[24px] shadow-sm md:shadow-md p-6 flex flex-col items-center justify-center text-center">
                    <div className="flex items-center gap-2 mb-2">
                        <IconActivity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <span className="text-xs font-black text-slate-900 dark:text-white">GÜVENLİK ŞALTERİ</span>
                    </div>
                    <p className={`text-lg font-black ${metrics.engine.safetyBreakerStatus === 'TRIGGERED' ? 'text-rose-600 dark:text-rose-400' : 'text-indigo-600 dark:text-indigo-400'}`}>
                        {metrics.engine.safetyBreakerStatus === 'TRIGGERED' ? 'DEVREDE (DURDU)' : 'STABİL'}
                    </p>
                    <p className="text-[9px] text-gray-400 uppercase mt-1 font-bold">Limit: 500 ₺ Askı Bakiyesi</p>
                </div>
            </div>

            {/* Ana İstatistikler */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <MetricCard
                    title="Pazaryeri Alacakları"
                    value={metrics.financials.totalReceivable.toLocaleString('tr-TR')}
                    unit="₺"
                    subtitle={`${metrics.financials.openInvoiceCount} Bekleyen İşlem`}
                    color="bg-indigo-500"
                    icon={IconTrendingUp}
                    trend={12}
                />
                <MetricCard
                    title="Askıdaki Bakiye (397.01)"
                    value={metrics.financials.suspenseAmount.toLocaleString('tr-TR')}
                    unit="₺"
                    subtitle="Manuel inceleme bekleyen tutar"
                    color="bg-rose-600 dark:bg-rose-500"
                    icon={IconAlert}
                />
                <MetricCard
                    title="Bugün Uzlaşılan (Mutabakat)"
                    value={metrics.financials.reconciledTodayAmount?.toLocaleString('tr-TR') || "0"}
                    unit="₺"
                    subtitle={`${metrics.financials.reconciledTodayCount || 0} hakediş kapatıldı`}
                    color="bg-blue-500"
                    icon={IconCheck}
                />
            </div>

            {/* Orta Bölüm: Nakit Akışı ve Yaşlandırma */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Nakit Akışı Projeksiyonu */}
                <div className="bg-white dark:bg-[#1e293b] !border-none rounded-[24px] shadow-sm md:shadow-md p-8 border-l-4 border-indigo-500">
                    <div className="mb-8">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <IconTrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Nakit Akışı Projeksiyonu
                        </h3>
                        <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Yapay Zeka Destekli Tahmin</p>
                    </div>

                    <div className="space-y-6">
                        {metrics.forecast && metrics.forecast.length > 0 ? metrics.forecast.map((f: any, i: number) => (
                            <div key={i} className="group cursor-default">
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-sm font-bold text-gray-400">Gelecek {f.horizonDays} Gün</span>
                                    <span className={`text-sm font-black ${Number(f.netPosition) >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                        {Number(f.netPosition).toLocaleString('tr-TR')} ₺
                                    </span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-50 dark:bg-white/5 rounded-full overflow-hidden flex">
                                    <div
                                        className="h-full bg-indigo-500 transition-all duration-1000 group-hover:opacity-80"
                                        style={{ width: `${(Number(f.expectedIn) / (Math.max(Number(f.expectedIn) + Number(f.expectedOut), 1))) * 100}%` }}
                                    />
                                    <div
                                        className="h-full bg-rose-600 dark:bg-rose-500 transition-all duration-1000 group-hover:opacity-80"
                                        style={{ width: `${(Number(f.expectedOut) / (Math.max(Number(f.expectedIn) + Number(f.expectedOut), 1))) * 100}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-[10px] mt-1 font-bold">
                                    <span className="text-indigo-600 dark:text-indigo-400/70">GİRİŞ: {Number(f.expectedIn).toLocaleString('tr-TR')}</span>
                                    <span className="text-rose-600 dark:text-rose-400/70">ÇIKIŞ: {Number(f.expectedOut).toLocaleString('tr-TR')}</span>
                                </div>
                            </div>
                        )) : (
                            <div className="h-32 flex items-center justify-center text-gray-600 italic text-xs text-center">
                                Henüz projeksiyon verisi yok.<br />Banka hareketleri analiz ediliyor...
                            </div>
                        )}
                    </div>
                </div>

                {/* Yaşlandırma Analizi */}
                <div className="lg:col-span-2 bg-white dark:bg-[#1e293b] !border-none rounded-[24px] shadow-sm md:shadow-md p-8">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <IconClock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Alacak Yaşlandırma Analizi
                            </h3>
                            <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">120.03 Hesabı Risk Dağılımı</p>
                        </div>
                        <span className="text-[10px] text-gray-500 font-mono">Gerçek Zamanlı</span>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                        {(metrics.aging || []).map((bucket: any, i: number) => (
                            <div key={i} className="space-y-4">
                                <div className="relative h-48 w-full bg-slate-50 dark:bg-white/5 rounded-2xl overflow-hidden flex flex-col justify-end p-1">
                                    <div
                                        className={`w-full rounded-xl transition-all duration-1000 ease-out ${i === 0 ? 'bg-indigo-500/50' : i === 1 ? 'bg-blue-500/50' : i === 2 ? 'bg-amber-500/50' : 'bg-rose-600 dark:bg-rose-100 dark:bg-rose-500/20'
                                            }`}
                                        style={{ height: `${Math.min((bucket.amount / (Math.max(metrics.financials.totalReceivable, 1))) * 100, 100) || 5}%` }}
                                    />
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">{bucket.label}</p>
                                    <p className="text-sm font-black text-slate-900 dark:text-white leading-none">{bucket.amount.toLocaleString('tr-TR')} ₺</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Alt Bölüm: Akıllı Sinyaller ve Motor Performansı */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white dark:bg-[#1e293b] !border-none rounded-[24px] shadow-sm md:shadow-md p-6 border-amber-500/10 hover:border-amber-500/30 transition-colors">
                    <h3 className="text-xs font-bold text-amber-600 dark:text-amber-400 mb-3 uppercase tracking-widest flex items-center gap-2">
                        <IconShield className="w-4 h-4" /> Sistem Zekası Sinyalleri
                    </h3>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-xs">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                            <p className="text-gray-400"><span className="text-slate-900 dark:text-white font-bold">Otopilot:</span> ±1 ₺ Tolerans robotu aktif ve hakediş uzlaşmalarını denetliyor.</p>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            <p className="text-gray-400"><span className="text-slate-900 dark:text-white font-bold">Veri Koruması:</span> Layer-1 veri muhafızı mükerrer kayıtlara karşı %100 etkin.</p>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-amber-600 dark:text-amber-400/80 italic">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            <p>"Açık Bankacılık senkronizasyonu başarılı. Bugün manuel girişlerinizden 3 yeni eşleşme kuralı öğrenildi."</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1e293b] !border-none rounded-[24px] shadow-sm md:shadow-md p-6 bg-gradient-to-br from-indigo-900/10 to-transparent border-indigo-500/20">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-wider flex items-center gap-2">
                        <IconZap className="w-4 h-4 text-yellow-400" /> Motor Performansı
                    </h3>
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400 font-medium">Ort. Gecikme (P50)</span>
                            <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">{metrics.performance.avgLatency}ms</span>
                        </div>
                        <div className="w-full h-1 bg-slate-50 dark:bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 w-[75%]" />
                        </div>

                        <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-500 font-bold uppercase">7 Günlük Hatalı Event</span>
                            <span className={`font-black ${metrics.health.failedEventCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-indigo-600 dark:text-indigo-400'}`}>
                                {metrics.health.failedEventCount}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ProfitabilityHeatmapContent = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any[]>([]);
    
    // V2 Filters
    const [timeFilter, setTimeFilter] = useState('1M'); 
    const [searchFilter, setSearchFilter] = useState('');
    const [marketFilter, setMarketFilter] = useState('ALL');
    const [catFilter, setCatFilter] = useState('ALL');

    useEffect(() => {
        const fetchHeatmap = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/fintech/dashboard/heatmap?time=${timeFilter}`);
                const json = await res.json();
                if (json.success) setData(json.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchHeatmap();
    }, [timeFilter]);

    // Extraction for Dropdowns
    const uniqueMarkets = Array.from(new Set(data.map(d => d.marketplace)));
    const uniqueCats = Array.from(new Set(data.map(d => d.category).filter(Boolean)));

    const filteredData = data.filter(item => {
        const matchSearch = String(item.productName || '').toLowerCase().includes(searchFilter.toLowerCase()) ||
                            String(item.productCode || '').toLowerCase().includes(searchFilter.toLowerCase());
        const matchMarket = marketFilter === 'ALL' || item.marketplace === marketFilter;
        const matchCat = catFilter === 'ALL' || item.category === catFilter;
        return matchSearch && matchMarket && matchCat;
    });

    // Toplam Özet Metrikler
    const totalCiro = filteredData.reduce((acc, curr) => acc + curr.grossRevenue, 0);
    const totalKar = filteredData.reduce((acc, curr) => acc + curr.netProfit, 0);
    const totalKomisyon = filteredData.reduce((acc, curr) => acc + curr.commission, 0);
    const totalKargo = filteredData.reduce((acc, curr) => acc + curr.shipping, 0);
    const totalPenalty = filteredData.reduce((acc, curr) => acc + curr.penalty, 0);
    const totalCogs = filteredData.reduce((acc, curr) => acc + curr.fifoCost, 0);

    const getMarginColor = (margin: number) => {
        if (margin >= 20) return 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20';
        if (margin >= 5) return 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20';
        if (margin > 0) return 'text-orange-600 dark:text-orange-400 bg-orange-500/10 border-orange-500/20';
        return 'text-rose-600 dark:text-rose-400 bg-rose-600 dark:bg-rose-50 dark:bg-rose-500/10 border-rose-500/20';
    };

    const getStatusText = (margin: number) => {
        if (margin >= 20) return 'ALTIN ÜRÜN';
        if (margin >= 5) return 'MAKUL KÂR';
        if (margin > 0) return 'RİSKLİ/KRİTİK';
        return 'ZARAR/KANAMA';
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* V2 Terminal Header & Filters */}
            <div className="bg-white dark:bg-[#1e293b] !border-none rounded-[24px] shadow-sm md:shadow-md p-6">
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-6">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-2">
                            <IconTrendingUp className="w-6 h-6 text-indigo-500" />
                            KARLILIK (P&L) TERMİNALİ
                        </h2>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Zaman Serisi (Time-Series) Fatura Dağılım Motoru</p>
                    </div>

                    {/* Time Filter Pills */}
                    <div className="flex bg-slate-50 dark:bg-white/5 p-1 rounded-xl border border-slate-200 dark:border-white/10 shrink-0">
                        {[
                            { id: 'TODAY', label: 'BUGÜN' },
                            { id: '1W', label: '1 HAFTA' },
                            { id: '1M', label: '1 AY' },
                            { id: '3M', label: '3 AY' },
                            { id: '1Y', label: '1 YIL' },
                            { id: 'ALL', label: 'TÜM ZAMANLAR' }
                        ].map(tf => (
                            <button
                                key={tf.id}
                                onClick={() => setTimeFilter(tf.id)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${timeFilter === tf.id ? 'bg-white dark:bg-[#1e293b] text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-white/10' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                {tf.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pb-2 border-b border-slate-100 dark:border-white/5">
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="SKU, Ürün adı veya Marka..."
                            value={searchFilter}
                            onChange={(e) => setSearchFilter(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-10 py-2.5 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-indigo-200 focus:ring-1 focus:ring-indigo-500"
                        />
                    </div>
                    
                    <select
                        value={marketFilter}
                        onChange={(e) => setMarketFilter(e.target.value)}
                        className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-indigo-200 cursor-pointer"
                    >
                        <option value="ALL">Tüm Pazaryerleri</option>
                        {uniqueMarkets.map(m => <option key={String(m)} value={String(m)}>{String(m).toUpperCase()}</option>)}
                    </select>

                    <select
                        value={catFilter}
                        onChange={(e) => setCatFilter(e.target.value)}
                        className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-indigo-200 cursor-pointer"
                    >
                        <option value="ALL">Tüm Kategoriler</option>
                        {uniqueCats.map(c => <option key={String(c)} value={String(c)}>{String(c).toUpperCase()}</option>)}
                    </select>
                </div>

                {/* Master Summary Blocks */}
                <div className="flex items-center gap-6 mt-6">
                    <div>
                        <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Seçili Dönem Ciro</p>
                        <p className="text-xl font-black text-slate-900 dark:text-white">{totalCiro.toLocaleString('tr-TR')} ₺</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Net Dönem Kârı</p>
                        <p className={`text-xl font-black ${totalKar >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            {totalKar.toLocaleString('tr-TR')} ₺
                        </p>
                    </div>
                    <div className="flex-1 flex justify-end gap-6 text-right">
                        <div>
                            <p className="text-[9px] text-rose-500/70 font-bold uppercase">Toplam Kargo Kesintisi</p>
                            <p className="text-sm font-bold text-rose-600 dark:text-rose-400">-{totalKargo.toLocaleString('tr-TR')} ₺</p>
                        </div>
                        <div>
                            <p className="text-[9px] text-orange-500/70 font-bold uppercase">Komisyon Kesintisi</p>
                            <p className="text-sm font-bold text-orange-600 dark:text-orange-400">-{totalKomisyon.toLocaleString('tr-TR')} ₺</p>
                        </div>
                        <div>
                            <p className="text-[9px] text-gray-500 font-bold uppercase">Ürün Maliyeti (COGS)</p>
                            <p className="text-sm font-bold text-gray-700 dark:text-gray-300">-{totalCogs.toLocaleString('tr-TR')} ₺</p>
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="space-y-4 animate-pulse">
                    {[1,2,3].map(i => <div key={i} className="h-28 bg-slate-50 dark:bg-[#1e293b] rounded-[24px]" />)}
                </div>
            ) : filteredData.length === 0 ? (
                <div className="p-16 bg-white dark:bg-[#1e293b]/50 rounded-[24px] text-center border border-dashed border-slate-200 dark:border-white/10">
                    <IconPackage className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">İşlenmiş Veri Bulunamadı</h3>
                    <p className="text-xs text-gray-500 uppercase font-bold mt-2">Bu zaman aralığında herhangi bir kesinleşmiş pazaryeri faturası / dekontu işlenmemiş.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredData.map((item) => (
                        <div key={item.id} className="bg-white dark:bg-[#1e293b] !border-none rounded-[16px] shadow-sm p-4 group hover:bg-slate-50 dark:hover:bg-[#1e293b]/80 border-l-4 border-l-transparent hover:border-l-indigo-500 transition-all cursor-default">
                            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                                
                                {/* 1. Product Context */}
                                <div className="flex-1 w-full flex items-center gap-4">
                                    <div className={`shrink-0 w-12 h-12 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-white/5`}>
                                        <Layers className="w-6 h-6 text-slate-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[9px] px-2 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 font-black tracking-widest leading-none">
                                                {item.marketplace.toUpperCase()}
                                            </span>
                                            {item.brand && item.brand !== 'GENEL' && (
                                                <span className="text-[9px] text-indigo-500 font-bold uppercase truncate">{item.brand}</span>
                                            )}
                                        </div>
                                        <h3 className="text-sm font-black text-slate-900 dark:text-white truncate">{item.productName}</h3>
                                        <p className="text-[10px] text-gray-500 font-mono tracking-tighter uppercase">{item.productCode} • {item.saleCount} Adet Satış</p>
                                    </div>
                                </div>

                                {/* 2. Financial Metrics Cube */}
                                <div className="grid grid-cols-4 gap-4 xl:gap-8 items-center border-l lg:border-l border-slate-200 dark:border-white/5 pl-6 w-full lg:w-auto shrink-0">
                                    <div className="text-right">
                                        <p className="text-[9px] text-gray-500 font-bold uppercase mb-1">Brüt Ciro</p>
                                        <p className="text-[13px] font-black">{item.grossRevenue.toLocaleString('tr-TR')} ₺</p>
                                    </div>
                                    
                                    {/* Exepenses Breakdown */}
                                    <div className="flex flex-col gap-1 text-right text-[10px] uppercase font-bold text-gray-500 justify-center">
                                        <div className="flex justify-between gap-4"><span className="text-orange-500/70">Kom:</span> <span>-{item.commission.toLocaleString('tr-TR')}</span></div>
                                        <div className="flex justify-between gap-4"><span className="text-rose-500/70">Kargo:</span> <span>-{item.shipping.toLocaleString('tr-TR')}</span></div>
                                        <div className="flex justify-between gap-4"><span className="text-indigo-500/70">Maliyet:</span> <span>-{item.fifoCost.toLocaleString('tr-TR')}</span></div>
                                    </div>

                                    {/* Profit */}
                                    <div className="text-right">
                                        <p className="text-[9px] text-gray-500 font-bold uppercase mb-1">Net Kâr</p>
                                        <p className={`text-[15px] font-black ${item.netProfit > 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                            {item.netProfit.toLocaleString('tr-TR')} ₺
                                        </p>
                                    </div>

                                    {/* Margin Heat */}
                                    <div className="w-[100px] text-center border-l border-slate-200 dark:border-white/5 pl-4">
                                        <p className="text-[9px] text-gray-500 font-bold uppercase mb-1">{getStatusText(item.margin)}</p>
                                        <div className={`text-sm font-black px-2 py-1 rounded-lg border ${getMarginColor(item.margin)}`}>
                                            %{item.margin.toFixed(1)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const SmartPricingContent = () => {
    const [loading, setLoading] = useState(true);
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [summary, setSummary] = useState<any>({ activeRules: 0, marginProtected: 0, criticalCount: 0 });
    const [isAutoPilot, setIsAutoPilot] = useState(false);

    useEffect(() => {
        const fetchPricing = async () => {
            try {
                const res = await fetch('/api/fintech/dashboard/pricing');
                const json = await res.json();
                if (json.success) {
                    setRecommendations(json.data);
                    if (json.summary) setSummary(json.summary);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchPricing();
    }, []);

    if (loading) return <div className="p-12 animate-pulse h-64 bg-slate-50 dark:bg-white/5 rounded-2xl" />;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Smart Pricing Engine</h2>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Autonomous Margin Protection & Price Optimization</p>
                </div>
                <div className="flex items-center gap-4 bg-slate-50 dark:bg-white/5 p-2 rounded-2xl border border-slate-200 dark:border-white/10">
                    <div className="flex flex-col items-end px-2">
                        <span className="text-[10px] font-bold text-gray-500 uppercase">Engine Status</span>
                        <span className={`text-[11px] font-black ${isAutoPilot ? 'text-indigo-600 dark:text-indigo-400' : 'text-orange-600 dark:text-orange-400'}`}>
                            {isAutoPilot ? 'AUTOPILOT: ON' : 'MANUAL REVIEW'}
                        </span>
                    </div>
                    <button
                        onClick={() => setIsAutoPilot(!isAutoPilot)}
                        className={`relative w-14 h-7 rounded-full transition-all duration-300 ${isAutoPilot ? 'bg-indigo-500' : 'bg-gray-700'}`}
                    >
                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 ${isAutoPilot ? 'left-8' : 'left-1'}`} />
                    </button>
                </div>
            </div>

            {/* Strategy Insight */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-[#1e293b] !border-none rounded-[24px] shadow-sm md:shadow-md p-6 border-orange-500/20">
                    <IconActivity className="w-6 h-6 text-orange-600 dark:text-orange-400 mb-4" />
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Rules</h4>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">{summary.activeRules}</p>
                    <p className="text-[10px] text-gray-500 mt-2">Across 3 Marketplaces</p>
                </div>
                <div className="bg-white dark:bg-[#1e293b] !border-none rounded-[24px] shadow-sm md:shadow-md p-6 border-indigo-200 dark:border-indigo-500/20 dark:border-indigo-200 dark:border-indigo-500/20">
                    <IconShield className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mb-4" />
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Margin Protected</h4>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">{summary.marginProtected.toLocaleString('tr-TR')} ₺</p>
                    <p className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-2">Dynamic Protection</p>
                </div>
                <div className="bg-white dark:bg-[#1e293b] !border-none rounded-[24px] shadow-sm md:shadow-md p-6 border-rose-500/20">
                    <IconAlert className="w-6 h-6 text-rose-600 dark:text-rose-400 mb-4" />
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Loss Prevention</h4>
                    <p className="text-2xl font-black text-rose-600 dark:text-rose-400">{summary.criticalCount} Critical</p>
                    <p className="text-[10px] text-gray-500 mt-2">Prices below cost!</p>
                </div>
                <div className="bg-white dark:bg-[#1e293b] !border-none rounded-[24px] shadow-sm md:shadow-md p-6 bg-gradient-to-br from-orange-900/10 to-transparent">
                    <IconRefresh className="w-6 h-6 text-orange-600 dark:text-orange-400 mb-4 animate-spin-slow" />
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Next Re-calc</h4>
                    <p className="text-xl font-black text-slate-900 dark:text-white">Gerçek Zamanlı</p>
                    <p className="text-[10px] text-gray-500 mt-2">Marketplace API</p>
                </div>
            </div>

            {/* Recommendations List */}
            <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-widest uppercase flex items-center gap-2">
                    <IconTrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Pending Price Actions
                </h3>

                <div className="grid grid-cols-1 gap-4">
                    {recommendations.map(rec => (
                        <div key={rec.productId} className="bg-white dark:bg-[#1e293b] !border-none rounded-[24px] shadow-sm md:shadow-md p-6 hover:border-orange-500/30 transition-all group overflow-hidden relative">
                            <div className={`absolute top-0 right-0 w-32 h-full opacity-5 bg-gradient-to-l ${rec.change > 5 ? 'from-rose-500' : 'from-orange-500'}`} />

                            <div className="grid grid-cols-12 gap-8 items-center relative">
                                <div className="col-span-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <IconPackage className="w-3 h-3 text-gray-500" />
                                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">{rec.marketplace}</span>
                                    </div>
                                    <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">{rec.productName}</h4>
                                    <p className={`text-[10px] font-bold mt-1 ${rec.status === 'CRITICAL' ? 'text-rose-600 dark:text-rose-400' : 'text-orange-600 dark:text-orange-400'}`}>
                                        Reason: {rec.reason}
                                    </p>
                                </div>

                                <div className="col-span-3 flex items-center justify-between border-x border-slate-200 dark:border-white/5 px-8">
                                    <div className="text-center">
                                        <p className="text-[9px] text-gray-500 font-bold uppercase mb-1">Current</p>
                                        <p className="text-xs font-bold text-gray-400">{rec.currentPrice.toLocaleString('tr-TR')} ₺</p>
                                    </div>
                                    <ArrowUpRight className={`w-4 h-4 ${rec.change > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-indigo-600 dark:text-indigo-400'}`} />
                                    <div className="text-center">
                                        <p className="text-[9px] text-gray-500 font-bold uppercase mb-1">New Sync</p>
                                        <p className="text-sm font-black text-slate-900 dark:text-white">{rec.recommendedPrice.toLocaleString('tr-TR')} ₺</p>
                                    </div>
                                </div>

                                <div className="col-span-4 grid grid-cols-2 gap-4 text-center border-r border-slate-200 dark:border-white/5 pr-8">
                                    <div>
                                        <p className="text-[9px] text-gray-500 font-bold uppercase mb-1">Net Margin At Current</p>
                                        <p className="text-xs font-black text-rose-600 dark:text-rose-400">{rec.currentMargin}%</p>
                                    </div>
                                    <div className="bg-indigo-500/5 rounded-xl p-2 border border-indigo-200 dark:border-indigo-500/20 dark:border-indigo-200 dark:border-indigo-500/20">
                                        <p className="text-[9px] text-indigo-600 dark:text-indigo-400/70 font-bold uppercase mb-1">Target Margin</p>
                                        <p className="text-sm font-black text-indigo-600 dark:text-indigo-400">{rec.targetMargin}%</p>
                                    </div>
                                </div>

                                <div className="col-span-2 flex justify-end gap-3">
                                    <button className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-indigo-500/20 hover:border-indigo-200 dark:border-indigo-500/20 dark:border-indigo-200 dark:border-indigo-500/20 text-[10px] font-black text-slate-900 dark:text-white transition-all uppercase tracking-widest">
                                        Apply
                                    </button>
                                    <button className="p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-white/10 transition-all">
                                        <ChevronRight className="w-4 h-4 text-gray-500" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- MAIN PAGE COMPONENT ---

import { useModal } from '@/contexts/ModalContext';

export default function FintechControlTower() {
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState<any>(null);
    const [toggling, setToggling] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [activeTab, setActiveTab] = useState<'control' | 'heatmap' | 'pricing'>('control');
    const { showSuccess, showError } = useModal();

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            const res = await fetch('/api/fintech/dashboard/sync-all', { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                showSuccess("Mutabakat Senkronizasyonu", data.message);
                await fetchMetrics(); // refresh metrics after sync
            } else {
                showError("Senkronizasyon Başarısız", data.error);
            }
        } catch (err: any) {
            console.error(err);
            showError("Senkronizasyon Hatası", err.message);
        } finally {
            setIsSyncing(false);
        }
    };

    const fetchMetrics = async () => {
        try {
            const res = await fetch('/api/fintech/dashboard/metrics');
            const json = await res.json();
            if (json.success) setMetrics(json.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMetrics();
        const interval = setInterval(fetchMetrics, 30000);
        return () => clearInterval(interval);
    }, []);

    const toggleLiveMode = async () => {
        if (!metrics) return;
        setToggling(true);
        const newState = metrics.healthSnapshot.autopilotState === 'LIVE' ? 'false' : 'true';

        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ FINTECH_AUTOPILOT_LIVE: newState })
            });

            if (res.ok) {
                await fetchMetrics();
            }
        } catch (err) {
            console.error('Failed to toggle live mode:', err);
        } finally {
            setToggling(false);
        }
    };

    if (loading) return (
        <div className="p-12 space-y-8 animate-pulse text-indigo-600 dark:text-indigo-400/50">
            <div className="h-20 bg-slate-50 dark:bg-white/5 rounded-2xl w-full" />
            <div className="grid grid-cols-4 gap-6">
                <div className="h-32 bg-slate-50 dark:bg-white/5 rounded-2xl" />
                <div className="h-32 bg-slate-50 dark:bg-white/5 rounded-2xl" />
                <div className="h-32 bg-slate-50 dark:bg-white/5 rounded-2xl" />
                <div className="h-32 bg-slate-50 dark:bg-white/5 rounded-2xl" />
            </div>
        </div>
    );

    return (
        <div className="max-w-[1600px] mx-auto pt-8 px-4 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-700 pb-40 bg-slate-50 min-h-screen w-full font-sans dark:bg-[#0f172a]">
<EnterpriseSectionHeader 
                title="FİNANSAL KONTROL KULESİ" 
                subtitle="Otonom Finansal Komuta Merkezi • Açık Bankacılık Senkronizasyon Konsolu"
                icon={<IconShield />}
                rightElement={
                    <div className="flex items-center gap-3">
                        <EnterpriseButton 
                            variant="primary" 
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white" 
                            onClick={handleSync}
                            disabled={isSyncing}
                        >
                            <IconActivity className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} /> 
                            {isSyncing ? 'Senkronize Ediliyor...' : 'Şimdi Senkronize Et'}
                        </EnterpriseButton>
                        <EnterpriseButton variant="secondary" className="flex items-center gap-2" onClick={() => {}}>
                            <IconShield className="w-4 h-4" /> Sistem Denetim Kaydı
                        </EnterpriseButton>
                    </div>
                } 
            />

            {/* Premium Tabs */}
            <div className="flex bg-slate-100 dark:bg-[#1e293b]/50 p-1.5 rounded-full w-full max-w-max md:mx-0 overflow-x-auto shadow-inner border border-slate-200/50 dark:border-slate-200 dark:border-white/5 custom-scroll shrink-0 mb-6 relative z-10">
                <button
                    onClick={() => setActiveTab('control')}
                    className={`flex-1 min-w-[200px] h-10 px-6 rounded-full text-[11px] font-bold tracking-wide transition-all outline-none whitespace-nowrap flex items-center justify-center gap-2 border ${activeTab === 'control' ? 'bg-white text-slate-800 shadow-sm border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-700 border-transparent dark:text-slate-400 dark:hover:text-slate-300'}`}
                >
                    <IconActivity className="w-4 h-4" /> KOMUTA MERKEZİ
                </button>
                <button
                    onClick={() => setActiveTab('heatmap')}
                    className={`flex-1 min-w-[200px] h-10 px-6 rounded-full text-[11px] font-bold tracking-wide transition-all outline-none whitespace-nowrap flex items-center justify-center gap-2 border ${activeTab === 'heatmap' ? 'bg-white text-slate-800 shadow-sm border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-700 border-transparent dark:text-slate-400 dark:hover:text-slate-300'}`}
                >
                    <IconZap className="w-4 h-4" /> KÂRLILIK ISI HARİTASI
                </button>
                <button
                    onClick={() => setActiveTab('pricing')}
                    className={`flex-1 min-w-[200px] h-10 px-6 rounded-full text-[11px] font-bold tracking-wide transition-all outline-none whitespace-nowrap flex items-center justify-center gap-2 border ${activeTab === 'pricing' ? 'bg-white text-slate-800 shadow-sm border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-700 border-transparent dark:text-slate-400 dark:hover:text-slate-300'}`}
                >
                    <IconTrendingUp className="w-4 h-4" /> OTONOM FİYATLANDIRMA
                </button>
            </div>

            {/* Tab Content Rendering */}
            {activeTab === 'control' && (
                <ControlCenterContent
                    metrics={metrics}
                    toggling={toggling}
                    toggleLiveMode={toggleLiveMode}
                />
            )}
            {activeTab === 'heatmap' && <ProfitabilityHeatmapContent />}
            {activeTab === 'pricing' && <SmartPricingContent />}

            {/* Spacer to prevent overlap */}
            <div className="h-32 w-full shrink-0 opacity-0" aria-hidden="true" />
            
            {/* Sticky Alt Çubuk */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-black/80 backdrop-blur-md border-t border-slate-200 dark:border-white/5  border-t border-slate-200 dark:border-white/5 z-50 flex justify-center">
                <div className="max-w-7xl w-full flex justify-between items-center">
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-gray-500 font-bold uppercase">Ana Banka Hesabı</span>
                            <span className="text-xs text-slate-900 dark:text-white font-medium">102.01 - Aktif</span>
                        </div>
                        <div className="flex flex-col border-l border-slate-200 dark:border-white/10 pl-6">
                            <span className="text-[10px] text-gray-500 font-bold uppercase">Fintech Sürümü</span>
                            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-black tracking-widest">OS v2.0-STABIL</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
