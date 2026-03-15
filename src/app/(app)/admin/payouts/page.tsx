"use client";
import React, { useState, useEffect } from "react";
import { useModal } from "@/contexts/ModalContext";

export default function PayoutsPage() {
    const { showSuccess, showError, showWarning, showConfirm, showPrompt } = useModal();
    const [reqs, setReqs] = useState<any[]>([]);
    const [kpis, setKpis] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');
    const [actioning, setActioning] = useState<string | null>(null);

    useEffect(() => { fetchReqs(filter); }, [filter]);

    const fetchReqs = async (status: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/payouts/queue?status=${status}`);
            if (res.ok) {
                const data = await res.json();
                setReqs(data.items || []);
                setKpis(data.kpis);
            }
        } finally { setLoading(false); }
    };

    const handleAction = (id: string, action: 'approve' | 'reject') => {
        if (action === 'reject') {
            showPrompt(
                "Reddetme Gerekçesi",
                "Lütfen bu ödeme talebini reddetme veya iptal etme sebebinizi giriniz (Min 5 karakter):",
                async (reason) => {
                    if (!reason || reason.length < 5) {
                        showWarning("Uyarı", "Lütfen geçerli bir sebep giriniz (En az 5 karakter).");
                        return;
                    }
                    await executeAction(id, action, reason);
                }
            );
        } else {
            showConfirm(
                "Transfer Onayı",
                "Tutar transferi IYZICO banka hesaplarına iletilecektir. Emin misiniz?",
                async () => {
                    await executeAction(id, action, "Otomatik Onay");
                }
            );
        }
    };

    const executeAction = async (id: string, action: string, reason: string) => {
        setActioning(id);
        try {
            const res = await fetch(`/api/admin/payouts/queue/${id}/${action}`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "x-idempotency-key": crypto.randomUUID() },
                body: JSON.stringify({ reason })
            });

            if (res.ok) {
                showSuccess("Bilgi", `İşlem Başarılı: ${action === 'approve' ? 'Onaylandı' : 'Reddedildi'}`);
                fetchReqs(filter);
            } else {
                const err = await res.json();
                showError("Hata", `Hata: ${err.error || 'İşlem başarısız oldu.'}`);
            }
        } finally { setActioning(null); }
    };

    return (
        <div className="space-y-6 max-w-7xl pb-10 font-inter">
            <div className="flex justify-between items-center border-b pb-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">💸 Payout (Satıcı Hakediş) Kontrolü</h1>
                    <p className="text-sm text-slate-500 mt-2">B2B ağındaki satıcıların kazançlarının cüzdanlarına veya Iyzico sub-merchant IBAN hesaplarına transfer sırası.</p>
                </div>
                <button onClick={() => fetchReqs(filter)} className="px-3 py-1.5 text-xs font-bold bg-white text-slate-700 border rounded shadow-sm hover:bg-slate-50">Yenile</button>
            </div>

            {kpis && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 border rounded shadow-sm flex flex-col justify-between">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Onay Bekleyenler (REQUESTED)</div>
                        <div className="text-2xl font-bold text-slate-800 mt-2">{kpis.requested} İşlem</div>
                    </div>
                    <div className="bg-blue-50 border-blue-100 p-4 border rounded shadow-sm">
                        <div className="text-[10px] font-bold text-blue-600 uppercase">İşleniyor (PROCESSING)</div>
                        <div className="text-2xl font-bold text-blue-800 mt-2">{kpis.processing} İşlem</div>
                    </div>
                    <div className="bg-emerald-50 border-emerald-100 p-4 border rounded shadow-sm">
                        <div className="text-[10px] font-bold text-emerald-600 uppercase">Bugün Başarılı Transfer Tutarı</div>
                        <div className="text-2xl font-bold font-mono text-emerald-800 mt-2">{Number(kpis.processedToday).toLocaleString()} TRY</div>
                    </div>
                    <div className="bg-red-50 border-red-100 p-4 border rounded shadow-sm">
                        <div className="text-[10px] font-bold text-red-600 uppercase">Bloklanan / Hatalı (FAILED)</div>
                        <div className="text-2xl font-bold text-red-800 mt-2">{kpis.failed} İşlem</div>
                    </div>
                </div>
            )}

            <div className="flex gap-2 mb-4">
                {['ALL', 'REQUESTED', 'APPROVED', 'PROCESSING', 'PAID_INTERNAL', 'FAILED', 'REJECTED']?.map(f => (
                    <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 text-[10px] border shadow-sm font-bold rounded uppercase ${filter === f ? 'bg-slate-900 text-white border-black' : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'}`}>
                        {f === 'ALL' ? 'TÜMÜ' : f}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full text-left table-auto">
                    <thead className="bg-slate-50 border-b text-[10px] uppercase text-slate-500 font-bold tracking-wider">
                        <tr>
                            <th className="p-4">Talep Zamanı / ID</th>
                            <th className="p-4">Firma (Seller ID)</th>
                            <th className="p-4">Hedef (IBAN/Wallet)</th>
                            <th className="p-4 text-right">Tutar</th>
                            <th className="p-4">Statü</th>
                            <th className="p-4 text-right">Aksiyon</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y text-xs">
                        {loading && reqs.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-400 font-bold">Yükleniyor...</td></tr>}
                        {!loading && reqs.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-400 font-bold">Kayıt Bulunamadı.</td></tr>}

                        {reqs?.map(r => (
                            <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-4">
                                    <div className="font-mono text-slate-800">{new Date(r.requestedAt).toLocaleString()}</div>
                                    <div className="font-mono text-[9px] text-slate-400 mt-1 uppercase">ID: {r.id.split('-')[0]}</div>
                                </td>
                                <td className="p-4 font-mono font-bold text-slate-700">{r.sellerTenantId}</td>
                                <td className="p-4">
                                    {r.destination ? (
                                        <div className="text-slate-600 font-mono">
                                            {r.destination.type} {r.destination.ibanHash ? `(Mask: ***${r.destination.ibanHash.slice(-4)})` : ''}
                                        </div>
                                    ) : <span className="text-slate-400">Varsayılan Cüzdan</span>}
                                </td>
                                <td className="p-4 text-right font-mono font-bold text-emerald-600 text-sm">
                                    {Number(r.amount).toLocaleString('tr-TR')} {r.currency}
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${r.status === 'REQUESTED' ? 'bg-amber-100 text-amber-800' :
                                            r.status === 'APPROVED' ? 'bg-blue-100 text-blue-800' :
                                                r.status === 'PAID_INTERNAL' ? 'bg-emerald-100 text-emerald-800' :
                                                    r.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                                                        r.status === 'REJECTED' ? 'bg-slate-200 text-slate-800' :
                                                            'bg-slate-100 text-slate-600'
                                        }`}>
                                        {r.status}
                                    </span>
                                    {r.failureMessage && <div className="text-[9px] text-red-500 mt-1 max-w-[150px] truncate" title={r.failureMessage}>{r.failureMessage}</div>}
                                </td>
                                <td className="p-4 text-right space-x-2">
                                    {r.status === 'REQUESTED' && (
                                        <>
                                            <button disabled={actioning === r.id} onClick={() => handleAction(r.id, 'reject')} className="px-2 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded text-[10px] font-bold border border-red-200 transition-colors disabled:opacity-50">RED</button>
                                            <button disabled={actioning === r.id} onClick={() => handleAction(r.id, 'approve')} className="px-2 py-1 bg-emerald-500 text-white hover:bg-emerald-600 rounded text-[10px] font-bold border border-emerald-600 transition-colors disabled:opacity-50">ONAYLA</button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
