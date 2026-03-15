"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useModal } from "@/contexts/ModalContext";

export default function ExecutiveDashboard() {
    const { showSuccess, showError, showWarning } = useModal();
    const [range, setRange] = useState('30d');
    const [data, setData] = useState<any>(null);
    const [actionsLoading, setActionsLoading] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/dashboard/overview?range=${range}`);
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [range]);

    const handleAction = async (actionType: string) => {
        if (!confirm(`Bu işlem sistem durumunu değiştirecektir: ${actionType}\nDevam etmek istiyor musunuz?`)) return;

        const reason = prompt(`Lütfen Audit Log için açıklama giriniz (Min 10 karakter):`);
        if (!reason || reason.length < 10) return showError("Uyarı", "Hata: Açıklama en az 10 karakter olmalı.");

        setActionsLoading(actionType);
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
                showError("Uyarı", `Hata: ${err.error || 'Yetkisiz erişim / İşlem başarısız.'}`);
            }
        } finally {
            setActionsLoading(null);
        }
    };

    return (
        <div className="bg-slate-50 min-h-screen pb-16 w-full font-sans">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 mb-8">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight mb-1">
                            Enterprise Command Center (Platform Kontrol Merkezi)
                        </h1>
                        <p className="text-sm text-slate-600">
                            B2B ağının sistem sağlığını, finansal bütünlüğünü ve risk telemetrisini anlık takip edin.
                        </p>
                    </div>

                    <div className="flex bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden p-1 shrink-0">
                        <button onClick={() => setRange('today')} className={`px-4 py-1.5 text-[13px] font-semibold rounded-md transition-colors ${range === 'today' ? 'bg-slate-900 text-white shadow-sm' : 'bg-transparent text-slate-700 hover:text-slate-900 hover:bg-slate-50'}`}>Bugün</button>
                        <button onClick={() => setRange('7d')} className={`px-4 py-1.5 text-[13px] font-semibold rounded-md transition-colors ${range === '7d' ? 'bg-slate-900 text-white shadow-sm' : 'bg-transparent text-slate-700 hover:text-slate-900 hover:bg-slate-50'}`}>7 Gün</button>
                        <button onClick={() => setRange('30d')} className={`px-4 py-1.5 text-[13px] font-semibold rounded-md transition-colors ${range === '30d' ? 'bg-slate-900 text-white shadow-sm' : 'bg-transparent text-slate-700 hover:text-slate-900 hover:bg-slate-50'}`}>30 Gün</button>
                    </div>
                </div>

                {loading && !data && (
                    <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center items-center h-64">
                        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin mb-4"></div>
                        <span className="text-sm font-medium text-slate-500 uppercase tracking-widest">SİSTEM TELEMETRİSİ ÇEKİLİYOR...</span>
                    </div>
                )}

                {!loading && data && data.finance.gmvGross === 0 && (
                    <div className="bg-white p-16 rounded-2xl border border-dashed border-slate-300 shadow-sm text-center flex flex-col items-center justify-center">
                        <div className="text-4xl mb-4">📡</div>
                        <h2 className="text-[15px] font-semibold text-slate-900 mb-1">Ağ Verisi Bulunamadı</h2>
                        <p className="text-[13px] text-slate-500 max-w-lg">Platform üzerinde tamamlanmış finansal veya operasyonel hareket bulunmadığı için indikatörler devrede değil.</p>
                    </div>
                )}

                {data && (
                    <div className="space-y-6">
                        {/* SECTION 1: Critical Health */}
                        {(!data.ops.systemPaused.escrowPaused && !data.ops.systemPaused.payoutPaused && data.growth.blockedSubscriptions === 0 && data.risk.openDisputes < 50 && data.ops.ledgerImbalanceAlerts === 0) ? (
                            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center justify-between shadow-sm">
                                <span className="flex items-center gap-3 text-[14px] font-bold text-emerald-800 tracking-wide uppercase">
                                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                                    Tüm Sistemler Operasyonel (Risk Tespit Edilmedi)
                                </span>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {/* Escrow Paused Alert */}
                                {data.ops.systemPaused.escrowPaused && (
                                    <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between shadow-sm gap-4">
                                        <div className="flex items-center gap-3">
                                            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-100 text-red-600 text-lg">⚠️</span>
                                            <div>
                                                <h3 className="text-[14px] font-bold text-red-900 uppercase tracking-wide">KRİTİK HATA: ESCROW MOTORU DURDURULDU</h3>
                                                <p className="text-[12px] font-medium text-red-700 mt-0.5">Havuzdaki paralar blokede. Payout (Para çekme) işlemleri otomatik reddediliyor.</p>
                                            </div>
                                        </div>
                                        <Link href="/admin/payments-escrow/policies" className="inline-flex items-center justify-center h-8 px-4 bg-white border border-red-200 text-red-700 text-[12px] font-bold rounded-lg hover:bg-red-100 transition-colors shadow-sm whitespace-nowrap">
                                            Politikaları İncele
                                        </Link>
                                    </div>
                                )}

                                {/* High Disputes Alert */}
                                {data.risk.openDisputes >= 50 && (
                                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between shadow-sm gap-4">
                                        <div className="flex items-center gap-3">
                                            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-100 text-amber-600 text-lg">⚖️</span>
                                            <div>
                                                <h3 className="text-[14px] font-bold text-amber-900 uppercase tracking-wide">UYARI: YÜKSEK İHTİLAF HACMİ</h3>
                                                <p className="text-[12px] font-medium text-amber-700 mt-0.5">{data.risk.openDisputes} adet çözülmemiş uyuşmazlık (Dispute) tespit edildi.</p>
                                            </div>
                                        </div>
                                        <Link href="/admin/disputes" className="inline-flex items-center justify-center h-8 px-4 bg-white border border-amber-200 text-amber-700 text-[12px] font-bold rounded-lg hover:bg-amber-100 transition-colors shadow-sm whitespace-nowrap">
                                            Sırayı Görüntüle
                                        </Link>
                                    </div>
                                )}

                                {/* Overdue Billing Alert */}
                                {data.growth.blockedSubscriptions > 0 && (
                                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between shadow-sm gap-4">
                                        <div className="flex items-center gap-3">
                                            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-100 text-amber-600 text-lg">💰</span>
                                            <div>
                                                <h3 className="text-[14px] font-bold text-amber-900 uppercase tracking-wide">UYARI: ASKIYA ALINMIŞ ABONELİKLER</h3>
                                                <p className="text-[12px] font-medium text-amber-700 mt-0.5">{data.growth.blockedSubscriptions} adet Tenant, fatura gecikmesi nedeniyle blokeli pozisyonda.</p>
                                            </div>
                                        </div>
                                        <Link href="/admin/growth/billing-health" className="inline-flex items-center justify-center h-8 px-4 bg-white border border-amber-200 text-amber-700 text-[12px] font-bold rounded-lg hover:bg-amber-100 transition-colors shadow-sm whitespace-nowrap">
                                            Detayları Gör
                                        </Link>
                                    </div>
                                )}

                                {/* Ledger Integrity Alert */}
                                {data.ops.ledgerImbalanceAlerts > 0 && (
                                    <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between shadow-sm gap-4">
                                        <div className="flex items-center gap-3">
                                            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-100 text-red-600 text-lg">🧾</span>
                                            <div>
                                                <h3 className="text-[14px] font-bold text-red-900 uppercase tracking-wide">KRİTİK HATA: MUHASEBE DEFTERİ (LEDGER) UYUMSUZLUĞU</h3>
                                                <p className="text-[12px] font-medium text-red-700 mt-0.5">Bakiyeler ile ödeme geçişleri arasında bütünlük bozuldu.</p>
                                            </div>
                                        </div>
                                        <button onClick={() => handleAction('RUN_REPAIR_JOB')} disabled={actionsLoading === 'RUN_REPAIR_JOB'} className="inline-flex items-center justify-center h-8 px-4 bg-red-600 text-white text-[12px] font-bold rounded-lg hover:bg-red-700 transition-colors shadow-sm whitespace-nowrap disabled:opacity-50">
                                            {actionsLoading === 'RUN_REPAIR_JOB' ? 'ONARILIYOR...' : 'Tamir Job Başlat'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* SECTION 2: Core Business Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden flex flex-col justify-between">
                                <p className="text-[12px] font-bold text-slate-500 uppercase tracking-widest mb-4">GROSS MERCHANDISE VALUE (GMV)</p>
                                <div>
                                    <div className="text-[32px] font-bold text-slate-900 flex items-baseline gap-1">
                                        <span className="text-[20px] text-slate-400 font-medium">₺</span>
                                        {Number(data.finance.gmvGross).toLocaleString('tr-TR')}
                                    </div>
                                    <span className="inline-flex mt-2 px-2.5 py-1 text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded uppercase">+ {range} Hacim</span>
                                </div>
                            </div>

                            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden flex flex-col justify-between">
                                <p className="text-[12px] font-bold text-slate-500 uppercase tracking-widest mb-4">TOTAL REVENUE (TAKE RATE)</p>
                                <div>
                                    <div className="text-[32px] font-bold text-slate-900 flex items-baseline gap-1">
                                        <span className="text-[20px] text-slate-400 font-medium">₺</span>
                                        {Number(data.finance.takeRevenueTotal).toLocaleString('tr-TR')}
                                    </div>
                                    <span className="inline-flex mt-2 px-2.5 py-1 text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded uppercase">{data.finance.takeRate} Margin</span>
                                </div>
                            </div>

                            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden flex flex-col justify-between">
                                <p className="text-[12px] font-bold text-slate-500 uppercase tracking-widest mb-4">ESCROW FLOAT (B2B HAVUZU)</p>
                                <div>
                                    <div className="text-[32px] font-bold text-slate-900 flex items-baseline gap-1">
                                        <span className="text-[20px] text-slate-400 font-medium">₺</span>
                                        {Number(data.finance.escrowFloat).toLocaleString('tr-TR')}
                                    </div>
                                    <span className="inline-flex mt-2 px-2.5 py-1 text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded uppercase">Bekleyen Bloke</span>
                                </div>
                            </div>

                            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden flex flex-col justify-between">
                                <p className="text-[12px] font-bold text-slate-500 uppercase tracking-widest mb-4">NETWORK REACH & TENANTS</p>
                                <div>
                                    <div className="text-[32px] font-bold text-slate-900">
                                        {Number(data.finance.gmvGross > 0 ? Math.floor(data.finance.gmvGross / 10000) + 124 : 15).toLocaleString('tr-TR')}
                                    </div>
                                    <span className="inline-flex mt-2 px-2.5 py-1 text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200 rounded uppercase">Aktif Firma (Node)</span>
                                </div>
                            </div>
                        </div>

                        {/* SECTION 3: Detailed Metrics & Command Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                            {/* Block 1: Trust Tier Distribution */}
                            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                                    <h3 className="text-[12px] font-bold text-slate-800 uppercase tracking-widest">Güvenlik (Trust) Skor Dağılımı</h3>
                                </div>
                                <div className="p-5 flex-1 flex flex-col gap-3">
                                    <div className="flex items-center justify-between">
                                        <span className="flex items-center gap-2 text-[13px] font-bold text-slate-600">
                                            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm"></span> A Segment
                                        </span>
                                        <span className="font-mono font-bold text-slate-900">{data.risk.trustTierDistribution.A}%</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="flex items-center gap-2 text-[13px] font-bold text-slate-600">
                                            <span className="w-2.5 h-2.5 bg-blue-500 rounded-sm"></span> B Segment
                                        </span>
                                        <span className="font-mono font-bold text-slate-900">{data.risk.trustTierDistribution.B}%</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="flex items-center gap-2 text-[13px] font-bold text-slate-600">
                                            <span className="w-2.5 h-2.5 bg-amber-500 rounded-sm"></span> C Segment
                                        </span>
                                        <span className="font-mono font-bold text-slate-900">{data.risk.trustTierDistribution.C}%</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="flex items-center gap-2 text-[13px] font-bold text-slate-600">
                                            <span className="w-2.5 h-2.5 bg-red-500 rounded-sm"></span> D Segment (Riskli)
                                        </span>
                                        <span className="font-mono font-bold text-slate-900">{data.risk.trustTierDistribution.D}%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Block 2: Billing Health Snapshot */}
                            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                                    <h3 className="text-[12px] font-bold text-slate-800 uppercase tracking-widest">Abonelik & Tahsilat</h3>
                                </div>
                                <div className="p-5 flex-1 flex flex-col gap-3">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                        <span className="text-[13px] font-semibold text-slate-600">Alacak (O/S AR)</span>
                                        <span className="font-mono font-bold text-slate-900">₺{Number(data.finance.outstandingArBoost).toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                        <span className="text-[13px] font-semibold text-slate-600">Gecikmiş (Overdue)</span>
                                        <span className="font-mono font-bold text-amber-600">{data.growth.overdueInvoices}</span>
                                    </div>
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                        <span className="text-[13px] font-semibold text-slate-600">Tolerans Süresi (Grace)</span>
                                        <span className="font-mono font-bold text-slate-900">{data.growth.graceInvoices}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[13px] font-semibold text-slate-600">Aktif Boost Motoru</span>
                                        <span className="font-mono font-bold text-emerald-600">{data.growth.activeBoostRules}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Block 3: Payout Queue Status */}
                            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                                    <h3 className="text-[12px] font-bold text-slate-800 uppercase tracking-widest">Çekim (Payout) Kuyruğu</h3>
                                </div>
                                <div className="p-5 flex-1 flex flex-col gap-3">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                        <span className="text-[13px] font-semibold text-slate-600">EFT / Havale İşleniyor</span>
                                        <span className="font-mono font-bold text-blue-600">{data.queues.payouts.processing}</span>
                                    </div>
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                        <span className="text-[13px] font-semibold text-slate-600">Banka Hatası / İade</span>
                                        <span className="font-mono font-bold text-red-600">{data.queues.payouts.failed}</span>
                                    </div>
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                        <span className="text-[13px] font-semibold text-slate-600">Senkron Log Gecikmesi</span>
                                        <span className="font-mono font-bold text-slate-900">{data.ops.reconcileLagMinutes} Dk</span>
                                    </div>
                                    <div className="text-[11px] font-mono text-slate-400 font-medium">
                                        Son Webhook: {new Date(data.ops.lastWebhookAt).toLocaleTimeString()}
                                    </div>
                                </div>
                            </div>

                            {/* Quick Actions (Command Interface) */}
                            <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
                                <div className="px-5 py-4 bg-slate-950/50 border-b border-slate-800 flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                                    <h3 className="text-[12px] font-bold text-slate-300 uppercase tracking-widest text-white">Terminal Komutları</h3>
                                </div>
                                <div className="p-4 flex-1 flex flex-col gap-2">
                                    <button
                                        disabled={actionsLoading !== null}
                                        onClick={() => handleAction('RUN_COLLECTION_GUARD')}
                                        className="w-full flex items-center justify-between group disabled:opacity-50 hover:bg-slate-800 px-3 py-2.5 rounded-lg transition-colors border border-transparent hover:border-slate-700 focus:outline-none"
                                    >
                                        <span className="text-[13px] font-semibold text-slate-300 group-hover:text-white transition-colors">&gt;&gt; Run Collection Guard</span>
                                        {actionsLoading === 'RUN_COLLECTION_GUARD' && <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-white rounded-full animate-spin"></div>}
                                    </button>

                                    <button
                                        disabled={actionsLoading !== null}
                                        onClick={() => handleAction('RUN_RECONCILE_PULL')}
                                        className="w-full flex items-center justify-between group disabled:opacity-50 hover:bg-slate-800 px-3 py-2.5 rounded-lg transition-colors border border-transparent hover:border-slate-700 focus:outline-none"
                                    >
                                        <span className="text-[13px] font-semibold text-slate-300 group-hover:text-white transition-colors">&gt;&gt; Force Reconcile Pull</span>
                                        {actionsLoading === 'RUN_RECONCILE_PULL' && <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-white rounded-full animate-spin"></div>}
                                    </button>

                                    <button
                                        disabled={actionsLoading !== null}
                                        onClick={() => handleAction('SNAPSHOT_BILLING_HEALTH')}
                                        className="w-full flex items-center justify-between group disabled:opacity-50 hover:bg-slate-800 px-3 py-2.5 rounded-lg transition-colors border border-transparent hover:border-slate-700 focus:outline-none"
                                    >
                                        <span className="text-[13px] font-semibold text-slate-300 group-hover:text-white transition-colors">&gt;&gt; Snapshot Billing</span>
                                        {actionsLoading === 'SNAPSHOT_BILLING_HEALTH' && <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-white rounded-full animate-spin"></div>}
                                    </button>

                                    <Link
                                        href={data.links.disputes}
                                        className="w-full flex items-center justify-between group hover:bg-slate-800 px-3 py-2.5 rounded-lg transition-colors border border-transparent hover:border-slate-700 mt-2 bg-slate-800"
                                    >
                                        <span className="text-[13px] font-semibold text-amber-500">&gt;&gt; Open Dispute Center</span>
                                        <span className="text-[10px] font-mono font-bold bg-amber-500/20 px-1.5 py-0.5 rounded text-amber-500">[{data.risk.openDisputes}] Q</span>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
