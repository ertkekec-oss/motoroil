"use client";

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useModal } from '@/contexts/ModalContext';
import { useTheme } from '@/contexts/ThemeContext';
import { 
    ArrowLeft, 
    Printer, 
    Play, 
    CheckCircle2, 
    FileText, 
    Camera, 
    Trash2, 
    Clock, 
    User, 
    Package, 
    CreditCard, 
    Wrench, 
    Info, 
    ChevronDown,
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

    const fetchData = async () => {
        setLoading(true);
        try {
            const [sRes, tRes] = await Promise.all([
                fetch(`/api/services/${id}`),
                fetch('/api/staff')
            ]);
            const sData = await sRes.json();
            const tData = await tRes.json();
            if (sData.success) setService(sData.service);
            if (tData.success) setTechnicians(tData.staff.filter((s: any) => s.type === 'service' || s.role === 'service' || !s.role));
        } catch (e) { showError('Hata', 'Veri alınamadı.'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, [id]);

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
            setElapsedTime(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
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
            if (data.success) { setService(data.service); return true; }
            return false;
        } catch (e) { return false; }
    };

    const handleStatusChange = async (newStatus: string) => {
        const payload: any = { status: newStatus };
        if (newStatus === 'İşlemde') payload.startTime = new Date().toISOString();
        if (newStatus === 'Tamamlandı') payload.endTime = new Date().toISOString();
        const success = await handleUpdate(payload);
        if (success) { showSuccess('Güncellendi', `İş emri #${id.slice(-6)} artık ${newStatus}.`); setIsActionsOpen(false); }
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64 = reader.result as string;
            const currentPhotos = service?.photos || [];
            handleUpdate({ photos: [...currentPhotos, base64] });
        };
        reader.readAsDataURL(file);
    };

    const handlePayment = () => {
        const total = (totalParts + (service.activeLaborCost || 500)) * 1.2;
        router.push(`/payment?amount=${total.toFixed(0)}&title=ServisBedeli&ref=SRV-${service.id}&customerId=${service.customerId}`);
    };

    if (loading || !service) return <div className={`flex h-screen items-center justify-center ${isLight ? 'bg-[#F7F8FA] text-[#9CA3AF]' : 'bg-[#030712] text-slate-400'}`}>Yükleniyor...</div>;

    const items = service.items || [];
    const totalParts = items.reduce((acc: number, item: any) => acc + (item.isWarranty ? 0 : (Number(item.price) || 0) * (Number(item.quantity) || 0)), 0);
    const laborCost = service.laborCost || 500;
    const subTotal = totalParts + (service.isLaborWarranty ? 0 : laborCost);
    const tax = subTotal * 0.20;
    const finalTotal = subTotal + tax;

    // Enterprise Color System Tokens
    const bgApp = isLight ? 'bg-[#F7F8FA]' : 'bg-[#020617]';
    const bgMain = isLight ? 'bg-[#FFFFFF]' : 'bg-[#0f172a]';
    const bgSidebar = isLight ? 'bg-[#F8FAFC]' : 'bg-[#151a2e]';
    const bgMuted = isLight ? 'bg-[#F4F6F8]' : 'bg-slate-900/50';
    const borderMain = isLight ? 'border-[#E1E5EA]' : 'border-slate-800';
    const borderCard = isLight ? 'border-[#D9DEE5]' : 'border-slate-800';
    const borderDivider = isLight ? 'border-[#ECEFF3]' : 'border-slate-800';
    const textMain = isLight ? 'text-[#111827]' : 'text-white';
    const textSecondary = isLight ? 'text-[#4B5563]' : 'text-slate-400';
    const textMuted = isLight ? 'text-[#9CA3AF]' : 'text-slate-500';

    return (
        <div className={`min-h-screen ${bgApp} p-6 font-sans transition-colors duration-300`}>
            <div className="max-w-[1400px] mx-auto space-y-6">
                
                {/* COMPACT HEADER */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.push('/service')} className={`w-9 h-9 rounded-lg border flex items-center justify-center ${bgMain} ${borderMain} ${textSecondary} hover:bg-[#ECEFF3] transition-colors`}><ArrowLeft size={18} /></button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className={`text-xl font-semibold tracking-tight ${textMain}`}>Servis Kontrol Masası</h1>
                                <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-widest border ${isLight ? 'bg-[#F1F3F5] border-[#D6DAE1] text-[#4B5563]' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>SRV-{id.slice(-6).toUpperCase()}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`text-xs font-semibold ${service.status === 'İşlemde' ? 'text-[#027A48]' : 'text-[#175CD3]'}`}>{service.status}</span>
                                {service.status === 'İşlemde' && <span className={`text-[11px] font-mono ${textMuted}`}>({elapsedTime})</span>}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <button onClick={() => window.print()} className={`flex-1 md:flex-none h-9 px-4 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-colors ${bgMain} ${borderMain} ${textSecondary} hover:bg-[#F1F3F6]`}><Printer size={16} /> Yazdır</button>
                        <div className="relative flex-1 md:flex-none">
                            <button onClick={() => setIsActionsOpen(!isActionsOpen)} className="w-full h-9 px-4 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                                İşlemler <ChevronDown size={14} className={isActionsOpen ? 'rotate-180' : ''} />
                            </button>
                            {isActionsOpen && (
                                <div className={`absolute right-0 top-full mt-2 w-52 rounded-xl border shadow-xl z-50 overflow-hidden py-1.5 ${bgMain} ${borderCard}`}>
                                    <button onClick={() => handleStatusChange('İşlemde')} className={`w-full text-left px-4 py-2.5 text-sm font-medium text-[#027A48] hover:bg-[#ECFDF3] flex items-center gap-2`}><Play size={14} fill="currentColor" /> İşe Başla</button>
                                    <button onClick={() => handleStatusChange('Tamamlandı')} className={`w-full text-left px-4 py-2.5 text-sm font-medium text-[#175CD3] hover:bg-[#EFF8FF] flex items-center gap-2`}><CheckCircle2 size={14} /> Bakımı Bitir</button>
                                    <div className={`h-px my-1.5 ${borderDivider}`}></div>
                                    <button onClick={() => router.push(`/offers?customerId=${service.customerId}&serviceId=${service.id}`)} className={`w-full text-left px-4 py-2.5 text-sm font-medium ${textSecondary} hover:bg-[#F1F3F6] flex items-center gap-2`}><FileText size={14} /> Teklif Hazırla</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                    {/* LEFT PANEL */}
                    <div className="xl:col-span-3 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Profile 1 */}
                            <div className={`p-6 rounded-xl border shadow-[0_1px_2px_rgba(16,24,40,0.04)] ${bgMain} ${borderCard}`}>
                                <div className={`flex items-center gap-4 mb-4 pb-4 border-b ${borderDivider}`}>
                                    <div className="w-10 h-10 rounded-lg bg-[#EFF8FF] text-[#175CD3] flex items-center justify-center"><User size={20}/></div>
                                    <div><div className={`text-[11px] font-semibold uppercase tracking-wider ${textMuted}`}>Müşteri Sahibi</div><div className={`font-semibold ${textMain}`}>{service.customer?.name}</div></div>
                                </div>
                                <div className="flex justify-between items-center"><span className={`text-xs ${textSecondary}`}>Telefon</span><span className={`text-sm font-medium ${textMain}`}>{service.customer?.phone || '-'}</span></div>
                            </div>
                            {/* Profile 2 */}
                            <div className={`p-6 rounded-xl border shadow-[0_1px_2px_rgba(16,24,40,0.04)] ${bgMain} ${borderCard}`}>
                                <div className={`flex items-center gap-4 mb-4 pb-4 border-b ${borderDivider}`}>
                                    <div className="w-10 h-10 rounded-lg bg-[#ECFDF3] text-[#027A48] flex items-center justify-center font-bold">🔧</div>
                                    <div><div className={`text-[11px] font-semibold uppercase tracking-wider ${textMuted}`}>Araç / Cihaz</div><div className={`font-semibold ${textMain} tracking-widest`}>{service.plate || service.vehicleSerial || 'BELİRTİLMEMİŞ'}</div></div>
                                </div>
                                <div className="flex justify-between items-center"><span className={`text-xs ${textSecondary}`}>Model</span><span className={`text-sm font-medium ${textMain}`}>{service.vehicleBrand || '-'}</span></div>
                            </div>
                        </div>

                        {/* ATELIER SECTION */}
                        <div className={`rounded-xl border shadow-[0_1px_2px_rgba(16,24,40,0.04)] overflow-hidden ${bgMain} ${borderCard}`}>
                            <div className={`px-6 py-4 border-b flex justify-between items-center ${bgMuted} ${borderDivider}`}>
                                <h3 className={`text-sm font-semibold flex items-center gap-3 ${textMain}`}><Wrench size={16} className="text-[#2563EB]" /> Atölye Operasyonları</h3>
                                <div className="flex items-center gap-3">
                                    <span className={`text-[11px] font-semibold uppercase tracking-wider ${textMuted}`}>Atanan:</span>
                                    <select value={service.technicianId || ''} onChange={(e) => handleUpdate({ technicianId: e.target.value })} className={`bg-transparent text-sm font-semibold outline-none border-b ${borderCard} pb-0.5 ${textMain}`}>
                                        <option value="" className={isLight ? 'text-[#111827]' : 'text-[#111827]'}>Seçilmedi</option>
                                        {technicians.map((t: any) => (<option key={t.id} value={t.id} className={isLight ? 'text-[#111827]' : 'text-[#111827]'}>{t.name}</option>))}
                                    </select>
                                </div>
                            </div>
                            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Checklist */}
                                <div className="space-y-4">
                                    <h4 className={`text-[11px] font-bold uppercase tracking-wider ${textMuted}`}>Kontrol Listesi</h4>
                                    <div className="space-y-2">
                                        {(Object.keys(service.checklist || {})).map(item => (
                                            <div key={item} className={`flex items-center gap-3 p-2.5 rounded-lg border ${isLight ? 'bg-[#F4F6F8]/50 border-[#EEF1F4]' : 'border-slate-800'}`}>
                                                <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${service.checklist[item] ? 'bg-[#027A48] border-[#027A48] text-white' : (isLight ? 'border-[#D6DAE1]' : 'border-slate-700')}`}>{service.checklist[item] && <span className="font-bold text-[10px]">✓</span>}</div>
                                                <span className={`text-xs font-medium ${textMain}`}>{item}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {/* Parts */}
                                <div className="space-y-4">
                                    <h4 className={`text-[11px] font-bold uppercase tracking-wider ${textMuted}`}>Parça & Malzemeler</h4>
                                    <div className="space-y-2">
                                        {items.map((item: any, i: number) => (
                                            <div key={i} className={`flex justify-between items-center p-3 rounded-lg border ${borderCard} ${bgMuted}`}>
                                                <div className="flex items-center gap-3">
                                                    <div className={textMuted}><Package size={14}/></div>
                                                    <div><div className={`text-xs font-semibold ${textMain}`}>{item.name}</div><div className="text-[10px] text-[#2563EB] tracking-widest font-bold">x{item.quantity} KALEM</div></div>
                                                </div>
                                                <div className={`text-xs font-bold ${item.isWarranty ? 'text-[#027A48] italic' : textMain}`}>{item.isWarranty ? 'GARANTİ' : `₺${(item.price * item.quantity).toLocaleString()}`}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* GALLERY */}
                        <div className={`rounded-xl border shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-6 space-y-4 ${bgMain} ${borderCard}`}>
                            <div className="flex justify-between items-center">
                                <h3 className={`text-sm font-semibold flex items-center gap-3 ${textMain}`}><Camera size={16} className="text-[#2563EB]" /> Servis Galerisi</h3>
                                <label className="h-8 px-3 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[11px] font-bold uppercase cursor-pointer flex items-center gap-2 shadow-sm">📷 EKLE <input type="file" className="hidden" onChange={handlePhotoUpload} /></label>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                                {(service.photos || []).map((photo: string, idx: number) => (
                                    <div key={idx} className={`aspect-square rounded-lg border overflow-hidden relative group ${borderDivider}`}>
                                        <img src={photo} className="w-full h-full object-cover" />
                                        <button onClick={() => { const n = [...service.photos]; n.splice(idx, 1); handleUpdate({photos: n}); }} className="absolute inset-0 bg-[#B42318]/80 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"><Trash2 size={20}/></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* SIDEBAR */}
                    <div className="space-y-6">
                        {/* FINANCE SECTION */}
                        <div className={`rounded-xl border p-6 flex flex-col gap-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)] ${bgSidebar} ${borderCard}`}>
                            <div className="text-center pb-2">
                                <span className={`text-[10px] font-bold uppercase tracking-widest ${textMuted}`}>Finansal Özet</span>
                                <h3 className={`text-3xl font-bold tracking-tighter mt-1 ${textMain}`}><span className="text-lg opacity-30 mr-1">₺</span>{finalTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</h3>
                            </div>
                            <div className={`space-y-2 border-t pt-4 ${borderDivider}`}>
                                <div className="flex justify-between text-xs"><span className={textSecondary}>Ürünler</span><span className={`font-medium ${textMain}`}>₺{totalParts.toLocaleString()}</span></div>
                                <div className="flex justify-between text-xs text-[#2563EB]"><span className="font-medium">İşçilik</span><span className="font-bold">₺{laborCost.toLocaleString()}</span></div>
                                <div className="flex justify-between text-xs"><span className={textSecondary}>KDV (%20)</span><span className={`font-medium ${textMain}`}>₺{tax.toLocaleString()}</span></div>
                            </div>
                            <button onClick={handlePayment} className="h-12 w-full rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all">
                                <CreditCard size={18}/> Ödeme Sayfasına Git
                            </button>
                        </div>

                        {/* TIMELINE */}
                        <div className={`rounded-xl border p-6 space-y-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)] ${bgMain} ${borderCard}`}>
                            <h4 className={`text-[11px] font-bold uppercase tracking-wider text-center ${textMuted}`}>İşlem Bazlı Akış</h4>
                            <div className="space-y-8 relative ml-3">
                                <div className={`absolute left-[7px] top-2 bottom-2 w-[1px] ${borderDivider}`}></div>
                                {[
                                    {label: 'Kayıt Kabul', date: service.createdAt},
                                    {label: 'Operasyon Başlatıldı', date: service.startTime},
                                    {label: 'Bakım Bitiş', date: service.endTime}
                                ].map((step, i) => (
                                    <div key={i} className="flex gap-4 items-start relative z-10">
                                        <div className={`w-4 h-4 rounded-full border-4 ${isLight ? 'border-[#F7F8FA]' : 'border-[#020617]'} ${step.date ? 'bg-[#2563EB] shadow-[0_0_10px_rgba(37,99,235,0.2)]' : (isLight ? 'bg-[#D1D5DB]' : 'bg-slate-800')}`}></div>
                                        <div className="flex flex-col">
                                            <span className={`text-[13px] font-semibold ${step.date ? textMain : textMuted}`}>{step.label}</span>
                                            <span className={`text-[11px] mt-0.5 ${textMuted}`}>{step.date ? new Date(step.date).toLocaleTimeString('tr-TR') : 'Bekleniyor...'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className={`p-4 rounded-xl border flex items-start gap-4 ${bgMuted} ${borderCard}`}>
                            <Info size={18} className="text-[#B54708] shrink-0 mt-0.5" />
                            <p className="text-[11px] font-medium text-[#4B5563] leading-relaxed italic">Atölye işlemleri bittikten sonra "Ödemeyi Al" adımına geçilebilir. Tüm parçalar otomatik düşülecektir.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
