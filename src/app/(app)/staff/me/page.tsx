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
import { Sun, Moon } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import dynamic from 'next/dynamic';
const BarcodeScanner = dynamic(() => import('@/components/BarcodeScanner'), { ssr: false });
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

// --- UI COMPONENTS ---

const Card = ({ children, title, icon: Icon, className = "", theme }: any) => (
    <div className={`card glass p-6 relative overflow-hidden group ${className}`}>
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                {Icon && <Icon className={`w-4 h-4 ${theme === 'light' ? 'text-primary' : 'text-emerald-500'}`} />} {title}
            </h3>
        </div>
        {children}
    </div>
);

const ProgressBar = ({ label, value, max, color = "bg-emerald-500", theme }: any) => {
    const percentage = Math.min((value / max) * 100, 100);
    return (
        <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-bold uppercase">
                <span className="text-gray-500">{label}</span>
                <span className={theme === 'light' ? "text-pos" : "text-white"}>%{percentage.toFixed(0)}</span>
            </div>
            <div className={`h-1.5 w-full ${theme === 'light' ? 'bg-gray-100' : 'bg-white/5'} rounded-full overflow-hidden`}>
                <div
                    className={`h-full ${theme === 'light' ? 'bg-primary' : color} transition-all duration-1000 ease-out`}
                    style={{ width: `${percentage}%` }}
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
    onQrScan,
    theme
}: any) => (
    <div className="space-y-8 animate-in fade-in duration-500">
        {/* Top Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="card glass p-6 border-emerald-500/20">
                <IconActivity className={theme === 'light' ? "w-6 h-6 text-primary mb-4" : "w-6 h-6 text-emerald-500 mb-4"} />
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Performans Skoru</h4>
                <p className={theme === 'light' ? "text-3xl font-black text-pos" : "text-3xl font-black text-white"}>92.4</p>
                <p className={theme === 'light' ? "text-[10px] text-primary mt-2" : "text-[10px] text-emerald-500 mt-2"}>↑ %2.1 geçen aya göre</p>
            </div>
            <div className="card glass p-6 border-indigo-500/20">
                <IconTrendingUp className={theme === 'light' ? "w-6 h-6 text-primary mb-4" : "w-6 h-6 text-indigo-500 mb-4"} />
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Hedef Gerçekleşme</h4>
                <p className={theme === 'light' ? "text-3xl font-black text-pos" : "text-3xl font-black text-white"}>%88</p>
                <p className="text-[10px] text-gray-500 mt-2">Bu ayki hedefler</p>
            </div>
            <div className="card glass p-6 border-amber-500/20">
                <IconClock className={theme === 'light' ? "w-6 h-6 text-amber-600 mb-4" : "w-6 h-6 text-amber-500 mb-4"} />
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Kalan İzin</h4>
                <p className={theme === 'light' ? "text-3xl font-black text-pos" : "text-3xl font-black text-white"}>14</p>
                <p className="text-[10px] text-gray-500 mt-2">Günlük bakiye</p>
            </div>
            <div className="card glass p-6 border-rose-500/20">
                <IconZap className={theme === 'light' ? "w-6 h-6 text-rose-500 mb-4" : "w-6 h-6 text-rose-500 mb-4"} />
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Aylık Mesai</h4>
                <p className={theme === 'light' ? "text-3xl font-black text-pos" : "text-3xl font-black text-white"}>12.5</p>
                <p className="text-[10px] text-gray-500 mt-2">Ekstradan çalışılan saat</p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Targets & Performance */}
            <Card title="Hedefler & Performans" icon={IconActivity} className="lg:col-span-2" theme={theme}>
                <div className="space-y-6">
                    <ProgressBar label="Satış Kotası Gerçekleşme" value={850000} max={1000000} theme={theme} />
                    <ProgressBar label="Müşteri Memnuniyeti (NPS)" value={4.8} max={5} color="bg-indigo-500" theme={theme} />
                    <ProgressBar label="Rota Uyumluluk Oranı" value={98} max={100} color="bg-blue-500" theme={theme} />
                    <ProgressBar label="Tahsilat Hedefi" value={420000} max={600000} color="bg-amber-500" theme={theme} />
                </div>

                <div className="mt-8 p-4 bg-white/5 rounded-2xl border border-white/10">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Aktif Görevler</h4>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 group hover:border-emerald-500/30 transition-all cursor-pointer">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span className="text-xs font-bold text-white text-sm">Aylık stok sayımı onayı</span>
                            </div>
                            <span className="text-[10px] font-bold text-gray-500 uppercase">Bugün</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 group hover:border-amber-500/30 transition-all cursor-pointer">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-amber-500" />
                                <span className="text-xs font-bold text-white text-sm">Pazaryeri hakediş kontrolü</span>
                            </div>
                            <span className="text-[10px] font-bold text-gray-500 uppercase">Yarın</span>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Shift & Calendar */}
            <Card title="Vardiya & Çalışma" icon={IconClock} theme={theme}>
                <div className="space-y-6">
                    <div className={theme === 'light' ? "p-4 bg-primary/10 border border-primary/20 rounded-2xl text-center" : "p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center"}>
                        <p className={theme === 'light' ? "text-[10px] font-bold text-primary uppercase mb-1" : "text-[10px] font-bold text-emerald-500 uppercase mb-1"}>Şu Anki Vardiya</p>
                        <p className={theme === 'light' ? "text-xl font-black text-pos" : "text-xl font-black text-white"}>09:00 - 18:00 (Merkez)</p>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Haftalık Akış</h4>
                        {[
                            { day: 'Pazartesi', hour: '09:00 - 18:00', status: 'Tamamlandı' },
                            { day: 'Salı', hour: '09:00 - 18:00', status: 'Tamamlandı' },
                            { day: 'Çarşamba', hour: '09:00 - 18:00', status: 'Bugün' },
                            { day: 'Perşembe', hour: '09:00 - 18:00', status: 'Bekliyor' },
                            { day: 'Cuma', hour: '09:00 - 20:00', status: 'Mesaili', color: theme === 'light' ? 'text-amber-600' : 'text-amber-500' },
                        ].map((s, i) => (
                            <div key={i} className="flex justify-between items-center border-b border-white/5 pb-2">
                                <span className="text-xs font-bold text-gray-400">{s.day}</span>
                                <div className="text-right">
                                    <p className={theme === 'light' ? "text-xs font-black text-pos leading-none mb-1" : "text-xs font-black text-white leading-none mb-1"}>{s.hour}</p>
                                    <p className={`text-[9px] font-bold uppercase ${s.status === 'Tamamlandı' ? 'text-gray-600' : s.color || (theme === 'light' ? 'text-primary' : 'text-emerald-500')}`}>{s.status}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Card>
        </div>

        {/* Payroll Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card title="Son Bordro Özetleri" icon={IconShield} theme={theme}>
                <div className="space-y-4 text-center">
                    <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                            <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Ocak 2026</p>
                            <p className={theme === 'light' ? "text-sm font-black text-pos" : "text-sm font-black text-white"}>₺32,450</p>
                        </div>
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                            <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Aralık 2025</p>
                            <p className={theme === 'light' ? "text-sm font-black text-pos" : "text-sm font-black text-white"}>₺31,200</p>
                        </div>
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                            <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Kasım 2025</p>
                            <p className={theme === 'light' ? "text-sm font-black text-pos" : "text-sm font-black text-white"}>₺31,200</p>
                        </div>
                    </div>
                    <button className={theme === 'light' ? "bg-primary text-white w-full py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg" : "btn-premium w-full py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2"}>
                        <IconShield className="w-4 h-4" /> Kâğıtsız Bordro (PDF) İndir
                    </button>
                </div>
            </Card>

            <Card title="PDKS İşlemleri" icon={IconZap} theme={theme}>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={handleQrCheckin}
                            className={theme === 'light' ? "bg-primary/10 hover:bg-primary/20 border border-primary/20 p-4 rounded-3xl transition-all flex flex-col items-center gap-2 group" : "bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 p-4 rounded-3xl transition-all flex flex-col items-center gap-2 group"}
                        >
                            <div className={theme === 'light' ? "w-10 h-10 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform" : "w-10 h-10 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform"}>
                                <IconShield className="w-5 h-5 text-white" />
                            </div>
                            <span className={theme === 'light' ? "text-[10px] font-black text-pos uppercase tracking-widest text-center" : "text-[10px] font-black text-white uppercase tracking-widest text-center"}>Ofis Girişi (QR)</span>
                        </button>

                        <button
                            onClick={handleGpsCheckin}
                            className={theme === 'light' ? "bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 p-4 rounded-3xl transition-all flex flex-col items-center gap-2 group" : "bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 p-4 rounded-3xl transition-all flex flex-col items-center gap-2 group"}
                        >
                            <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform text-white">
                                <IconActivity className="w-5 h-5 text-white" />
                            </div>
                            <span className={theme === 'light' ? "text-[10px] font-black text-pos uppercase tracking-widest text-center" : "text-[10px] font-black text-white uppercase tracking-widest text-center"}>Saha Girişi (GPS)</span>
                        </button>
                    </div>

                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <div>
                                <h4 className="text-[10px] font-bold text-gray-400 uppercase leading-none">Cihaz Durumu</h4>
                                <p className={theme === 'light' ? "text-[9px] font-black text-pos uppercase tracking-widest" : "text-[9px] font-black text-white uppercase tracking-widest"}>GÜVENLİ & EŞLEŞMİŞ</p>
                            </div>
                        </div>
                        <button className={theme === 'light' ? "text-[8px] font-black text-primary uppercase hover:underline" : "text-[8px] font-black text-indigo-400 uppercase hover:underline"}>Senkronize Et</button>
                    </div>

                    <p className="text-[10px] text-gray-500 text-center uppercase font-bold tracking-widest opacity-50">Loglar şifreli olarak saklanır.</p>
                </div>
            </Card>

            <BarcodeScanner
                isOpen={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
                onScan={onQrScan}
            />
        </div>
    </div>
);

const LeaveRequestView = ({ theme }: any) => {
    const [type, setType] = useState('YILLIK');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [note, setNote] = useState('');

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
            <div className="lg:col-span-1 space-y-6">
                <Card title="Yeni Talep Oluştur" icon={IconActivity} theme={theme}>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase">İzin Türü</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-emerald-500/50"
                            >
                                <option value="YILLIK">Yıllık Ücretli İzin</option>
                                <option value="MAZARET">Mazeret İzni</option>
                                <option value="HASTALIK">Hastalık / Sağlık Raporu</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Başlangıç</label>
                                <input
                                    type="date"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-emerald-500/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Bitiş</label>
                                <input
                                    type="date"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-emerald-500/50"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase">Not / Açıklama</label>
                            <textarea
                                className="w-full h-24 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-emerald-500/50 resize-none"
                                placeholder="İzin nedeninizi kısaca belirtin..."
                            />
                        </div>
                        <button className="btn-premium w-full py-4 rounded-2xl text-xs font-black uppercase tracking-widest mt-4">
                            Talebi Gönder
                        </button>
                    </div>
                </Card>
            </div>

            <div className="lg:col-span-2 space-y-6">
                <Card title="Geçmiş Taleplerim" icon={IconClock} theme={theme}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-separate border-spacing-y-3">
                            <thead>
                                <tr className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                    <th className="px-4 pb-2">Tür</th>
                                    <th className="px-4 pb-2">Tarih Aralığı</th>
                                    <th className="px-4 pb-2">Durum</th>
                                    <th className="px-4 pb-2">Onaylayan</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { type: 'YILLIK', range: '15 Haz - 28 Haz', status: 'ONAYLANDI', color: 'text-emerald-400', approver: 'Ahmet Yılmaz' },
                                    { type: 'MAZARET', range: '12 Nis - 13 Nis', status: 'REDDEDİLDİ', color: 'text-rose-400', approver: 'Mehmet Demir' },
                                    { type: 'HASTALIK', range: '02 Şub - 04 Şub', status: 'ONAYLANDI', color: 'text-emerald-400', approver: 'Sistem (Oto)' },
                                ].map((row, i) => (
                                    <tr key={i} className="bg-white/5 rounded-xl border border-white/5 group hover:bg-white/10 transition-all">
                                        <td className="px-4 py-4 rounded-l-xl">
                                            <span className="text-xs font-black text-white">{row.type}</span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="text-xs font-bold text-gray-400">{row.range}</span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={`text-[10px] font-black tracking-widest ${row.color}`}>{row.status}</span>
                                        </td>
                                        <td className="px-4 py-4 rounded-r-xl">
                                            <span className="text-xs font-bold text-gray-400">{row.approver}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
};

const ProfileSettingsView = ({ user, theme }: any) => {
    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
            <Card title="Profil Bilgilerimi Güncelle" icon={IconShield} theme={theme}>
                <div className="flex items-center gap-8 mb-8 border-b border-white/5 pb-8">
                    <div className="w-24 h-24 rounded-3xl bg-indigo-500 flex items-center justify-center text-3xl font-black text-white relative group">
                        {user?.name?.[0]?.toUpperCase() || 'P'}
                        <button className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 rounded-3xl transition-all flex items-center justify-center text-xs font-bold">Değiştir</button>
                    </div>
                    <div>
                        <h4 className="text-xl font-black text-white">{user?.name}</h4>
                        <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">{user?.role || 'Personel'}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Tam Ad Soyad</label>
                        <input
                            type="text"
                            defaultValue={user?.name}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-emerald-500/50"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">E-Posta Adresi</label>
                        <input
                            type="email"
                            defaultValue={user?.email}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-emerald-500/50"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Telefon Numarası</label>
                        <input
                            type="tel"
                            placeholder="+90 5xx xxx xx xx"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-emerald-500/50"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Adres</label>
                        <input
                            type="text"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-emerald-500/50"
                        />
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t border-white/5 space-y-6">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Güvenlik Ayarları</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase">Yeni Şifre</label>
                            <input
                                type="password"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-emerald-500/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase">Şifre Tekrar</label>
                            <input
                                type="password"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-emerald-500/50"
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-10 flex justify-end gap-4">
                    <button className="px-8 py-3 rounded-2xl text-xs font-bold text-gray-500 hover:text-white transition-all">İptal</button>
                    <button className="btn-premium px-12 py-3 rounded-2xl text-xs font-black uppercase tracking-widest">Kaydet ve Güncelle</button>
                </div>
            </Card>
        </div>
    );
};

// --- MAIN PAGE ---

export default function PersonelPanel() {
    const { currentUser } = useApp();
    const [activeTab, setActiveTab] = useState<'dashboard' | 'leave' | 'profile'>('dashboard');
    const [loading, setLoading] = useState(true);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const { theme } = useTheme();

    useEffect(() => {
        if (theme === 'light') {
            document.body.style.background = '#F7F9FC';
            document.body.style.color = '#1A1F36';
        } else {
            document.body.style.background = 'var(--bg-deep)';
            document.body.style.color = 'var(--text-main)';
        }
        return () => {
            document.body.style.background = 'var(--bg-deep)';
            document.body.style.color = 'var(--text-main)';
        };
    }, [theme]);

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
        <div className="p-12 space-y-8 animate-pulse text-indigo-400/50">
            <div className="h-20 bg-white/5 rounded-2xl w-full" />
            <div className="grid grid-cols-4 gap-6">
                <div className="h-32 bg-white/5 rounded-2xl" />
                <div className="h-32 bg-white/5 rounded-2xl" />
                <div className="h-32 bg-white/5 rounded-2xl" />
                <div className="h-32 bg-white/5 rounded-2xl" />
            </div>
            <div className="h-64 bg-white/5 rounded-2xl w-full" />
        </div>
    );

    return (
        <div data-pos-theme={theme} className="p-8 space-y-8 animate-in fade-in duration-700 pb-24 min-h-screen transition-colors duration-300">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className={theme === 'light' ? "text-4xl font-black text-primary" : "text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-400 to-white animate-gradient"}>
                        PERSONEL OPERASYON PANELİ
                    </h1>
                    <p className="text-gray-500 text-sm font-medium mt-1 uppercase tracking-widest flex items-center gap-2">
                        <IconShield className={theme === 'light' ? "w-4 h-4 text-primary" : "w-4 h-4 text-indigo-500"} /> Merhaba, {currentUser?.name || 'Kullanıcı'} • Bugün Çok Verimlisin!
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end px-4 border-r border-white/10">
                        <span className="text-[10px] font-bold text-gray-500 uppercase">Mesai Durumu</span>
                        <span className="text-xs font-black text-emerald-400">AKTİF ÇALIŞIYOR</span>
                    </div>
                    <IconRefresh className="w-5 h-5 text-gray-500 hover:text-white cursor-pointer transition-all" />
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 p-1.5 bg-white/5 border border-white/10 rounded-2xl w-fit">
                <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all duration-300 flex items-center gap-2 ${activeTab === 'dashboard' ? (theme === 'light' ? 'bg-primary text-white shadow-lg' : 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20') : 'text-gray-500 hover:text-white'}`}
                >
                    <IconActivity className="w-4 h-4" /> Genel Durum
                </button>
                <button
                    onClick={() => setActiveTab('leave')}
                    className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all duration-300 flex items-center gap-2 ${activeTab === 'leave' ? (theme === 'light' ? 'bg-primary text-white shadow-lg' : 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20') : 'text-gray-500 hover:text-white'}`}
                >
                    <IconClock className="w-4 h-4" /> İzin Taleplerim
                </button>
                <button
                    onClick={() => setActiveTab('profile')}
                    className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all duration-300 flex items-center gap-2 ${activeTab === 'profile' ? (theme === 'light' ? 'bg-primary text-white shadow-lg' : 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20') : 'text-gray-500 hover:text-white'}`}
                >
                    <IconShield className="w-4 h-4" /> Profil & Hesap
                </button>
            </div>

            {/* Content Rendering */}
            {activeTab === 'dashboard' && (
                <DashboardView
                    handleQrCheckin={handleQrCheckin}
                    handleGpsCheckin={handleGpsCheckin}
                    isScannerOpen={isScannerOpen}
                    setIsScannerOpen={setIsScannerOpen}
                    onQrScan={onQrScan}
                    theme={theme}
                />
            )}
            {activeTab === 'leave' && <LeaveRequestView theme={theme} />}
            {activeTab === 'profile' && <ProfileSettingsView user={currentUser} theme={theme} />}

            {/* Branding Footer */}
            <div className={`fixed bottom-0 left-0 right-0 p-4 ${theme === 'light' ? 'bg-white/80 border-gray-200' : 'bg-black/60 border-white/5'} backdrop-blur-xl border-t z-50 flex justify-center transition-colors duration-300`}>
                <div className="max-w-7xl w-full flex justify-between items-center text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    <span>© 2026 PERIODYA OS • İNSAN KAYNAKLARI MODÜLÜ</span>
                    <span className={theme === 'light' ? "text-primary" : "text-indigo-400"}>Verileriniz End-to-End Şifrelenmiştir</span>
                </div>
            </div>
        </div>
    );
}
