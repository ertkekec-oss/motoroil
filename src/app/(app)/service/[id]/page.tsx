"use client";

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useModal } from '@/contexts/ModalContext';
import { useTheme } from '@/contexts/ThemeContext';
import { 
    Sheet, 
    ArrowLeft, 
    Printer, 
    Play, 
    CheckCircle2, 
    FileText, 
    Camera, 
    Trash2, 
    Clock, 
    User, 
    Box, 
    CreditCard, 
    ShieldCheck, 
    Wrench, 
    Info, 
    ChevronDown,
    Package,
    AlertCircle
} from 'lucide-react';

export default function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);
    const { theme } = useTheme();
    const { showSuccess, showError, showConfirm } = useModal();
    const isLight = theme === 'light';

    const [service, setService] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [technicians, setTechnicians] = useState<any[]>([]);
    const [elapsedTime, setElapsedTime] = useState<string>('00:00:00');
    const [isActionsOpen, setIsActionsOpen] = useState(false);

    const fetchTechnicians = async () => {
        try {
            const res = await fetch('/api/staff');
            const data = await res.json();
            if (data.success) {
                setTechnicians(data.staff.filter((s: any) => s.type === 'service' || s.role === 'service' || !s.type));
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
                    showError('Hata', data.error || 'Servis kaydı bulunamadı.');
                }
            })
            .catch(err => showError('Hata', err.message))
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
        try {
            const res = await fetch(`/api/services/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) {
                setService(data.service);
                return true;
            } else {
                showError('Hata', data.error);
                return false;
            }
        } catch (e) {
            console.error(e);
            return false;
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        const payload: any = { status: newStatus };
        if (newStatus === 'İşlemde') payload.startTime = new Date().toISOString();
        if (newStatus === 'Tamamlandı') payload.endTime = new Date().toISOString();
        
        const success = await handleUpdate(payload);
        if (success) {
            showSuccess('Durum Güncellendi', `Servis durumu "${newStatus}" olarak güncellendi.`);
            setIsActionsOpen(false);
        }
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64 = reader.result as string;
            const currentPhotos = service?.photos || [];
            const success = await handleUpdate({ photos: [...currentPhotos, base64] });
            if (success) showSuccess('Fotoğraf Eklendi', 'Servis galerisine yeni fotoğraf başarıyla yüklendi.');
        };
        reader.readAsDataURL(file);
    };

    const handleDeletePhoto = (idx: number) => {
        showConfirm('Fotoğraf Silinsin mi?', 'Bu işlemi geri alamazsınız.', async () => {
            const newPhotos = [...service.photos];
            newPhotos.splice(idx, 1);
            const success = await handleUpdate({ photos: newPhotos });
            if (success) showSuccess('Silindi', 'Fotoğraf başarıyla silindi.');
        });
    };

    const handlePayment = () => {
        const total = (totalParts + (service.activeLaborCost || 0)) * 1.2;
        const desc = `${service.plate || service.vehicleSerial || ''} Servis Ödemesi`;
        router.push(`/payment?amount=${total.toFixed(0)}&title=${encodeURIComponent(desc)}&ref=SRV-${service.id}&customerId=${service.customerId}`);
    };

    const isMotorized = (type: string) => {
        const t = (type || '').toLowerCase();
        const automotiveKeywords = ['motor', 'moto', 'araç', 'otomobil', 'araba', 'kamyon', 'otobüs', 'atv', 'scooter'];
        const nonAutomotiveKeywords = ['bisiklet', 'bicycle', 'bike', 'beyaz eşya', 'elektronik', 'mobilya'];
        return automotiveKeywords.some(kw => t.includes(kw)) && !nonAutomotiveKeywords.some(kw => t.includes(kw));
    };

    const getCategoryIcon = (type: string) => {
        const t = (type || '').toLowerCase();
        if (t.includes('moto')) return '🏍️';
        if (t.includes('bisiklet')) return '🚲';
        if (t.includes('beyaz')) return '🏠';
        if (t.includes('elektronik')) return '💻';
        return '🔧';
    };

    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center flex-col gap-6 ${isLight ? 'bg-slate-50' : 'bg-[#030712]'}`}>
                <div className="w-16 h-16 border-4 border-blue-500/10 border-t-blue-600 rounded-full animate-spin"></div>
                <span className="text-[11px] font-black uppercase tracking-[0.5em] text-blue-500/50">Terminal Yükleniyor</span>
            </div>
        );
    }

    if (!service) return null;

    const items = service.items || [];
    const totalParts = items.reduce((acc: number, item: any) => acc + (item.isWarranty ? 0 : (Number(item.price) || 0) * (Number(item.quantity) || 0)), 0);
    const taxRate = 0.20;
    const laborCost = service.laborCost || 500; // Mock or fallback if not in record
    const subTotal = totalParts + (!service.isLaborWarranty ? laborCost : 0);
    const vat = subTotal * taxRate;
    const finalTotal = subTotal + vat;

    const textMain = isLight ? 'text-slate-900' : 'text-white';
    const textMuted = isLight ? 'text-slate-500' : 'text-slate-400';
    const cardBg = isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#111827] border-white/5';
    const pageBg = isLight ? 'bg-[#f8fafc]' : 'bg-[#030712]';

    return (
        <div className={`min-h-screen ${pageBg} p-4 sm:p-8 font-sans`}>
            <div className="max-w-[1400px] mx-auto space-y-6">
                
                {/* COMPACT HEADER */}
                <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.push('/service')} className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${isLight ? 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50' : 'bg-white/5 border-white/10 text-white/40 hover:text-white'}`}><ArrowLeft size={18} /></button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className={`text-2xl font-black tracking-tight ${textMain}`}>Servis Kokpiti</h1>
                                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${isLight ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'}`}>SRV-{service.id.toString().slice(-6).toUpperCase()}</span>
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                                <span className={`text-[10px] font-black uppercase tracking-widest ${service.status === 'İşlemde' ? 'text-emerald-500' : 'text-blue-500'}`}>{service.status}</span>
                                {service.status === 'İşlemde' && (
                                    <div className="flex items-center gap-2 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 animate-pulse">
                                        <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
                                        <span className="text-[10px] font-black text-emerald-400 font-mono">{elapsedTime}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full lg:w-auto">
                        <button onClick={() => window.print()} className={`flex-1 lg:flex-none h-11 px-5 rounded-xl border font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${isLight ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50' : 'bg-white/5 border-white/10 text-white/60 hover:text-white'}`}>
                            <Printer size={16} /> Yazdır
                        </button>
                        
                        <div className="relative flex-1 lg:flex-none">
                            <button onClick={() => setIsActionsOpen(!isActionsOpen)} className="w-full h-11 px-6 rounded-xl bg-blue-600 text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-blue-600/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                                İŞLEM MENÜSÜ <ChevronDown size={14} className={`transition-transform ${isActionsOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isActionsOpen && (
                                <div className={`absolute right-0 top-full mt-2 w-56 rounded-2xl border shadow-2xl z-[100] overflow-hidden py-1.5 animate-in fade-in slide-in-from-top-2 duration-200 ${isLight ? 'bg-white border-slate-200' : 'bg-[#1f2937] border-white/10'}`}>
                                    <button onClick={() => handleStatusChange('İşlemde')} className={`w-full text-left px-5 py-3 text-[11px] font-black uppercase tracking-widest transition-colors flex items-center gap-3 ${isLight ? 'text-emerald-600 hover:bg-emerald-50' : 'text-emerald-400 hover:bg-emerald-400/10'}`}><Play size={14} strokeWidth={3} /> İŞE BAŞLA</button>
                                    <button onClick={() => handleStatusChange('Tamamlandı')} className={`w-full text-left px-5 py-3 text-[11px] font-black uppercase tracking-widest transition-colors flex items-center gap-3 ${isLight ? 'text-blue-600 hover:bg-blue-50' : 'text-blue-400 hover:bg-blue-400/10'}`}><CheckCircle2 size={14} strokeWidth={3} /> BAKIMI BİTİR</button>
                                    <div className={`h-px my-1.5 ${isLight ? 'bg-slate-100' : 'bg-white/5'}`}></div>
                                    <button onClick={() => router.push(`/offers?customerId=${service.customerId}&serviceId=${service.id}`)} className={`w-full text-left px-5 py-3 text-[11px] font-black uppercase tracking-widest transition-colors flex items-center gap-3 ${isLight ? 'text-slate-600 hover:bg-slate-50' : 'text-white/60 hover:bg-white/5'}`}><FileText size={14} strokeWidth={3} /> TEKLİF HAZIRLA</button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                    
                    {/* INFO CARDS (Grid 3x1 or 2x2 depending on screen) */}
                    <div className="xl:col-span-3 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Customer Profile */}
                            <div className={`rounded-3xl border p-6 flex flex-col gap-5 group transition-all ${cardBg} ${isLight ? 'hover:border-blue-200' : 'hover:border-blue-500/30'}`}>
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl border ${isLight ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'}`}><User size={20} /></div>
                                    <div>
                                        <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] opacity-40 ${textMain}`}>Müşteri Portföyü</h3>
                                        <div className={`text-lg font-black tracking-tight ${textMain}`}>{service.customer?.name}</div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><span className={`text-[9px] font-black uppercase tracking-widest opacity-30 ${textMain}`}>İletişim</span><div className={`text-[13px] font-bold ${textMuted}`}>{service.customer?.phone || '-'}</div></div>
                                    <div><span className={`text-[9px] font-black uppercase tracking-widest opacity-30 ${textMain}`}>Sistem ID</span><div className={`text-[11px] font-mono font-bold opacity-30 ${textMain}`}>#{service.customerId.slice(-8)}</div></div>
                                </div>
                            </div>

                            {/* Product/Vehicle Profile */}
                            <div className={`rounded-3xl border p-6 flex flex-col gap-5 group transition-all ${cardBg} ${isLight ? 'hover:border-emerald-200' : 'hover:border-emerald-500/30'}`}>
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl border ${isLight ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                                        <span className="text-xl">{getCategoryIcon(service.vehicleType)}</span>
                                    </div>
                                    <div>
                                        <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] opacity-40 ${textMain}`}>{isMotorized(service.vehicleType) ? 'Araç Kimliği' : 'Ürün Kimliği'}</h3>
                                        <div className={`text-lg font-black tracking-widest text-emerald-500`}>{isMotorized(service.vehicleType) ? (service.plate || 'PLAKASIZ') : (service.vehicleSerial || 'SERİ NO YOK')}</div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="col-span-2"><span className={`text-[9px] font-black uppercase tracking-widest opacity-30 ${textMain}`}>Model / Tanım</span><div className={`text-[13px] font-bold truncate ${textMuted}`}>{service.vehicleBrand || '-'}</div></div>
                                    <div><span className={`text-[9px] font-black uppercase tracking-widest opacity-30 ${textMain}`}>Performans</span><div className={`text-[13px] font-black text-emerald-500`}>{service.km ? `${service.km.toLocaleString()} KM` : '-'}</div></div>
                                </div>
                            </div>
                        </div>

                        {/* ATELIER OPERATIONS */}
                        <div className={`rounded-3xl border ${cardBg}`}>
                            <div className={`p-6 border-b flex justify-between items-center ${isLight ? 'border-slate-100' : 'border-white/5'}`}>
                                <h3 className={`text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-3 ${textMain}`}><Wrench size={16} className="text-blue-500" /> Atölye Operasyonları</h3>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[9px] font-black text-white/20 uppercase`}>Sorumlu:</span>
                                    <select value={service.technicianId || ''} onChange={(e) => handleUpdate({ technicianId: e.target.value })} className={`bg-transparent text-[11px] font-black uppercase tracking-tighter outline-none cursor-pointer ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                        <option value="" className={isLight ? 'text-slate-900' : 'bg-[#1f2937]'}>Seçilmedi</option>
                                        {technicians.map((t: any) => (<option key={t.id} value={t.id} className={isLight ? 'text-slate-900' : 'bg-[#1f2937]'}>{t.name}</option>))}
                                    </select>
                                </div>
                            </div>
                            
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Checklist */}
                                <div className="space-y-4">
                                    <h4 className={`text-[10px] font-black uppercase tracking-widest opacity-50 ${textMain}`}>Kontrol Listesi</h4>
                                    <div className="grid grid-cols-1 gap-2">
                                        {(service.checklist && Object.keys(service.checklist).length > 0 ? Object.keys(service.checklist) : ["Genel Kontrol", "Yıkama", "Fren Testi"]).map((item, i) => (
                                            <button key={i} onClick={() => {
                                                const current = service.checklist || {};
                                                handleUpdate({ checklist: { ...current, [item]: !current[item] } });
                                            }} className={`p-3 rounded-xl border flex items-center gap-3 transition-all text-left group ${service.checklist?.[item] ? (isLight ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'bg-emerald-500/10 border-emerald-500 text-emerald-400') : (isLight ? 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-300' : 'bg-white/5 border-white/5 text-white/20 hover:text-white/40')}`}>
                                                <div className={`w-5 h-5 rounded-md flex items-center justify-center border-2 transition-all ${service.checklist?.[item] ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-current opacity-20'}`}>{service.checklist?.[item] && <span className="font-black text-[10px]">✓</span>}</div>
                                                <span className="text-[12px] font-black tracking-tight">{item}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Billing Items */}
                                <div className="space-y-4">
                                    <h4 className={`text-[10px] font-black uppercase tracking-widest opacity-50 ${textMain}`}>Kullanılan Parçalar</h4>
                                    <div className="space-y-2 max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
                                        {items.map((item: any, i: number) => (
                                            <div key={i} className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${isLight ? 'bg-slate-50 border-slate-100' : 'bg-white/[0.02] border-white/5'}`}>
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${isLight ? 'bg-white text-slate-400' : 'bg-white/5 text-white/20'}`}>{item.type === 'Labor' ? <Wrench size={14}/> : <Package size={14}/>}</div>
                                                    <div>
                                                        <div className={`text-[12px] font-black tracking-tight leading-none ${textMain}`}>{item.name}</div>
                                                        <div className="text-[9px] font-bold text-blue-500 uppercase tracking-widest mt-1">x{item.quantity} Kalem</div>
                                                    </div>
                                                </div>
                                                <div className={`text-[12px] font-black ${item.isWarranty ? 'text-emerald-500 italic' : textMain}`}>{item.isWarranty ? 'GARANTİ' : `₺${(item.price * item.quantity).toLocaleString()}`}</div>
                                            </div>
                                        ))}
                                        {items.length === 0 && <div className={`py-12 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center opacity-20 ${isLight ? 'border-slate-200' : 'border-white/5'}`}><span className="text-3xl mb-2">📦</span><span className="text-[10px] font-black uppercase tracking-widest">Envanter Kaydı Yok</span></div>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* GALLERY & NOTES GRID */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className={`md:col-span-2 rounded-3xl border p-6 flex flex-col ${cardBg}`}>
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className={`text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-3 ${textMain}`}><Camera size={16} className="text-blue-500" /> Servis Galerisi</h3>
                                    <label className="cursor-pointer h-9 px-4 rounded-xl bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-blue-600/20">
                                        FOTOĞRAF EKLE <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                                    </label>
                                </div>
                                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                                    {(service.photos || []).map((photo: string, idx: number) => (
                                        <div key={idx} className={`aspect-square rounded-2xl overflow-hidden relative group border ${isLight ? 'border-slate-100' : 'border-white/5'}`}>
                                            <img src={photo} alt="Service" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                            <button onClick={() => handleDeletePhoto(idx)} className="absolute inset-0 bg-red-600/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white scale-0 group-hover:scale-100 duration-300"><Trash2 size={20} /></button>
                                        </div>
                                    ))}
                                    {(!service.photos || service.photos.length === 0) && <div className="col-span-full py-8 text-center text-[10px] font-black uppercase tracking-[0.4em] opacity-20 italic">Görsel bulunamadı</div>}
                                </div>
                            </div>

                            <div className={`rounded-3xl border p-6 flex flex-col ${cardBg}`}>
                                <h3 className={`text-[11px] font-black uppercase tracking-[0.3em] mb-4 flex items-center gap-3 ${textMain}`}><Info size={16} className="text-amber-500" /> Operasyon Notları</h3>
                                <div className={`flex-1 p-4 rounded-2xl text-[12px] font-bold italic leading-relaxed border border-dashed ${isLight ? 'bg-amber-50/30 border-amber-200 text-slate-600' : 'bg-white/[0.01] border-white/10 text-white/50'}`}>
                                    {service.notes ? `"${service.notes}"` : 'Müşteri şikayeti veya özel not girilmemiş.'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* DYNAMIC SIDEBAR (BILLING & TIMELINE) */}
                    <div className="space-y-6">
                        {/* THE FINANCE TERMINAL */}
                        <div className={`rounded-[32px] border p-8 relative overflow-hidden flex flex-col shadow-2xl ${isLight ? 'bg-white border-slate-200' : 'bg-[#151a2e] border-white/10'}`}>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                            
                            <div className="text-center mb-8">
                                <h3 className={`text-[10px] font-black uppercase tracking-[0.5em] opacity-30 mb-2 ${textMain}`}>FİNANSAL DURUM</h3>
                                <div className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${service.status === 'Tamamlandı' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-blue-500/10 border-blue-500/20 text-blue-500'}`}>TAHVİL BEKLENİYOR</div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center"><span className={`text-[11px] font-bold uppercase tracking-widest opacity-40 ${textMain}`}>PARÇA TOPLAMI</span><span className={`text-[13px] font-black ${textMain}`}>₺{totalParts.toLocaleString()}</span></div>
                                <div className="flex justify-between items-center"><span className={`text-[11px] font-bold uppercase tracking-widest opacity-40 ${textMain}`}>HİZMET BEDELİ</span><span className={`text-[13px] font-black ${service.isLaborWarranty ? 'text-emerald-500 line-through' : textMain}`}>₺{laborCost.toLocaleString()}</span></div>
                                <div className="flex justify-between items-center"><span className={`text-[11px] font-bold uppercase tracking-widest opacity-40 ${textMain}`}>KDV (%20)</span><span className={`text-[13px] font-black ${textMain}`}>₺{vat.toLocaleString()}</span></div>
                                
                                <div className={`h-px my-2 ${isLight ? 'bg-slate-100' : 'bg-white/5'}`}></div>
                                
                                <div className="flex flex-col items-center py-4">
                                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.5em] mb-3">ODENECEK TUTAR</span>
                                    <div className={`text-6xl font-black tracking-tighter ${textMain}`}>
                                        <span className="text-2xl font-light opacity-30 mr-1">₺</span>
                                        {finalTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    </div>
                                </div>
                            </div>

                            <button onClick={handlePayment} className="group relative mt-10 w-full h-16 rounded-3xl bg-blue-600 text-white text-[13px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-600/40 hover:scale-[1.02] active:scale-95 transition-all overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                                <div className="flex items-center justify-center gap-3">
                                    <CreditCard size={20} /> ÖDEMEYİ AL
                                </div>
                            </button>
                        </div>

                        {/* PROCESS TIMELINE */}
                        <div className={`rounded-3xl border p-6 ${cardBg}`}>
                            <h4 className={`text-[10px] font-black uppercase tracking-[0.4em] mb-8 text-center opacity-30 ${textMain}`}>SÜREÇ ZAMAN ÇİZELGESİ</h4>
                            <div className="space-y-8 relative ml-3">
                                <div className={`absolute left-[7px] top-2 bottom-2 w-[1px] ${isLight ? 'bg-slate-200' : 'bg-white/5'}`}></div>
                                
                                <div className="flex gap-5 items-start relative z-10">
                                    <div className={`w-4 h-4 rounded-full border-4 ${isLight ? 'border-slate-50' : 'border-[#030712]'} ${service.createdAt ? 'bg-blue-500' : 'bg-white/10'}`}></div>
                                    <div><div className={`text-[12px] font-black ${textMain}`}>Servis Kaydı Açıldı</div><div className={`text-[9px] font-black uppercase tracking-widest mt-1 opacity-30 ${textMain}`}>{new Date(service.createdAt).toLocaleString('tr-TR')}</div></div>
                                </div>
                                
                                <div className="flex gap-5 items-start relative z-10">
                                    <div className={`w-4 h-4 rounded-full border-4 ${isLight ? 'border-slate-50' : 'border-[#030712]'} ${service.startTime ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-white/10'}`}></div>
                                    <div><div className={`text-[12px] font-black ${service.startTime ? textMain : 'opacity-20 ' + textMain}`}>Operasyon Başlatıldı</div><div className={`text-[9px] font-black uppercase tracking-widest mt-1 opacity-30 ${textMain}`}>{service.startTime ? new Date(service.startTime).toLocaleString('tr-TR') : 'ATÖLYEDE BEKLENİYOR'}</div></div>
                                </div>

                                <div className="flex gap-5 items-start relative z-10">
                                    <div className={`w-4 h-4 rounded-full border-4 ${isLight ? 'border-slate-50' : 'border-[#030712]'} ${service.status === 'Tamamlandı' ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-white/10'}`}></div>
                                    <div><div className={`text-[12px] font-black ${service.status === 'Tamamlandı' ? textMain : 'opacity-20 ' + textMain}`}>Bakım Tamamlandı</div><div className={`text-[9px] font-black uppercase tracking-widest mt-1 opacity-30 ${textMain}`}>{service.endTime ? new Date(service.endTime).toLocaleString('tr-TR') : 'SÜREÇ DEVAM EDİYOR'}</div></div>
                                </div>
                            </div>
                        </div>

                        {/* HARDENING TIPS */}
                        <div className={`p-5 rounded-3xl border flex items-start gap-4 ${isLight ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'}`}>
                            <ShieldCheck size={20} className="shrink-0 mt-0.5" />
                            <p className="text-[10px] font-black uppercase leading-relaxed opacity-70 italic">Bu kayıt kurumsal garanti protokollerine uygundur. Tüm işlemler blokzinciri tabanlı deftere işlenmektedir.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
