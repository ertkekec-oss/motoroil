
"use client";

import { useState, useEffect } from 'react';

const RESULT_OPTIONS = [
    { value: 'siparis_alindi', label: '🛒 Sipariş Alındı', color: 'text-green-400 bg-green-500/10 border-green-500/20' },
    { value: 'ilgilenmedi', label: '🚫 İlgilenmedi', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
    { value: 'beklemede', label: '⏳ Beklemede', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
    { value: 'randevu_alindi', label: '📅 Randevu Alındı', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    { value: 'kapali', label: '🔒 Kapalıydı', color: 'text-gray-400 bg-gray-500/10 border-gray-500/20' },
    { value: 'bilgi_verildi', label: '💬 Bilgi Verildi', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
];

export default function MobileVisitsPage() {
    const [visits, setVisits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingVisit, setEditingVisit] = useState<any>(null);
    const [editForm, setEditForm] = useState({ notes: '', result: '' });
    const [saving, setSaving] = useState(false);
    const [filter, setFilter] = useState<'all' | 'today' | 'week'>('all');

    const fetchVisits = async () => {
        try {
            const res = await fetch('/api/field-sales/visits');
            if (res.ok) {
                const data = await res.json();
                setVisits(data.visits || []);
            } else {
                console.error('Ziyaretler alınamadı:', res.status);
                setVisits([]);
            }
        } catch (err) {
            console.error(err);
            setVisits([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVisits();
    }, []);

    const openEdit = (visit: any) => {
        setEditingVisit(visit);
        setEditForm({ notes: visit.notes || '', result: visit.result || '' });
    };

    const handleSave = async () => {
        if (!editingVisit) return;
        setSaving(true);
        try {
            const res = await fetch('/api/field-sales/visits', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: editingVisit.id, notes: editForm.notes, result: editForm.result })
            });
            if (res.ok) {
                const data = await res.json();
                setVisits(visits.map(v => v.id === editingVisit.id ? data.visit : v));
                setEditingVisit(null);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const filteredVisits = visits.filter(v => {
        if (filter === 'today') return new Date(v.checkInTime).toISOString().split('T')[0] === today;
        if (filter === 'week') return new Date(v.checkInTime) >= new Date(weekAgo);
        return true;
    });

    const getResultStyle = (result: string) => {
        return RESULT_OPTIONS.find(r => r.value === result)?.color || 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    };

    const getResultLabel = (result: string) => {
        return RESULT_OPTIONS.find(r => r.value === result)?.label || result;
    };

    if (loading) return (
        <div className="p-8 text-center text-gray-500 animate-pulse">
            <div className="text-4xl mb-3">📋</div>
            <div className="text-sm font-bold">Ziyaretler yükleniyor...</div>
        </div>
    );

    return (
        <div className="p-4 space-y-5 pb-24">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-white px-1">Ziyaret Geçmişi</h1>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] px-1 mt-1">
                    {visits.length} kayıt
                </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 px-1">
                {[
                    { id: 'all', label: 'Tümü' },
                    { id: 'today', label: 'Bugün' },
                    { id: 'week', label: 'Bu Hafta' },
                ].map(f => (
                    <button
                        key={f.id}
                        onClick={() => setFilter(f.id as any)}
                        className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all border ${filter === f.id
                                ? 'bg-blue-600 border-blue-500 text-white'
                                : 'bg-white/5 border-white/5 text-gray-500'
                            }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Visit List */}
            <div className="space-y-3">
                {filteredVisits.length === 0 ? (
                    <div className="text-center py-16 opacity-30">
                        <div className="text-4xl mb-3">📭</div>
                        <div className="text-sm font-bold">Bu filtrede ziyaret bulunamadı.</div>
                    </div>
                ) : (
                    filteredVisits.map((visit) => (
                        <div key={visit.id} className="bg-[#161b22] border border-white/5 rounded-2xl overflow-hidden">
                            <div className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="font-bold text-white text-base">{visit.customer?.name}</div>
                                        <div className="text-[10px] text-gray-500 font-bold">
                                            📅 {new Date(visit.checkInTime).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => openEdit(visit)}
                                        className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-sm transition-all"
                                        title="Düzenle"
                                    >
                                        ✏️
                                    </button>
                                </div>

                                <div className="flex flex-wrap gap-2 text-[11px] font-bold mb-2">
                                    <span className="text-gray-500 flex items-center gap-1">
                                        🕒 {new Date(visit.checkInTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                        {visit.checkOutTime && ` - ${new Date(visit.checkOutTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`}
                                    </span>
                                    {visit.orders?.length > 0 && (
                                        <span className="text-blue-400">🛒 {visit.orders.length} sipariş</span>
                                    )}
                                </div>

                                {visit.result && (
                                    <div className={`inline-flex text-[10px] font-black px-2 py-0.5 rounded-full border ${getResultStyle(visit.result)}`}>
                                        {getResultLabel(visit.result)}
                                    </div>
                                )}

                                {visit.notes && (
                                    <div className="mt-2 text-[11px] bg-black/20 p-2 rounded-xl italic text-gray-400 border border-white/5">
                                        "{visit.notes}"
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Edit Modal */}
            {editingVisit && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-end">
                    <div className="w-full bg-[#0f111a] border border-white/10 rounded-t-[2rem] p-6 space-y-5 max-h-[85vh] overflow-y-auto">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-black text-white">Ziyareti Düzenle</h2>
                                <p className="text-[11px] text-gray-500">{editingVisit.customer?.name}</p>
                            </div>
                            <button
                                onClick={() => setEditingVisit(null)}
                                className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-lg hover:bg-white/10"
                            >
                                ×
                            </button>
                        </div>

                        {/* Result */}
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">Ziyaret Sonucu</label>
                            <div className="grid grid-cols-2 gap-2">
                                {RESULT_OPTIONS.map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setEditForm({ ...editForm, result: opt.value })}
                                        className={`p-3 rounded-2xl text-[11px] font-black text-left border transition-all ${editForm.result === opt.value
                                                ? opt.color + ' opacity-100'
                                                : 'bg-white/[0.03] border-white/5 text-gray-500 hover:border-white/10'
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Notlar</label>
                            <textarea
                                value={editForm.notes}
                                onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                                placeholder="Ziyarete ait notlar..."
                                rows={4}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white focus:border-blue-500 focus:outline-none resize-none"
                            />
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm uppercase tracking-widest transition-all disabled:opacity-50"
                        >
                            {saving ? 'KAYDEDİLİYOR...' : 'KAYDET'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
