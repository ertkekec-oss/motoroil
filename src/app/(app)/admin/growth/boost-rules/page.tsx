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
        const r = prompt("İşlem nedenini giriniz (Audit log için zorunlu):");
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
        <div className="bg-slate-50 min-h-screen pb-16 w-full font-sans">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 mb-8">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight mb-1">
                            Boost Reklam Motoru (Growth Engine)
                        </h1>
                        <p className="text-sm text-slate-600">
                            Kategori, listeleme veya satıcı bazlı suni B2B görünürlük çarpanı ve sponsorluk yönetimi.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        <button
                            onClick={() => setShowModal(true)}
                            className="h-10 px-5 inline-flex items-center justify-center rounded-lg text-[13px] font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-sm gap-2"
                        >
                            <span>⚡</span> Yeni Kural Üret
                        </button>
                    </div>
                </div>

                {/* Dashboard Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                        <p className="text-[12px] font-bold text-emerald-800 uppercase tracking-widest mb-1">AKTİF ÇARPANLAR</p>
                        <p className="text-3xl font-bold text-emerald-600">{stats.active} Kural</p>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                        <p className="text-[12px] font-bold text-amber-800 uppercase tracking-widest mb-1">PLANLI (SCHEDULED)</p>
                        <p className="text-3xl font-bold text-amber-600">{stats.scheduled} Kural</p>
                    </div>
                    <div className="bg-slate-100 border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                        <p className="text-[12px] font-bold text-slate-500 uppercase tracking-widest mb-1">PASİF / İPTAL EDİLEN</p>
                        <p className="text-3xl font-bold text-slate-600">{stats.disabled} Kural</p>
                    </div>
                </div>

                {/* Ana Veri Tablosu */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-base font-semibold text-slate-900">Aktif Konfigürasyonlar ve Algoritma Kriterleri</h2>
                            <p className="text-[13px] text-slate-500 mt-1">Platform içi görünürlüğü manipüle eden onaylı tüm kurallar dizini.</p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="p-16 flex flex-col items-center justify-center">
                            <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin mb-4"></div>
                            <span className="text-sm font-medium text-slate-500 uppercase tracking-widest">KURAL VERİ TABANI SORGULANIYOR...</span>
                        </div>
                    ) : rules.length === 0 ? (
                        <div className="p-16 text-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 border border-slate-200 shadow-sm">
                                📊
                            </div>
                            <p className="text-[15px] font-semibold text-slate-900">Aktif Kural Bulunamadı</p>
                            <p className="text-[13px] text-slate-500 max-w-sm mx-auto mt-1">Sistemde yürürlükte veya planlanmış herhangi bir gösterim manipülasyonu bulunmuyor.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left table-auto">
                                <thead className="bg-white border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold tracking-wide">
                                    <tr>
                                        <th className="px-6 py-4 font-bold">Kural Tipi & Hedef ID</th>
                                        <th className="px-6 py-4 font-bold text-right">Güç Çarpanı (x)</th>
                                        <th className="px-6 py-4 font-bold text-center">Günlük Gösterim Limiti</th>
                                        <th className="px-6 py-4 font-bold text-center">Tarihsel Geçerlilik</th>
                                        <th className="px-6 py-4 font-bold text-center">Statü</th>
                                        <th className="px-6 py-4 font-bold text-right">Devre Dışı Bırak / İptal E.</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-[14px]">
                                    {rules.map(r => (
                                        <tr key={r.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-bold tracking-widest bg-blue-100 text-blue-700 uppercase border border-blue-200">
                                                        {r.targetType}
                                                    </span>
                                                </div>
                                                <div className="font-mono text-[11px] text-slate-500 mt-1.5">{r.targetId || 'SYSTEM_GLOBAL'}</div>
                                            </td>

                                            <td className="px-6 py-4 text-right">
                                                <span className="inline-flex items-center justify-center px-3 py-1 bg-emerald-50 border border-emerald-200 rounded font-mono text-[15px] font-bold text-emerald-700">
                                                    x{r.multiplier}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex px-2 py-1 rounded bg-slate-50 border border-slate-200 text-[12px] font-bold text-slate-700">
                                                    {r.maxImpressionsPerDay || 'Limitsiz ∞'}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4 text-center">
                                                <div className="text-[12px] font-medium text-slate-900">{new Date(r.startsAt).toLocaleDateString()}</div>
                                                <div className="text-[10px] uppercase font-bold text-slate-400 my-0.5">Bitiş</div>
                                                <div className="text-[12px] font-medium text-slate-900">{new Date(r.endsAt).toLocaleDateString()}</div>
                                            </td>

                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-widest border ${r.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                                                    r.status === 'SCHEDULED' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                                                        r.status === 'EXPIRED' ? 'bg-slate-50 text-slate-500 border-slate-200' :
                                                            'bg-red-100 text-red-800 border-red-200'
                                                    }`}>
                                                    {r.status}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4 text-right">
                                                {(r.status === 'ACTIVE' || r.status === 'SCHEDULED') ? (
                                                    <div className="flexitems-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => handleAction(r.id, 'expire-now')}
                                                            className="inline-flex items-center justify-center h-8 px-3 mr-2 bg-amber-50 border border-amber-200 text-amber-700 text-[12px] font-bold rounded-lg hover:bg-amber-100 transition-colors shadow-sm"
                                                        >
                                                            Erken Bitir
                                                        </button>
                                                        <button
                                                            onClick={() => handleAction(r.id, 'disable')}
                                                            className="inline-flex items-center justify-center h-8 px-3 bg-red-50 border border-red-200 text-red-700 text-[12px] font-bold rounded-lg hover:bg-red-100 transition-colors shadow-sm"
                                                        >
                                                            Kapat / İptal
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-300 text-[12px] font-bold italic">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Kural Ekleme Modalı */}
                {showModal && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in duration-200">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
                            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">Platform İçi Kural Tanımlama Yönergesi</h2>
                                    <p className="text-[13px] text-slate-500">Idempotency-key destekli kayıt ataması.</p>
                                </div>
                                <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 text-2xl font-light">&times;</button>
                            </div>

                            <div className="p-6 overflow-y-auto">
                                {(targetType === 'SELLER') && (
                                    <div className="mb-6 bg-blue-50 border border-blue-200 p-4 rounded-xl flex gap-3 items-start">
                                        <span className="text-blue-500 mt-0.5">ℹ️</span>
                                        <div>
                                            <p className="text-[13px] text-blue-900 font-bold uppercase tracking-wide mb-1">Risk Protokolü Uyarı Sistemi</p>
                                            <p className="text-[13px] text-blue-800 leading-relaxed font-medium">Hedef satıcı <span className="font-bold border-b border-blue-300">"D" (Riskli)</span> tier grubunda ise, sistem otomatik olarak bu çarpan etkisini (x1.0) baz değerine geri dengeleyecektir (Platform Finansal Koruma İlkesi gereği). Satıcı ürünü yalnızca "reklamlı" etiketinde sponsorluk amblemi ile sergiler.</p>
                                        </div>
                                    </div>
                                )}

                                <form id="boostRuleForm" onSubmit={handleCreate} className="space-y-5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Hedef Metodolojisi / Hedef Tipi</label>
                                            <select required value={targetType} onChange={e => setTargetType(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition-colors font-medium">
                                                <option value="GLOBAL">GLOBAL (Tüm Sistem Ağı)</option>
                                                <option value="CATEGORY">KATALOG KATEGORİSİ (Category)</option>
                                                <option value="LISTING">SPESİFİK LİSTELEME (Listing)</option>
                                                <option value="SELLER">TEDARİKÇİ / SATICI (Tenant)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Benzersiz Hedef ID (UUID) {targetType !== 'GLOBAL' && <span className="text-red-500">*</span>}</label>
                                            <input disabled={targetType === 'GLOBAL'} required={targetType !== 'GLOBAL'} type="text" value={targetId} onChange={e => setTargetId(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-mono" placeholder="örn. 123e4567-e89b-12d3..." />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Görünürlük Çarpanı (Multiplier)</label>
                                            <div className="relative">
                                                <input required type="number" step="0.1" min="1.0" max="3.0" value={multiplier} onChange={e => setMultiplier(Number(e.target.value))} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition-colors font-mono pl-8" />
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">x</span>
                                            </div>
                                            <p className="text-[11px] text-slate-500 mt-1">Sert manipülasyonları engellemek adında Max 3.0 ile limitlenmiştir.</p>
                                        </div>
                                        <div>
                                            <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Günlük Gösterim Limiti (Impression Cap)</label>
                                            <input type="number" value={maxImp} onChange={e => setMaxImp(e.target.value)} placeholder="Limit Yok ise Boş Bırakınız" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition-colors font-mono" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Harekete Geçiş Zamanı (Starts At)</label>
                                            <input required type="datetime-local" value={startsAt} onChange={e => setStartsAt(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-[13px] font-medium bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition-colors" />
                                        </div>
                                        <div>
                                            <label className="block text-[13px] font-bold text-slate-700 mb-1.5">İptal Edilme Zamanı (Ends At)</label>
                                            <input required type="datetime-local" value={endsAt} onChange={e => setEndsAt(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-[13px] font-medium bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition-colors" />
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <label className="block text-[13px] font-bold text-red-600 mb-1.5 uppercase tracking-wide">Güvenlik: İşlem / Kayıt Sebebi (Audit Log)</label>
                                        <textarea required minLength={5} value={reason} onChange={e => setReason(e.target.value)} rows={3} className="w-full px-3 py-2 border border-red-200 bg-red-50 rounded-lg text-sm placeholder-red-300 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-500/20 transition-colors font-medium text-red-900" placeholder="Bu kural neden oluşturuluyor? Zorunlu alan, min 5 karakter."></textarea>
                                    </div>
                                </form>
                            </div>

                            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end gap-3 rounded-b-2xl">
                                <button type="button" onClick={() => setShowModal(false)} className="h-10 px-5 inline-flex items-center justify-center rounded-lg text-[13px] font-semibold border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
                                    Pencereyi Kapat
                                </button>
                                <button type="submit" form="boostRuleForm" disabled={saving} className="h-10 px-6 inline-flex items-center justify-center rounded-lg text-[13px] font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                                    {saving ? 'AĞA İŞLENİYOR...' : 'KURAL PROTOKOLÜNÜ ONAYLA'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
