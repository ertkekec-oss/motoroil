"use client";

import React, { useState, useEffect } from "react";
import { 
    EnterpriseSectionHeader, 
    EnterpriseButton, 
    EnterpriseCard
} from "@/components/ui/enterprise";
import { 
    IconWrench, 
    IconCheck, 
    IconAlertCircle, 
    IconActivity,
    IconSave,
    IconPrinter,
    IconFileText,
    IconSettings,
    IconCornerUpRight,
    IconUsers
} from "@/components/icons/PremiumIcons";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";

const WORKFLOW = [
    { id: 'PENDING', label: 'Kabul' },
    { id: 'IN_PROGRESS', label: 'İşlemde' },
    { id: 'WAITING_APPROVAL', label: 'Onay Bekliyor' },
    { id: 'READY', label: 'Hazır' },
];

export default function ServiceOrderDetailPage() {
    const router = useRouter();
    const params = useParams();
    const [status, setStatus] = useState('PENDING');
    const [items, setItems] = useState<any[]>([]);
    const [orderData, setOrderData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Modal States
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [itemModalType, setItemModalType] = useState<'PART'|'LABOR'|'OUTSOURCED'>('PART');
    const [staffList, setStaffList] = useState<any[]>([]);
    const [itemForm, setItemForm] = useState({ name: '', quantity: 1, unitPrice: 0, technicianId: '', isWarrantyCovered: false });
    const [isSavingItem, setIsSavingItem] = useState(false);

    useEffect(() => {
        if (!params || !params.id || params.id === 'new') return; // 'new' is handled by different page
        fetchData();
        fetchStaff();
    }, [params.id]);

    const fetchData = () => {
        fetch(`/api/service-v2/${params.id}`)
            .then(res => res.json())
            .then(data => {
                if(data.success && data.order) {
                    setOrderData(data.order);
                    setStatus(data.order.status || 'PENDING');
                    setItems(data.order.items || []);
                }
                setIsLoading(false);
            })
            .catch(() => setIsLoading(false));
    };

    const fetchStaff = () => {
        fetch('/api/staff')
            .then(res => res.json())
            .then(data => {
                if (data.success && data.staff) setStaffList(data.staff);
            }).catch(() => {});
    };

    const handleStatusUpdate = async (newStatus: string) => {
        setStatus(newStatus);
        await fetch(`/api/service-v2/${params.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
    };

    const openAddItemModal = (type: 'PART'|'LABOR'|'OUTSOURCED') => {
        setItemModalType(type);
        setItemForm({ name: '', quantity: 1, unitPrice: 0, technicianId: '', isWarrantyCovered: false });
        setIsItemModalOpen(true);
    };

    const saveItem = async () => {
        if (!itemForm.name || Number(itemForm.unitPrice) <= 0) {
            alert("Lütfen isim ve geçerli bir birim fiyatı giriniz.");
            return;
        }
        setIsSavingItem(true);
        try {
            const res = await fetch(`/api/service-v2/${params.id}/items`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...itemForm, type: itemModalType })
            });
            const data = await res.json();
            if (data.success) {
                setIsItemModalOpen(false);
                fetchData(); // Reload UI
            } else {
                alert(data.error || 'Eklenemedi');
            }
        } finally {
            setIsSavingItem(false);
        }
    };

    const removeItem = async (itemId: string) => {
        if (!confirm('Bu kalemi silmek istediğinize emin misiniz?')) return;
        try {
            const res = await fetch(`/api/service-v2/${params.id}/items/${itemId}`, { method: 'DELETE' });
            if (res.ok) {
                fetchData();
            }
        } catch (e) {
            console.error(e);
        }
    };

    if (isLoading) return <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
        <div className="font-black tracking-widest text-[10px] text-slate-400 uppercase">Veriler Çekiliyor...</div>
    </div>;

    if (!orderData) return <div className="p-10 text-center font-bold text-slate-500">Maaalesef iş emri bulunamadı.</div>;

    const totalAmount = items.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0);
    const taxAmount = totalAmount * 0.20;
    const finalAmount = totalAmount + taxAmount;

    return (
        <div className="max-w-[1600px] mx-auto pt-8 px-4 sm:px-6 lg:px-8 space-y-6 animate-in fade-in duration-700 pb-20 font-sans">
            
            {/* Üst Kısım Header - Uzay Mekiği Hissi (Geliştirilmiş) */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4 bg-white/50 backdrop-blur-3xl p-6 rounded-[2rem] shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-white/80 ring-1 ring-slate-100/50">
                <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-[1.5rem] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/20 ring-4 ring-white">
                        <IconWrench className="w-10 h-10" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">İŞ EMRİ: {orderData.id.slice(0,8).toUpperCase()}</h1>
                        <p className="text-sm font-bold text-slate-500 flex items-center gap-2">
                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md uppercase tracking-widest text-[10px]">{orderData.asset?.brand || 'Markasız'} {orderData.asset?.model || ''}</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                            <span className="text-indigo-600 font-black">{orderData.customer?.name || 'Müşteri Belirsiz'}</span>
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button className="px-5 py-2.5 rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 text-sm font-bold text-slate-600 flex items-center gap-2 hover:bg-slate-50 hover:shadow-md transition-all">
                        <IconPrinter className="w-4 h-4" /> Servis Fişi
                    </button>
                    <button className="px-5 py-2.5 rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/20 text-sm font-black flex items-center gap-2 hover:bg-slate-800 hover:-translate-y-0.5 transition-all">
                        <IconFileText className="w-4 h-4" /> E-FATURA KES
                    </button>
                </div>
            </div>

            {/* Otonom Durum Çubuğu - Wizard Formatı */}
            <div className="bg-white p-3 rounded-[2rem] shadow-sm ring-1 ring-slate-100 flex flex-wrap items-center justify-between gap-4 mb-4">
                <div className="flex items-center w-full md:w-auto relative px-2">
                    {WORKFLOW.map((wf, idx) => {
                        const isActive = status === wf.id;
                        const isPast = WORKFLOW.findIndex(w => w.id === status) > idx;
                        return (
                            <div key={wf.id} className="flex items-center">
                                <button
                                    onClick={() => handleStatusUpdate(wf.id)}
                                    className={`relative z-10 flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] uppercase font-black tracking-widest transition-all ${
                                        isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 scale-105' :
                                        isPast ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100' : 'bg-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    {isPast && <IconCheck className="w-3.5 h-3.5" />}
                                    {wf.label}
                                </button>
                                {idx < WORKFLOW.length - 1 && (
                                    <div className="w-4 md:w-10 h-0.5 mx-1 md:mx-2 rounded-full bg-slate-100 overflow-hidden relative">
                                        {(isPast || isActive) && <div className="absolute inset-0 bg-indigo-500 w-full animate-in slide-in-from-left duration-1000" />}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
                {status === 'WAITING_APPROVAL' && (
                    <button onClick={() => window.open(`/p/approval/${orderData.id}`, '_blank')} className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-amber-950 rounded-2xl text-xs font-black uppercase tracking-tight shadow-[0_0_15px_rgba(245,158,11,0.4)] flex items-center gap-2 transition-all hover:scale-105 active:scale-95 ml-auto">
                        <BrandWhatsappIcon /> MÜŞTERİDEN ONAY İSTE
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* SOL: Cihaz ve Müşteri Karnesi (Dar Sütun) */}
                <div className="space-y-6 lg:col-span-4">
                    <div className="bg-white rounded-[2rem] p-8 shadow-sm ring-1 ring-slate-100 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-1000" />
                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                            CİHAZ / ARAÇ KARNESİ
                        </h3>

                        <div className="flex bg-slate-50 p-4 rounded-3xl items-center gap-4 mb-8">
                            <div className="w-14 h-14 rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/50 flex items-center justify-center text-indigo-600 font-bold text-xl uppercase">
                                {orderData.asset?.brand?.charAt(0) || <IconWrench className="w-6 h-6" />}
                            </div>
                            <div>
                                <h4 className="text-xl font-black text-slate-900 tracking-tight">{orderData.asset?.primaryIdentifier}</h4>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-white px-2 py-0.5 rounded-md inline-block mt-1 shadow-sm border border-slate-100 border-b-2">{orderData.asset?.brand} {orderData.asset?.model}</p>
                            </div>
                        </div>

                        <div className="space-y-5">
                            <div className="flex justify-between items-center bg-white">
                                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Gösterge / KM</span>
                                <span className="text-sm font-black text-slate-900 bg-slate-50 px-3 py-1 rounded-xl shadow-inner">{orderData.currentKm_or_Use?.toLocaleString() || 'Bilinmiyor'} KM</span>
                            </div>
                            <div className="flex justify-between items-start bg-white pt-2 border-t border-slate-50">
                                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1.5">Şikayet</span>
                                <span className="text-sm font-semibold text-slate-800 text-right w-2/3 leading-relaxed">{orderData.complaint || 'Belirtilmedi'}</span>
                            </div>
                            <div className="flex justify-between items-center bg-white pt-2 border-t border-slate-50">
                                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Garanti Durumu</span>
                                <span className="text-[10px] font-black tracking-widest uppercase text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200/50">KAPSAMİÇİ (MÜMKÜN)</span>
                            </div>
                            <div className="flex flex-col gap-2 pt-4 mt-2 border-t border-slate-100">
                                <span className="text-[10px] text-indigo-600/80 font-black uppercase tracking-widest">Atanan Usta (Aktif Zimmet)</span>
                                <div className="flex items-center gap-3 bg-indigo-50/50 p-3 rounded-2xl border border-indigo-100/50">
                                    <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-black shadow-md shadow-indigo-500/30">
                                       {(items.length > 0 && items.find(i => i.type==='LABOR')?.technician?.name) ? items.find(i => i.type==='LABOR').technician.name.substring(0,2).toUpperCase() : '?'}
                                    </div>
                                    <div>
                                        <p className="font-black text-sm text-indigo-950">
                                            {(items.length > 0 && items.find(i => i.type==='LABOR')?.technician?.name) || 'Henüz Atanmadı'}
                                        </p>
                                        <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Performans %98.4</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SAĞ: Reçete ve Yedek Parça (Geniş Sütun) */}
                <div className="space-y-6 lg:col-span-8 flex flex-col">
                    <div className="bg-white rounded-[2rem] shadow-sm ring-1 ring-slate-100 flex flex-col flex-1 overflow-hidden relative">
                        {/* Reçete Header */}
                        <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div>
                                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 flex items-center gap-2">
                                    SERVİS REÇETESİ
                                </h3>
                                <p className="text-lg font-black text-slate-900 tracking-tight">Hizmet Kaydı <span className="text-indigo-600">(Maliyet & Kâr)</span></p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button onClick={() => openAddItemModal('OUTSOURCED')} className="text-[11px] font-black uppercase tracking-widest text-amber-600 bg-white ring-1 ring-amber-200 px-4 py-2.5 rounded-xl shadow-sm hover:shadow-md hover:bg-amber-50 hover:-translate-y-0.5 transition-all flex items-center gap-2">
                                    + FASON (DIŞ)
                                </button>
                                <button onClick={() => openAddItemModal('LABOR')} className="text-[11px] font-black uppercase tracking-widest text-emerald-600 bg-white ring-1 ring-emerald-200 px-4 py-2.5 rounded-xl shadow-sm hover:shadow-md hover:bg-emerald-50 hover:-translate-y-0.5 transition-all flex items-center gap-2">
                                    <IconUsers className="w-3.5 h-3.5" /> + PERSONEL KOTASI
                                </button>
                                <button onClick={() => openAddItemModal('PART')} className="text-[11px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-600 text-white px-4 py-2.5 rounded-xl shadow-[0_5px_15px_rgba(79,70,229,0.2)] hover:shadow-[0_8px_20px_rgba(79,70,229,0.3)] hover:-translate-y-0.5 transition-all flex items-center gap-2">
                                    <IconActivity className="w-3.5 h-3.5" /> + STOK / YEDEK PARÇA
                                </button>
                            </div>
                        </div>
                        
                        {/* Tablo Alanı */}
                        <div className="flex-1 overflow-x-auto p-4 md:p-6 custom-scroll">
                            {items.length === 0 ? (
                                <div className="h-48 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
                                    <IconSettings className="w-8 h-8 mb-3 opacity-20" />
                                    <span className="text-sm font-bold uppercase tracking-widest opacity-50">Henüz Reçeteye Kalem Eklenmedi</span>
                                    <p className="text-xs font-medium mt-1 opacity-40">Yukarıdaki butonlardan işçilik veya parça ekleyin.</p>
                                </div>
                            ) : (
                                <table className="w-full text-left border-collapse min-w-[600px]">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-[10px] uppercase font-black tracking-widest text-slate-400">
                                            <th className="pb-4 px-4 w-24">TÜR</th>
                                            <th className="pb-4 px-4">ÜRÜN / AÇIKLAMA</th>
                                            <th className="pb-4 px-4 text-center">MİKTAR</th>
                                            <th className="pb-4 px-4 text-right">B.FİYATI</th>
                                            <th className="pb-4 px-4 text-right">TUTAR</th>
                                            <th className="pb-4 px-4 w-12 text-center"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50/80">
                                        {items.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="py-5 px-4 relative">
                                                    {item.isWarrantyCovered && <div className="absolute top-1 -left-1 w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>}
                                                    <span className={`text-[10px] font-black uppercase py-1.5 px-3 rounded-lg tracking-widest ${
                                                        item.type === 'PART' ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200/50' : 
                                                        item.type === 'LABOR' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50' : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/50'
                                                    }`}>
                                                        {item.type === 'PART' ? 'PARÇA' : item.type === 'LABOR' ? 'İŞÇİLİK' : 'FASON'}
                                                    </span>
                                                </td>
                                                <td className="py-5 px-4">
                                                    <div className="text-sm font-bold text-slate-800 tracking-tight">{item.name}</div>
                                                    {item.type === 'LABOR' && item.technician && (
                                                        <div className="text-[10px] font-black tracking-widest text-emerald-600 mt-1 uppercase flex items-center gap-1">
                                                            <IconCheck className="w-3 h-3" /> PRİM ZİMMETLİ: {item.technician?.name}
                                                        </div>
                                                    )}
                                                    {item.isWarrantyCovered && (
                                                        <div className="text-[10px] font-black tracking-widest text-emerald-500 mt-1 uppercase bg-emerald-50 inline-block px-2 py-0.5 rounded-md">GARANTİ KAPSAMI (%100)</div>
                                                    )}
                                                </td>
                                                <td className="py-5 px-4 text-center">
                                                    <span className="text-sm font-black text-slate-700 bg-slate-100 px-3 py-1 rounded-lg">{Number(item.quantity || 1)}</span>
                                                </td>
                                                <td className="py-5 px-4 text-right">
                                                    <span className={`text-sm font-bold ${item.isWarrantyCovered ? 'text-slate-300 line-through' : 'text-slate-500'}`}>{Number(item.unitPrice || 0).toLocaleString()} ₺</span>
                                                </td>
                                                <td className="py-5 px-4 text-right">
                                                    <span className={`text-sm font-black ${item.isWarrantyCovered ? 'text-emerald-500' : 'text-slate-950'}`}>{Number(item.totalPrice || 0).toLocaleString()} ₺</span>
                                                </td>
                                                <td className="py-5 px-4 text-center">
                                                    <button onClick={() => removeItem(item.id)} className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center font-bold transition-all mx-auto opacity-0 group-hover:opacity-100">×</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Toplam Matrisi */}
                        <div className="bg-slate-950 p-6 md:p-8 rounded-b-[2rem] text-slate-300 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                            <div className="flex flex-col gap-3 items-end relative z-10">
                                <div className="flex justify-between w-64 text-sm font-bold opacity-70 hover:opacity-100 transition-opacity">
                                    <span>Ara Toplam Maliyet</span>
                                    <span>{totalAmount.toLocaleString()} ₺</span>
                                </div>
                                <div className="flex justify-between w-64 text-sm font-bold opacity-70 hover:opacity-100 transition-opacity">
                                    <span>Hesaplanan KDV (%20)</span>
                                    <span>{taxAmount.toLocaleString()} ₺</span>
                                </div>
                                <div className="w-64 h-px bg-white/20 my-2" />
                                <div className="flex justify-between w-64 text-xl font-black text-white items-end gap-4">
                                    <span className="text-[10px] tracking-widest uppercase text-slate-400 mb-1">MÜŞTERİYE ÇIKACAK<br/>GENEL TOPLAM</span>
                                    <span className="text-indigo-400 text-3xl">{finalAmount.toLocaleString()} ₺</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* FASON/İŞÇİLİK/PARÇA EKLEME MODALI */}
            {isItemModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300 p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300 ring-1 ring-slate-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 blur-3xl -translate-y-1/2 translate-x-1/2 opacity-20" style={{ backgroundColor: itemModalType === 'PART' ? '#4f46e5' : itemModalType === 'LABOR' ? '#10b981' : '#f59e0b'}} />
                            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2 relative z-10">
                                {itemModalType === 'PART' ? <IconActivity className="text-indigo-600"/> : itemModalType === 'LABOR' ? <IconUsers className="text-emerald-600"/> : <IconSettings className="text-amber-600"/>}
                                {itemModalType === 'PART' ? 'STOK / PARÇA EKLE' : itemModalType === 'LABOR' ? 'İŞÇİLİK / PRESTİJ' : 'FASON GİDER EKLE'}
                            </h2>
                            <button onClick={() => setIsItemModalOpen(false)} className="w-8 h-8 rounded-full bg-slate-200/50 flex items-center justify-center font-bold text-slate-500 hover:bg-slate-300 hover:text-slate-800 transition-colors relative z-10">×</button>
                        </div>
                        <div className="p-6 space-y-5 bg-white">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">Hizmet / Parça Adı</label>
                                <input type="text" className="w-full bg-white border-none ring-1 ring-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 shadow-sm outline-none" placeholder={itemModalType === 'PART' ? 'Örn: Fren Balatası (S)' : 'Örn: Motor İndirme İşçiliği'} value={itemForm.name} onChange={e => setItemForm({...itemForm, name: e.target.value})} />
                            </div>

                            {itemModalType === 'LABOR' && (
                                <div className="animate-in slide-in-from-top-2">
                                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">Hangi Personel Yaptı? (HR Verimi İçin)</label>
                                    <select className="w-full bg-white border-none ring-1 ring-emerald-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 shadow-sm outline-none cursor-pointer" value={itemForm.technicianId} onChange={e => setItemForm({...itemForm, technicianId: e.target.value})}>
                                        <option value="">-- Atama Yapılmayacak / Şirket Kârı --</option>
                                        {staffList.map(s => <option key={s.id} value={s.id}>{s.name} ({s.status || 'Personel'})</option>)}
                                    </select>
                                    <p className="text-[9px] font-bold text-emerald-600/80 uppercase mt-2 flex items-center gap-1"><IconCheck className="w-3 h-3"/>*Seçilen personelin HR Departmanı Prim Kotasına işlenir.</p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">Miktar / Saat</label>
                                    <input type="number" min="1" className="w-full bg-white border-none ring-1 ring-slate-200 rounded-xl px-4 py-3 text-sm font-black text-slate-900 text-center focus:ring-2 focus:ring-indigo-500 shadow-sm outline-none" value={itemForm.quantity} onChange={e => setItemForm({...itemForm, quantity: Number(e.target.value)})} />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">Birim Fiyatı (₺)</label>
                                    <input type="number" className="w-full bg-white border-none ring-1 ring-slate-200 rounded-xl px-4 py-3 text-sm font-black text-slate-900 text-right focus:ring-2 focus:ring-indigo-500 shadow-sm outline-none" value={itemForm.unitPrice} onChange={e => setItemForm({...itemForm, unitPrice: Number(e.target.value)})} />
                                </div>
                            </div>

                            <label className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 ring-1 ring-slate-200 cursor-pointer hover:bg-slate-100 transition-colors mt-2">
                                <div className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${itemForm.isWarrantyCovered ? 'bg-emerald-500 text-white shadow-md' : 'bg-white ring-1 ring-slate-300'}`}>
                                    {itemForm.isWarrantyCovered && <IconCheck className="w-4 h-4" />}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-black text-slate-800 tracking-tight">Ücretsiz! (Garanti Kapsamı)</p>
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mt-0.5">Müşteriye 0₺ Yansır, İç Maliyet Yazılır</p>
                                </div>
                                <input type="checkbox" className="hidden" checked={itemForm.isWarrantyCovered} onChange={e => setItemForm({...itemForm, isWarrantyCovered: e.target.checked})} />
                            </label>

                            <button onClick={saveItem} disabled={isSavingItem} className="w-full mt-4 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-black text-sm uppercase tracking-widest py-4 rounded-xl transition-all flex items-center justify-center shadow-xl shadow-slate-900/20 disabled:opacity-50">
                                {isSavingItem ? 'KAYDEDİLİYOR...' : 'REÇETEYE ONAYLA (+)'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
function BrandWhatsappIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.592 6.592 6.592a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
        </svg>
    )
}
