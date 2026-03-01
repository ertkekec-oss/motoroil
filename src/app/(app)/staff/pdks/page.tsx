"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import {
    ShieldCheck,
    RefreshCw,
    Plus,
    AlertTriangle,
    TabletSmartphone,
    History,
    Check,
    CheckCircle2,
    X,
    Info,
    Smartphone,
    MapPin,
    Clock,
    User,
    Wifi
} from "lucide-react";

export default function AdminPdksPage() {
    const { theme } = useTheme();
    const isLight = theme === 'light';

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

    // Styling constants
    const bgPage = isLight ? 'min-h-screen bg-slate-50' : 'min-h-screen bg-[#020617] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/40 via-[#020617] to-[#020617]';
    const textMain = isLight ? 'text-slate-900' : 'text-slate-100';
    const textMuted = isLight ? 'text-slate-500' : 'text-slate-400';
    const bgCard = isLight ? 'bg-white border-slate-200' : 'bg-[#0f172a] border-white/5';
    const bgSurface = isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#1e293b] border-white/5';
    const borderColor = isLight ? 'border-slate-200' : 'border-white/5';

    if (loading) return (
        <div className={`${bgPage} flex flex-col items-center justify-center p-20 animate-in fade-in duration-700`}>
            <div className={`w-12 h-12 rounded-full border-4 border-t-blue-600 animate-spin mb-4 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}></div>
            <div className={`text-[12px] font-bold uppercase tracking-widest ${textMuted}`}>Güvenlik Paneli Yükleniyor...</div>
        </div>
    );

    const pendingEvents = events.filter(e => e.status === "PENDING");

    return (
        <div data-pos-theme={theme} className={`${bgPage} font-sans transition-colors duration-300 p-6 md:p-10 animate-in fade-in duration-700`}>
            <div className="max-w-[1400px] mx-auto space-y-8">

                {/* Executive Header Strip */}
                <header className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b ${borderColor}`}>
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center shadow-sm ${isLight ? 'bg-blue-50 text-blue-600' : 'bg-blue-500/10 text-blue-400'}`}>
                            <ShieldCheck size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h1 className={`text-[28px] font-bold tracking-tight mb-1 ${textMain}`}>
                                Workforce Security Control
                            </h1>
                            <p className={`text-[13px] font-medium flex items-center gap-2 ${textMuted}`}>
                                <TabletSmartphone size={14} /> Donanımsız Personel Takip Sistemi Yönetimi
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchData}
                            disabled={isRefreshing}
                            className={`w-10 h-10 rounded-[12px] flex items-center justify-center transition-all border ${isLight ? 'bg-white border-slate-200 text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200' : 'bg-transparent border-white/10 text-slate-400 hover:bg-blue-500/10 hover:text-blue-400 hover:border-blue-500/20'} disabled:opacity-50`}
                            title="Yenile"
                        >
                            <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
                        </button>
                        {activeTab === "tabletler" && (
                            <button
                                onClick={handleOpenCreate}
                                className={`h-10 px-4 rounded-[12px] text-[13px] font-semibold transition-all shadow-sm flex items-center gap-2 ${isLight ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-600 text-white hover:bg-blue-500'}`}
                            >
                                <Plus size={16} strokeWidth={3} /> Yeni Terminal
                            </button>
                        )}
                    </div>
                </header>

                {/* Premium Segmented Control */}
                <div className={`flex items-center p-1.5 rounded-full w-fit max-w-full overflow-x-auto custom-scrollbar ${bgSurface}`}>
                    {[
                        { id: "onay", label: "Onay Havuzu", icon: AlertTriangle, count: pendingEvents.length },
                        { id: "tabletler", label: "Tablet Yönetimi", icon: TabletSmartphone },
                        { id: "loglar", label: "Tüm Hareketler", icon: History }
                    ].map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] transition-all whitespace-nowrap ${isActive
                                    ? (isLight ? 'bg-blue-100 text-blue-700 font-semibold shadow-sm' : 'bg-blue-500/20 text-blue-400 font-semibold')
                                    : (isLight ? 'text-slate-500 font-medium hover:bg-slate-200/50' : 'text-slate-400 font-medium hover:bg-white/5')
                                    }`}
                            >
                                <tab.icon size={16} />
                                {tab.label}
                                {tab.id === "onay" && tab.count! > 0 && (
                                    <span className={`ml-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${isActive ? (isLight ? 'bg-blue-200 text-blue-800' : 'bg-blue-500/30 text-blue-200') : (isLight ? 'bg-slate-200 text-slate-600' : 'bg-white/10 text-slate-300')}`}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Content Container */}
                <div className="space-y-6">
                    {activeTab === "onay" && (
                        <div className={`rounded-[24px] border p-8 md:p-10 shadow-sm ${bgCard}`}>
                            {pendingEvents.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 opacity-60">
                                    <div className={`w-16 h-16 rounded-[16px] flex items-center justify-center mb-4 ${isLight ? 'bg-emerald-50 text-emerald-600' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                        <CheckCircle2 size={32} />
                                    </div>
                                    <h3 className={`text-[16px] font-semibold ${textMain}`}>Bekleyen Onay Yok</h3>
                                    <p className={`text-[13px] mt-1 ${textMuted}`}>Tüm personel hareketleri onaylanmış durumda.</p>
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    <div className="mb-2 flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full bg-amber-500 animate-pulse`}></span>
                                        <h3 className={`text-[14px] font-semibold ${textMain}`}>Bekleyen İşlemler ({pendingEvents.length})</h3>
                                    </div>
                                    {pendingEvents.map(ev => (
                                        <div key={ev.id} className={`p-5 rounded-[16px] border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${isLight ? 'bg-slate-50 border-slate-200 hover:border-blue-300 hover:shadow-sm' : 'bg-white/[0.02] border-white/5 hover:border-blue-500/30'}`}>
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center font-bold text-[14px] shadow-sm ${isLight ? 'bg-white border border-slate-200 text-slate-700' : 'bg-slate-800 border border-slate-700 text-slate-300'}`}>
                                                    {ev.staff?.name?.charAt(0) || <User size={16} />}
                                                </div>
                                                <div>
                                                    <h4 className={`text-[15px] font-semibold ${textMain}`}>{ev.staff?.name}</h4>
                                                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                                        <span className={`px-2 py-0.5 rounded-[6px] text-[10px] font-bold uppercase tracking-wide border ${ev.type === 'SHIFT_START' ? (isLight ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-blue-500/10 text-blue-400 border-blue-500/20') : (isLight ? 'bg-white text-slate-600 border-slate-200' : 'bg-slate-800 text-slate-400 border-slate-700')}`}>
                                                            {ev.type === 'SHIFT_START' ? 'Giriş' : 'Çıkış'} • {ev.mode}
                                                        </span>
                                                        {ev.riskFlags?.length > 0 && (
                                                            <span className={`px-2 py-0.5 rounded-[6px] text-[10px] font-bold uppercase tracking-wide border flex items-center gap-1 ${isLight ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                                                                <AlertTriangle size={10} /> {ev.riskFlags.join(", ")}
                                                            </span>
                                                        )}
                                                        <span className={`text-[11px] font-medium flex items-center gap-1 ${textMuted}`}>
                                                            <Clock size={12} /> {new Date(ev.serverTime).toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                                <button
                                                    onClick={() => handleApprove(ev.id, "REJECTED")}
                                                    className={`flex-1 sm:flex-none h-10 px-4 rounded-[10px] text-[13px] font-semibold border transition-all flex items-center justify-center gap-2 ${isLight ? 'bg-white border-rose-200 text-rose-600 hover:bg-rose-50' : 'bg-transparent border-rose-500/30 text-rose-400 hover:bg-rose-500/10'}`}
                                                >
                                                    <X size={16} /> Reddet
                                                </button>
                                                <button
                                                    onClick={() => handleApprove(ev.id, "APPROVED")}
                                                    className={`flex-[2] sm:flex-none h-10 px-6 rounded-[10px] text-[13px] font-semibold transition-all flex items-center justify-center gap-2 ${isLight ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm' : 'bg-emerald-600 text-emerald-50 hover:bg-emerald-500'}`}
                                                >
                                                    <Check size={16} /> Onayla
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "tabletler" && (
                        <div className="space-y-8">
                            {/* Tablet Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {displays.map(disp => (
                                    <div key={disp.id} className={`rounded-[18px] border shadow-sm p-6 flex flex-col relative transition-all ${bgCard}`}>
                                        <div className={`absolute top-6 right-6 w-2.5 h-2.5 rounded-full ${disp.isActive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-400'}`} title={disp.isActive ? "Aktif" : "Pasif"} />

                                        <div className="flex items-center gap-4 mb-6">
                                            <div className={`w-12 h-12 rounded-[12px] flex items-center justify-center border ${isLight ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'}`}>
                                                <TabletSmartphone size={24} />
                                            </div>
                                            <div>
                                                <h3 className={`text-[15px] font-bold ${textMain}`}>{disp.name}</h3>
                                                <div className={`text-[11px] font-medium uppercase tracking-wide flex items-center gap-1 mt-0.5 ${textMuted}`}>
                                                    <MapPin size={10} /> Site ID: {disp.siteId}
                                                </div>
                                            </div>
                                        </div>

                                        <div className={`p-5 rounded-[14px] border mb-6 flex-1 ${bgSurface}`}>
                                            <p className={`text-[11px] font-semibold uppercase tracking-wide mb-1 opacity-70 ${textMuted}`}>Eşleştirme Kodu</p>
                                            <p className={`text-[24px] font-black tracking-widest font-mono ${textMain}`}>{disp.pairingCode}</p>

                                            {disp.announcement && (
                                                <div className={`mt-4 pt-4 border-t ${borderColor}`}>
                                                    <p className={`text-[10px] font-bold uppercase tracking-wide mb-1 ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>Aktif Duyuru</p>
                                                    <p className={`text-[12px] leading-relaxed line-clamp-2 ${textMuted}`}>{disp.announcement}</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-3 mt-auto">
                                            <button
                                                onClick={() => handleOpenEdit(disp)}
                                                className={`w-full h-10 border rounded-[10px] text-[12px] font-semibold transition-all ${isLight ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50' : 'bg-[#1e293b] border-white/10 text-slate-300 hover:bg-white/5'}`}
                                            >
                                                Cihazı Yapılandır
                                            </button>
                                            <div className="flex items-center justify-between px-1">
                                                <span className={`text-[10px] font-semibold flex items-center gap-1 ${textMuted}`}>
                                                    <Wifi size={10} /> IP: {disp.lastPublicIp || "Bağlanmadı"}
                                                </span>
                                                <button
                                                    onClick={() => handleDeleteDisplay(disp.id)}
                                                    className={`text-[11px] font-semibold transition-colors ${isLight ? 'text-slate-400 hover:text-red-500' : 'text-slate-500 hover:text-red-400'}`}
                                                >
                                                    Kaldır
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {displays.length === 0 && (
                                    <div className="col-span-full py-16 text-center border-2 border-dashed rounded-[18px] opacity-60 flex flex-col items-center">
                                        <TabletSmartphone size={32} className={`mb-3 ${textMuted}`} />
                                        <h3 className={`text-[15px] font-semibold ${textMain}`}>Kayıtlı Terminal Yok</h3>
                                        <p className={`text-[13px] mt-1 ${textMuted}`}>Sisteme yeni bir terminal cihazı ekleyerek başlayın.</p>
                                    </div>
                                )}
                            </div>

                            {/* Usage Instructions */}
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className={`p-8 rounded-[20px] border shadow-sm ${bgCard}`}>
                                    <h3 className={`text-[16px] font-bold mb-5 flex items-center gap-3 ${textMain}`}>
                                        <div className={`w-8 h-8 rounded-[8px] flex items-center justify-center text-[13px] font-bold ${isLight ? 'bg-blue-100 text-blue-700' : 'bg-blue-500/20 text-blue-400'}`}>1</div>
                                        Terminal Kurulumu
                                    </h3>
                                    <div className="space-y-5">
                                        <div className="flex gap-4">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                                            <div>
                                                <p className={`text-[12px] font-bold uppercase tracking-wide mb-1 ${textMain}`}>BİNA GİRİŞ EKRANI</p>
                                                <p className={`text-[13px] leading-relaxed mb-3 ${textMuted}`}>
                                                    Kurulum yapacağınız terminal (tablet / akıllı ekran) cihazından aşağıdaki bağlantıyı açın:
                                                </p>
                                                <code className={`block p-3 rounded-[10px] border text-[13px] font-bold font-mono break-all select-all ${isLight ? 'bg-slate-50 border-slate-200 text-blue-600' : 'bg-black/20 border-white/10 text-blue-400'}`}>
                                                    {window.location.origin}/pdks/display
                                                </code>
                                            </div>
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                                            <div>
                                                <p className={`text-[12px] font-bold uppercase tracking-wide mb-1 ${textMain}`}>CİHAZ EŞLEŞTİRME</p>
                                                <p className={`text-[13px] leading-relaxed ${textMuted}`}>
                                                    Ekranda beliren uyarı kutusuna, yukarıda oluşturduğunuz terminalin <b>8 haneli kodunu</b> girerek bağlantıyı tamamlayın.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className={`p-8 rounded-[20px] border shadow-sm ${bgCard}`}>
                                    <h3 className={`text-[16px] font-bold mb-5 flex items-center gap-3 ${textMain}`}>
                                        <div className={`w-8 h-8 rounded-[8px] flex items-center justify-center text-[13px] font-bold ${isLight ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-500/20 text-emerald-400'}`}>2</div>
                                        Personel İşlemi
                                    </h3>
                                    <div className="space-y-5">
                                        <p className={`text-[13px] leading-relaxed ${textMuted}`}>
                                            Personelleriniz kendi mobil cihazlarındaki Dashboard üzerinden <strong className={textMain}>PDKS</strong> butonuna basarak, terminaldeki QR kodu okuturlar.
                                        </p>
                                        <div className={`p-5 rounded-[12px] border ${bgSurface}`}>
                                            <h4 className={`text-[11px] font-bold uppercase tracking-widest mb-3 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>GÜVENLİK METRİKLERİ</h4>
                                            <ul className="space-y-2.5">
                                                <li className={`flex items-start gap-2 text-[12px] font-medium ${textMain}`}>
                                                    <CheckCircle2 size={14} className={`mt-0.5 ${isLight ? 'text-emerald-500' : 'text-emerald-400'}`} /> Dinamik 8 saniyelik QR kod (Kopya Engeli)
                                                </li>
                                                <li className={`flex items-start gap-2 text-[12px] font-medium ${textMain}`}>
                                                    <CheckCircle2 size={14} className={`mt-0.5 ${isLight ? 'text-emerald-500' : 'text-emerald-400'}`} /> Cihaz parmak izi (Fingerprint) kontrolü
                                                </li>
                                                <li className={`flex items-start gap-2 text-[12px] font-medium ${textMain}`}>
                                                    <CheckCircle2 size={14} className={`mt-0.5 ${isLight ? 'text-emerald-500' : 'text-emerald-400'}`} /> IP Mismatch ve GPS lokasyon mesafe denetimi
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "loglar" && (
                        <div className={`rounded-[20px] border shadow-sm overflow-hidden ${bgCard}`}>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[800px]">
                                    <thead>
                                        <tr className={`border-b ${borderColor} ${bgSurface}`}>
                                            <th className={`px-6 py-4 text-[11px] font-bold uppercase tracking-wider ${textMuted}`}>Personel</th>
                                            <th className={`px-6 py-4 text-[11px] font-bold uppercase tracking-wider ${textMuted}`}>İşlem Tipi</th>
                                            <th className={`px-6 py-4 text-[11px] font-bold uppercase tracking-wider ${textMuted}`}>Konum / Ağ</th>
                                            <th className={`px-6 py-4 text-[11px] font-bold uppercase tracking-wider ${textMuted}`}>Zaman (Sunucu)</th>
                                            <th className={`px-6 py-4 text-[11px] font-bold uppercase tracking-wider ${textMuted}`}>Durum</th>
                                        </tr>
                                    </thead>
                                    <tbody className={`divide-y ${borderColor}`}>
                                        {events.map((ev) => (
                                            <tr key={ev.id} className={`transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-white/[0.02]'}`}>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-[8px] flex items-center justify-center font-bold text-[12px] ${isLight ? 'bg-slate-100 text-slate-600' : 'bg-slate-800 text-slate-300'}`}>
                                                            {ev.staff?.name?.charAt(0) || <User size={12} />}
                                                        </div>
                                                        <span className={`text-[13px] font-semibold ${textMain}`}>{ev.staff?.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1 items-start">
                                                        <span className={`px-2 py-0.5 rounded-[6px] text-[10px] font-bold uppercase tracking-wide border ${ev.type === 'SHIFT_START' ? (isLight ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-blue-500/10 text-blue-400 border-blue-500/20') : (isLight ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-slate-800 text-slate-400 border-slate-700')}`}>
                                                            {ev.type === 'SHIFT_START' ? 'MESAi BAŞI' : 'MESAİ SONU'}
                                                        </span>
                                                        <span className={`text-[10px] font-semibold uppercase ${textMuted}`}>{ev.mode}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <span className={`text-[11px] font-medium flex items-center gap-1 ${textMain}`}>
                                                            <Wifi size={10} className={textMuted} /> {ev.requestPublicIp || "-"}
                                                        </span>
                                                        {ev.lat && (
                                                            <span className={`text-[10px] font-medium flex items-center gap-1 ${textMuted}`}>
                                                                <MapPin size={10} /> {ev.lat.toFixed(4)}, {ev.lng.toFixed(4)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <span className={`text-[12px] font-medium ${textMain}`}>
                                                            {new Date(ev.serverTime).toLocaleDateString('tr-TR')}
                                                        </span>
                                                        <span className={`text-[11px] font-medium ${textMuted}`}>
                                                            {new Date(ev.serverTime).toLocaleTimeString('tr-TR')}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {ev.status === 'APPROVED' ? (
                                                        <span className={`px-2.5 py-1 rounded-[6px] text-[10px] font-bold uppercase tracking-widest border ${isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>ONAYLI</span>
                                                    ) : ev.status === 'REJECTED' ? (
                                                        <span className={`px-2.5 py-1 rounded-[6px] text-[10px] font-bold uppercase tracking-widest border ${isLight ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>REDDEDİLDİ</span>
                                                    ) : (
                                                        <span className={`px-2.5 py-1 rounded-[6px] text-[10px] font-bold uppercase tracking-widest border animate-pulse ${isLight ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>BEKLİYOR</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {events.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-12 text-center">
                                                    <span className={`text-[13px] font-medium ${textMuted}`}>Kayıt bulunamadı.</span>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Compliance Info Bar */}
                <div className={`mt-10 p-4 rounded-[12px] border flex items-start sm:items-center gap-3 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.02] border-white/5'}`}>
                    <Info size={16} className={`shrink-0 ${textMuted}`} />
                    <p className={`text-[12px] font-medium ${textMuted}`}>
                        Sistem üzerindeki tüm personel takip verileri KVKK standartlarına uygun olarak şifrelenir ve loglanır. IP Address ve Geolocation risk metrikleri Fraud tespit algoritmasıyla otomatik hesaplanmaktadır.
                    </p>
                </div>

            </div>

            {/* Modal for Creating/Editing Display */}
            {isModalOpen && (
                <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200 ${isLight ? 'bg-slate-900/40' : 'bg-slate-900/60'}`}>
                    <div className={`w-full max-w-lg overflow-hidden rounded-[24px] border shadow-2xl ${isLight ? 'bg-white border-slate-200' : 'bg-[#0f172a] border-white/10'}`}>
                        <div className="p-6 md:p-8">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className={`text-[20px] font-bold tracking-tight mb-1 ${textMain}`}>
                                        {editingDisplay ? "Cihazı Yapılandır" : "Yeni Terminal Tanımla"}
                                    </h2>
                                    <p className={`text-[11px] font-bold uppercase tracking-widest ${textMuted}`}>PDKS GİRİŞ NOKTASI YAPILANDIRMASI</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className={`w-8 h-8 rounded-[8px] flex items-center justify-center transition-all ${isLight ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-white/10 text-slate-400'}`}>
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <label className={`block text-[11px] font-bold uppercase tracking-wide ml-1 ${textMuted}`}>Cihaz İsmi <span className="text-rose-500">*</span></label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Örn: Merkez Bina Ana Giriş"
                                        className={`w-full h-[48px] px-4 rounded-[12px] border text-[13px] font-semibold transition-all outline-none shadow-sm ${isLight ? 'bg-white border-slate-200 focus:border-blue-500 text-slate-900 placeholder:text-slate-400' : 'bg-white/[0.02] border-white/10 focus:border-blue-500/50 text-white placeholder:text-slate-500'}`}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className={`block text-[11px] font-bold uppercase tracking-wide ml-1 ${textMuted}`}>Ekran Duyurusu (Opsiyonel)</label>
                                    <textarea
                                        rows={3}
                                        value={formData.announcement}
                                        onChange={(e) => setFormData({ ...formData, announcement: e.target.value })}
                                        placeholder="Personeller için ekranda görünecek önemli bir not yazın..."
                                        className={`w-full p-4 rounded-[12px] border text-[13px] font-medium transition-all outline-none shadow-sm resize-none ${isLight ? 'bg-white border-slate-200 focus:border-blue-500 text-slate-900 placeholder:text-slate-400' : 'bg-white/[0.02] border-white/10 focus:border-blue-500/50 text-white placeholder:text-slate-500'}`}
                                    />
                                </div>

                                <label className={`flex items-start gap-3 p-4 rounded-[12px] border cursor-pointer transition-all ${isLight ? 'bg-slate-50 border-slate-200 hover:bg-slate-100' : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.04]'}`}>
                                    <div className="mt-0.5 relative flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={formData.isActive}
                                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                            className="peer w-5 h-5 opacity-0 absolute cursor-pointer"
                                        />
                                        <div className={`w-5 h-5 rounded-[6px] border flex items-center justify-center transition-all ${formData.isActive ? 'bg-blue-600 border-blue-600 text-white' : (isLight ? 'bg-white border-slate-300' : 'bg-transparent border-slate-600')}`}>
                                            {formData.isActive && <Check size={12} strokeWidth={3} />}
                                        </div>
                                    </div>
                                    <div>
                                        <div className={`text-[13px] font-semibold ${textMain}`}>Terminal Aktif</div>
                                        <div className={`text-[11px] font-medium mt-0.5 ${textMuted}`}>Cihaz açıkken ekranda dinamik QR kodu üretmeye devam eder.</div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div className={`p-6 border-t flex items-center gap-3 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0b1120] border-white/10'}`}>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className={`flex-1 h-12 rounded-[12px] font-bold text-[13px] border transition-all ${isLight ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50' : 'bg-transparent border-white/10 text-slate-300 hover:bg-white/5'}`}
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleSaveDisplay}
                                className={`flex-1 h-12 rounded-[12px] font-bold text-[13px] text-white transition-all shadow-sm ${isLight ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-500'}`}
                            >
                                Ayarları Kaydet
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.3); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(148, 163, 184, 0.5); }
                [data-pos-theme="dark"] .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); }
                [data-pos-theme="dark"] .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
            `}</style>
        </div>
    );
}
