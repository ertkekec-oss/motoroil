"use client";
import React, { useState, useEffect } from "react";

export default function AdminBoostRules() {
    const [rules, setRules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form state
    const [targetType, setTargetType] = useState('GLOBAL');
    const [targetId, setTargetId] = useState('');
    const [multiplier, setMultiplier] = useState(1.5);
    const [maxImp, setMaxImp] = useState('');
    const [startsAt, setStartsAt] = useState('');
    const [endsAt, setEndsAt] = useState('');
    const [reason, setReason] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => { fetchRules(); }, []);

    const fetchRules = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/growth/boost-rules`);
            if (res.ok) {
                const data = await res.json();
                setRules(data.rules || []);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/growth/boost-rules`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "x-idempotency-key": crypto.randomUUID() },
                body: JSON.stringify({
                    targetType,
                    targetId: targetId || undefined,
                    multiplier: Number(multiplier),
                    maxImpressionsPerDay: maxImp ? parseInt(maxImp) : undefined,
                    startsAt: new Date(startsAt).toISOString(),
                    endsAt: new Date(endsAt).toISOString(),
                    reason
                })
            });

            if (res.ok) {
                alert("Kural başarıyla oluşturuldu.");
                setShowModal(false);
                fetchRules();
            } else {
                const err = await res.json();
                alert(`Hata: ${err.error}`);
            }
        } finally {
            setSaving(false);
        }
    };

    const handleAction = async (id: string, action: 'disable' | 'expire-now') => {
        const r = prompt("İşlem nedenini giriniz (Audit log için Zorunlu):");
        if (!r || r.length < 5) return alert("Geçerli bir sebep girilmeli (min 5 karakter).");

        try {
            const res = await fetch(`/api/admin/growth/boost-rules/${id}/${action}`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "x-idempotency-key": crypto.randomUUID() },
                body: JSON.stringify({ reason: r })
            });
            if (res.ok) {
                fetchRules();
            } else {
                const err = await res.json();
                alert(`Hata: ${err.error}`);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const stats = {
        active: rules.filter((r) => r.status === 'ACTIVE').length,
        scheduled: rules.filter((r) => r.status === 'SCHEDULED').length,
        disabled: rules.filter((r) => r.status === 'DISABLED').length,
    };

    return (
        <div className="space-y-6 max-w-7xl pb-10">
            <div className="flex justify-between items-center border-b pb-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Boost Engine Rules (Gösterim Artırıcı)</h1>
                    <p className="text-sm text-slate-500 mt-2">Kategori, listeleme veya satıcı bazlı suni görünürlük çarpanı yönetimi.</p>
                </div>
                <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-blue-600 text-white font-bold rounded shadow hover:bg-blue-700">
                    + Yeni Kural Ekle
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 border rounded shadow-sm">
                    <div className="text-xs font-bold text-slate-400">AKTİF (ACTIVE)</div>
                    <div className="text-2xl font-bold text-blue-600 mt-1">{stats.active} Kural</div>
                </div>
                <div className="bg-white p-4 border rounded shadow-sm">
                    <div className="text-xs font-bold text-slate-400">PLANLI (SCHEDULED)</div>
                    <div className="text-2xl font-bold text-amber-600 mt-1">{stats.scheduled} Kural</div>
                </div>
                <div className="bg-white p-4 border rounded shadow-sm">
                    <div className="text-xs font-bold text-slate-400">PASİFE ALINANLAR</div>
                    <div className="text-2xl font-bold text-slate-600 mt-1">{stats.disabled} Kural</div>
                </div>
            </div>

            {loading ? <div className="p-8 text-center text-slate-500">Yükleniyor...</div> : (
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <table className="w-full text-left font-inter table-auto">
                        <thead className="bg-slate-50 border-b text-xs uppercase text-slate-500 font-bold">
                            <tr>
                                <th className="p-4">Tip / Hedef</th>
                                <th className="p-4">Çarpan (Multiplier)</th>
                                <th className="p-4">Günlük Limit</th>
                                <th className="p-4">Tarih Aralığı</th>
                                <th className="p-4">Durum</th>
                                <th className="p-4 text-right">Aksiyon</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-sm">
                            {rules.map(r => (
                                <tr key={r.id} className="hover:bg-slate-50">
                                    <td className="p-4">
                                        <div className="font-bold text-slate-800">{r.targetType}</div>
                                        <div className="font-mono text-xs text-slate-500">{r.targetId || 'GLOBAL'}</div>
                                    </td>
                                    <td className="p-4 font-bold text-emerald-600">x{r.multiplier}</td>
                                    <td className="p-4 text-slate-500">{r.maxImpressionsPerDay || 'Limitsiz'}</td>
                                    <td className="p-4 text-xs font-mono text-slate-500">
                                        {new Date(r.startsAt).toLocaleDateString()} - <br />{new Date(r.endsAt).toLocaleDateString()}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${r.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' :
                                                r.status === 'SCHEDULED' ? 'bg-amber-100 text-amber-800' :
                                                    r.status === 'EXPIRED' ? 'bg-slate-200 text-slate-600' :
                                                        'bg-red-100 text-red-800'
                                            }`}>
                                            {r.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right space-x-2">
                                        {(r.status === 'ACTIVE' || r.status === 'SCHEDULED') && (
                                            <>
                                                <button onClick={() => handleAction(r.id, 'expire-now')} className="text-xs font-bold text-amber-600 hover:text-amber-800 px-2 py-1 border rounded bg-white shadow-sm">Erken Bitir</button>
                                                <button onClick={() => handleAction(r.id, 'disable')} className="text-xs font-bold text-red-600 hover:text-red-800 px-2 py-1 border rounded bg-white shadow-sm">İptal/Kapat</button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg border">
                        <h2 className="text-lg font-bold text-slate-800 mb-4">Yeni Boost Kuralı Ekle</h2>

                        {(targetType === 'SELLER') && (
                            <div className="mb-4 bg-blue-50 border border-blue-200 p-3 rounded text-xs text-blue-800 font-medium">
                                Bilgi: Hedef satıcı "D" (Riskli) tier grubunda ise, sistem otomatik olarak bu çarpan etkisini (x1.0) olarak dengeleyecektir (Platform İlkesi). Yalnızca etiket sponsoru olarak görünür.
                            </div>
                        )}

                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Hedef Tipi</label>
                                    <select required value={targetType} onChange={e => setTargetType(e.target.value)} className="w-full p-2 border rounded text-sm bg-slate-50">
                                        <option value="GLOBAL">GLOBAL (Tüm Sistem)</option>
                                        <option value="CATEGORY">KATEGORİ (Category)</option>
                                        <option value="LISTING">LİSTELEME (Listing/Ürün)</option>
                                        <option value="SELLER">SATICI (Tenant)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Hedef ID {targetType !== 'GLOBAL' && <span className="text-red-500">*</span>}</label>
                                    <input disabled={targetType === 'GLOBAL'} required={targetType !== 'GLOBAL'} type="text" value={targetId} onChange={e => setTargetId(e.target.value)} className="w-full p-2 border rounded text-sm bg-slate-50 disabled:bg-slate-200" placeholder="UUID giriniz" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Boost Çarpanı (Max: 3.0)</label>
                                    <input required type="number" step="0.1" min="1.0" max="3.0" value={multiplier} onChange={e => setMultiplier(Number(e.target.value))} className="w-full p-2 border rounded text-sm bg-slate-50" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Max Günlük Gösterim (Limit)</label>
                                    <input type="number" value={maxImp} onChange={e => setMaxImp(e.target.value)} placeholder="Opsiyonel" className="w-full p-2 border rounded text-sm bg-slate-50" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Başlangıç Zamanı</label>
                                    <input required type="datetime-local" value={startsAt} onChange={e => setStartsAt(e.target.value)} className="w-full p-2 border rounded text-sm bg-slate-50" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Bitiş Zamanı (Max 90 Gün)</label>
                                    <input required type="datetime-local" value={endsAt} onChange={e => setEndsAt(e.target.value)} className="w-full p-2 border rounded text-sm bg-slate-50" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-red-500 mb-1 border-b border-red-500 max-w-max">* Audit Log / Denetim İzi (Zorunlu)</label>
                                <textarea required minLength={5} value={reason} onChange={e => setReason(e.target.value)} rows={2} className="w-full p-2 border border-red-200 bg-red-50 rounded text-sm placeholder-red-300" placeholder="Kuralı ekleme sebebi..."></textarea>
                            </div>

                            <div className="flex justify-end gap-2 pt-4 border-t">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 font-bold text-slate-500 hover:text-slate-800">İptal</button>
                                <button type="submit" disabled={saving} className="px-5 py-2 bg-blue-600 text-white font-bold rounded shadow hover:bg-blue-700 disabled:opacity-50">
                                    {saving ? 'KAYDEDİLİYOR' : 'OLUŞTUR (IDEMPOTENT)'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
