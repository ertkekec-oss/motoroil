"use client";

import { useState, useEffect } from 'react';
import {
    IconActivity,
    IconTrendingUp,
    IconClock,
    IconCheck,
    IconAlert,
    IconZap,
    IconShield,
    IconRefresh,
    IconTrash
} from '@/components/icons/PremiumIcons';
import { useApp } from '@/contexts/AppContext';
import dynamic from 'next/dynamic';
const BarcodeScanner = dynamic(() => import('@/components/BarcodeScanner'), { ssr: false });
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

import {
    EnterpriseCard,
    EnterpriseSectionHeader,
    EnterpriseInput,
    EnterpriseTextarea,
    EnterpriseSelect,
    EnterpriseButton
} from '@/components/ui/enterprise';

// --- UI COMPONENTS ---
const ProgressBar = ({ label, value, max, color = "#3b82f6" }: any) => {
    const percentage = Math.min((value / max) * 100, 100);
    return (
        <div className="space-y-2">
            <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest">
                <span className="text-slate-500 dark:text-slate-400">{label}</span>
                <span style={{ color }}>%{percentage.toFixed(0)}</span>
            </div>
            <div className={`h-1.5 w-full bg-slate-100 dark:bg-slate-800/50 rounded-full overflow-hidden`}>
                <div
                    className={`h-full transition-all duration-1000 ease-out`}
                    style={{ width: `${percentage}%`, background: color }}
                />
            </div>
        </div>
    );
};

// --- SUB-PAGES ---

const DashboardView = ({
    handleQrCheckin,
    handleGpsCheckin,
    isScannerOpen,
    setIsScannerOpen,
    onQrScan
}: any) => (
    <div className="space-y-6 animate-in fade-in duration-500">
        {/* Top Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <EnterpriseCard className="p-6 border-l-4" borderLeftColor="#3b82f6">
                <div className="flex justify-between items-start mb-4">
                    <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Performans Skoru</h4>
                    <IconActivity className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">0.0</p>
                <div className="mt-2 flex items-center gap-2 text-[11px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-500/10 w-fit px-2 py-1 rounded">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /> Hesaplanıyor...
                </div>
            </EnterpriseCard>

            <EnterpriseCard className="p-6 border-l-4" borderLeftColor="#8b5cf6">
                <div className="flex justify-between items-start mb-4">
                    <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Hedef Gerçekleşme</h4>
                    <IconTrendingUp className="w-5 h-5 text-purple-500" />
                </div>
                <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">%0</p>
                <p className="text-[11px] font-semibold text-slate-400 mt-2">Bu ayki hedefler</p>
            </EnterpriseCard>

            <EnterpriseCard className="p-6 border-l-4" borderLeftColor="#f59e0b">
                <div className="flex justify-between items-start mb-4">
                    <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Kalan İzin</h4>
                    <IconClock className="w-5 h-5 text-amber-500" />
                </div>
                <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">0 <span className="text-lg text-slate-400 font-bold">Gün</span></p>
                <p className="text-[11px] font-semibold text-slate-400 mt-2">Kullanılabilir bakiye</p>
            </EnterpriseCard>

            <EnterpriseCard className="p-6 border-l-4" borderLeftColor="#ef4444">
                <div className="flex justify-between items-start mb-4">
                    <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Aylık Mesai</h4>
                    <IconZap className="w-5 h-5 text-red-500" />
                </div>
                <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">0 <span className="text-lg text-slate-400 font-bold">Saat</span></p>
                <p className="text-[11px] font-semibold text-slate-400 mt-2">Ekstradan çalışılan süre</p>
            </EnterpriseCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Targets & Performance */}
            <div className="lg:col-span-2">
                <EnterpriseCard className="h-full">
                    <EnterpriseSectionHeader title="Hedefler & Performans" icon="📈" />
                    <div className="p-6 space-y-8">
                        <ProgressBar label="Satış Kotası Gerçekleşme" value={0} max={1000000} color="#3b82f6" />
                        <ProgressBar label="Müşteri Memnuniyeti (NPS)" value={0} max={5} color="#8b5cf6" />
                        <ProgressBar label="Rota Uyumluluk Oranı" value={0} max={100} color="#10b981" />
                        <ProgressBar label="Tahsilat Hedefi" value={0} max={600000} color="#f59e0b" />
                        
                        <div className="mt-8 p-6 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-700/50">
                            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <span className="text-lg">📋</span> Aktif Görevler
                            </h4>
                            <div className="text-center text-sm font-semibold text-slate-400 py-6 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
                                Bekleyen görev bulunmamaktadır.
                            </div>
                        </div>
                    </div>
                </EnterpriseCard>
            </div>

            {/* Shift & Calendar */}
            <div>
                <EnterpriseCard className="h-full">
                    <EnterpriseSectionHeader title="Vardiya & Çalışma" icon="⏰" />
                    <div className="p-6 space-y-6">
                        <div className="p-6 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl text-center">
                            <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2">Şu Anki Vardiya</p>
                            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Belirsiz</p>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Haftalık Akış</h4>
                            <div className="text-center text-sm font-semibold text-slate-400 py-8 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/20">
                                Vardiya planı tanımlanmamış.
                            </div>
                        </div>
                    </div>
                </EnterpriseCard>
            </div>
        </div>

        {/* Payroll Summary & PDKS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <EnterpriseCard>
                <EnterpriseSectionHeader title="Son Bordro Özetleri" icon="🛡️" />
                <div className="p-6">
                    <div className="py-12 text-sm font-semibold text-slate-400 text-center border border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/30">
                        Geçmiş bordro kaydı bulunamadı.
                    </div>
                </div>
            </EnterpriseCard>

            <EnterpriseCard>
                <EnterpriseSectionHeader title="PDKS İşlemleri" icon="⚡" />
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={handleQrCheckin}
                            className="flex flex-col items-center gap-3 p-6 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/20 rounded-xl transition-all group"
                        >
                            <div className="w-12 h-12 bg-indigo-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform">
                                <span className="text-2xl">📱</span>
                            </div>
                            <span className="text-[11px] font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-widest text-center">Ofis Girişi (QR)</span>
                        </button>

                        <button
                            onClick={handleGpsCheckin}
                            className="flex flex-col items-center gap-3 p-6 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/20 rounded-xl transition-all group"
                        >
                            <div className="w-12 h-12 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                                <span className="text-2xl">📍</span>
                            </div>
                            <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest text-center">Saha Girişi (GPS)</span>
                        </button>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" />
                            <div>
                                <h4 className="text-[10px] font-bold text-slate-500 uppercase leading-none mb-1">Cihaz Durumu</h4>
                                <p className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">GÜVENLİ & EŞLEŞMİŞ</p>
                            </div>
                        </div>
                        <button className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest hover:underline bg-blue-50 dark:bg-blue-500/10 px-3 py-1.5 rounded-lg">Senkronize Et</button>
                    </div>

                    <p className="text-[10px] text-slate-400 text-center uppercase font-bold tracking-widest opacity-80">
                        🔒 Loglar uçtan uca şifreli olarak saklanır.
                    </p>
                </div>
            </EnterpriseCard>

            <BarcodeScanner
                isOpen={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
                onScan={onQrScan}
            />
        </div>
    </div>
);

const LeaveRequestView = () => {
    const [type, setType] = useState('YILLIK');

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
            <div className="lg:col-span-1">
                <EnterpriseCard className="h-full">
                    <EnterpriseSectionHeader title="Yeni Talep Oluştur" icon="📝" />
                    <div className="p-6 space-y-5">
                        <EnterpriseSelect 
                            label="İzin Türü" 
                            value={type} 
                            onChange={(e) => setType(e.target.value)}
                        >
                            <option value="YILLIK">Yıllık Ücretli İzin</option>
                            <option value="MAZARET">Mazeret İzni</option>
                            <option value="HASTALIK">Hastalık / Sağlık Raporu</option>
                        </EnterpriseSelect>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <EnterpriseInput label="Başlangıç Tarihi" type="date" />
                            <EnterpriseInput label="Bitiş Tarihi" type="date" />
                        </div>
                        
                        <EnterpriseTextarea 
                            label="Not / Açıklama" 
                            placeholder="İzin nedeninizi kısaca belirtin..." 
                            rows={4}
                        />
                        
                        <EnterpriseButton variant="primary" className="w-full mt-2">
                            TALEBİ GÖNDER
                        </EnterpriseButton>
                    </div>
                </EnterpriseCard>
            </div>

            <div className="lg:col-span-2">
                <EnterpriseCard className="h-full">
                    <EnterpriseSectionHeader title="Geçmiş Taleplerim" icon="🕒" />
                    <div className="p-6">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">
                                        <th className="px-4 py-3">Tür</th>
                                        <th className="px-4 py-3">Tarih Aralığı</th>
                                        <th className="px-4 py-3">Durum</th>
                                        <th className="px-4 py-3">Onaylayan</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td colSpan={4} className="px-4 py-12 text-center text-sm font-semibold text-slate-400 bg-slate-50/50 dark:bg-slate-800/20">
                                            Geçmiş izin talebi kaydı bulunamadı.
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </EnterpriseCard>
            </div>
        </div>
    );
};

const ProfileSettingsView = ({ user }: any) => {
    return (
        <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
            <EnterpriseCard>
                <EnterpriseSectionHeader title="Profil & Güvenlik Ayarları" icon="⚙️" />
                <div className="p-8">
                    <div className="flex items-center gap-6 mb-8 border-b border-slate-200 dark:border-slate-800 pb-8">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-3xl font-black text-white relative group shadow-lg">
                            {user?.name?.[0]?.toUpperCase() || 'P'}
                            <button className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 rounded-2xl transition-all flex items-center justify-center text-[10px] font-bold tracking-widest uppercase">Değiştir</button>
                        </div>
                        <div>
                            <h4 className="text-2xl font-black text-slate-900 dark:text-white mb-1">{user?.name}</h4>
                            <span className="px-3 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[11px] font-bold uppercase tracking-widest rounded-md">
                                {user?.role || 'Personel'}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <EnterpriseInput label="Tam Ad Soyad" defaultValue={user?.name} />
                        <EnterpriseInput label="E-Posta Adresi" type="email" defaultValue={user?.email} />
                        <EnterpriseInput label="Telefon Numarası" type="tel" placeholder="+90 5xx xxx xx xx" />
                        <EnterpriseInput label="Adres" />
                    </div>

                    <div className="pt-8 border-t border-slate-200 dark:border-slate-800">
                        <h4 className="text-[12px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-6">
                            <span>🔒</span> Güvenlik Ayarları
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <EnterpriseInput label="Yeni Şifre" type="password" />
                            <EnterpriseInput label="Şifre Tekrar" type="password" />
                        </div>
                    </div>

                    <div className="mt-10 flex justify-end gap-3">
                        <EnterpriseButton variant="secondary" className="px-8">İPTAL</EnterpriseButton>
                        <EnterpriseButton variant="primary" className="px-10">KAYDET VE GÜNCELLE</EnterpriseButton>
                    </div>
                </div>
            </EnterpriseCard>
        </div>
    );
};

// --- MAIN PAGE ---

export default function PersonelPanel() {
    const { currentUser } = useApp();
    const [activeTab, setActiveTab] = useState<'dashboard' | 'leave' | 'profile'>('dashboard');
    const [loading, setLoading] = useState(true);
    const [isScannerOpen, setIsScannerOpen] = useState(false);

    // PDKS Fonksiyonları
    const getFingerprint = () => {
        return btoa(navigator.userAgent + screen.width + screen.height).slice(0, 32);
    };

    const handleQrCheckin = () => {
        setIsScannerOpen(true);
    };

    const onQrScan = async (token: string) => {
        toast.loading("Konum ve cihaz doğrulanıyor...", { id: "pdks" });
        try {
            const res = await fetch("/api/v1/pdks/check-in", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mode: "OFFICE_QR",
                    qrToken: token,
                    deviceFp: getFingerprint(),
                    clientTime: new Date().toISOString(),
                    offlineId: uuidv4()
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Mesai Başlatıldı!", { id: "pdks" });
                if (data.status === "PENDING") toast.warning("Risk uyarısı: Yönetici onayı bekleniyor.");
            } else {
                toast.error(data.error || "Giriş başarısız", { id: "pdks" });
            }
        } catch (err) {
            toast.error("Bağlantı hatası", { id: "pdks" });
        }
    };

    const handleGpsCheckin = () => {
        if (!navigator.geolocation) {
            return toast.error("Tarayıcınız konum bilgisini desteklemiyor.");
        }

        toast.loading("Konum alınıyor...", { id: "gps" });

        navigator.geolocation.getCurrentPosition(async (pos) => {
            try {
                const res = await fetch("/api/v1/pdks/check-in", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        mode: "FIELD_GPS",
                        deviceFp: getFingerprint(),
                        clientTime: new Date().toISOString(),
                        location: {
                            lat: pos.coords.latitude,
                            lng: pos.coords.longitude,
                            acc: pos.coords.accuracy
                        },
                        offlineId: uuidv4()
                    })
                });
                const data = await res.json();
                if (data.success) {
                    toast.success("Saha Girişi Yapıldı!", { id: "gps" });
                } else {
                    toast.error(data.error || "Giriş başarısız", { id: "gps" });
                }
            } catch (err) {
                toast.error("Bağlantı hatası", { id: "gps" });
            }
        }, (err) => {
            toast.error("Konum izni reddedildi veya alınamadı.", { id: "gps" });
        }, { enableHighAccuracy: true });
    };

    useEffect(() => {
        setTimeout(() => setLoading(false), 800);
    }, []);

    if (loading) return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-pulse text-indigo-400/50">
            <div className="h-20 bg-slate-100 dark:bg-slate-800/30 rounded-2xl w-full" />
            <div className="grid grid-cols-4 gap-6">
                <div className="h-32 bg-slate-100 dark:bg-slate-800/30 rounded-2xl" />
                <div className="h-32 bg-slate-100 dark:bg-slate-800/30 rounded-2xl" />
                <div className="h-32 bg-slate-100 dark:bg-slate-800/30 rounded-2xl" />
                <div className="h-32 bg-slate-100 dark:bg-slate-800/30 rounded-2xl" />
            </div>
            <div className="h-64 bg-slate-100 dark:bg-slate-800/30 rounded-2xl w-full" />
        </div>
    );

    return (
        <div style={{ background: 'var(--bg-main)' }} className="min-h-screen text-slate-900 dark:text-white transition-colors duration-300">
            {/* EXECUTIVE HEADER STRIP */}
            <div style={{ background: 'var(--bg-panel)', borderBottom: '1px solid var(--border-color)' }} className="px-8 py-6 sticky top-0 z-40 shadow-sm">
                <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                            <span className="text-3xl">👨‍💼</span> PERSONEL OPERASYON PANELİ
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-xs font-bold mt-2 uppercase tracking-widest flex items-center gap-2">
                            <span className="text-emerald-500">🟢</span> Merhaba, {currentUser?.name || 'Kullanıcı'} • Bugün Çok Verimlisin!
                        </p>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col items-end px-5 border-r border-slate-200 dark:border-slate-800">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Mesai Durumu</span>
                            <span className="text-xs font-black text-emerald-500 mt-0.5 flex items-center gap-1.5 hover:text-emerald-400 transition-colors cursor-default">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                AKTİF ÇALIŞIYOR
                            </span>
                        </div>
                        <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors" title="Verileri Yenile">
                            <IconRefresh className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto p-8 space-y-8 animate-in fade-in duration-700 pb-24">
                {/* Navigation Tabs (Grouped Navigation Style) */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex w-full lg:w-max whitespace-nowrap overflow-x-auto items-center gap-6 px-1 custom-scroll select-none pb-1">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/30 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-sm">
                                <button
                                    onClick={() => setActiveTab('dashboard')}
                                    className={`${activeTab === 'dashboard'
                                        ? "px-5 py-2.5 text-[12px] font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-900 shadow-sm border border-slate-200/50 dark:border-white/10 rounded-lg transition-all"
                                        : "px-5 py-2.5 text-[12px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-all rounded-lg"
                                    } flex items-center gap-2`}
                                >
                                    <IconActivity className="w-4 h-4" /> Genel Durum
                                </button>
                                <button
                                    onClick={() => setActiveTab('leave')}
                                    className={`${activeTab === 'leave'
                                        ? "px-5 py-2.5 text-[12px] font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-900 shadow-sm border border-slate-200/50 dark:border-white/10 rounded-lg transition-all"
                                        : "px-5 py-2.5 text-[12px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-all rounded-lg"
                                    } flex items-center gap-2`}
                                >
                                    <IconClock className="w-4 h-4" /> İzin Taleplerim
                                </button>
                                <button
                                    onClick={() => setActiveTab('profile')}
                                    className={`${activeTab === 'profile'
                                        ? "px-5 py-2.5 text-[12px] font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-900 shadow-sm border border-slate-200/50 dark:border-white/10 rounded-lg transition-all"
                                        : "px-5 py-2.5 text-[12px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-all rounded-lg"
                                    } flex items-center gap-2`}
                                >
                                    <IconShield className="w-4 h-4" /> Profil & Hesap
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Rendering */}
                {activeTab === 'dashboard' && (
                    <DashboardView
                        handleQrCheckin={handleQrCheckin}
                        handleGpsCheckin={handleGpsCheckin}
                        isScannerOpen={isScannerOpen}
                        setIsScannerOpen={setIsScannerOpen}
                        onQrScan={onQrScan}
                    />
                )}
                {activeTab === 'leave' && <LeaveRequestView />}
                {activeTab === 'profile' && <ProfileSettingsView user={currentUser} />}

            </div>

            {/* Branding Footer */}
            <div style={{ background: 'var(--bg-panel)', borderTop: '1px solid var(--border-color)' }} className="fixed bottom-0 left-0 right-0 p-4 z-50 flex justify-center">
                <div className="max-w-[1600px] mx-auto w-full flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    <span>© 2026 PERIODYA OS • İNSAN KAYNAKLARI MODÜLÜ</span>
                    <span className="text-blue-500 font-black">🔒 Verileriniz Uçtan Uca Şifrelenmiştir</span>
                </div>
            </div>
        </div>
    );
}
