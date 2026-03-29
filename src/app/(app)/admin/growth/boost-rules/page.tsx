"use client";
import React, { useState, useEffect } from "react";
import { useModal } from "@/contexts/ModalContext";
import { EnterprisePageShell, EnterpriseCard } from "@/components/ui/enterprise";

export default function AdminBoostRules() {
    const { showSuccess, showError, showWarning, showPrompt } = useModal();
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
                showSuccess("Bilgi", "Kural baÅŸarÄ±yla oluÅŸturuldu.");
                setShowModal(false);
                fetchRules();
            } else {
                const err = await res.json();
                showError("UyarÄ±", `Hata: ${err.error}`);
            }
        } finally {
            setSaving(false);
        }
    };

    const handleAction = async (id: string, action: 'disable' | 'expire-now') => {
        showPrompt("Ä°ÅŸlem OnayÄ±", "Ä°ÅŸlem nedenini giriniz (Audit log iÃ§in zorunlu):", async (r) => {
            if (!r || r.length < 5) return showError("UyarÄ±", "GeÃ§erli bir sebep girilmeli (min 5 karakter).");

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
                    showError("UyarÄ±", `Hata: ${err.error}`);
                }
            } catch (e) {
                console.error(e);
            }
        });
    };

    const stats = {
        active: rules.filter((r) => r.status === 'ACTIVE').length,
        scheduled: rules.filter((r) => r.status === 'SCHEDULED').length,
        disabled: rules.filter((r) => r.status === 'DISABLED').length,
    };

    const actions = (
        <div className="flex items-center gap-3 shrink-0">
            <button
                onClick={() => setShowModal(true)}
                className="h-10 px-5 inline-flex items-center justify-center rounded-xl text-[11px] uppercase tracking-widest font-black bg-slate-900 dark:bg-emerald-600 text-white hover:bg-slate-800 dark:hover:bg-emerald-700 transition-colors shadow-sm gap-2"
            >
                <span>âš¡</span> Yeni Kural Ãœret
            </button>
        </div>
    );

    return (
        <EnterprisePageShell
            title="Boost Reklam Motoru (Growth Engine)"
            description="Kategori, listeleme veya satÄ±cÄ± bazlÄ± suni B2B gÃ¶rÃ¼nÃ¼rlÃ¼k Ã§arpanÄ± ve sponsorluk yÃ¶netimi."
            actions={actions}
            className="min-h-screen bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 font-sans w-full pb-16 focus:outline-none"
        >
            {/* Dashboard Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl p-6 shadow-sm relative overflow-hidden flex flex-col justify-between group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/3 pointer-events-none group-hover:bg-emerald-500/10 dark:group-hover:bg-emerald-500/20 transition-all duration-500"></div>
                    <p className="text-[11px] font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-widest mb-4 z-10">AKTÄ°F Ã‡ARPANLAR</p>
                    <p className="text-[32px] font-black tracking-tighter text-emerald-600 dark:text-emerald-500 z-10">{stats.active} <span className="text-[14px] text-emerald-600/60 dark:text-emerald-500/60 font-medium tracking-normal">Kural</span></p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-6 shadow-sm relative overflow-hidden flex flex-col justify-between group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 dark:bg-amber-500/10 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/3 pointer-events-none group-hover:bg-amber-500/10 dark:group-hover:bg-amber-500/20 transition-all duration-500"></div>
                    <p className="text-[11px] font-black text-amber-800 dark:text-amber-400 uppercase tracking-widest mb-4 z-10">PLANLI (SCHEDULED)</p>
                    <p className="text-[32px] font-black tracking-tighter text-amber-600 dark:text-amber-500 z-10">{stats.scheduled} <span className="text-[14px] text-amber-600/60 dark:text-amber-500/60 font-medium tracking-normal">Kural</span></p>
                </div>
                <div className="bg-slate-100 dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm relative overflow-hidden flex flex-col justify-between group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-slate-500/5 dark:bg-slate-500/10 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/3 pointer-events-none group-hover:bg-slate-500/10 dark:group-hover:bg-slate-500/20 transition-all duration-500"></div>
                    <p className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 z-10">PASÄ°F / Ä°PTAL EDÄ°LEN</p>
                    <p className="text-[32px] font-black tracking-tighter text-slate-600 dark:text-slate-300 z-10">{stats.disabled} <span className="text-[14px] text-slate-400/60 dark:text-slate-500/60 font-medium tracking-normal">Kural</span></p>
                </div>
            </div>

            {/* Ana Veri Tablosu */}
            <EnterpriseCard noPadding>
                <div className="px-6 py-5 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#1e293b] flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-[13px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Aktif KonfigÃ¼rasyonlar ve Algoritma Kriterleri</h2>
                        <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">Platform iÃ§i gÃ¶rÃ¼nÃ¼rlÃ¼ÄŸÃ¼ manipÃ¼le eden onaylÄ± tÃ¼m kurallar dizini.</p>
                    </div>
                </div>

                {loading ? (
                    <div className="p-16 flex flex-col items-center justify-center">
                        <div className="w-8 h-8 border-4 border-slate-200 dark:border-slate-700 border-t-slate-900 dark:border-t-emerald-500 rounded-full animate-spin mb-4"></div>
                        <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">KURAL VERÄ° TABANI SORGULANIYOR...</span>
                    </div>
                ) : rules.length === 0 ? (
                    <div className="p-16 text-center">
                        <div className="w-16 h-16 bg-slate-50 dark:bg-[#0f172a] rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 border border-slate-200 dark:border-white/5 shadow-sm">
                            ğŸ“Š
                        </div>
                        <p className="text-[13px] font-black text-slate-900 dark:text-white uppercase tracking-widest mb-1">Aktif Kural BulunamadÄ±</p>
                        <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 max-w-sm mx-auto uppercase tracking-widest leading-relaxed">Sistemde yÃ¼rÃ¼rlÃ¼kte veya planlanmÄ±ÅŸ herhangi bir gÃ¶sterim manipÃ¼lasyonu bulunmuyor.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse whitespace-nowrap">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-white/5">
                                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-slate-500 dark:text-slate-400">Kural Tipi & Hedef ID</th>
                                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-slate-500 dark:text-slate-400 text-right">GÃ¼Ã§ Ã‡arpanÄ± (x)</th>
                                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-slate-500 dark:text-slate-400 text-center">GÃ¼nlÃ¼k GÃ¶sterim Limiti</th>
                                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-slate-500 dark:text-slate-400 text-center">Tarihsel GeÃ§erlilik</th>
                                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-slate-500 dark:text-slate-400 text-center">StatÃ¼</th>
                                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-slate-500 dark:text-slate-400 text-right">Aksiyonlar</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-sm">
                                {rules?.map(r => (
                                    <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="inline-flex px-2 py-0.5 rounded-lg text-[10px] font-black tracking-widest bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 uppercase border border-blue-200 dark:border-blue-500/30">
                                                    {r.targetType}
                                                </span>
                                            </div>
                                            <div className="font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1.5 tracking-widest">{r.targetId || 'SYSTEM_GLOBAL'}</div>
                                        </td>

                                        <td className="px-6 py-4 text-right">
                                            <span className="inline-flex items-center justify-center px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-lg font-mono text-[13px] font-black text-emerald-700 dark:text-emerald-400">
                                                x{r.multiplier}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest shadow-[inset_0_1px_4px_rgba(0,0,0,0.1)]">
                                                {r.maxImpressionsPerDay || 'LÄ°MÄ°TSÄ°Z âˆ'}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4 text-center">
                                            <div className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest">{new Date(r.startsAt).toLocaleDateString()}</div>
                                            <div className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 my-1.5 tracking-widest">BitiÅŸ</div>
                                            <div className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest">{new Date(r.endsAt).toLocaleDateString()}</div>
                                        </td>

                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${r.status === 'ACTIVE' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30' :
                                                r.status === 'SCHEDULED' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-500/30' :
                                                    r.status === 'EXPIRED' ? 'bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/5' :
                                                        'bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-400 border-red-200 dark:border-red-500/30'
                                                }`}>
                                                {r.status}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4 text-right">
                                            {(r.status === 'ACTIVE' || r.status === 'SCHEDULED') ? (
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleAction(r.id, 'expire-now')}
                                                        className="inline-flex items-center justify-center h-8 px-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 text-[10px] tracking-widest uppercase font-black rounded-lg hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors shadow-sm"
                                                    >
                                                        Erken Bitir
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction(r.id, 'disable')}
                                                        className="inline-flex items-center justify-center h-8 px-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-[10px] tracking-widest uppercase font-black rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors shadow-sm"
                                                    >
                                                        Ä°ptal Et
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-slate-300 dark:text-slate-600 text-[12px] font-bold italic">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </EnterpriseCard>

            {/* Kural Ekleme ModalÄ± */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in duration-200">
                    <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-xl w-full max-w-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between sticky top-0 bg-white dark:bg-[#1e293b] z-10">
                            <div>
                                <h2 className="text-[13px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Platform Ä°Ã§i Kural TanÄ±mlama YÃ¶nergesi</h2>
                                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">Idempotency-key destekli kayÄ±t atamasÄ±.</p>
                            </div>
                            <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-white text-2xl font-light transition-colors">&times;</button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            {(targetType === 'SELLER') && (
                                <div className="mb-6 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 p-4 rounded-2xl flex gap-4 items-start shadow-sm">
                                    <span className="text-blue-500 dark:text-blue-400 mt-0.5 text-lg">â„¹ï¸</span>
                                    <div>
                                        <p className="text-[11px] font-black text-blue-900 dark:text-blue-400 uppercase tracking-widest mb-1">Risk ProtokolÃ¼ UyarÄ± Sistemi</p>
                                        <p className="text-[10px] text-blue-800 dark:text-blue-300 font-bold uppercase tracking-widest">Hedef satÄ±cÄ± <span className="font-black border-b border-blue-300 dark:border-blue-500/50">"D" (Riskli)</span> tier grubunda ise, sistem otomatik olarak bu Ã§arpan etkisini (x1.0) baz deÄŸerine geri dengeleyecektir (Platform Finansal Koruma Ä°lkesi gereÄŸi). SatÄ±cÄ± Ã¼rÃ¼nÃ¼ yalnÄ±zca "reklamlÄ±" etiketinde sponsorluk amblemi ile sergiler.</p>
                                    </div>
                                </div>
                            )}

                            <form id="boostRuleForm" onSubmit={handleCreate} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-[11px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 mb-2">Hedef Metodolojisi / Tipi</label>
                                        <select required value={targetType} onChange={e => setTargetType(e.target.value)} className="w-full px-4 py-3 border border-slate-300 dark:border-white/10 rounded-xl text-[13px] bg-slate-50 dark:bg-[#0f172a] focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors font-bold text-slate-900 dark:text-white">
                                            <option value="GLOBAL">GLOBAL (TÃ¼m Sistem AÄŸÄ±)</option>
                                            <option value="CATEGORY">KATALOG KATEGORÄ°SÄ° (Category)</option>
                                            <option value="LISTING">SPESÄ°FÄ°K LÄ°STELEME (Listing)</option>
                                            <option value="SELLER">TEDARÄ°KÃ‡Ä° / SATICI (Tenant)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 mb-2">Benzersiz Hedef ID (UUID) {targetType !== 'GLOBAL' && <span className="text-red-500">*</span>}</label>
                                        <input disabled={targetType === 'GLOBAL'} required={targetType !== 'GLOBAL'} type="text" value={targetId} onChange={e => setTargetId(e.target.value)} className="w-full px-4 py-3 border border-slate-300 dark:border-white/10 rounded-xl text-[13px] bg-slate-50 dark:bg-[#0f172a] focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-mono text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600" placeholder="Ã¶rn. 123e4567-e89b-12d3..." />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-[11px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 mb-2">GÃ¶sterim Ã‡arpanÄ± (Multiplier)</label>
                                        <div className="relative">
                                            <input required type="number" step="0.1" min="1.0" max="3.0" value={multiplier} onChange={e => setMultiplier(Number(e.target.value))} className="w-full px-4 py-3 border border-slate-300 dark:border-white/10 rounded-xl text-[13px] bg-slate-50 dark:bg-[#0f172a] focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors font-mono font-black text-emerald-700 dark:text-emerald-400 pl-8" />
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600 dark:text-emerald-500 font-black">x</span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-2">Sert manipÃ¼lasyonlarÄ± engellemek adÄ±na Max 3.0 limiti.</p>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 mb-2">GÃ¼nlÃ¼k GÃ¶sterim Limiti (Imp. Cap)</label>
                                        <input type="number" value={maxImp} onChange={e => setMaxImp(e.target.value)} placeholder="Limit Yok ise BoÅŸ BÄ±rakÄ±nÄ±z" className="w-full px-4 py-3 border border-slate-300 dark:border-white/10 rounded-xl text-[13px] bg-slate-50 dark:bg-[#0f172a] focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors font-mono font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 tracking-widest uppercase" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-[11px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 mb-2">BaÅŸlangÄ±Ã§ ZamanÄ±</label>
                                        <input required type="datetime-local" value={startsAt} onChange={e => setStartsAt(e.target.value)} className="w-full px-4 py-3 border border-slate-300 dark:border-white/10 rounded-xl text-[13px] font-bold bg-slate-50 dark:bg-[#0f172a] focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors text-slate-900 dark:text-white" />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 mb-2">BitiÅŸ ZamanÄ±</label>
                                        <input required type="datetime-local" value={endsAt} onChange={e => setEndsAt(e.target.value)} className="w-full px-4 py-3 border border-slate-300 dark:border-white/10 rounded-xl text-[13px] font-bold bg-slate-50 dark:bg-[#0f172a] focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors text-slate-900 dark:text-white" />
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <label className="block text-[11px] font-black text-red-600 dark:text-red-400 mb-2 uppercase tracking-widest">GÃ¼venlik: Ä°ÅŸlem Sebebi (Audit Log)</label>
                                    <textarea required minLength={5} value={reason} onChange={e => setReason(e.target.value)} rows={3} className="w-full px-4 py-3 border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 rounded-xl text-[13px] placeholder-red-300 dark:placeholder-red-400/50 focus:outline-none focus:border-red-400 dark:focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-colors font-bold text-red-900 dark:text-red-400" placeholder="Bu kural neden oluÅŸturuluyor? Zorunlu alan, min 5 karakter."></textarea>
                                </div>
                            </form>
                        </div>

                        <div className="px-6 py-5 border-t border-slate-100 dark:border-white/5 bg-slate-50/80 dark:bg-[#1e293b] flex items-center justify-end gap-3 rounded-b-2xl">
                            <button type="button" onClick={() => setShowModal(false)} className="h-10 px-5 inline-flex items-center justify-center rounded-xl text-[11px] font-black uppercase tracking-widest border border-slate-300 dark:border-white/10 bg-white dark:bg-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#0f172a] transition-colors shadow-sm">
                                VazgeÃ§
                            </button>
                            <button type="submit" form="boostRuleForm" disabled={saving} className="h-10 px-6 inline-flex items-center justify-center rounded-xl text-[11px] font-black uppercase tracking-widest bg-emerald-600 dark:bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                                {saving ? 'AÄA Ä°ÅLENÄ°YOR...' : 'KURAL PROTOKOLÃœNÃœ ONAYLA'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </EnterprisePageShell>
    );
}

