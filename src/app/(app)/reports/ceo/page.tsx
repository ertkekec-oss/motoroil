"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine, ZAxis } from 'recharts';
import { HelpCircle, CheckCircle2, ArrowRight, AlertTriangle, AlertCircle, MoveRight, DollarSign, Package, Users, Settings } from 'lucide-react';

const riskData = [
    { id: '1', name: 'Nakit Sıkışıklığı (EU)', finRisk: 85, opRisk: 30, z: 50, region: 'EU' },
    { id: '2', name: 'Atıl Stok (TR)', finRisk: 40, opRisk: 75, z: 80, region: 'TR' },
    { id: '3', name: 'Tedarik Gecikmesi (USA)', finRisk: 60, opRisk: 90, z: 60, region: 'USA' },
    { id: '4', name: 'Fiyat/Marj Eriyişi (EU)', finRisk: 70, opRisk: 50, z: 40, region: 'EU' },
    { id: '5', name: 'Düzenli Akış (MEA)', finRisk: 20, opRisk: 20, z: 90, region: 'MEA' },
];

const decisionQueue = [
    { id: 1, action: '3 ürün için Global RFQ aç', reason: 'Aşırı Talep & Avrupa Deposunda Kritik Stok', impact: 'Kritik Operasyonel Risk', color: 'red' },
    { id: 2, action: '4 ürünü B2B Global Network\'e aç', reason: '120 gündür atıl stok (TR)', impact: 'Yüksek Nakit Etkisi ($84K)', color: 'blue' },
    { id: 3, action: 'TR/EU Arası Fiyat Arbitrajı', reason: 'Kur farkı %4\'ü aştı', impact: 'Orta Marj Etkisi', color: 'emerald' },
    { id: 4, action: 'Depolar Arası Transfer (TR -> EU)', reason: 'Dengesiz stok dağılımı ve vergi avantajı', impact: 'Düşük Operasyonel Değer', color: 'slate' },
];

const InfoTooltip = ({ content, iconClassName = "w-4 h-4 text-slate-400 hover:text-slate-600" }: { content: string, iconClassName?: string }) => (
    <div className="group relative inline-flex items-center justify-center pointer-events-auto align-middle ml-1">
        <HelpCircle className={`${iconClassName} cursor-help transition-colors`} />
        <div className="opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-4 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-xl shadow-md text-slate-600 dark:text-slate-400 text-sm leading-relaxed z-[100] pointer-events-none font-normal text-left">
            {content}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-[6px] border-transparent border-t-white z-10"></div>
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-[7px] border-transparent border-t-slate-200"></div>
        </div>
    </div>
);

export default function CEODashboardPage() {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const [roleMode, setRoleMode] = useState<'CEO' | 'CFO' | 'COO' | 'Growth'>('CEO');
    const [scopeMode, setScopeMode] = useState<'Yerel' | 'Bölgesel' | 'Global'>('Global');

    // YENI EKLENEN CEO-METRICS (ESKI KOKPITTEN GELEN)
    const [data, setData] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
            return;
        }

        const fetchData = async () => {
            try {
                const res = await fetch('/api/reports/ceo-metrics');
                const json = await res.json();
                setData(json);
            } catch (error) {
                console.error("CEO Metrics Error", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [isLoading, isAuthenticated, router]);

    if (isLoading || loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-800 dark:text-slate-200 font-sans">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <div className="font-bold text-sm tracking-widest text-slate-500 dark:text-slate-400 uppercase animate-pulse">İş Zekası Yükleniyor...</div>
                </div>
            </div>
        );
    }

    if (!data) return <div className="text-slate-800 dark:text-slate-200 p-10 font-sans font-medium">Veri alınamadı.</div>;

    const { metrics, briefing } = data;
    const { issues, warnings } = briefing || { issues: [], warnings: [] };
    const hasIssues = issues.length > 0 || warnings.length > 0;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 dark:text-slate-200 font-sans p-6 md:p-10 pb-24 animate-in fade-in duration-500">

            {/* 2. Dark Hero Alanı */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-8 mb-6 shadow-md relative z-10">
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                    {/* LEFT BLOCK */}
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-white mb-2">
                            Strateji Merkezi
                        </h1>
                        <p className="text-slate-400 font-medium text-sm mb-6">
                            Şirket genel performans, risk ve öncelik analiz paneli
                        </p>

                        <div className="flex items-center gap-3">
                            <div className="flex flex-col">
                                <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 flex items-center">
                                    Şirket Sağlık Skoru
                                    <InfoTooltip content="Nakit, stok ve kârlılık verilerinden hesaplanan genel performans göstergesi." iconClassName="w-3.5 h-3.5 text-slate-500 hover:text-slate-300" />
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-5xl font-black text-emerald-400">81</span>
                                    <span className="text-lg font-bold text-slate-500 dark:text-slate-400">/ 100</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT BLOCK */}
                    <div className="flex flex-col gap-4 shrink-0 w-full md:w-auto">
                        {/* Scope Toggle */}
                        <div className="flex bg-slate-950/50 border border-slate-700/50 rounded-xl p-1 shadow-inner items-center">
                            {(['Yerel', 'Bölgesel', 'Global'] as const).map(s => (
                                <button
                                    key={s}
                                    onClick={() => setScopeMode(s)}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 flex-1 justify-center md:flex-none ${scopeMode === s ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    {s}
                                    {s === 'Yerel' && <InfoTooltip content="Seçili şirket ve ülke verileri analiz edilir." iconClassName={`w-3.5 h-3.5 ${scopeMode === s ? 'text-blue-200' : 'text-slate-500 hover:text-slate-300'}`} />}
                                    {s === 'Bölgesel' && <InfoTooltip content="Birden fazla şube karşılaştırmalı analiz edilir." iconClassName={`w-3.5 h-3.5 ${scopeMode === s ? 'text-blue-200' : 'text-slate-500 hover:text-slate-300'}`} />}
                                    {s === 'Global' && <InfoTooltip content="Tüm bölgeler ve para birimleri birlikte değerlendirilir." iconClassName={`w-3.5 h-3.5 ${scopeMode === s ? 'text-blue-200' : 'text-slate-500 hover:text-slate-300'}`} />}
                                </button>
                            ))}
                        </div>

                        {/* Role Toggle */}
                        <div className="flex bg-white dark:bg-[#0f172a] rounded-xl p-1 shadow-lg items-center self-end w-full md:w-auto">
                            {(['CEO', 'CFO', 'COO', 'Growth'] as const).map(r => (
                                <button
                                    key={r}
                                    onClick={() => setRoleMode(r)}
                                    className={`px-6 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 flex-1 justify-center md:flex-none ${roleMode === r ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                                >
                                    {r}
                                    {roleMode === r && <InfoTooltip content="Seçilen role göre metrik ve öncelikler sadeleştirilir." iconClassName="w-[14px] h-[14px] text-slate-400 hover:text-white/80" />}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. DİNAMİK GÜNLÜK DURUM (Eski CEO Sayfasından Harmanlama) */}
            <div className="mb-8">
                {!hasIssues ? (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl p-5 flex justify-between items-center shadow-sm">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                            <div>
                                <div className="font-bold text-sm">Her Şey Yolunda Görünüyor</div>
                                <div className="text-xs font-medium text-emerald-600/80">Bugün için kritik bir risk, stok problemi veya finansal anomali tespit edilmedi.</div>
                            </div>
                        </div>
                        <InfoTooltip content="Bugün sistem tarafından tespit edilen kritik risk bulunmamaktadır." iconClassName="w-5 h-5 text-emerald-500 hover:text-emerald-700" />
                    </div>
                ) : (
                    <div className="space-y-3">
                        {issues.map((issue: any, idx: number) => (
                            <div key={idx} className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-5 shadow-sm flex items-center justify-between animate-in slide-in-from-top-2">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                                        <AlertTriangle className="w-5 h-5 text-red-600" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-[15px] mb-0.5">{issue.title}</div>
                                        <div className="text-xs font-medium text-red-600/80">{issue.message}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {warnings.map((warn: string, idx: number) => (
                            <div key={idx} className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-4 shadow-sm flex items-center gap-3">
                                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                                <span className="text-xs font-bold">{warn}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* YENİ HARMAN: ESKİ İSTATİSTİKİ VERİLER (GERÇEK VERİ MODÜLÜ) */}
            <div className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">Analitik Çekirdek (Reel Metrikler)</h2>
                    <InfoTooltip content="İşletmenin anlık reel performansı." iconClassName="w-4 h-4 text-slate-400" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {/* EN KÂRLI ÜRÜN */}
                    <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-white/5 group">
                        <div className="text-[11px] font-bold text-indigo-600 mb-2 uppercase flex justify-between items-center">
                            En Kârlı Ürün
                            <Package className="w-4 h-4 text-indigo-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                        </div>
                        {metrics.mostProfitable ? (
                            <>
                                <div className="text-base font-black text-slate-900 dark:text-white truncate" title={metrics.mostProfitable.name}>{metrics.mostProfitable.name}</div>
                                <div className="flex items-end gap-1 mb-2">
                                    <span className="text-2xl font-black text-slate-800 dark:text-slate-200">+{Math.round(metrics.mostProfitable.roi)}%</span>
                                    <span className="text-xs text-emerald-600 font-bold mb-1">ROI</span>
                                </div>
                                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-[#1e293b] border border-slate-100 dark:border-white/5 px-3 py-1.5 rounded-lg inline-flex items-center gap-2">
                                    <DollarSign className="w-3.5 h-3.5 text-slate-400" /> P. Başı Kâr: ₺{metrics.mostProfitable.margin.toLocaleString()}
                                </div>
                            </>
                        ) : (
                            <div className="text-sm text-slate-400 font-medium py-4">Veri yok</div>
                        )}
                    </div>

                    {/* STOK DEĞERİ */}
                    <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-white/5 group">
                        <div className="text-[11px] font-bold text-blue-600 mb-2 uppercase flex justify-between items-center">
                            Stok Maliyet Değeri
                            <Package className="w-4 h-4 text-blue-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="text-2xl font-black text-slate-900 dark:text-white mb-1">₺{metrics.inventoryValue?.toLocaleString()}</div>
                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-3">
                            Potansiyel: <span className="text-emerald-600 font-bold">₺{metrics.potentialRevenue?.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-[#334155]/50 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-blue-500 h-full" style={{ width: '60%' }}></div>
                        </div>
                    </div>

                    {/* SERVİSTE BEKLEYEN */}
                    <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-white/5 group">
                        <div className="text-[11px] font-bold text-amber-600 mb-2 uppercase flex justify-between items-center">
                            Serviste Bekleyen (WIP)
                            <Settings className="w-4 h-4 text-amber-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="text-2xl font-black text-slate-900 dark:text-white mb-1">₺{metrics.wipValue?.toLocaleString()}</div>
                        <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-tight mt-3">
                            Henüz faturalanmamış devam eden servis değerleri toplamı.
                        </div>
                    </div>

                    {/* PERSONEL V. & MVP */}
                    <div className="bg-gradient-to-br from-indigo-50 to-white rounded-2xl p-5 shadow-sm border border-indigo-100 group flex flex-col justify-between">
                        <div>
                            <div className="text-[11px] font-bold text-indigo-800 mb-2 uppercase flex justify-between items-center">
                                MVP Müşteri
                                <Users className="w-4 h-4 text-indigo-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                            </div>
                            {metrics.mvpCustomer ? (
                                <div className="flex justify-between items-end">
                                    <div className="flex-1 pr-2">
                                        <div className="text-[15px] font-bold text-slate-900 dark:text-white truncate">{metrics.mvpCustomer.name}</div>
                                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Satış Lideri</div>
                                    </div>
                                    <div className="text-xl font-black text-indigo-700 shrink-0">₺{metrics.mvpCustomer.total?.toLocaleString()}</div>
                                </div>
                            ) : (
                                <div className="text-sm text-slate-400 font-medium">Veri yok.</div>
                            )}
                        </div>
                        <div className="mt-4 border-t border-indigo-100/60 pt-3 flex justify-between items-center">
                            <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Per Ciro: <span className="text-slate-800 dark:text-slate-200">₺{Math.round(metrics.revenuePerEmployee || 0).toLocaleString()}</span></div>
                            <button className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors">Tümü <MoveRight className="w-3 h-3" /></button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 4. Ana Kart Alanı (Light Kurumsal) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {roleMode === 'CEO' && (
                    <>
                        <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-white/5 flex flex-col justify-center">
                            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 flex justify-between items-center w-full">
                                <span>Konsolide Ciro</span>
                                <InfoTooltip content="Tüm şubeler ve döviz cinslerinden elde edilen net ciro tutarı." />
                            </div>
                            <div className="text-3xl font-black text-slate-900 dark:text-white">$4.2M</div>
                        </div>
                        <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-white/5 flex flex-col justify-center">
                            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 flex justify-between items-center w-full">
                                <span>Nakit Dönüş Süresi</span>
                                <InfoTooltip content="Stokların satılıp nakde dönüşümüne kadar geçen ortalama süre." />
                            </div>
                            <div className="text-3xl font-black text-slate-900 dark:text-white">42 Gün</div>
                        </div>
                        <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-white/5 flex flex-col justify-center">
                            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 flex justify-between items-center w-full">
                                <span>Kritik Risk Sayısı</span>
                                <InfoTooltip content="Acil müdahale gerektiren operasyonel veya finansal darboğaz sayısı." />
                            </div>
                            <div className="text-3xl font-black text-red-500">3</div>
                        </div>
                        <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-white/5 flex flex-col justify-center">
                            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 flex justify-between items-center w-full">
                                <span>Tahmini 30G Kâr</span>
                                <InfoTooltip content="Gelecek 30 gün içinde beklenen operasyonel kâr tahmini." />
                            </div>
                            <div className="text-3xl font-black text-emerald-600">+$124K</div>
                        </div>
                    </>
                )}

                {roleMode === 'CFO' && (
                    <>
                        <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-white/5 flex flex-col justify-center">
                            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 flex justify-between items-center w-full">
                                <span>Alacak / Borç Dengesi</span>
                                <InfoTooltip content="Açık faturalar üzerinden hesaplanan şirketin cari nakit netliği." />
                            </div>
                            <div className="text-3xl font-black text-slate-900 dark:text-white">+ %14</div>
                        </div>
                        <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-white/5 flex flex-col justify-center">
                            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 flex justify-between items-center w-full">
                                <span>Kur Riski</span>
                                <InfoTooltip content="Kur dalgalanmasına açık varlık/yükümlülük risk hacmi." />
                            </div>
                            <div className="text-3xl font-black text-amber-500">Orta</div>
                        </div>
                        <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-white/5 flex flex-col justify-center">
                            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 flex justify-between items-center w-full">
                                <span>Tahmini Nakit Açığı</span>
                                <InfoTooltip content="15 gün içinde oluşması muhtemel nakit rezerv eksikliği." />
                            </div>
                            <div className="text-3xl font-black text-slate-900 dark:text-white">$0 <span className="text-sm font-medium text-slate-400 ml-1">(Yok)</span></div>
                        </div>
                        <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-white/5 flex flex-col justify-center">
                            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 flex justify-between items-center w-full">
                                <span>Geciken Tahsilatlar</span>
                                <InfoTooltip content="Vadesi geçmiş ve tahsil edilememiş toplam alacaklar." />
                            </div>
                            <div className="text-3xl font-black text-red-500">$28K</div>
                        </div>
                    </>
                )}

                {roleMode === 'COO' && (
                    <>
                        <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-white/5 flex flex-col justify-center">
                            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 flex justify-between items-center w-full">
                                <span>Kritik Stok</span>
                                <InfoTooltip content="Tükenme seviyesinde olan veya aşırı atıl duran ürün sayısı." />
                            </div>
                            <div className="text-3xl font-black text-red-500">14</div>
                        </div>
                        <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-white/5 flex flex-col justify-center">
                            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 flex justify-between items-center w-full">
                                <span>Transfer Bekleyen</span>
                                <InfoTooltip content="Depolar arası onay bekleyen sevk emri sayısı." />
                            </div>
                            <div className="text-3xl font-black text-amber-500">28</div>
                        </div>
                        <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-white/5 flex flex-col justify-center">
                            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 flex justify-between items-center w-full">
                                <span>Servis WIP</span>
                                <InfoTooltip content="Devam eden ancak henüz faturalandırılmamış servis işlemleri bedeli." />
                            </div>
                            <div className="text-3xl font-black text-slate-900 dark:text-white">₺184K</div>
                        </div>
                        <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-white/5 flex flex-col justify-center">
                            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 flex justify-between items-center w-full">
                                <span>Ortalama Tedarik Süresi</span>
                                <InfoTooltip content="Sipariş anından depoya girişine kadar geçen ortalama süre." />
                            </div>
                            <div className="text-3xl font-black text-slate-900 dark:text-white">14 Gün</div>
                        </div>
                    </>
                )}

                {roleMode === 'Growth' && (
                    <>
                        <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-white/5 flex flex-col justify-center">
                            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 flex justify-between items-center w-full">
                                <span>En Karlı Ürün</span>
                                <InfoTooltip content="Marjı en yüksek olan ve en fazla net kâr bırakan kategori/ürün." />
                            </div>
                            <div className="text-xl font-black text-slate-900 dark:text-white leading-tight">Maden Yağları</div>
                        </div>
                        <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-white/5 flex flex-col justify-center">
                            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 flex justify-between items-center w-full">
                                <span>En Hızlı Dönen SKU</span>
                                <InfoTooltip content="Stok devir hızı en yüksek olan ve anında nakde dönen ürün." />
                            </div>
                            <div className="text-xl font-black text-slate-900 dark:text-white leading-tight">10W-40 Pro</div>
                        </div>
                        <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-white/5 flex flex-col justify-center">
                            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 flex justify-between items-center w-full">
                                <span>Müşteri Değer Skoru</span>
                                <InfoTooltip content="CSAT ve LTV verilerine dayalı ortalama sadakat skoru." />
                            </div>
                            <div className="text-3xl font-black text-emerald-600">92/100</div>
                        </div>
                        <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-white/5 flex flex-col justify-center">
                            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 flex justify-between items-center w-full">
                                <span>Kampanya ROI</span>
                                <InfoTooltip content="B2B Boost kampanyalarının ortalama yatırım getirisi oranı." />
                            </div>
                            <div className="text-3xl font-black text-blue-600">% 415</div>
                        </div>
                    </>
                )}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* 5. Risk Haritası */}
                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm flex flex-col min-h-[420px]">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center mb-1">
                                Risk Haritası
                                <InfoTooltip content="Operasyonel risk (X) ve finansal risk (Y) yoğunluğunu gösterir." />
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium tracking-wide">Kırmızı: Kritik | Turuncu: Risk | Yeşil: Stabil</p>
                        </div>
                    </div>
                    <div className="flex-1 w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 0 }}>
                                <XAxis type="number" dataKey="opRisk" name="Operasyonel" tick={{ fontSize: 11 }} hide domain={[0, 100]} />
                                <YAxis type="number" dataKey="finRisk" name="Finansal" tick={{ fontSize: 11 }} hide domain={[0, 100]} />
                                <ZAxis type="number" dataKey="z" range={[100, 800]} name="Bölgesel Etki" />
                                <Tooltip cursor={{ strokeDasharray: '3 3' }}
                                    content={(props: any) => {
                                        const { active, payload } = props;
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                                <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-[11px] font-medium border border-slate-700 min-w-[160px]">
                                                    <div className="font-bold border-b border-slate-700 pb-2 mb-2 flex justify-between items-center">
                                                        <span>{data.name}</span>
                                                        <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded text-[9px]">{data.region}</span>
                                                    </div>
                                                    <div className="flex justify-between text-slate-300 mb-1"><span>Finansal Risk:</span> <span className="text-white font-bold">% {data.finRisk}</span></div>
                                                    <div className="flex justify-between text-slate-300 mb-1"><span>Operasyonel:</span> <span className="text-white font-bold">% {data.opRisk}</span></div>
                                                </div>
                                            )
                                        }
                                        return null;
                                    }}
                                />
                                <Scatter name="Risk" data={riskData} fill="#8884d8">
                                    {riskData.map((entry, index) => {
                                        const score = (entry.finRisk + entry.opRisk) / 2;
                                        let color = '#10b981'; // emerald
                                        if (score > 60) color = '#ef4444'; // red
                                        else if (score > 40) color = '#f59e0b'; // amber
                                        return <Cell key={`cell-${index}`} fill={color} opacity={0.8} />
                                    })}
                                </Scatter>
                                <ReferenceLine x={50} stroke="#e2e8f0" strokeDasharray="3 3" />
                                <ReferenceLine y={50} stroke="#e2e8f0" strokeDasharray="3 3" />
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 6. Karar Motoru */}
                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm flex flex-col min-h-[420px]">
                    <div className="mb-6 border-b border-slate-100 dark:border-white/5 pb-4">
                        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center">
                            Bugün Öncelikli Aksiyonlar
                            <InfoTooltip content="Sistem tarafından analiz edilerek önerilen müdahale gerektiren işlemler." />
                        </h2>
                    </div>

                    <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        {decisionQueue.map((item) => (
                            <div key={item.id} className="flex flex-col p-4 rounded-xl border border-slate-200 dark:border-white/5 hover:border-slate-300 hover:shadow-md transition-all bg-white dark:bg-[#0f172a] relative">
                                <div className="mb-3">
                                    <div className="text-sm font-black text-slate-900 dark:text-white mb-1 leading-tight">{item.action}</div>
                                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{item.reason}</div>
                                </div>

                                <div className="mb-4">
                                    <div className={`text-[10px] font-bold text-${item.color}-700 bg-${item.color}-50 px-2 py-1 rounded inline-block border border-${item.color}-200`}>
                                        {item.impact}
                                    </div>
                                </div>

                                <div className="flex gap-2 w-full mt-auto">
                                    <button className="flex-1 px-3 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm flex justify-center items-center gap-1.5 focus:ring-2 focus:ring-slate-900 focus:ring-offset-1">
                                        Operasyona Git <ArrowRight className="w-3.5 h-3.5" />
                                    </button>
                                    <button className="px-4 py-2 bg-slate-100 dark:bg-[#334155]/50 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors border border-slate-200 dark:border-white/5">
                                        Onayla
                                    </button>
                                    <button className="px-4 py-2 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-[#1e293b] rounded-lg text-xs font-semibold transition-colors">
                                        Sonra
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

        </div>
    );
}
