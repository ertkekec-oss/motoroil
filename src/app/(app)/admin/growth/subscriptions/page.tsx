"use client";
import React, { useState, useEffect } from "react";

export default function AdminGrowthSubscriptions() {
    const [subs, setSubs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => { fetchSubs(); }, []);

    const fetchSubs = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/growth/subscriptions`);
            if (res.ok) {
                const data = await res.json();
                setSubs(data.items || []);
            }
        } finally { setLoading(false); }
    };

    const handleAction = async (id: string, action: string) => {
        const confirmMsg = `Bu işlem YAPILACAKTIR: Abonelik ${action} (Mali Denetime Bildirilecektir). Devam edilsin mi?`;
        if (!window.confirm(confirmMsg)) return;

        const reason = prompt("İptal / Askı / Kilit Açma sebebi (Audit Log):");
        if (!reason || reason.length < 5) return alert("Sebep en az 5 karakter girmelisiniz.");

        setSaving(true);
        try {
            const res = await fetch(`/api/admin/growth/subscriptions/${id}/${action}`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "x-idempotency-key": crypto.randomUUID() },
                body: JSON.stringify({ reason })
            });
            if (res.ok) {
                alert("Başarılı");
                fetchSubs();
            } else {
                const err = await res.json();
                alert(`Hata: ${err.error}`);
            }
        } finally { setSaving(false); }
    };

    return (
        <div className="space-y-6 max-w-7xl pb-10">
            <div className="flex justify-between items-center border-b pb-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Boost Hub Abonelikleri</h1>
                    <p className="text-sm text-slate-500 mt-2">Finansal dondurma (billingBlocked) durumları ve hak (quota) yönetimi.</p>
                </div>
                <button onClick={fetchSubs} className="px-3 py-1.5 text-xs text-slate-600 bg-white border rounded shadow-sm hover:bg-slate-50 font-bold">Yenile</button>
            </div>

            {loading ? <div className="p-8 text-center text-slate-500">Yükleniyor...</div> : (
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <table className="w-full text-left font-inter table-auto">
                        <thead className="bg-slate-50 border-b text-xs uppercase text-slate-500 font-bold">
                            <tr>
                                <th className="p-4">Firma (Tenant) / Sub ID</th>
                                <th className="p-4">Trust Tier</th>
                                <th className="p-4">Tüketim Limitleri</th>
                                <th className="p-4">Billing Durumu</th>
                                <th className="p-4">Son Fatura (Invoice) Durumu</th>
                                <th className="p-4 text-right">Aksiyon (Finans/Risk)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-sm">
                            {subs.map(s => (
                                <tr key={s.subscriptionId} className="hover:bg-slate-50">
                                    <td className="p-4">
                                        <div className="font-mono font-bold text-slate-800 text-xs">{s.tenantId}</div>
                                        <div className="font-mono text-[10px] text-slate-400 mt-1">S: {s.subscriptionId.substring(0, 8)}...</div>
                                    </td>
                                    <td className="p-4 font-bold text-blue-600">{s.trustTier}</td>
                                    <td className="p-4">
                                        <div className="w-full bg-slate-200 rounded-full h-1.5 mb-1 dark:bg-slate-700">
                                            <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${Math.min((s.quotaUsed / s.quotaTotal) * 100, 100)}%` }}></div>
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-500">{s.quotaUsed}/{s.quotaTotal} Hak Gösterilmiş</span>
                                    </td>
                                    <td className="p-4">
                                        {s.billingBlocked ? (
                                            <span className="bg-red-100 text-red-800 font-bold px-2 py-1 rounded text-xs flex items-center gap-1 w-max">
                                                <span>🔒 ÖDEME NEDENİYLE KİLİTLENDİ</span>
                                            </span>
                                        ) : (
                                            <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-1 rounded text-xs">
                                                AÇIK
                                            </span>
                                        )}
                                        <div className="text-[10px] text-slate-500 mt-1 font-mono">Plan Durumu: {s.status}</div>
                                    </td>
                                    <td className="p-4 font-mono text-xs">
                                        <span className={`font-bold ${s.lastInvoiceStatus === 'OVERDUE' ? 'text-red-600' :
                                                s.lastInvoiceStatus === 'COLLECTION_BLOCKED' ? 'text-slate-800 bg-slate-200 px-1 rounded' :
                                                    s.lastInvoiceStatus === 'GRACE' ? 'text-amber-600' : 'text-slate-500'
                                            }`}>
                                            {s.lastInvoiceStatus || 'YOK'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        {s.billingBlocked && (
                                            <button disabled={saving} onClick={() => handleAction(s.subscriptionId, 'unblock')} className="px-3 py-1.5 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 font-bold text-xs rounded border border-yellow-200 disabled:opacity-50">
                                                Kilidi Kaldır (Unblock)
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {subs.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-500">Sistemde abonelik bulunamadı veya henüz fatura döngüsü başlamadı.</td></tr>}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
