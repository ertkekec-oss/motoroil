'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, MapPin, Grid, AlertCircle } from 'lucide-react';

export default function RestaurantSettingsPanel({ showSuccess, showError, showConfirm }: any) {
    const [zones, setZones] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newZoneName, setNewZoneName] = useState('');
    const [newTable, setNewTable] = useState({ name: '', capacity: 4, zoneId: '' });

    const fetchZones = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/restaurant/zones');
            const data = await res.json();
            if (Array.isArray(data)) setZones(data);
        } catch (e) {
             console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchZones();
    }, []);

    const handleAddZone = async () => {
        if (!newZoneName.trim()) return;
        try {
            const res = await fetch('/api/restaurant/zones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newZoneName })
            });
            if (res.ok) {
                showSuccess("Başarılı", "Yeni Salon (Kroki Alanı) oluşturuldu.");
                setNewZoneName('');
                fetchZones();
            } else {
                showError("Hata", "Alan oluşturulamadı.");
            }
        } catch (e) { showError("Hata", "Bağlantı hatası."); }
    };

    const handleDeleteZone = (id: string) => {
        showConfirm("Alanı Sil?", "Bu alanı (ve içindeki tüm masaları) silmek istediğinize emin misiniz?", async () => {
             await fetch(`/api/restaurant/zones?id=${id}`, { method: 'DELETE' });
             showSuccess("Silindi", "Alan ve masalar kaldırıldı.");
             fetchZones();
        });
    };

    const handleAddTable = async () => {
        if (!newTable.name || !newTable.zoneId) return;
        try {
            const res = await fetch('/api/restaurant/tables', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newTable)
            });
            if (res.ok) {
                showSuccess("Başarılı", "Masa eklendi.");
                setNewTable({ ...newTable, name: '' }); // keep zone and capacity
                fetchZones();
            } else {
                showError("Hata", "Masa eklenemedi.");
            }
        } catch (e) { showError("Hata", "Bağlantı hatası."); }
    };

    const handleDeleteTable = (id: string) => {
        showConfirm("Masayı Sil?", "Masayı kaldırmak istediğinize emin misiniz?", async () => {
            await fetch(`/api/restaurant/tables?id=${id}`, { method: 'DELETE' });
            fetchZones();
        });
    };

    if (isLoading) return <div className="p-8 text-center text-slate-500 animate-pulse">Kroki Yükleniyor...</div>;

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-8 animate-in fade-in">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                    <MapPin className="w-7 h-7 text-amber-500" />
                    Salon & Kroki Yönetimi
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm leading-relaxed">
                    Buradan restoran veya kafenizdeki fiziksel alanları (Teras, İç Mekan vb.) ve bu alanların içindeki masaları tanımlayabilirsiniz. 
                    Tanımlanan bu masalar "Satış Terminali" ve "E-Adisyon" modüllerinde otomatik olarak görünecektir.
                </p>
            </div>

            {/* QUICK ACTIONS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* YENİ ALAN (ZONE) EKLE */}
                <div className="bg-white dark:bg-[#0B1220] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Grid className="w-4 h-4 text-emerald-500" />
                        Yeni Salon Ekle
                    </h3>
                    <div className="flex gap-3">
                        <input
                            type="text"
                            placeholder="Örn: Ön Teras, VIP Kısım..."
                            value={newZoneName}
                            onChange={(e) => setNewZoneName(e.target.value)}
                            className="flex-1 h-11 px-4 rounded-xl bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        />
                        <button
                            onClick={handleAddZone}
                            disabled={!newZoneName.trim()}
                            className="h-11 px-6 rounded-xl font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 disabled:opacity-50 transition-colors"
                        >
                            Oluştur
                        </button>
                    </div>
                </div>

                {/* YENİ MASA EKLE */}
                <div className="bg-white dark:bg-[#0B1220] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Plus className="w-4 h-4 text-blue-500" />
                        Masaları Ata
                    </h3>
                    <div className="flex flex-col gap-3">
                        <div className="flex gap-3">
                            <select
                                value={newTable.zoneId}
                                onChange={(e) => setNewTable({ ...newTable, zoneId: e.target.value })}
                                className="w-[140px] h-11 px-3 rounded-xl bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 focus:outline-none"
                            >
                                <option value="">Salon Seç...</option>
                                {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                            </select>
                            <input
                                type="text"
                                placeholder="Masa Adı (Örn: T-01)"
                                value={newTable.name}
                                onChange={(e) => setNewTable({ ...newTable, name: e.target.value })}
                                className="flex-1 h-11 px-4 rounded-xl bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 focus:outline-none"
                            />
                            <button
                                onClick={handleAddTable}
                                disabled={!newTable.name || !newTable.zoneId}
                                className="h-11 px-6 rounded-xl font-bold bg-blue-600 text-white disabled:opacity-50 transition-colors"
                            >
                                Ekle
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ZONES & TABLES DISPLAY */}
            <div className="space-y-6 pt-4">
                {zones.length === 0 ? (
                    <div className="text-center py-12 px-6 bg-slate-50 dark:bg-slate-800/20 rounded-3xl border border-slate-200 dark:border-slate-800/50 border-dashed">
                        <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4 opacity-50" />
                        <h4 className="text-lg font-bold text-slate-700 dark:text-slate-300">Henüz kroki oluşturulmadı</h4>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Yukarıdaki panelden restoranınıza ait salon/teras alanlarını ekleyerek başlayın.</p>
                    </div>
                ) : (
                    zones.map(zone => (
                        <div key={zone.id} className="bg-slate-50/50 dark:bg-[#0f172a]/50 border border-slate-200 dark:border-slate-800 rounded-3xl p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-black text-slate-800 dark:text-white">{zone.name}</h3>
                                <button
                                    onClick={() => handleDeleteZone(zone.id)}
                                    className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 flex items-center justify-center dark:hover:bg-rose-500/20 p-2 rounded-xl transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                                {zone.tables?.length > 0 ? (
                                    zone.tables.map((table: any) => (
                                        <div key={table.id} className="group relative bg-white dark:bg-[#0B1220] border border-slate-200 dark:border-slate-700 p-4 rounded-2xl flex flex-col items-center shadow-sm hover:border-amber-400 dark:hover:border-amber-500 transition-all cursor-crosshair">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 mb-2 flex items-center justify-center">
                                                <span className="text-lg">🍽️</span>
                                            </div>
                                            <span className="font-bold text-slate-800 dark:text-white text-sm">{table.name}</span>
                                            
                                            <button 
                                              onClick={() => handleDeleteTable(table.id)}
                                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-rose-100 dark:bg-rose-900/50 text-rose-600 transition-opacity"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full py-4 text-center text-sm text-slate-400 dark:text-slate-500 italic">
                                        Bu alana ait masa bulunmuyor.
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
