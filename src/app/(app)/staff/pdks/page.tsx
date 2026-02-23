"use client";

import React, { useState, useEffect } from "react";
import {
    IconDeviceTablet,
    IconCheck,
    IconX,
    IconAlertTriangle,
    IconInfoCircle,
    IconPlus,
    IconRefresh,
    IconHistory,
    IconShieldCheck
} from "@/components/icons/PremiumIcons";
import { toast } from "sonner";

export default function AdminPdksPage() {
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<"onay" | "tabletler" | "loglar">("onay");
    const [displays, setDisplays] = useState<any[]>([]);
    const [events, setEvents] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDisplay, setEditingDisplay] = useState<any>(null);
    const [formData, setFormData] = useState({ name: "", announcement: "", isActive: true });

    const fetchData = async () => {
        setIsRefreshing(true);
        try {
            const [evRes, dispRes] = await Promise.all([
                fetch("/api/admin/pdks/events"),
                fetch("/api/admin/pdks/displays")
            ]);

            const evData = await evRes.json();
            const dispData = await dispRes.json();

            if (evData.success) setEvents(evData.events);
            if (dispData.success) setDisplays(dispData.displays);
        } catch (error) {
            toast.error("Veriler alınamadı");
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpenCreate = () => {
        setEditingDisplay(null);
        setFormData({ name: "", announcement: "", isActive: true });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (disp: any) => {
        setEditingDisplay(disp);
        setFormData({ name: disp.name, announcement: disp.announcement || "", isActive: disp.isActive });
        setIsModalOpen(true);
    };

    const handleSaveDisplay = async () => {
        if (!formData.name) {
            toast.error("İsim gereklidir");
            return;
        }

        try {
            const method = editingDisplay ? "PATCH" : "POST";
            const body = editingDisplay
                ? { id: editingDisplay.id, ...formData }
                : { name: formData.name };

            const res = await fetch("/api/admin/pdks/displays", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            const data = await res.json();
            if (data.success) {
                toast.success(editingDisplay ? "Tablet güncellendi" : "Tablet eklendi");
                setIsModalOpen(false);
                fetchData();
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("İşlem başarısız");
        }
    };

    const handleApprove = async (eventId: string, status: "APPROVED" | "REJECTED") => {
        try {
            const res = await fetch("/api/admin/pdks/events/approve", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ eventId, status })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(status === "APPROVED" ? "Onaylandı" : "Reddedildi");
                fetchData();
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("İşlem başarısız");
        }
    };

    const handleDeleteDisplay = async (id: string) => {
        if (!confirm("Bu tableti silmek istediğinize emin misiniz?")) return;
        try {
            const res = await fetch(`/api/admin/pdks/displays?id=${id}`, { method: "DELETE" });
            const data = await res.json();
            if (data.success) {
                toast.success("Tablet silindi");
                fetchData();
            }
        } catch (error) {
            toast.error("Silme işlemi başarısız");
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto font-sans animate-in fade-in duration-700">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center">
                            <IconShieldCheck className="w-6 h-6 text-indigo-500" />
                        </div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tighter">
                            PDKS <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-violet-500">Kontrol Paneli</span>
                        </h1>
                    </div>
                    <p className="text-slate-500 text-sm font-bold uppercase tracking-widest pl-1">Donanımsız Personel Takip Sistemi Yönetimi</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchData}
                        disabled={isRefreshing}
                        className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all text-slate-500 disabled:opacity-50"
                    >
                        <IconRefresh className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </button>
                    {activeTab === "tabletler" && (
                        <button
                            onClick={handleOpenCreate}
                            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:-translate-y-1 transition-all"
                        >
                            <IconPlus className="w-4 h-4" />
                            Yeni Tablet Ekle
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 mb-8 bg-slate-100 p-1.5 rounded-3xl w-fit border border-slate-200">
                {[
                    { id: "onay", label: "Onay Havuzu", icon: IconAlertTriangle },
                    { id: "tabletler", label: "Tablet Yönetimi", icon: IconDeviceTablet },
                    { id: "loglar", label: "Tüm Hareketler", icon: IconHistory }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === tab.id
                            ? "bg-white text-indigo-600 shadow-sm"
                            : "text-slate-500 hover:text-slate-800"
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                        {tab.id === "onay" && events.filter(e => e.status === "PENDING").length > 0 && (
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse ml-1" />
                        )}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="h-64 flex items-center justify-center text-slate-400 font-bold animate-pulse uppercase tracking-[0.2em] text-xs">Veriler Hazırlanıyor...</div>
            ) : (
                <div className="space-y-8">
                    {activeTab === "onay" && (
                        <div className="grid gap-4">
                            {events.filter(e => e.status === "PENDING").length === 0 ? (
                                <div className="bg-white border border-slate-100 border-dashed rounded-[2.5rem] p-16 text-center">
                                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <IconCheck className="w-8 h-8 text-emerald-500" />
                                    </div>
                                    <p className="text-slate-500 font-black text-sm uppercase tracking-widest">Bekleyen onay bulunmuyor</p>
                                </div>
                            ) : (
                                events.filter(e => e.status === "PENDING").map(ev => (
                                    <div key={ev.id} className="bg-white border border-slate-200 p-6 rounded-[2.5rem] flex items-center justify-between group hover:shadow-2xl hover:shadow-indigo-500/5 transition-all">
                                        <div className="flex items-center gap-6">
                                            <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center text-white font-black text-lg">
                                                {ev.staff?.name?.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="font-black text-slate-800 tracking-tight text-lg">{ev.staff?.name}</h3>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-[10px] font-black uppercase bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">{ev.mode}</span>
                                                    <span className="text-[10px] font-black uppercase text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                                                        <IconAlertTriangle className="w-3 h-3" />
                                                        {ev.riskFlags?.join(", ")}
                                                    </span>
                                                    <span className="text-slate-400 text-[10px] font-bold uppercase">{new Date(ev.serverTime).toLocaleString('tr-TR')}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleApprove(ev.id, "REJECTED")}
                                                className="p-4 bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-100 transition-all"
                                            >
                                                <IconX className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleApprove(ev.id, "APPROVED")}
                                                className="flex items-center gap-2 px-8 py-4 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all"
                                            >
                                                <IconCheck className="w-5 h-5" />
                                                ONAYLA
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === "tabletler" && (
                        <div className="space-y-12">
                            {/* Tablet Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {displays.map(disp => (
                                    <div key={disp.id} className="bg-white border border-slate-200 p-8 rounded-[3.5rem] relative group hover:shadow-2xl hover:shadow-indigo-500/5 transition-all flex flex-col">
                                        <div className={`absolute top-8 right-8 w-3 h-3 rounded-full ${disp.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />

                                        <div className="w-16 h-16 bg-indigo-50 rounded-3xl flex items-center justify-center mb-6">
                                            <IconDeviceTablet className="w-8 h-8 text-indigo-500" />
                                        </div>

                                        <h3 className="text-xl font-black text-slate-800 mb-1">{disp.name}</h3>
                                        <div className="flex items-center gap-2 mb-4">
                                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Sitede: {disp.siteId}</span>
                                        </div>

                                        <div className="bg-slate-50 p-6 rounded-3xl border border-dashed border-slate-200 mb-6 flex-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Eşleştirme Kodu</p>
                                            <p className="text-2xl font-black text-slate-800 tracking-[0.3em] font-mono mb-4">{disp.pairingCode}</p>

                                            {disp.announcement && (
                                                <div className="mt-4 pt-4 border-t border-slate-200">
                                                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">Aktif Duyuru</p>
                                                    <p className="text-xs text-slate-600 line-clamp-2">{disp.announcement}</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-3">
                                            <button
                                                onClick={() => handleOpenEdit(disp)}
                                                className="w-full py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all"
                                            >
                                                Tableti Düzenle
                                            </button>
                                            <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest pt-2">
                                                <span>IP: {disp.lastPublicIp || "-"}</span>
                                                <button
                                                    onClick={() => handleDeleteDisplay(disp.id)}
                                                    className="text-rose-400 hover:text-rose-600 transition-colors"
                                                >
                                                    Cihazı Kaldır
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Usage Instructions & Links */}
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="bg-indigo-900/5 border border-indigo-500/10 p-10 rounded-[3.5rem]">
                                    <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
                                        <div className="w-8 h-8 bg-indigo-500 text-white rounded-xl flex items-center justify-center text-xs">1</div>
                                        Terminalleri Hazırlayın
                                    </h3>
                                    <div className="space-y-6">
                                        <div className="flex gap-4">
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
                                            <div>
                                                <p className="font-black text-slate-800 text-sm mb-1 uppercase tracking-tight">EKRAN LİNKİ</p>
                                                <p className="text-slate-500 text-sm leading-relaxed mb-3">
                                                    Herhangi bir tabletten veya akıllı ekrandan aşağıdaki linki açın:
                                                </p>
                                                <code className="block p-4 bg-white border border-indigo-200 rounded-2xl text-indigo-600 font-bold text-sm break-all select-all shadow-sm">
                                                    {window.location.origin}/pdks/display
                                                </code>
                                            </div>
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
                                            <div>
                                                <p className="font-black text-slate-800 text-sm mb-1 uppercase tracking-tight">CİHAZ EŞLEŞTİRME</p>
                                                <p className="text-slate-500 text-sm leading-relaxed">
                                                    Ekran açıldığında karşınıza çıkan kutuya buradaki <b>PDKS-XXXX</b> kodunu girerek terminali sisteme bağlayın.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-900 border border-slate-800 p-10 rounded-[3.5rem] text-white">
                                    <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                                        <div className="w-8 h-8 bg-emerald-500 text-slate-900 rounded-xl flex items-center justify-center text-xs">2</div>
                                        Personel Girişi
                                    </h3>
                                    <div className="space-y-6">
                                        <p className="text-slate-400 text-sm leading-relaxed">
                                            Personelleriniz mobil uygulama üzerinden "Dashboard" ekranındaki PDKS butonuna basarak ekrandaki QR kodu okutabilirler.
                                        </p>
                                        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
                                            <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-4">GÜVENLİK ÖZELLİKLERİ</h4>
                                            <ul className="space-y-3">
                                                <li className="flex items-center gap-3 text-xs font-bold text-slate-300">
                                                    <IconCheck className="w-4 h-4 text-emerald-500" /> Dinamik 8 saniyelik QR kod değişimi
                                                </li>
                                                <li className="flex items-center gap-3 text-xs font-bold text-slate-300">
                                                    <IconCheck className="w-4 h-4 text-emerald-500" /> Cihaz parmak izi (Fingerprint) kontrolü
                                                </li>
                                                <li className="flex items-center gap-3 text-xs font-bold text-slate-300">
                                                    <IconCheck className="w-4 h-4 text-emerald-500" /> IP Mismatch ve GPS mesafe denetimi
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "loglar" && (
                        <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest w-64">Personel</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tip / Mod</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">IP / Konum</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Zaman</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Durum</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {events.map((ev) => (
                                        <tr key={ev.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-black text-slate-500">
                                                        {ev.staff?.name?.charAt(0)}
                                                    </div>
                                                    <span className="font-black text-slate-800 text-sm tracking-tight">{ev.staff?.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col gap-1">
                                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded w-fit ${ev.type === 'SHIFT_START' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-600'}`}>{ev.type}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase">{ev.mode}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[10px] font-bold text-slate-600">{ev.requestPublicIp || "-"}</span>
                                                    {ev.lat && <span className="text-[9px] font-bold text-slate-400">{ev.lat.toFixed(4)}, {ev.lng.toFixed(4)}</span>}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="text-[10px] font-bold text-slate-500">{new Date(ev.serverTime).toLocaleString('tr-TR')}</span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2">
                                                    {ev.status === 'APPROVED' ? (
                                                        <span className="text-[9px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-widest">ONAYLI</span>
                                                    ) : ev.status === 'REJECTED' ? (
                                                        <span className="text-[9px] font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded uppercase tracking-widest">REDDEDİLDİ</span>
                                                    ) : (
                                                        <span className="text-[9px] font-black text-amber-500 bg-amber-50 px-2 py-0.5 rounded uppercase tracking-widest animate-pulse">BEKLİYOR</span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Modal for Creating/Editing Display */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl shadow-indigo-500/10 overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-300">
                        <div className="p-10">
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">
                                {editingDisplay ? "Tableti Düzenle" : "Yeni Tablet Tanımla"}
                            </h2>
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-8">PDKS GİRİŞ NOKTASI YAPILANDIRMASI</p>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 px-1">Cihaz İsmi</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Örn: Merkez Bina Girişi"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 font-bold text-slate-700 focus:border-indigo-500 outline-none transition-all shadow-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 px-1">Ekran Duyurusu (Opsiyonel)</label>
                                    <textarea
                                        rows={4}
                                        value={formData.announcement}
                                        onChange={(e) => setFormData({ ...formData, announcement: e.target.value })}
                                        placeholder="Personeller için önemli bir not yazın..."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 font-bold text-slate-700 focus:border-indigo-500 outline-none transition-all shadow-sm resize-none"
                                    />
                                </div>

                                <div className="flex items-center gap-3 bg-slate-100/50 p-4 rounded-3xl">
                                    <input
                                        type="checkbox"
                                        id="isActive"
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                        className="w-5 h-5 accent-indigo-500"
                                    />
                                    <label htmlFor="isActive" className="text-xs font-black text-slate-600 uppercase tracking-widest cursor-pointer">
                                        Tablet Aktif (QR Üretilebilir)
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-slate-50 flex items-center gap-4 border-t border-slate-200">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all"
                            >
                                Vazgeç
                            </button>
                            <button
                                onClick={handleSaveDisplay}
                                className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:-translate-y-1 active:scale-95 transition-all"
                            >
                                Ayarları Kaydet
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Support Tooltip */}
            <div className="mt-12 flex items-center justify-center gap-2 text-slate-400 p-8 border-t border-slate-100">
                <IconInfoCircle className="w-4 h-4" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-center max-w-2xl leading-relaxed">
                    Tüm PDKS verileri KVKK uyumlu olarak loglanmaktadır. İp mismatch ve lokasyon riskleri sistem tarafından otomatik belirlenir.
                </p>
            </div>
        </div>
    );
}
