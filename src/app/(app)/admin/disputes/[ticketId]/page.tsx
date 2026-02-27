"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from 'next/navigation';

export default function DisputeDetailPage() {
    const params = useParams();
    const router = useRouter();
    const ticketId = params.ticketId as string;

    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [actionState, setActionState] = useState({ type: '', amount: '', reason: '', code: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchDetail();
    }, [ticketId]);

    const fetchDetail = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/disputes/${ticketId}`);
            if (res.ok) {
                setData(await res.json());
            } else {
                alert("Uyarı: Dosya bulunamadı veya yetkisiz erişim.");
                router.push("/admin/disputes");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!actionState.reason || actionState.reason.length < 5) return alert("Sebebini giriniz.");

        const confirmMsg = `Bu işlem YAPILACAKTIR:\nİşlem: ${actionState.type}\nTutar: ${actionState.amount || 'Tümü'}\nOnaylıyor musunuz (Finans Denetimine Kaydedilecektir)?`;
        if (!window.confirm(confirmMsg)) return;

        setSaving(true);
        try {
            const payload = {
                actionType: actionState.type,
                amount: actionState.amount ? parseFloat(actionState.amount) : undefined,
                reason: actionState.reason,
                resolutionCode: actionState.code || undefined
            };

            const res = await fetch(`/api/admin/disputes/${ticketId}/actions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-idempotency-key": crypto.randomUUID()
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert("Aksiyon uygulandı ve Finans Denetim Defterine kaydedildi.");
                setActionState({ type: '', amount: '', reason: '', code: '' });
                fetchDetail();
            } else {
                const errResult = await res.json();
                alert(`İşlem Hatası: ${errResult.error}`);
            }
        } finally {
            setSaving(false);
        }
    };

    const handleRequestInfo = async () => {
        const fields = prompt("Alıcıdan / Satıcıdan istenecek bilgileri aralarına virgül koyarak yazın (örn: Teslimat Tutanağı, Fotoğraf):");
        if (!fields) return;

        setSaving(true);
        try {
            const res = await fetch(`/api/admin/disputes/${ticketId}/request-info`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-idempotency-key": crypto.randomUUID()
                },
                body: JSON.stringify({ fieldsRequested: fields.split(',').map(s => s.trim()) })
            });

            if (res.ok) {
                alert("Bilgi talebi oluşturuldu.");
                fetchDetail();
            } else {
                alert("Hata oluştu.");
            }
        } finally {
            setSaving(false);
        }
    };

    if (loading || !data) return <div className="p-8">Yükleniyor...</div>;

    const { ticket, case: dCase, messages, actions } = data;

    return (
        <div className="space-y-6 max-w-7xl pb-24">
            <div className="flex justify-between items-start border-b pb-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Uyuşmazlık Dosyası (Tahkim)</h1>
                        <span className={`px-2 py-1 text-xs font-bold rounded ring-1 ring-inset ${dCase.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-amber-50 text-amber-700 ring-amber-200'}`}>
                            {dCase.status}
                        </span>
                    </div>
                    <p className="text-sm font-mono text-slate-500 mt-2">Ticket ID: {ticket.id} | Case ID: {dCase.id}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Sol Panel: Kanıt, Finans ve Zaman Çizelgesi */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Dosya Özeti */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">DOSYA GÖVDESİ</h2>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between border-b pb-2">
                                <span className="font-semibold text-slate-600">Alıcı Tenant:</span>
                                <span className="font-mono text-slate-800">{dCase.buyerTenantId.substring(0, 8)}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="font-semibold text-slate-600">Satıcı Tenant:</span>
                                <span className="font-mono text-slate-800">{dCase.sellerTenantId.substring(0, 8)}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="font-semibold text-slate-600">Bağlı Sipariş:</span>
                                <span className="font-mono text-blue-600 hover:underline cursor-pointer">{dCase.referencedOrderId || 'Belirtilmemiş'}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="font-semibold text-slate-600">Bağlı Kargo Gönderisi:</span>
                                <span className="font-mono text-blue-600 hover:underline cursor-pointer">{dCase.referencedShipmentId || 'Belirtilmemiş'}</span>
                            </div>
                            <div className="flex justify-between pt-2">
                                <span className="font-semibold text-slate-600">Emanet (Escrow) Durumu:</span>
                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${['RELEASED', 'REFUNDED'].includes(dCase.escrowActionState) ? 'bg-slate-800 text-white' : 'bg-red-100 text-red-700'}`}>
                                    {dCase.escrowActionState}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Denetim & Aksiyon Geçmişi */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm h-96 overflow-y-auto">
                        <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">PLATFORM FİNANS DENETİM BEYAZ MASA</h2>
                        <div className="space-y-4">
                            {actions.length === 0 ? <p className="text-sm text-slate-500 text-center py-4">Henüz finansal veya idari müdahale yapılmamış.</p> : null}
                            {actions.map((act: any) => (
                                <div key={act.id} className="relative pl-4 border-l-2 border-slate-200">
                                    <div className="absolute -left-1.5 top-1.5 w-3 h-3 bg-white border-2 border-slate-400 rounded-full"></div>
                                    <div className="text-xs font-bold text-slate-800">{act.actionType}</div>
                                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{new Date(act.createdAt).toLocaleString()} | Actor: {act.actorRole}</div>
                                    <div className="text-xs text-slate-600 mt-1 bg-slate-50 p-2 border rounded">
                                        <span className="font-semibold block mb-1">Sebep:</span>
                                        {act.reason}
                                    </div>
                                    {act.amount && <div className="text-xs font-bold text-emerald-600 mt-1">İşlem Tutarı: {act.amount} TRY</div>}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sağ Panel: Mesajlar ve Çözüm Merkezi */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Ticket Mesajları (Sadece Redacted) */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[500px]">
                        <div className="p-4 border-b bg-slate-50 flex justify-between items-center rounded-t-xl">
                            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">TICKET İÇERİĞİ (PII MASKELİ)</h2>
                            <button onClick={handleRequestInfo} disabled={saving || dCase.status === 'RESOLVED'} className="px-3 py-1.5 bg-blue-50 text-blue-700 font-semibold text-xs border border-blue-200 hover:bg-blue-100 rounded shadow-sm disabled:opacity-50">
                                + Bilgi & Belge Talep Et (Şablon)
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                            {messages.map((m: any) => (
                                <div key={m.id} className={`flex flex-col max-w-[80%] ${m.actorType === 'SYSTEM' ? 'mx-auto w-full max-w-[90%]' : m.actorType === 'ADMIN' ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                                    <span className="text-[10px] font-bold text-slate-400 mb-1">{m.actorType} | {new Date(m.createdAt).toLocaleTimeString()}</span>
                                    <div className={`p-3 rounded-lg text-sm shadow-sm whitespace-pre-wrap ${m.actorType === 'SYSTEM' ? 'bg-amber-50 border border-amber-200 text-amber-900 w-full font-medium' :
                                            m.actorType === 'ADMIN' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border rounded-tl-none text-slate-700'
                                        }`}>
                                        {m.redactedMessage}
                                    </div>
                                </div>
                            ))}
                            {messages.length === 0 && <p className="text-center text-slate-500 text-sm mt-10">Kayıtlı mesaj bulunamadı.</p>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Sabit (Sticky) Aksiyon Paneli - Finans veya Platform Yöneticisine Özel */}
            <div className="fixed bottom-0 left-64 right-0 bg-white border-t border-slate-200 p-4 shadow-[-5px_-5px_15px_rgba(0,0,0,0.03)] flex gap-4 h-24 items-center z-20">
                <div className="border-r pr-4 border-slate-200">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">EMANET YÖNETİMİ / KARAR</h3>
                    <p className="text-xs text-slate-500 font-medium">Lütfen yapmak istediğiniz aksiyonu seçin.</p>
                </div>

                <form onSubmit={handleAction} className="flex flex-1 gap-3 items-end">
                    <div className="flex-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Aksiyon Tipi</label>
                        <select required disabled={saving || dCase.status === 'RESOLVED'} value={actionState.type} onChange={e => setActionState({ ...actionState, type: e.target.value })} className="w-full mt-1 p-2 text-sm border rounded bg-slate-50 disabled:bg-slate-100">
                            <option value="">-- Aksiyon Seç --</option>
                            <option value="CHANGE_STATUS">Durumu Güncelle (Finansal Olmayan)</option>
                            <option disabled>────── MÜDAHALE (FİNANS) ──────</option>
                            <option value="HOLD_ESCROW">Emaneti Askıya Al (HOLD)</option>
                            <option value="PARTIAL_RELEASE">Kısmi Olarak Satıcıya Serbest Bırak</option>
                            <option value="FULL_RELEASE">Tamamını Satıcıya Serbest Bırak (Satıcı Haklı)</option>
                            <option value="REFUND">İptal/İade - Alıcıya Geri Öde (Alıcı Haklı)</option>
                            <option value="FLAG_CHARGEBACK">Ters İbraz / Chargeback Talebi Olarak İşaretle</option>
                        </select>
                    </div>

                    {(actionState.type === 'PARTIAL_RELEASE' || actionState.type === 'REFUND') && (
                        <div className="w-32">
                            <label className="text-[10px] font-bold text-emerald-600 uppercase">Tutar (Opsiyonel)</label>
                            <input type="number" step="0.01" value={actionState.amount} onChange={e => setActionState({ ...actionState, amount: e.target.value })} placeholder="0.00" className="w-full mt-1 p-2 text-sm border-emerald-300 rounded focus:ring-emerald-200 focus:border-emerald-400" />
                        </div>
                    )}

                    {['FULL_RELEASE', 'REFUND', 'PARTIAL_RELEASE', 'CHANGE_STATUS'].includes(actionState.type) && (
                        <div className="w-48">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Resmi Çözüm Kodu</label>
                            <select value={actionState.code} onChange={e => setActionState({ ...actionState, code: e.target.value })} className="w-full mt-1 p-2 text-sm border rounded bg-slate-50">
                                <option value="">-- Sebep Kodu --</option>
                                <option value="DELIVERY_FAILED">Teslimat Başarısız</option>
                                <option value="QUALITY_ISSUE">Hasar / Kusur</option>
                                <option value="NOT_AS_DESCRIBED">Eksik / Yanlış Ürün</option>
                                <option value="FRAUD_SUSPECTED">Riskli İşlem Alarmları</option>
                                <option value="OTHER">Diğer Anlaşma</option>
                            </select>
                        </div>
                    )}

                    <div className="w-1/3">
                        <label className="text-[10px] font-bold text-red-500 uppercase border-b border-red-500 w-full inline-block">* Audit Log Kayıt Sebebi (Zorunlu)</label>
                        <input required disabled={saving || dCase.status === 'RESOLVED'} type="text" value={actionState.reason} onChange={e => setActionState({ ...actionState, reason: e.target.value })} placeholder="Örn: Müşteri teslim tutanağı ile hasar onaylandı. Yönetici kararı." className="w-full mt-1 p-2 text-sm border border-red-200 bg-red-50 rounded placeholder-red-300" />
                    </div>

                    <button disabled={!actionState.type || saving || dCase.status === 'RESOLVED'} type="submit" className="px-6 py-2 bg-slate-900 text-white font-bold rounded shadow hover:bg-black disabled:opacity-50">
                        {saving ? 'İŞLENİYOR' : 'UYGULA & KAYDET'}
                    </button>
                </form>
            </div>
        </div>
    );
}
