"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function ExecutiveDashboard() {
    const [range, setRange] = useState('today');
    const [data, setData] = useState<any>(null);
    const [actionsLoading, setActionsLoading] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/dashboard/overview?range=${range}`);
            if (res.ok) setData(await res.json());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [range]);

    const handleAction = async (actionType: string) => {
        const reason = prompt(`İşlem Onaylanacak: ${actionType}\nLütfen Audit Log için açıklama (reason) giriniz (Min 10 karakter):`);
        if (!reason || reason.length < 10) return alert("Hata: Açıklama en az 10 karakter olmalı.");

        setActionsLoading(true);
        try {
            const res = await fetch('/api/admin/dashboard/actions', {
                method: "POST",
                headers: { "Content-Type": "application/json", "x-idempotency-key": crypto.randomUUID() },
                body: JSON.stringify({ actionType, reason })
            });

            if (res.ok) {
                const out = await res.json();
                alert(`İşlem Başarılı! OpsSummary: ${JSON.stringify(out.summary)}`);
                fetchData();
            } else {
                const err = await res.json();
                alert(`Hata: ${err.error || 'Yetkisiz erişim / İşlem başarısız.'}`);
            }
        } finally {
            setActionsLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-[1400px] w-full pb-10">
            <div className="flex justify-between items-center border-b pb-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Executive Dashboard</h1>
                    <p className="text-sm text-slate-500 mt-2">Platform Health (Finance, Risk, Growth & Ops) Genel Görünümü.</p>
                </div>

                <div className="flex gap-2 items-center text-sm font-bold">
                    <span className="text-slate-400 font-mono text-xs mr-2">Timezone: Europe/Istanbul</span>
                    <select value={range} onChange={e => setRange(e.target.value)} className="px-3 py-1.5 border rounded bg-white shadow-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="today">Bugün (Today)</option>
                        <option value="7d">Son 7 Gün</option>
                        <option value="30d">Son 30 Gün</option>
                    </select>
                    <button onClick={fetchData} className="px-3 py-1.5 text-blue-600 bg-blue-50 border border-blue-100 rounded shadow-sm hover:bg-blue-100 transition-colors">Yenile</button>
                </div>
            </div>

            {loading && !data && <div className="p-8 text-center font-bold text-slate-400">Yükleniyor...</div>}

            {data && (
                <>
                    {/* section Banners */}
                    <div className="space-y-2">
                        {data.ops.systemPaused.escrowPaused && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded shadow-sm flex items-center justify-between font-bold text-sm">
                                <span>🚨 KRİTİK UYARI: Platform Escrow (Emanet) Sistemi DURDURULDU! Yeni Ödeme ve Parametre Dağıtımları Beklemede.</span>
                                <Link href={data.links.escrowPolicies} className="text-red-900 underline">Policies</Link>
                            </div>
                        )}
                        {(data.ops.finalizeMissingAlerts > 0 || data.ops.ledgerImbalanceAlerts > 0) && (
                            <div className="bg-orange-50 border border-orange-200 text-orange-800 px-4 py-3 rounded shadow-sm flex justify-between font-bold text-sm">
                                <span>⚙️ OPS UYARISI: Ledger Imbalance veya Finalize eksikleri tespit edildi.</span>
                                <button onClick={() => handleAction('RUN_REPAIR_JOB')} className="underline">Onarım Tetikle</button>
                            </div>
                        )}
                    </div>

                    {/* section KPI's */}
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <div className="bg-white p-4 border rounded shadow-sm flex flex-col justify-between h-32">
                            <div className="text-[10px] font-bold text-slate-500 uppercase">GMV (Brüt Hacim)</div>
                            <div>
                                <div className="text-2xl font-bold font-mono text-slate-800">
                                    {Number(data.finance.gmvGross).toLocaleString()} ₺
                                </div>
                                <div className="text-[10px] text-slate-400 mt-1">{range} Hacmi</div>
                            </div>
                        </div>
                        <div className="bg-emerald-50 border-emerald-100 p-4 border rounded shadow-sm flex flex-col justify-between h-32">
                            <div className="text-[10px] font-bold text-emerald-600 uppercase">Take Revenue Toplamı</div>
                            <div>
                                <div className="text-2xl font-bold font-mono text-emerald-800">
                                    {Number(data.finance.takeRevenueTotal).toLocaleString()} ₺
                                </div>
                                <div className="text-[10px] text-emerald-600/70 mt-1">Komisyon + Boost Oranı: {data.finance.takeRate}</div>
                            </div>
                        </div>
                        <div className="bg-slate-900 border-black p-4 border rounded shadow-sm flex flex-col justify-between h-32 text-white">
                            <div className="text-[10px] font-bold text-slate-400 uppercase">Havuzdaki Bakiye (Escrow)</div>
                            <div>
                                <div className="text-xl font-bold font-mono text-blue-400">
                                    {Number(data.finance.escrowFloat).toLocaleString()} ₺
                                </div>
                                <div className="text-[10px] mt-1 text-slate-500">Açık/Release Edilmemiş</div>
                            </div>
                        </div>
                        <div className="bg-white border p-4 rounded shadow-sm flex flex-col justify-between h-32">
                            <div className="text-[10px] font-bold text-blue-600 uppercase">Uyuşmazlıklar (Dispute)</div>
                            <div>
                                <div className="text-2xl font-bold font-mono text-blue-800">
                                    {data.risk.openDisputes}
                                </div>
                                <div className="text-[10px] mt-1 text-slate-500">
                                    {data.queues.disputes.needsInfo} Bilgi Bekliyor
                                </div>
                            </div>
                        </div>
                        <div className="bg-white border p-4 rounded shadow-sm flex flex-col justify-between h-32 ring-1 ring-amber-400 relative overflow-hidden">
                            <div className="text-[10px] font-bold text-amber-600 uppercase relative z-10">Tahsilat Gecikmesi (AR)</div>
                            <div className="relative z-10">
                                <div className="text-xl font-bold font-mono text-amber-800">
                                    {Number(data.finance.outstandingArBoost).toLocaleString()} ₺
                                </div>
                                <div className="text-[10px] mt-1 text-amber-600">
                                    {data.growth.overdueInvoices} Fatura Overdue
                                </div>
                            </div>
                        </div>
                        <div className="bg-white border p-4 rounded shadow-sm flex flex-col justify-between h-32">
                            <div className="text-[10px] font-bold text-purple-600 uppercase">Ops & Payout State</div>
                            <div>
                                <div className="text-lg font-bold font-mono text-purple-800">
                                    {data.queues.payouts.failed} Başarısız
                                </div>
                                <div className="text-[10px] mt-1 text-slate-500 font-mono">
                                    Lag: {data.ops.reconcileLagMinutes}dk
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* RISK & DISPUTES */}
                        <div className="bg-white border rounded-lg shadow-sm">
                            <div className="px-4 py-3 border-b flex justify-between items-center bg-slate-50 rounded-t-lg">
                                <h3 className="text-sm font-bold text-slate-800 uppercase">Risk İzleme Özet</h3>
                                <Link href={data.links.disputes} className="text-[10px] text-blue-600 font-bold hover:underline">TÜMÜ &rarr;</Link>
                            </div>
                            <div className="p-4 space-y-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500">Açık Anlaşmazlıklar</span>
                                    <span className="font-bold text-slate-800">{data.risk.openDisputes}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500">Ek Bilgi Beklenen (Needs Info)</span>
                                    <span className="font-bold text-amber-600">{data.risk.disputesNeedingInfo}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500">Blokeli Para/Emanet (Held)</span>
                                    <span className="font-bold text-red-600">{data.risk.heldEscrowCount} İşlem</span>
                                </div>
                                <div className="pt-4 mt-2 border-t">
                                    <h4 className="text-[10px] text-slate-400 font-bold uppercase mb-2">Seller Trust Dağılımı</h4>
                                    <div className="flex gap-2 w-full h-2 rounded-full overflow-hidden">
                                        <div className="bg-emerald-500 h-full" style={{ width: `${data.risk.trustTierDistribution.A}%` }}></div>
                                        <div className="bg-blue-400 h-full" style={{ width: `${data.risk.trustTierDistribution.B}%` }}></div>
                                        <div className="bg-amber-400 h-full" style={{ width: `${data.risk.trustTierDistribution.C}%` }}></div>
                                        <div className="bg-red-500 h-full" style={{ width: `${data.risk.trustTierDistribution.D}%` }}></div>
                                    </div>
                                    <div className="flex justify-between text-[8px] text-slate-500 font-bold mt-1 uppercase">
                                        <span>A {data.risk.trustTierDistribution.A}%</span>
                                        <span>B {data.risk.trustTierDistribution.B}%</span>
                                        <span>C {data.risk.trustTierDistribution.C}%</span>
                                        <span>D {data.risk.trustTierDistribution.D}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* GROWTH & BILLING */}
                        <div className="bg-white border rounded-lg shadow-sm">
                            <div className="px-4 py-3 border-b flex justify-between items-center bg-slate-50 rounded-t-lg">
                                <h3 className="text-sm font-bold text-slate-800 uppercase">Growth & Billing</h3>
                                <Link href={data.links.billingHealth} className="text-[10px] text-blue-600 font-bold hover:underline">DETAYLAR &rarr;</Link>
                            </div>
                            <div className="p-4 space-y-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500">Aktif Boost Kuralları</span>
                                    <span className="font-bold font-mono text-blue-600 px-2 py-0.5 bg-blue-50 rounded">{data.growth.activeBoostRules} Kural</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Blokeli Hub Abonelikleri</span>
                                    <span className="font-bold text-red-600">{data.growth.blockedSubscriptions}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400"></span> Ödemesi Gecikmiş Fatura</span>
                                    <span className="font-bold text-orange-600">{data.growth.overdueInvoices}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-200"></span> Ekstra Tolerans Süresinde</span>
                                    <span className="font-bold text-amber-600">{data.growth.graceInvoices}</span>
                                </div>
                            </div>
                        </div>

                        {/* QUICK ACTIONS */}
                        <div className="bg-slate-900 border-black rounded-lg shadow-sm text-white">
                            <div className="px-4 py-3 border-b border-slate-700 flex justify-between items-center rounded-t-lg">
                                <h3 className="text-sm font-bold text-slate-300 uppercase">Hızlı Aksiyonlar</h3>
                                <span className="text-[10px] text-emerald-400 font-mono tracking-widest">IDEMPOTENT</span>
                            </div>
                            <div className="p-4 grid grid-cols-2 gap-3">
                                <button disabled={actionsLoading} onClick={() => handleAction('RUN_COLLECTION_GUARD')} className="text-left p-3 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors disabled:opacity-50">
                                    <div className="text-[10px] font-bold text-blue-400 mb-1">Growth Ops</div>
                                    <div className="text-xs font-bold w-full leading-tight">Billing Guard Çalıştır (Gecikme Temsili)</div>
                                </button>
                                <button disabled={actionsLoading} onClick={() => handleAction('SNAPSHOT_BILLING_HEALTH')} className="text-left p-3 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors disabled:opacity-50">
                                    <div className="text-[10px] font-bold text-blue-400 mb-1">Finance</div>
                                    <div className="text-xs font-bold w-full leading-tight">Billing Health Snapshot Kaydet</div>
                                </button>
                                <button disabled={actionsLoading} onClick={() => handleAction('RUN_RECONCILE_PULL')} className="text-left p-3 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors disabled:opacity-50">
                                    <div className="text-[10px] font-bold text-emerald-400 mb-1">Escrow/Payout</div>
                                    <div className="text-xs font-bold w-full leading-tight">Reconciliation Pull Zorla</div>
                                </button>
                                <button disabled={actionsLoading} onClick={() => handleAction('RUN_OUTBOX_RETRY')} className="text-left p-3 rounded bg-slate-800 text-red-200 hover:bg-slate-700 border border-red-900 transition-colors disabled:opacity-50">
                                    <div className="text-[10px] font-bold text-red-500 mb-1">System Ops</div>
                                    <div className="text-xs font-bold w-full leading-tight">Stuck Outbox (Asenkron) Kuyruğu İttir</div>
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
