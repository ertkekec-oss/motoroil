"use client";
import React, { useState, useEffect } from "react";

export default function AdminGrowthBillingHealth() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [saving, setSaving] = useState(false);

    useEffect(() => { fetchHealth(filter); }, [filter]);

    const fetchHealth = async (bucket: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/growth/billing-health?bucket=${bucket}`);
            if (res.ok) {
                setData(await res.json());
            }
        } finally { setLoading(false); }
    };

    const handleAction = async (action: 'run-collection-guard' | 'snapshot') => {
        const confirmMsg = action === 'run-collection-guard'
            ? 'Bu işlem Collection Guard (Tahsilat Koruyucu) altyapısını manuel çalıştırır (gecikmişleri kilitleyebilir).'
            : 'Mali tabloyu (Outstanding AR) BUGÜN itibarıyla finans denetimi için dondur (Snapshot)';
        if (!window.confirm(confirmMsg + '\n\nDEVAM EDILSIN MI?')) return;

        const reason = prompt("İşlem Sebebi (Audit Log için zorunlu):");
        if (!reason || reason.length < 5) return alert("Sebep en az 5 karakter girmelisiniz.");

        setSaving(true);
        try {
            const res = await fetch(`/api/admin/growth/billing-health/${action}`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "x-idempotency-key": crypto.randomUUID() },
                body: JSON.stringify({ reason })
            });
            if (res.ok) {
                const out = await res.json();
                alert(`İşlem Başarılı. OpsLog'a kaydedildi.\n\nSonuç: ${JSON.stringify(out.result)}`);
                fetchHealth(filter);
            } else {
                const err = await res.json();
                alert(`Hata: ${err.error}`);
            }
        } finally { setSaving(false); }
    };

    if (loading && !data) return <div className="p-8">Yükleniyor...</div>;

    return (
        <div className="space-y-6 max-w-7xl pb-10">
            <div className="flex justify-between items-center border-b pb-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Mali AR & Billing Health</h1>
                    <p className="text-sm text-slate-500 mt-2">Boost Hub ve Ekstra Servis faturalandırmalarının finansal durumu (Alacaklar/Tahsilat)</p>
                </div>
                <div className="flex gap-2">
                    <button disabled={saving} onClick={() => handleAction('snapshot')} className="px-3 py-1.5 text-xs font-bold bg-white text-slate-700 border rounded shadow-sm hover:bg-slate-50 disabled:opacity-50">
                        📸 Snapshot Al
                    </button>
                    <button disabled={saving} onClick={() => handleAction('run-collection-guard')} className="px-3 py-1.5 text-xs font-bold bg-slate-900 text-white rounded shadow hover:bg-black disabled:opacity-50">
                        🛡 Guard Motorunu Çalıştır
                    </button>
                </div>
            </div>

            {data && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="bg-white p-4 items-center justify-between border rounded shadow-sm flex flex-col items-start bg-slate-900 text-white">
                        <div className="text-[10px] font-bold text-slate-400 capitalize w-full">Askıdaki Tahsilat Toplamı (AR)</div>
                        <div className="text-2xl font-bold mt-1 max-w-full text-emerald-400 self-start">
                            {Number(data.kpis.outstandingArTotal).toLocaleString('tr-TR')} TRY
                        </div>
                    </div>
                    <div className="bg-white p-4 border rounded shadow-sm">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Açık Fatura</div>
                        <div className="text-2xl font-bold text-slate-800 mt-1">{data.kpis.currentCount} Adet</div>
                    </div>
                    <div className="bg-white p-4 border rounded shadow-sm">
                        <div className="text-[10px] font-bold text-amber-500 uppercase">Ekstra Tolere (Grace)</div>
                        <div className="text-2xl font-bold text-amber-600 mt-1">{data.kpis.graceCount} Adet</div>
                    </div>
                    <div className="bg-white p-4 border rounded shadow-sm ring-1 ring-red-500">
                        <div className="text-[10px] font-bold text-red-500 uppercase flex items-center gap-1">Gecikmiş (Overdue)</div>
                        <div className="text-2xl font-bold text-red-600 mt-1">{data.kpis.overdueCount} Adet</div>
                    </div>
                    <div className="bg-white p-4 border rounded shadow-sm bg-red-50">
                        <div className="text-[10px] font-bold text-red-800 uppercase">Blokeli (Suspended) Abonelikler</div>
                        <div className="text-2xl font-bold text-red-800 mt-1">{data.kpis.blockedSubscriptionsCount} Adet</div>
                    </div>
                </div>
            )}

            <div className="flex gap-2">
                {[
                    { label: 'Tümü', val: 'all' },
                    { label: 'Güncel (Current)', val: 'current' },
                    { label: 'Tolerans (Grace)', val: 'grace' },
                    { label: 'Gecikmiş (Overdue)', val: 'overdue' },
                    { label: 'Açılmayı Bekleyen (Blocked)', val: 'blocked' }
                ].map(f => (
                    <button key={f.val} onClick={() => setFilter(f.val)} className={`px-4 py-2 text-xs font-bold rounded shadow-sm border ${filter === f.val ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
                        {f.label}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full text-left font-inter table-auto">
                    <thead className="bg-slate-50 border-b text-xs uppercase text-slate-500 font-bold">
                        <tr>
                            <th className="p-4">Tenant / Fatura ID</th>
                            <th className="p-4 text-right">Fatura Tutarı</th>
                            <th className="p-4">Durum (Collection)</th>
                            <th className="p-4">Son Ödeme Zamanı</th>
                            <th className="p-4">Bloke Riski</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y text-sm">
                        {data?.tenants.map((t: any) => (
                            <tr key={t.invoiceId} className="hover:bg-slate-50">
                                <td className="p-4">
                                    <div className="font-bold text-slate-800 font-mono text-xs">{t.tenantId}</div>
                                    <div className="font-mono text-[10px] text-slate-400 mt-1">Inv: {t.invoiceId.substring(0, 8)}...</div>
                                </td>
                                <td className="p-4 font-bold text-slate-700 text-right">
                                    {Number(t.amount).toLocaleString('tr-TR')} TRY
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${t.status === 'COLLECTION_BLOCKED' ? 'bg-slate-800 text-white' :
                                            t.status === 'OVERDUE' ? 'bg-red-100 text-red-800' :
                                                t.status === 'GRACE' ? 'bg-amber-100 text-amber-800' :
                                                    'bg-emerald-100 text-emerald-800'
                                        }`}>
                                        {t.status}
                                    </span>
                                </td>
                                <td className="p-4 text-xs font-mono text-slate-500">
                                    {t.overdueSince ? new Date(t.overdueSince).toLocaleString() : 'Belirsiz'}
                                </td>
                                <td className="p-4 text-xs font-bold">
                                    {t.billingBlocked ? (
                                        <span className="text-red-600 flex items-center gap-1">🔒 Sistem Zaten Bloke Edilmiş</span>
                                    ) : (
                                        <span className={t.status === 'OVERDUE' ? 'text-amber-600' : 'text-slate-400'}>
                                            {t.status === 'OVERDUE' ? 'Bloke edilebilir (SLA > 15G)' : 'Güvende'}
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {data?.tenants.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-500">Bu filtrelere uygun fatura bulunmuyor.</td></tr>}
                    </tbody>
                </table>
            </div>

        </div>
    );
}
