"use client";

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';

export default function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);
    const [service, setService] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [technicians, setTechnicians] = useState<any[]>([]);
    const [isUpdating, setIsUpdating] = useState(false);
    const [elapsedTime, setElapsedTime] = useState<string>('00:00:00');
    const [isActionsOpen, setIsActionsOpen] = useState(false);

    const fetchTechnicians = async () => {
        try {
            const res = await fetch('/api/staff');
            const data = await res.json();
            if (data.success) {
                setTechnicians(data.staff.filter((s: any) => s.type === 'service' || !s.type));
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchService = () => {
        if (!id) return;
        setLoading(true);
        fetch(`/api/services/${id}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setService(data.service);
                } else {
                    setError(data.error || 'Servis kaydı bulunamadı.');
                }
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchService();
        fetchTechnicians();
    }, [id]);

    useEffect(() => {
        if (!service || service.status !== 'İşlemde' || !service.startTime) {
            setElapsedTime('00:00:00');
            return;
        }

        const interval = setInterval(() => {
            const start = new Date(service.startTime).getTime();
            const now = new Date().getTime();
            const diff = now - start;

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff / (1000 * 60)) % 60);
            const seconds = Math.floor((diff / 1000) % 60);

            setElapsedTime(
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
            );
        }, 1000);

        return () => clearInterval(interval);
    }, [service?.status, service?.startTime]);

    const handleUpdate = async (payload: any) => {
        setIsUpdating(true);
        try {
            const res = await fetch(`/api/services/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) {
                setService(data.service);
            } else {
                alert("Güncelleme hatası: " + data.error);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsUpdating(false);
        }
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            const currentPhotos = service?.photos || [];
            handleUpdate({ photos: [...currentPhotos, base64] });
        };
        reader.readAsDataURL(file);
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        try {
            return new Date(dateString).toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (e) {
            return 'Geçersiz Tarih';
        }
    };

    if (loading) {
        return (
            <div className="container flex-center min-h-[80vh]">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-16 h-16 rounded-full border-4 border-subtle border-t-primary animate-spin"></div>
                    <span className="text-[11px] font-black text-muted uppercase tracking-[0.3em] animate-pulse">Detaylar Yükleniyor...</span>
                </div>
            </div>
        );
    }

    if (error || !service) {
        return (
            <div className="container flex-center min-h-[80vh]">
                <div className="bg-subtle border border-main rounded-[40px] p-12 text-center max-w-lg shadow-2xl">
                    <div className="text-6xl mb-6">⚠️</div>
                    <h2 className="text-2xl font-black text-main mb-2">Eyvah! Bir Sorun Var</h2>
                    <p className="text-muted font-medium mb-8 leading-relaxed">{error || 'İstediğiniz servis kaydına şu an ulaşamıyoruz.'}</p>
                    <button onClick={() => router.back()} className="px-8 py-4 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">Geri Dön</button>
                </div>
            </div>
        );
    }

    const items = service.items || [];
    const partsTotal = items.reduce((acc: number, item: any) => acc + (item.isWarranty ? 0 : (Number(item.price) || 0) * (Number(item.quantity) || 0)), 0);
    const totalAmount = partsTotal;

    const defaultChecklists: Record<string, string[]> = {
        'Motosiklet': ["Fren Hidroliği", "Zincir Gerginliği & Yağlama", "Lastik Basınçları", "Yağ Seviyesi", "Soğutma Suyu", "Aydınlatma Grubu"],
        'Bisiklet': ["Fren Papuçları / Balatalar", "Zincir Yağlama", "Vites Ayarları", "Lastik Basınçları", "Jant Akordu", "Gidon Sıkılığı"],
    };

    const currentChecklistItems = defaultChecklists[service.vehicleType || 'Motosiklet'] || ["Genel Kontrol", "Temizlik", "Fonksiyon Testi"];

    const toggleChecklistItem = (item: string) => {
        const currentChecklist = service.checklist || {};
        handleUpdate({
            checklist: {
                ...currentChecklist,
                [item]: !currentChecklist[item]
            }
        });
    };

    return (
        <div className="container p-8 max-w-[1400px] mx-auto min-h-screen bg-[#080911]">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                <div className="space-y-1">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.push('/service')} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all">←</button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-4xl font-black text-white tracking-tight">Servis Kokpiti</h1>
                                <span className="px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest mt-1">
                                    SRV-{service.id.toString().slice(-6).toUpperCase()}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <p className="text-white/40 font-bold text-[10px] uppercase tracking-[0.2em]">{service.status}</p>
                                {service.status === 'İşlemde' && (
                                    <div className="flex items-center gap-2 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 animate-pulse">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                        <span className="text-[10px] font-black text-emerald-400 font-mono tracking-wider">{elapsedTime}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => window.print()} className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/40 font-black text-xs uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all flex items-center gap-3">
                        <span>🖨️</span> Yazdır
                    </button>
                    <div className="relative">
                        <button onClick={() => setIsActionsOpen(!isActionsOpen)} className="px-6 py-3 rounded-2xl bg-blue-600 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-600/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                            EYLEMLER
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-3 h-3 transition-transform ${isActionsOpen ? 'rotate-180' : ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                        </button>
                        {isActionsOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsActionsOpen(false)}></div>
                                <div className="absolute right-0 top-full mt-2 w-56 bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden py-2 backdrop-blur-xl">
                                    <button onClick={() => { handleUpdate({ status: 'İşlemde', startTime: new Date().toISOString() }); setIsActionsOpen(false); }} className="w-full text-left px-5 py-3 text-[12px] font-black uppercase tracking-widest text-emerald-400 hover:bg-emerald-400/10 transition-colors flex items-center gap-3"><span className="text-sm">⚡</span> İşe Başla</button>
                                    <button onClick={() => { handleUpdate({ status: 'Tamamlandı', endTime: new Date().toISOString() }); setIsActionsOpen(false); }} className="w-full text-left px-5 py-3 text-[12px] font-black uppercase tracking-widest text-blue-400 hover:bg-blue-400/10 transition-colors flex items-center gap-3"><span className="text-sm">✅</span> Bitir</button>
                                    <div className="h-px bg-white/5 my-2"></div>
                                    <button onClick={() => { router.push(`/offers?customerId=${service.customerId}&serviceId=${service.id}`); setIsActionsOpen(false); }} className="w-full text-left px-5 py-3 text-[12px] font-black uppercase tracking-widest text-white/60 hover:bg-white/5 transition-colors flex items-center gap-3"><span className="text-sm">📝</span> Teklif Oluştur</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </header>
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-8">
                <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-white/[0.03] border border-white/10 rounded-[40px] p-8 relative overflow-hidden group hover:border-blue-500/30 transition-all">
                            <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-[0.05] transition-opacity duration-700 pointer-events-none text-9xl">👤</div>
                            <div className="flex flex-col gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-2xl">👤</div>
                                    <div><h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Müşteri Bilgileri</h3><div className="text-xl font-black text-white leading-tight">{service.customer?.name}</div></div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><div className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Telefon</div><div className="text-sm font-bold text-white/80">{service.customer?.phone || '-'}</div></div>
                                    <div><div className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Kayıt No</div><div className="text-sm font-mono font-bold text-white/40 truncate">#{service.id.slice(0,8)}</div></div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/[0.03] border border-white/10 rounded-[40px] p-8 relative overflow-hidden group hover:border-blue-500/30 transition-all">
                            <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-[0.05] transition-opacity duration-700 pointer-events-none text-9xl">🏍️</div>
                            <div className="flex flex-col gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-2xl">{service.vehicleType === 'bike' ? '🚲' : '🏍️'}</div>
                                    <div><h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Araç Bilgileri</h3><div className="text-xl font-black text-emerald-400 tracking-wider transition-all">{service.plate || 'Plakasız'}</div></div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><div className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Marka / Model</div><div className="text-sm font-bold text-white/80 line-clamp-1">{service.vehicleBrand || '-'}</div></div>
                                    <div><div className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Mevcut Kilometre</div><div className="text-sm font-bold text-emerald-400">{service.km ? `${service.km.toLocaleString()} KM` : '-'}</div></div>
                                    <div className="col-span-2">
                                        <div className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Atanan Personel</div>
                                        <div className="relative">
                                            <select value={service.technicianId || ''} onChange={(e) => handleUpdate({ technicianId: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-blue-500/50 transition-all appearance-none">
                                                <option value="" className="bg-[#1a1c2e]">Personel Seçiniz</option>
                                                {technicians.map((t: any) => (<option key={t.id} value={t.id} className="bg-[#1a1c2e]">{t.name}</option>))}
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">▼</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white/[0.03] border border-white/10 rounded-[40px] p-10">
                        <h3 className="text-sm font-black text-white uppercase tracking-[0.4em] mb-8 flex items-center gap-4"><span className="w-10 h-[2px] bg-emerald-500"></span> Teknik Kontrol Listesi</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {currentChecklistItems.map((item, i) => (
                                <button
                                    key={i}
                                    onClick={() => toggleChecklistItem(item)}
                                    className={`p-5 rounded-[24px] border flex items-center gap-4 transition-all text-left group ${service.checklist?.[item]
                                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                                            : 'bg-white/[0.02] border-white/5 text-white/40 hover:bg-white/5'
                                        }`}
                                >
                                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all ${service.checklist?.[item]
                                            ? 'bg-emerald-500 border-emerald-500 text-black'
                                            : 'border-white/10 group-hover:border-white/20'
                                        }`}>
                                        {service.checklist?.[item] && <span className="font-black">✓</span>}
                                    </div>
                                    <span className="text-[13px] font-black tracking-tight">{item}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="bg-white/[0.03] border border-white/10 rounded-[40px] p-10">
                        <div className="flex justify-between items-center mb-10">
                            <h3 className="text-sm font-black text-white uppercase tracking-[0.4em] flex items-center gap-4"><span className="w-10 h-[2px] bg-blue-600"></span> Fotoğraf Galerisi (Kabul Öncesi & Sonrası)</h3>
                            <label className="cursor-pointer px-6 py-3 rounded-2xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-blue-600/20">📷 ÇEK & EKLE<input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} /></label>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                            {(service.photos || []).map((photo: string, idx: number) => (
                                <div key={idx} className="aspect-square rounded-[32px] bg-black/40 border border-white/5 overflow-hidden group relative shadow-2xl">
                                    <img src={photo} alt="Service" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                                        <button onClick={() => { const newPhotos = [...service.photos]; newPhotos.splice(idx, 1); handleUpdate({ photos: newPhotos }); }} className="w-full text-white text-[10px] font-black uppercase tracking-tighter bg-red-600/80 p-3 rounded-2xl backdrop-blur-md">SİL</button>
                                    </div>
                                </div>
                            ))}
                            {(!service.photos || service.photos.length === 0) && (
                                <div className="col-span-full py-20 flex flex-col items-center justify-center bg-white/[0.01] rounded-[48px] border-2 border-dashed border-white/5">
                                    <span className="text-6xl mb-6 opacity-10">📸</span><p className="text-[12px] font-black text-white/5 uppercase tracking-[0.4em]">Henüz fotoğraf girişi yapılmamış</p>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="bg-white/[0.03] border border-white/10 rounded-[40px] overflow-hidden shadow-2xl">
                        <div className="p-10 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                            <h3 className="text-sm font-black text-white uppercase tracking-[0.4em] flex items-center gap-4"><span className="w-10 h-[2px] bg-emerald-500"></span> Teknisyen İşlemleri ve Malzemeler</h3>
                            <div className="flex items-center gap-3"><span className="px-3 py-1 bg-white/5 rounded-lg text-[10px] font-black text-white/20 uppercase tracking-widest">{items.length} KALEM</span></div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-black/20">
                                    <tr>
                                        <th className="px-10 py-6 text-[10px] font-black text-white/20 uppercase tracking-widest">Hizmet / Parça</th>
                                        <th className="px-10 py-6 text-[10px] font-black text-white/20 uppercase tracking-widest text-center">Adet</th>
                                        <th className="px-10 py-6 text-[10px] font-black text-white/20 uppercase tracking-widest text-right">Birim</th>
                                        <th className="px-10 py-6 text-[10px] font-black text-white/20 uppercase tracking-widest text-right">Ara Toplam</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {items.map((item: any, i: number) => (
                                        <tr key={i} className="group hover:bg-white/[0.02] transition-all">
                                            <td className="px-10 py-8">
                                                <div className="flex items-start gap-5">
                                                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-xl shadow-inner">{item.type === 'Labor' ? '🔧' : '📦'}</div>
                                                    <div>
                                                        <div className="text-[15px] font-black text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight">{item.name}</div>
                                                        {item.isWarranty && <div className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mt-1.5 flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-emerald-500"></span> 🛡️ Dijital Garanti Kapsamında</div>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8 text-center"><span className="text-sm font-mono font-bold text-white/40">x{item.quantity}</span></td>
                                            <td className="px-10 py-8 text-right font-mono"><span className={`text-sm font-bold ${item.isWarranty ? 'text-white/10 line-through' : 'text-white/60'}`}>₺{parseFloat(item.price).toLocaleString()}</span></td>
                                            <td className="px-10 py-8 text-right font-mono"><span className={`text-lg font-black ${item.isWarranty ? 'text-emerald-500/40 text-sm italic' : 'text-white'}`}>{item.isWarranty ? 'HEDİYE' : `₺${(item.price * item.quantity).toLocaleString()}`}</span></td>
                                        </tr>
                                    ))}
                                    {items.length === 0 && (<tr><td colSpan={4} className="px-10 py-20 text-center"><div className="text-white/5 text-xl font-black uppercase tracking-[0.5em] italic">Liste Bulunamadı</div></td></tr>)}
                                </tbody>
                            </table>
                        </div>
                        {service.notes && (<div className="p-10 bg-black/40 border-t border-white/5"><h4 className="text-[11px] font-black text-white/20 uppercase tracking-[0.4em] mb-4">Müşteri Şikayeti / Form Notları</h4><div className="text-[13px] font-bold text-white/60 leading-relaxed italic border-l-4 border-blue-600/40 pl-6 py-2">"{service.notes}"</div></div>)}
                    </div>
                </div>
                <div className="space-y-8">
                    <div className="bg-[#1a1c2e] rounded-[48px] border border-white/10 p-10 shadow-[0_32px_80px_rgba(0,0,0,0.5)] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600/10 rounded-full  -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                        <div className="mb-10 text-center">
                            <h3 className="text-[11px] font-black text-white/20 uppercase tracking-[0.5em] mb-4">Operasyonel Durum</h3>
                            <div className={`text-4xl font-black tracking-tighter uppercase ${service.status === 'İşlemde' ? 'text-blue-400' : service.status === 'Tamamlandı' ? 'text-emerald-400' : 'text-white/60'}`}>{service.status}</div>
                        </div>
                        <div className="space-y-5">
                            <div className="flex justify-between items-center"><span className="text-xs font-bold text-white/30 tracking-widest uppercase">Giriş Tarihi</span><span className="text-xs font-black text-white">{formatDate(service.createdAt)}</span></div>
                            {service.nextDate && (<div className="flex justify-between items-center p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10"><span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Hatırlatma</span><span className="text-xs font-black text-emerald-400">{formatDate(service.nextDate)}</span></div>)}
                            <div className="my-8 h-px bg-white/5"></div>
                            <div className="flex justify-between items-center"><span className="text-xs font-bold text-white/30 tracking-widest uppercase">Parça & İşçilik</span><span className="text-lg font-black text-white/80">₺{partsTotal.toLocaleString()}</span></div>
                            <div className="flex justify-between items-center"><span className="text-xs font-bold text-white/30 tracking-widest uppercase">Kdv Bedeli</span><span className="text-xs font-bold text-white/40 italic">₺{(totalAmount * 0.2).toLocaleString()}</span></div>
                            <div className="pt-10 flex flex-col items-center"><span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.5em] mb-2">Tahsilat Tutarı</span><div className="text-6xl font-black text-white tracking-tighter text-center"><span className="text-3xl font-light opacity-30 mr-1">₺</span>{(totalAmount * 1.2).toLocaleString()}</div></div>
                        </div>
                        <div className="mt-12 space-y-4">
                            <button onClick={() => handleUpdate({ status: 'Teslim Edildi' })} className="w-full py-5 rounded-[32px] bg-emerald-600 text-white font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-emerald-600/20 hover:scale-[1.02] active:scale-95 transition-all">ARACI TESLİM ET</button>
                            <button className="w-full py-5 rounded-[32px] bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 font-black text-[10px] uppercase tracking-[0.3em] transition-all">🗑️ KAYDI ARŞİVLE / SİL</button>
                        </div>
                    </div>
                    <div className="bg-white/[0.03] border border-white/10 rounded-[40px] p-8 shadow-2xl">
                        <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-10 text-center">Süreç Zaman Çizelgesi</h4>
                        <div className="space-y-10 relative ml-4">
                            <div className="absolute left-[9px] top-2 bottom-2 w-[2px] bg-white/5"></div>
                            <div className="flex gap-6 items-start relative z-10">
                                <div className={`w-5 h-5 rounded-full border-[5px] border-[#080911] ${service.startTime ? 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]' : 'bg-white/10'}`}></div>
                                <div><div className={`text-[13px] font-black tracking-tight ${service.startTime ? 'text-white' : 'text-white/20'}`}>Atölye Kabul & Başlangıç</div><div className="text-[10px] font-black text-white/10 uppercase mt-1 tracking-widest">{service.startTime ? new Date(service.startTime).toLocaleString('tr-TR') : 'BEKLENİYOR'}</div></div>
                            </div>
                            <div className="flex gap-6 items-start relative z-10">
                                <div className={`w-5 h-5 rounded-full border-[5px] border-[#080911] ${service.status === 'Tamamlandı' || service.status === 'Teslim Edildi' ? 'bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]' : 'bg-white/10'}`}></div>
                                <div><div className={`text-[13px] font-black tracking-tight ${service.status === 'Tamamlandı' || service.status === 'Teslim Edildi' ? 'text-white' : 'text-white/20'}`}>Bakım İşlemleri Tamamlandı</div><div className="text-[10px] font-black text-white/10 uppercase mt-1 tracking-widest">{service.endTime ? new Date(service.endTime).toLocaleString('tr-TR') : 'İŞLEM SÜRÜYOR'}</div></div>
                            </div>
                            <div className="flex gap-6 items-start relative z-10">
                                <div className={`w-5 h-5 rounded-full border-[5px] border-[#080911] ${service.status === 'Teslim Edildi' ? 'bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.5)]' : 'bg-white/10'}`}></div>
                                <div><div className={`text-[13px] font-black tracking-tight ${service.status === 'Teslim Edildi' ? 'text-white' : 'text-white/20'}`}>Müşteri Teslimat</div><div className="text-[10px] font-black text-white/10 uppercase mt-1 tracking-widest">{service.status === 'Teslim Edildi' ? 'GÜNCELLENDİ' : 'HENÜZ TESLİM EDİLMEDİ'}</div></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
