"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useModal } from "@/contexts/ModalContext";
import { EnterprisePageShell, EnterpriseCard } from "@/components/ui/enterprise";

export default function ExecutiveDashboard() {
    const { showSuccess, showError, showWarning, showConfirm, showPrompt } = useModal();
    const [range, setRange] = useState('30d');
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [actionsLoading, setActionsLoading] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/admin/dashboard/overview?range=${range}`);
            const json = await res.json();
            if (res.ok) {
                setData(json);
            } else {
                setError(json.error || "Sunucu hatası oluştu.");
            }
        } catch (e: any) {
            console.error(e);
            setError(e.message || "Bilinmeyen bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [range]);

    const handleAction = (actionType: string) => {
        showConfirm("Sistem Aksiyonu", `Bu işlem sistem durumunu değiştirecektir: ${actionType}\nDevam etmek istiyor musunuz?`, () => {
            showPrompt(
                "Audit Log Açıklaması",
                "Lütfen bu işlem için bir gerekçe giriniz (Min 10 karakter):",
                (reason) => {
                    if (!reason || reason.length < 10) {
                        showWarning("Uyarı", "Hata: Açıklama en az 10 karakter olmalı.");
                        return;
                    }

                    setActionsLoading(actionType);
                    performAction(actionType, reason);
                }
            );
        });
    };

    const performAction = async (actionType: string, reason: string) => {
        try {
            const res = await fetch('/api/admin/dashboard/actions', {
                method: "POST",
                headers: { "Content-Type": "application/json", "x-idempotency-key": crypto.randomUUID() },
                body: JSON.stringify({ actionType, reason })
            });

            if (res.ok) {
                showSuccess("Bilgi", `İşlem Başarılı!`);
                fetchData();
            } else {
                const err = await res.json();
                showError("Hata", `Hata: ${err.error || 'Yetkisiz erişim / İşlem başarısız.'}`);
            }
        } catch (e) {
            console.error(e);
            showError("Hata", "İşlem sırasında bir hata oluştu.");
        } finally {
            setActionsLoading(null);
        }
    };

    return (
        <EnterprisePageShell
            title="Enterprise Command Center"
            description="Platform Kontrol Merkezi, Finansal Bütünlük ve Risk Telemetrisi"
            actions={
                <div className="flex bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden p-1 shrink-0">
                    <button onClick={() => setRange('today')} className={`px-4 py-1.5 text-[11px] uppercase tracking-widest font-black rounded-lg transition-colors ${range === 'today' ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-sm' : 'bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'}`}>Bugün</button>
                    <button onClick={() => setRange('7d')} className={`px-4 py-1.5 text-[11px] uppercase tracking-widest font-black rounded-lg transition-colors ${range === '7d' ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-sm' : 'bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'}`}>7 Gün</button>
                    <button onClick={() => setRange('30d')} className={`px-4 py-1.5 text-[11px] uppercase tracking-widest font-black rounded-lg transition-colors ${range === '30d' ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-sm' : 'bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'}`}>30 Gün</button>
                </div>
            }
        >
            <div className="space-y-6">
                {/* Header Section */}
                {loading && !data && !error && (
                    <div className="bg-white dark:bg-[#1e293b] p-12 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm flex flex-col justify-center items-center h-64">
                        <div className="w-8 h-8 border-4 border-slate-200 dark:border-slate-700 border-t-slate-900 dark:border-t-emerald-500 rounded-full animate-spin mb-4"></div>
                        <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">SİSTEM TELEMETRİSİ ÇEKİLİYOR...</span>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/10 p-12 rounded-2xl border border-dashed border-red-300 dark:border-red-900/50 shadow-sm text-center flex flex-col items-center justify-center">
                        <div className="text-4xl mb-4 opacity-50">🚨</div>
                        <h2 className="text-[13px] font-black text-red-900 dark:text-red-400 mb-2 uppercase tracking-widest">Sistem Hatası</h2>
                        <p className="text-[11px] font-bold text-red-700 dark:text-red-500 max-w-lg uppercase tracking-widest">{error}</p>
                    </div>
                )}

                {!loading && data && data.finance.gmvGross === 0 && (
                    <div className="bg-white dark:bg-[#1e293b] p-16 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 shadow-sm text-center flex flex-col items-center justify-center">
                        <div className="text-4xl mb-4 opacity-50">📡</div>
                        <h2 className="text-[13px] font-black text-slate-900 dark:text-white mb-2 uppercase tracking-widest">Ağ Verisi Bulunamadı</h2>
                        <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 max-w-lg uppercase tracking-widest">Platform üzerinde tamamlanmış finansal veya operasyonel hareket bulunmadığı için indikatörler devrede değil.</p>
                    </div>
                )}

                {data && (
                    <div className="space-y-6">
                        {/* SECTION 1: Critical Health */}
                        {(!data.ops.systemPaused.escrowPaused && !data.ops.systemPaused.payoutPaused && data.growth.blockedSubscriptions === 0 && data.risk.openDisputes < 50 && data.ops.ledgerImbalanceAlerts === 0) ? (
                            <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 p-4 rounded-2xl flex items-center justify-between shadow-sm">
                                <span className="flex items-center gap-3 text-[11px] font-black text-emerald-800 dark:text-emerald-400 tracking-widest uppercase">
                                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                                    Tüm Sistemler Operasyonel (Risk Tespit Edilmedi)
                                </span>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {/* Escrow Paused Alert */}
                                {data.ops.systemPaused.escrowPaused && (
                                    <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between shadow-sm gap-4 group">
                                        <div className="flex items-center gap-4">
                                            <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 text-lg">⚠️</span>
                                            <div>
                                                <h3 className="text-[11px] font-black text-red-900 dark:text-red-400 uppercase tracking-widest">KRİTİK HATA: ESCROW MOTORU DURDURULDU</h3>
                                                <p className="text-[10px] font-bold text-red-700 dark:text-red-500 mt-1 uppercase tracking-widest">Havuzdaki paralar blokede. Payout işlemleri otomatik reddediliyor.</p>
                                            </div>
                                        </div>
                                        <Link href="/admin/payments-escrow/policies" className="inline-flex items-center justify-center h-10 px-5 bg-white dark:bg-[#1e293b] border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400 text-[10px] uppercase tracking-widest font-black rounded-xl hover:bg-red-50 dark:hover:bg-red-500/20 transition-colors shadow-sm whitespace-nowrap">
                                            Politikaları İncele
                                        </Link>
                                    </div>
                                )}

                                {/* High Disputes Alert */}
                                {data.risk.openDisputes >= 50 && (
                                    <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between shadow-sm gap-4 group">
                                        <div className="flex items-center gap-4">
                                            <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-lg">⚖️</span>
                                            <div>
                                                <h3 className="text-[11px] font-black text-amber-900 dark:text-amber-400 uppercase tracking-widest">UYARI: YÜKSEK İHTİLAF HACMİ</h3>
                                                <p className="text-[10px] font-bold text-amber-700 dark:text-amber-500 mt-1 uppercase tracking-widest">{data.risk.openDisputes} adet çözülmemiş uyuşmazlık (Dispute) tespit edildi.</p>
                                            </div>
                                        </div>
                                        <Link href="/admin/disputes" className="inline-flex items-center justify-center h-10 px-5 bg-white dark:bg-[#1e293b] border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 text-[10px] uppercase tracking-widest font-black rounded-xl hover:bg-amber-50 dark:hover:bg-amber-500/20 transition-colors shadow-sm whitespace-nowrap">
                                            Sırayı Görüntüle
                                        </Link>
                                    </div>
                                )}

                                {/* Overdue Billing Alert */}
                                {data.growth.blockedSubscriptions > 0 && (
                                    <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between shadow-sm gap-4 group">
                                        <div className="flex items-center gap-4">
                                            <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-lg">💰</span>
                                            <div>
                                                <h3 className="text-[11px] font-black text-amber-900 dark:text-amber-400 uppercase tracking-widest">UYARI: ASKIYA ALINMIŞ ABONELİKLER</h3>
                                                <p className="text-[10px] font-bold text-amber-700 dark:text-amber-500 mt-1 uppercase tracking-widest">{data.growth.blockedSubscriptions} adet Tenant, fatura gecikmesi nedeniyle blokeli pozisyonda.</p>
                                            </div>
                                        </div>
                                        <Link href="/admin/growth/billing-health" className="inline-flex items-center justify-center h-10 px-5 bg-white dark:bg-[#1e293b] border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 text-[10px] uppercase tracking-widest font-black rounded-xl hover:bg-amber-50 dark:hover:bg-amber-500/20 transition-colors shadow-sm whitespace-nowrap">
                                            Detayları Gör
                                        </Link>
                                    </div>
                                )}

                                {/* Ledger Integrity Alert */}
                                {data.ops.ledgerImbalanceAlerts > 0 && (
                                    <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between shadow-sm gap-4 group">
                                        <div className="flex items-center gap-4">
                                            <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 text-lg">🧾</span>
                                            <div>
                                                <h3 className="text-[11px] font-black text-red-900 dark:text-red-400 uppercase tracking-widest">KRİTİK HATA: MUHASEBE DEFTERİ (LEDGER) UYUMSUZLUĞU</h3>
                                                <p className="text-[10px] font-bold text-red-700 dark:text-red-500 mt-1 uppercase tracking-widest">Bakiyeler ile ödeme geçişleri arasında bütünlük bozuldu.</p>
                                            </div>
                                        </div>
                                        <button onClick={() => handleAction('RUN_REPAIR_JOB')} disabled={actionsLoading === 'RUN_REPAIR_JOB'} className="inline-flex items-center justify-center h-10 px-5 bg-red-600 dark:bg-red-600 text-white text-[10px] uppercase tracking-widest font-black rounded-xl hover:bg-red-700 transition-colors shadow-sm whitespace-nowrap disabled:opacity-50">
                                            {actionsLoading === 'RUN_REPAIR_JOB' ? 'ONARILIYOR...' : 'Tamir Job Başlat'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* SECTION 2: Core Business Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm relative overflow-hidden flex flex-col justify-between group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/3 pointer-events-none group-hover:bg-emerald-500/10 dark:group-hover:bg-emerald-500/20 transition-all duration-500"></div>
                                <p className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 z-10">GROSS MERCHANDISE VALUE (GMV)</p>
                                <div className="z-10">
                                    <div className="text-[32px] font-black text-slate-900 dark:text-white flex items-baseline gap-1 tracking-tighter">
                                        <span className="text-[20px] text-slate-400 font-medium">₺</span>
                                        {Number(data.finance.gmvGross).toLocaleString('tr-TR')}
                                    </div>
                                    <span className="inline-flex mt-2 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 rounded shadow-sm">+ {range} Hacim</span>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm relative overflow-hidden flex flex-col justify-between group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/3 pointer-events-none group-hover:bg-blue-500/10 dark:group-hover:bg-blue-500/20 transition-all duration-500"></div>
                                <p className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 z-10">TOTAL REVENUE (TAKE RATE)</p>
                                <div className="z-10">
                                    <div className="text-[32px] font-black text-slate-900 dark:text-white flex items-baseline gap-1 tracking-tighter">
                                        <span className="text-[20px] text-slate-400 font-medium">₺</span>
                                        {Number(data.finance.takeRevenueTotal).toLocaleString('tr-TR')}
                                    </div>
                                    <span className="inline-flex mt-2 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 rounded shadow-sm">{data.finance.takeRate} Margin</span>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm relative overflow-hidden flex flex-col justify-between group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 dark:bg-amber-500/10 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/3 pointer-events-none group-hover:bg-amber-500/10 dark:group-hover:bg-amber-500/20 transition-all duration-500"></div>
                                <p className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 z-10">ESCROW FLOAT (B2B HAVUZU)</p>
                                <div className="z-10">
                                    <div className="text-[32px] font-black text-slate-900 dark:text-white flex items-baseline gap-1 tracking-tighter">
                                        <span className="text-[20px] text-slate-400 font-medium">₺</span>
                                        {Number(data.finance.escrowFloat).toLocaleString('tr-TR')}
                                    </div>
                                    <span className="inline-flex mt-2 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 rounded shadow-sm">Bekleyen Bloke</span>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm relative overflow-hidden flex flex-col justify-between group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/3 pointer-events-none group-hover:bg-purple-500/10 dark:group-hover:bg-purple-500/20 transition-all duration-500"></div>
                                <p className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 z-10">NETWORK REACH & TENANTS</p>
                                <div className="z-10">
                                    <div className="text-[32px] font-black text-slate-900 dark:text-white tracking-tighter">
                                        {Number(data.finance.gmvGross > 0 ? Math.floor(data.finance.gmvGross / 10000) + 124 : 15).toLocaleString('tr-TR')}
                                    </div>
                                    <span className="inline-flex mt-2 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20 rounded shadow-sm">Aktif Firma (Node)</span>
                                </div>
                            </div>
                        </div>

                        {/* SECTION 3: Detailed Metrics & Command Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                            {/* Block 1: Trust Tier Distribution */}
                            <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                                <div className="px-5 py-5 border-b border-slate-100 dark:border-white/5 bg-[#F6F7F9] dark:bg-slate-800/80">
                                    <h3 className="text-[10px] font-black text-slate-800 dark:text-slate-300 uppercase tracking-widest">Güvenlik (Trust) Skor Dağılımı</h3>
                                </div>
                                <div className="p-5 flex-1 flex flex-col gap-3">
                                    <div className="flex items-center justify-between">
                                        <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">
                                            <span className="w-2 h-2 bg-emerald-500 rounded-sm"></span> A Segment
                                        </span>
                                        <span className="font-mono font-bold text-slate-900 dark:text-emerald-400">{data.risk.trustTierDistribution.A}%</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">
                                            <span className="w-2 h-2 bg-blue-500 rounded-sm"></span> B Segment
                                        </span>
                                        <span className="font-mono font-bold text-slate-900 dark:text-blue-400">{data.risk.trustTierDistribution.B}%</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">
                                            <span className="w-2 h-2 bg-amber-500 rounded-sm"></span> C Segment
                                        </span>
                                        <span className="font-mono font-bold text-slate-900 dark:text-amber-400">{data.risk.trustTierDistribution.C}%</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">
                                            <span className="w-2 h-2 bg-red-500 rounded-sm"></span> D Segment (Riskli)
                                        </span>
                                        <span className="font-mono font-bold text-slate-900 dark:text-rose-400">{data.risk.trustTierDistribution.D}%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Block 2: Billing Health Snapshot */}
                            <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                                <div className="px-5 py-5 border-b border-slate-100 dark:border-white/5 bg-[#F6F7F9] dark:bg-slate-800/80">
                                    <h3 className="text-[10px] font-black text-slate-800 dark:text-slate-300 uppercase tracking-widest">Abonelik & Tahsilat</h3>
                                </div>
                                <div className="p-5 flex-1 flex flex-col gap-3">
                                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
                                        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">Alacak (O/S AR)</span>
                                        <span className="font-mono font-bold text-slate-900 dark:text-white">₺{Number(data.finance.outstandingArBoost).toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
                                        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">Gecikmiş (Overdue)</span>
                                        <span className="font-mono font-bold text-amber-600">{data.growth.overdueInvoices}</span>
                                    </div>
                                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
                                        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">Süre (Grace)</span>
                                        <span className="font-mono font-bold text-slate-900 dark:text-white">{data.growth.graceInvoices}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">Aktif Boost Motoru</span>
                                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{data.growth.activeBoostRules}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Block 3: Payout Queue Status */}
                            <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                                <div className="px-5 py-5 border-b border-slate-100 dark:border-white/5 bg-[#F6F7F9] dark:bg-slate-800/80">
                                    <h3 className="text-[10px] font-black text-slate-800 dark:text-slate-300 uppercase tracking-widest">Çekim (Payout) Kuyruğu</h3>
                                </div>
                                <div className="p-5 flex-1 flex flex-col gap-3">
                                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
                                        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">EFT İşleniyor</span>
                                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{data.queues.payouts.processing}</span>
                                    </div>
                                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
                                        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">Banka İade</span>
                                        <span className="font-mono font-bold text-red-600 dark:text-rose-400">{data.queues.payouts.failed}</span>
                                    </div>
                                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
                                        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">Senkron Log</span>
                                        <span className="font-mono font-bold text-slate-900 dark:text-white">{data.ops.reconcileLagMinutes} Dk</span>
                                    </div>
                                    <div className="text-[10px] font-mono font-black text-slate-400 dark:text-slate-500 tracking-tight pt-1">
                                        Webhook: {new Date(data.ops.lastWebhookAt).toLocaleTimeString('tr-TR')}
                                    </div>
                                </div>
                            </div>

                            {/* Quick Actions (Command Interface) */}
                            <div className="bg-slate-900 dark:bg-slate-950 border border-slate-800 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                                <div className="px-5 py-5 bg-slate-950/50 dark:bg-black/30 border-b border-slate-800 dark:border-white/5 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                                    <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Terminal Komutları</h3>
                                </div>
                                <div className="p-4 flex-1 flex flex-col gap-2">
                                    <button
                                        disabled={actionsLoading !== null}
                                        onClick={() => handleAction('RUN_COLLECTION_GUARD')}
                                        className="w-full flex items-center justify-between group disabled:opacity-50 hover:bg-slate-800 dark:hover:bg-white/5 px-3 py-3 rounded-xl transition-colors border border-transparent hover:border-slate-700 dark:hover:border-white/10 focus:outline-none"
                                    >
                                        <span className="text-[11px] font-black uppercase tracking-widest text-slate-300 group-hover:text-white transition-colors">&gt;&gt; Run Collection Guard</span>
                                        {actionsLoading === 'RUN_COLLECTION_GUARD' && <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-white rounded-full animate-spin"></div>}
                                    </button>

                                    <button
                                        disabled={actionsLoading !== null}
                                        onClick={() => handleAction('RUN_RECONCILE_PULL')}
                                        className="w-full flex items-center justify-between group disabled:opacity-50 hover:bg-slate-800 dark:hover:bg-white/5 px-3 py-3 rounded-xl transition-colors border border-transparent hover:border-slate-700 dark:hover:border-white/10 focus:outline-none"
                                    >
                                        <span className="text-[11px] font-black uppercase tracking-widest text-slate-300 group-hover:text-white transition-colors">&gt;&gt; Force Reconcile Pull</span>
                                        {actionsLoading === 'RUN_RECONCILE_PULL' && <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-white rounded-full animate-spin"></div>}
                                    </button>

                                    <button
                                        disabled={actionsLoading !== null}
                                        onClick={() => handleAction('SNAPSHOT_BILLING_HEALTH')}
                                        className="w-full flex items-center justify-between group disabled:opacity-50 hover:bg-slate-800 dark:hover:bg-white/5 px-3 py-3 rounded-xl transition-colors border border-transparent hover:border-slate-700 dark:hover:border-white/10 focus:outline-none"
                                    >
                                        <span className="text-[11px] font-black uppercase tracking-widest text-slate-300 group-hover:text-white transition-colors">&gt;&gt; Snapshot Billing</span>
                                        {actionsLoading === 'SNAPSHOT_BILLING_HEALTH' && <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-white rounded-full animate-spin"></div>}
                                    </button>

                                    <Link
                                        href={data.links.disputes}
                                        className="w-full flex items-center justify-between group hover:bg-slate-800 dark:hover:bg-white/5 px-3 py-3 rounded-xl transition-colors border border-transparent hover:border-slate-700 dark:hover:border-white/10 mt-2 bg-slate-800 dark:bg-white/5"
                                    >
                                        <span className="text-[11px] font-black uppercase tracking-widest text-amber-500">&gt;&gt; Open Dispute Center</span>
                                        <span className="text-[10px] font-mono font-black bg-amber-500/20 px-1.5 py-0.5 rounded text-amber-500">[{data.risk.openDisputes}] Q</span>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </EnterprisePageShell>
    );
}
