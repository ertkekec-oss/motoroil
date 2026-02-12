"use client";

import { useState, useEffect } from 'react';
import {
    IconActivity,
    IconShield,
    IconAlert,
    IconTrendingUp,
    IconClock,
    IconZap,
    IconCheck,
    IconBank,
    IconCreditCard
} from '@/components/icons/PremiumIcons';

// Basit Ok Bileşenleri
const ArrowUpRight = ({ className }: any) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19L19 5M19 5H10M19 5V14" /></svg>;
const ArrowDownRight = ({ className }: any) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 19l-7-7 7-7" /></svg>;
const ShieldAlert = ({ className }: any) => <IconAlert className={className} />;
const CheckCircle2 = ({ className }: any) => <IconCheck className={className} />;

const MetricCard = ({ title, value, unit, subtitle, color, icon: Icon, trend }: any) => (
    <div className="card glass p-6 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
        <div className={`absolute top-0 right-0 w-24 h-24 ${color} opacity-10 rounded-bl-full -mr-4 -mt-4 transition-all group-hover:opacity-20`} />
        <div className="relative">
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider">{title}</h3>
                <Icon className={`w-5 h-5 ${color.replace('bg-', 'text-')}`} />
            </div>
            <div className="flex items-baseline gap-2 mb-1">
                <span className="text-3xl font-black text-white">{value}</span>
                <span className="text-gray-500 font-bold">{unit}</span>
            </div>
            <p className="text-xs text-gray-400 mb-4">{subtitle}</p>
            {trend !== undefined && (
                <div className={`flex items-center gap-1 text-[10px] font-bold ${trend > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    %{Math.abs(trend)} (Geçen haftaya göre)
                </div>
            )}
        </div>
    </div>
);

const HealthSnapshot = ({ data }: any) => (
    <div className="card glass p-6 space-y-4">
        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider">Sistem Sağlık Özeti</h3>
        <div className="space-y-3">
            <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 font-medium">Bağlı Bankalar</span>
                <span className="text-sm font-black text-white">{data?.connectedBanks || 0}</span>
            </div>
            <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 font-medium">Otonom Eşleşme Oranı</span>
                <span className="text-sm font-black text-emerald-400">%{data?.todayMatchedPct?.toFixed(1) || '0.0'}</span>
            </div>
            <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 font-medium">Çalışma Modu</span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-black ${data?.autopilotState === 'LIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
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
        <div className="card glass p-6">
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-4">Eşleşme Doğruluğu</h3>
            <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden flex mb-4">
                <div style={{ width: `${hp}%` }} className="h-full bg-emerald-500" title="Yüksek" />
                <div style={{ width: `${mp}%` }} className="h-full bg-amber-500" title="Orta" />
                <div style={{ width: `${lp}%` }} className="h-full bg-rose-500" title="Düşük" />
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
                <div><p className="text-[10px] text-gray-500 font-bold uppercase">Yüksek</p><p className="text-xs font-black text-emerald-400">{dist?.high || 0}</p></div>
                <div><p className="text-[10px] text-gray-500 font-bold uppercase">Orta</p><p className="text-xs font-black text-amber-400">{dist?.medium || 0}</p></div>
                <div><p className="text-[10px] text-gray-500 font-bold uppercase">Düşük</p><p className="text-xs font-black text-rose-400">{dist?.low || 0}</p></div>
            </div>
        </div>
    );
};

const FlowAccuracy = ({ data }: any) => {
    const accuracy = data?.forecast > 0 ? (1 - Math.abs(data.actual - data.forecast) / data.forecast) * 100 : 0;
    return (
        <div className="card glass p-6">
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-4">Tahmin vs Gerçekleşen</h3>
            <div className="space-y-3">
                <div className="flex justify-between items-end">
                    <p className="text-[10px] text-gray-500 font-bold uppercase">Günlük Hedef Giriş</p>
                    <p className="text-sm font-black text-white">{data?.forecast?.toLocaleString('tr-TR') || 0} ₺</p>
                </div>
                <div className="flex justify-between items-end">
                    <p className="text-[10px] text-gray-500 font-bold uppercase">Gerçekleşen Giriş</p>
                    <p className="text-sm font-black text-emerald-400">{data?.actual?.toLocaleString('tr-TR') || 0} ₺</p>
                </div>
                <div className="pt-2 border-t border-white/5 flex justify-between items-center">
                    <span className="text-[10px] text-gray-500 font-bold uppercase">Model Başarımı</span>
                    <span className={`text-xs font-black ${accuracy > 80 ? 'text-emerald-400' : 'text-amber-400'}`}>{accuracy.toFixed(1)}%</span>
                </div>
            </div>
        </div>
    );
};

export default function FintechControlTower() {
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState<any>(null);
    const [toggling, setToggling] = useState(false);

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
        const interval = setInterval(fetchMetrics, 30000); // 30 saniyede bir güncelle
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
        <div className="p-12 space-y-8 animate-pulse text-indigo-400/50">
            <div className="h-20 bg-white/5 rounded-2xl w-full" />
            <div className="grid grid-cols-4 gap-6">
                <div className="h-32 bg-white/5 rounded-2xl" />
                <div className="h-32 bg-white/5 rounded-2xl" />
                <div className="h-32 bg-white/5 rounded-2xl" />
                <div className="h-32 bg-white/5 rounded-2xl" />
            </div>
            <div className="grid grid-cols-3 gap-8">
                <div className="col-span-2 h-64 bg-white/5 rounded-2xl" />
                <div className="h-64 bg-white/5 rounded-2xl" />
            </div>
        </div>
    );

    if (!metrics) return <div className="p-12 text-center text-gray-500">Finansal veri alınamadı. Altyapı veya bağlantı kontrol ediliyor...</div>;

    return (
        <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24">
            {/* Premium Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-emerald-400 to-white animate-gradient">
                        FİNANSAL KONTROL KULESİ <span className="text-xs align-top bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded ml-2">FAZ 3: CANLI DENETİM</span>
                    </h1>
                    <p className="text-gray-500 text-sm font-medium mt-1 uppercase tracking-widest flex items-center gap-2">
                        <IconShield className="w-4 h-4 text-emerald-500" /> OTONOM FİNANSAL KOMUTA MERKEZİ
                    </p>
                </div>
                <div className="flex items-center gap-6">
                    {/* Live Mode Toggle */}
                    <div className="flex items-center gap-3 bg-white/5 px-4 py-2.5 rounded-2xl border border-white/10">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">Otopilot Modu</span>
                            <span className={`text-xs font-black ${metrics.healthSnapshot.autopilotState === 'LIVE' ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {metrics.healthSnapshot.autopilotState === 'LIVE' ? 'CANLI MOD' : 'TEST MODU'}
                            </span>
                        </div>
                        <button
                            disabled={toggling}
                            onClick={toggleLiveMode}
                            className={`relative w-12 h-6 rounded-full transition-all duration-300 ${metrics.healthSnapshot.autopilotState === 'LIVE' ? 'bg-emerald-500' : 'bg-gray-700'} ${toggling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg transition-all duration-300 ${metrics.healthSnapshot.autopilotState === 'LIVE' ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>

                    <button className="btn-premium px-6 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2">
                        <IconActivity className="w-4 h-4" /> Sistem Denetim Kaydı
                    </button>
                </div>
            </div>

            {/* Otonom Başarı Mesajı */}
            {metrics.healthSnapshot.todayMatchedPct > 0 && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between group animate-in slide-in-from-top duration-700">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                            <IconZap className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-white">OTONOM BAŞARI</h4>
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
                <div className="card glass p-6 flex flex-col items-center justify-center text-center">
                    <div className="flex items-center gap-2 mb-2">
                        <IconActivity className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs font-black text-white">GÜVENLİK ŞALTERİ</span>
                    </div>
                    <p className={`text-lg font-black ${metrics.engine.safetyBreakerStatus === 'TRIGGERED' ? 'text-rose-500' : 'text-emerald-500'}`}>
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
                    color="bg-emerald-500"
                    icon={IconTrendingUp}
                    trend={12}
                />
                <MetricCard
                    title="Askıdaki Bakiye (397.01)"
                    value={metrics.financials.suspenseAmount.toLocaleString('tr-TR')}
                    unit="₺"
                    subtitle="Manuel inceleme bekleyen tutar"
                    color="bg-rose-500"
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
                <div className="card glass p-8 border-l-4 border-indigo-500">
                    <div className="mb-8">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <IconTrendingUp className="w-5 h-5 text-indigo-400" /> Nakit Akışı Projeksiyonu
                        </h3>
                        <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Yapay Zeka Destekli Tahmin</p>
                    </div>

                    <div className="space-y-6">
                        {metrics.forecast && metrics.forecast.length > 0 ? metrics.forecast.map((f: any, i: number) => (
                            <div key={i} className="group cursor-default">
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-sm font-bold text-gray-400">Gelecek {f.horizonDays} Gün</span>
                                    <span className={`text-sm font-black ${Number(f.netPosition) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {Number(f.netPosition).toLocaleString('tr-TR')} ₺
                                    </span>
                                </div>
                                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden flex">
                                    <div
                                        className="h-full bg-emerald-500 transition-all duration-1000 group-hover:opacity-80"
                                        style={{ width: `${(Number(f.expectedIn) / (Math.max(Number(f.expectedIn) + Number(f.expectedOut), 1))) * 100}%` }}
                                    />
                                    <div
                                        className="h-full bg-rose-500 transition-all duration-1000 group-hover:opacity-80"
                                        style={{ width: `${(Number(f.expectedOut) / (Math.max(Number(f.expectedIn) + Number(f.expectedOut), 1))) * 100}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-[10px] mt-1 font-bold">
                                    <span className="text-emerald-500/70">GİRİŞ: {Number(f.expectedIn).toLocaleString('tr-TR')}</span>
                                    <span className="text-rose-500/70">ÇIKIŞ: {Number(f.expectedOut).toLocaleString('tr-TR')}</span>
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
                <div className="lg:col-span-2 card glass p-8">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <IconClock className="w-5 h-5 text-indigo-400" /> Alacak Yaşlandırma Analizi
                            </h3>
                            <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">120.03 Hesabı Risk Dağılımı</p>
                        </div>
                        <span className="text-[10px] text-gray-500 font-mono">Gerçek Zamanlı</span>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                        {(metrics.aging || []).map((bucket: any, i: number) => (
                            <div key={i} className="space-y-4">
                                <div className="relative h-48 w-full bg-white/5 rounded-2xl overflow-hidden flex flex-col justify-end p-1">
                                    <div
                                        className={`w-full rounded-xl transition-all duration-1000 ease-out ${i === 0 ? 'bg-emerald-500/50' : i === 1 ? 'bg-blue-500/50' : i === 2 ? 'bg-amber-500/50' : 'bg-rose-500/50'
                                            }`}
                                        style={{ height: `${Math.min((bucket.amount / (Math.max(metrics.financials.totalReceivable, 1))) * 100, 100) || 5}%` }}
                                    />
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">{bucket.label}</p>
                                    <p className="text-sm font-black text-white leading-none">{bucket.amount.toLocaleString('tr-TR')} ₺</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Alt Bölüm: Akıllı Sinyaller ve Motor Performansı */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 card glass p-6 border-amber-500/10 hover:border-amber-500/30 transition-colors">
                    <h3 className="text-xs font-bold text-amber-400 mb-3 uppercase tracking-widest flex items-center gap-2">
                        <IconShield className="w-4 h-4" /> Sistem Zekası Sinyalleri
                    </h3>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-xs">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <p className="text-gray-400"><span className="text-white font-bold">Otopilot:</span> ±1 ₺ Tolerans robotu aktif ve hakediş uzlaşmalarını denetliyor.</p>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            <p className="text-gray-400"><span className="text-white font-bold">Veri Koruması:</span> Layer-1 veri muhafızı mükerrer kayıtlara karşı %100 etkin.</p>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-amber-400/80 italic">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            <p>"Açık Bankacılık senkronizasyonu başarılı. Bugün manuel girişlerinizden 3 yeni eşleşme kuralı öğrenildi."</p>
                        </div>
                    </div>
                </div>

                <div className="card glass p-6 bg-gradient-to-br from-indigo-900/10 to-transparent border-indigo-500/20">
                    <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-wider flex items-center gap-2">
                        <IconZap className="w-4 h-4 text-yellow-400" /> Motor Performansı
                    </h3>
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400 font-medium">Ort. Gecikme (P50)</span>
                            <span className="text-sm font-black text-indigo-400">{metrics.performance.avgLatency}ms</span>
                        </div>
                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 w-[75%]" />
                        </div>

                        <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-500 font-bold uppercase">7 Günlük Hatalı Event</span>
                            <span className={`font-black ${metrics.health.failedEventCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                {metrics.health.failedEventCount}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky Alt Çubuk */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-black/60 backdrop-blur-xl border-t border-white/5 z-50 flex justify-center">
                <div className="max-w-7xl w-full flex justify-between items-center">
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-gray-500 font-bold uppercase">Ana Banka Hesabı</span>
                            <span className="text-xs text-white font-medium">102.01 - Aktif</span>
                        </div>
                        <div className="flex flex-col border-l border-white/10 pl-6">
                            <span className="text-[10px] text-gray-500 font-bold uppercase">Fintech Sürümü</span>
                            <span className="text-xs text-indigo-400 font-black tracking-widest">OS v2.0-STABIL</span>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button className="px-6 py-2 bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-500/20">
                            Denetim Kaydını İndir
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
