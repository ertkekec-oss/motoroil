"use client";

import React, { useState, useEffect } from "react";
import { 
    IconWrench, 
    IconCheck, 
    IconAlertCircle, 
    IconActivity,
    IconPrinter,
    IconPlus,
    IconCornerUpRight
} from "@/components/icons/PremiumIcons";
import { useRouter, useParams } from "next/navigation";
import { useSettings } from "@/contexts/SettingsContext";

// YENİDEN SIRALANAN İŞ AKIŞI: 1) Kabul, 2) Onay Bekliyor, 3) İşlemde, 4) Hazır
const WORKFLOW = [
    { id: 'PENDING', label: '1. Kabul Aşaması' },
    { id: 'WAITING_APPROVAL', label: '2. Onay Bekliyor' },
    { id: 'IN_PROGRESS', label: '3. İşlemde' },
    { id: 'READY', label: '4. Teslimat (Hazır)' },
];

export default function ServiceOrderDetailPage() {
    const router = useRouter();
    const params = useParams();
    const { serviceSettings } = useSettings();

    const [status, setStatus] = useState('PENDING'); 
    const [items, setItems] = useState<any[]>([]);
    const [orderData, setOrderData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Modal States
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [itemModalType, setItemModalType] = useState<'PART'|'LABOR'|'OUTSOURCED'>('PART');
    const [itemForm, setItemForm] = useState({ name: '', quantity: 1, unitPrice: 0, productId: '', isWarrantyCovered: false });
    const [isSavingItem, setIsSavingItem] = useState(false);

    // Multiple Part Queue (Çoklu Seçim)
    const [partQueue, setPartQueue] = useState<{id: string, productId: string, name: string, quantity: number, unitPrice: number, isWarrantyCovered: boolean}[]>([]);

    // Products pool
    const [products, setProducts] = useState<any[]>([]);
    const [progressLog, setProgressLog] = useState('');
    const [reminder, setReminder] = useState('');

    useEffect(() => {
        if (!params || !params.id || params.id === 'new') return;
        fetchData();
        fetchProducts();
    }, [params.id]);

    const fetchData = () => {
        setIsLoading(true);
        // Add cache busting to ensure we never get stale "empty" requests
        fetch(`/api/service-v2/${params.id}?t=${Date.now()}`, { cache: 'no-store' })
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

    const fetchProducts = () => {
        fetch('/api/products', { cache: 'no-store' })
            .then(res => res.json())
            .then(data => {
                let list = [];
                if (Array.isArray(data)) list = data;
                else if (data && data.products) list = data.products;
                setProducts(list);
            }).catch(() => {});
    };

    const handleTabChange = async (newStatus: string) => {
        setStatus(newStatus);
        await fetch(`/api/service-v2/${params.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
    };

    const openAddItemModal = (type: 'PART'|'LABOR'|'OUTSOURCED') => {
        setItemModalType(type);
        setItemForm({ name: '', quantity: 1, unitPrice: 0, productId: '', isWarrantyCovered: false });
        setPartQueue([]); // Reset multi-select queue
        setIsItemModalOpen(true);
    };

    const addToPartQueue = (productId: string) => {
        const prod = products.find(p => p.id === productId);
        if (!prod) return;
        
        let initialPrice = Number(prod.price || 0);
        if (initialPrice === 0 && prod.prices && prod.prices.length > 0) {
            initialPrice = Number(prod.prices[0].price || 0);
        }

        const existingIndex = partQueue.findIndex(p => p.productId === productId);
        if (existingIndex >= 0) {
            // increment qty
            const newQueue = [...partQueue];
            newQueue[existingIndex].quantity += 1;
            setPartQueue(newQueue);
        } else {
            setPartQueue([...partQueue, {
                id: Math.random().toString(),
                productId: prod.id,
                name: prod.name,
                quantity: 1,
                unitPrice: initialPrice,
                isWarrantyCovered: false
            }]);
        }
    };

    const updatePartQueueItem = (id: string, field: string, value: any) => {
        setPartQueue(partQueue.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    const removePartQueueItem = (id: string) => {
        setPartQueue(partQueue.filter(p => p.id !== id));
    };

    const saveItemsQueue = async () => {
        if (itemModalType === 'PART') {
            if (partQueue.length === 0) {
                alert("Lütfen listeye yedek parça ekleyin.");
                return;
            }
            setIsSavingItem(true);
            try {
                // Sırayla (Sequential) kayıt atılıyor ki veritabanı "transaction" kilitlenmesi yaşanmasın
                for (const p of partQueue) {
                    const res = await fetch(`/api/service-v2/${params.id}/items`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            type: 'PART', 
                            name: p.name, 
                            quantity: p.quantity, 
                            unitPrice: p.unitPrice, 
                            productId: p.productId, 
                            isWarrantyCovered: p.isWarrantyCovered 
                        })
                    });
                    if (!res.ok) throw new Error("Parça eklenemedi.");
                }
                setIsItemModalOpen(false);
                fetchData();
            } finally {
                setIsSavingItem(false);
            }
        } else {
            // Isçilik veya Fason (Single)
            if (!itemForm.name || Number(itemForm.unitPrice) < 0) {
                alert("Lütfen geçerli bir kalem adı ve fiyat (0 veya üstü) girin.");
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
                    fetchData();
                } else {
                    alert(data.error || 'Eklenemedi');
                }
            } finally {
                setIsSavingItem(false);
            }
        }
    };

    const removeItem = async (itemId: string) => {
        if (!confirm('Kalemi silmek istediğinize emin misiniz?')) return;
        try {
            const res = await fetch(`/api/service-v2/${params.id}/items/${itemId}`, { method: 'DELETE' });
            if (res.ok) fetchData();
        } catch (e) {}
    };

    if (isLoading) return <div className="p-10 text-slate-500 font-semibold tracking-widest uppercase text-sm animate-pulse">Yükleniyor...</div>;
    if (!orderData) return <div className="p-10 text-slate-500 font-semibold tracking-widest uppercase text-sm">İş Emri Bulunamadı veya Yüklenemedi.</div>;

    const totalAmount = items.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0);
    const taxAmount = totalAmount * 0.20; // Example static 20%
    const finalAmount = totalAmount + taxAmount;

    const ReceiptTable = ({ allowEdit = true }) => (
        <div className="bg-transparent mt-2">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4 mb-4">
                <p className="font-medium text-[13px] text-slate-500 tracking-tight">İşleme eklenecek parçalar ve el emeği bedelleri</p>
                {allowEdit && (
                    <div className="flex flex-wrap gap-2">
                        <button onClick={() => openAddItemModal('OUTSOURCED')} className="h-9 px-4 text-[11px] font-bold tracking-widest text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all uppercase">FASON/DIŞ EK</button>
                        <button onClick={() => openAddItemModal('LABOR')} className="h-9 px-4 text-[11px] font-bold tracking-widest text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all uppercase">İŞÇİLİK YANSIT</button>
                        <button onClick={() => openAddItemModal('PART')} className="h-9 px-4 text-[11px] font-bold tracking-widest text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-md shadow-slate-900/10 flex items-center gap-2 uppercase">
                            <IconPlus className="w-3.5 h-3.5" /> Çoklu Parça Seç
                        </button>
                    </div>
                )}
            </div>
            {items.length === 0 ? (
                <div className="py-12 text-center text-[13px] font-semibold text-slate-400 bg-slate-50/50 rounded-2xl border border-slate-100 border-dashed">Reçeteye henüz işlem eklenmemiş.</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[600px] mb-4">
                        <thead>
                            <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-widest text-[10px]">
                                <th className="px-4 py-3 font-black">Tür</th>
                                <th className="px-4 py-3 font-black">Kalem / Açıklama</th>
                                <th className="px-4 py-3 font-black text-center">Miktar</th>
                                <th className="px-4 py-3 font-black text-right">Tutar (KDV Dahil)</th>
                                {allowEdit && <th className="px-4 py-3 text-center"></th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {items.map(item => (
                                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-4 py-4 w-32">
                                        <span className={`inline-block px-2.5 py-1 text-[9px] font-bold rounded-md uppercase ${item.type === 'PART' ? 'text-sky-700 bg-sky-50 border border-sky-100/50' : item.type === 'LABOR' ? 'text-indigo-700 bg-indigo-50 border border-indigo-100/50' : 'text-slate-600 bg-slate-100 border border-slate-200/50'}`}>
                                            {item.type === 'PART' ? 'Y.PARÇA / STOK' : item.type === 'LABOR' ? 'İŞÇİLİK' : 'DIŞ FASON'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-[13.5px] font-black text-slate-800">
                                        {item.name}
                                        {item.isWarrantyCovered && <span className="ml-2 px-1.5 py-0.5 text-[9px] bg-amber-100 text-amber-700 rounded font-black uppercase tracking-widest border border-amber-200/50">Garanti İçi</span>}
                                    </td>
                                    <td className="px-4 py-4 text-center font-bold text-[13px] text-slate-500">{item.quantity}</td>
                                    <td className="px-4 py-4 text-right font-black text-[14px] text-slate-900">
                                        {item.isWarrantyCovered ? <span className="text-amber-600 line-through opacity-50 block text-[11px] mb-0.5">{Number(item.totalPrice).toLocaleString()} ₺</span> : ''}
                                        {item.isWarrantyCovered ? '0.00 ₺' : `${Number(item.totalPrice).toLocaleString()} ₺`}
                                    </td>
                                    {allowEdit && (
                                        <td className="px-4 py-4 text-center w-12">
                                            <button onClick={() => removeItem(item.id)} className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-red-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100 shadow-sm" title="Satırı Sil">✕</button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-6 flex flex-col items-end mt-2">
                <div className="w-full sm:w-64 space-y-3">
                    <div className="flex justify-between text-[13px] font-bold text-slate-500">
                        <span>Ara Toplam:</span>
                        <span>{totalAmount.toLocaleString()} ₺</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-bold tracking-widest text-slate-400 uppercase">
                        <span>Tahmini Vergi:</span>
                        <span>{taxAmount.toLocaleString()} ₺</span>
                    </div>
                    <div className="flex justify-between text-[18px] font-black text-slate-900 border-t-2 border-slate-200/80 pt-4 mt-2">
                        <span>GENEL TOPLAM:</span>
                        <span className="text-indigo-600">{finalAmount.toLocaleString()} ₺</span>
                    </div>
                </div>
            </div>
        </div>
    );

    const PhotoUploader = ({ count }: { count: number }) => (
        <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 bg-slate-50/50 text-center cursor-pointer hover:bg-slate-50 transition-colors mt-2 group">
            <IconActivity className="w-8 h-8 mx-auto mb-3 text-slate-300 group-hover:text-indigo-500 transition-colors" />
            <p className="text-[13px] font-bold text-slate-700">Fotoğraf veya Belge Yükle</p>
            <p className="text-[11px] font-semibold text-slate-400 mt-1 uppercase tracking-widest">({count} adet eklendi)</p>
        </div>
    );

    return (
        <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8 font-sans pb-32 animate-in fade-in duration-500 bg-[#F8FAFC] min-h-screen">
            
            {/* Premium Header */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-6 lg:p-7 mb-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <button onClick={() => router.push('/service')} className="w-12 h-12 flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-2xl transition-all shrink-0 border border-slate-200/60 hover:shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                    </button>
                    <div>
                        <div className="flex items-center gap-4 mb-2">
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                                İŞ EMRİ #{orderData.id.slice(0,8).toUpperCase()}
                            </h1>
                            <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg font-bold text-[11px] uppercase tracking-widest border border-blue-100 shadow-sm">
                                {WORKFLOW.find(w => w.id === status)?.label.replace(/^\d\.\s/, '') || status}
                            </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[13px] font-medium text-slate-500">
                            <span>Müşteri: <strong className="text-slate-800">{orderData.customer?.name}</strong></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mx-2"></span>
                            <span>Cihaz: <strong className="text-slate-800">{orderData.asset?.brand || 'Marka Belirtilmemiş'} {orderData.asset?.model || ''}</strong></span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-wrap gap-3 w-full lg:w-auto">
                    <button className="h-12 flex-1 lg:flex-none px-6 text-[13px] font-bold text-slate-700 bg-white border border-slate-200/80 rounded-2xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm flex items-center justify-center gap-2">
                        <IconPrinter className="w-5 h-5" /> YAZDIR
                    </button>
                    <button className="h-12 flex-1 lg:flex-none px-6 text-[13px] font-bold text-white bg-slate-900 border border-slate-900 rounded-2xl hover:bg-slate-800 hover:-translate-y-0.5 transition-all shadow-xl shadow-slate-900/20">
                        E-FATURA KES
                    </button>
                </div>
            </div>

            {/* Horizontal Workflow Stepper */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-4 mb-8 overflow-x-auto custom-scrollbar">
                <div className="flex items-center justify-between min-w-[800px] w-full relative">
                    {/* Background Connector Line for Stepper */}
                    <div className="absolute left-[5%] right-[5%] z-0 h-[2px] bg-slate-100 top-1/2 -translate-y-1/2"></div>
                    
                    {WORKFLOW.map((wf) => {
                        const wfIndex = WORKFLOW.findIndex(w => w.id === wf.id);
                        const currentIndex = WORKFLOW.findIndex(w => w.id === status);
                        const isPast = wfIndex < currentIndex;
                        const isActive = wfIndex === currentIndex;
                        
                        return (
                            <div key={wf.id} className="flex-1 flex flex-col items-center justify-center relative z-10">
                                <button 
                                    onClick={() => handleTabChange(wf.id)}
                                    className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl transition-all ${
                                        isActive 
                                        ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20 scale-105 ring-4 ring-white' 
                                        : isPast 
                                        ? 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm' 
                                        : 'bg-white border border-slate-100 text-slate-400 hover:bg-slate-50'
                                    }`}
                                >
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-[11px] ${
                                        isActive ? 'bg-white/20 text-white' : isPast ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                                    }`}>
                                        {isPast ? <IconCheck className="w-4 h-4" /> : wfIndex + 1}
                                    </div>
                                    <div className={`text-[12px] font-black uppercase tracking-widest ${isActive ? 'text-white' : ''}`}>
                                        {wf.label.replace(/^\d\.\s/, '')}
                                    </div>
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* SOL KOLON: Aktif Aşama İçeriği (Ana Sahne) */}
                <div className="lg:col-span-8 space-y-6">
                    
                    {/* 1. KABUL AŞAMASI */}
                    {status === 'PENDING' && (
                        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                            <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden">
                                <div className="p-6 lg:p-8">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                            <IconWrench className="w-5 h-5" />
                                        </div>
                                        <h3 className="text-[16px] font-black text-slate-900 uppercase tracking-tight">Sisteme Yansılatılacak Maliyetler (Reçete)</h3>
                                    </div>
                                    <ReceiptTable allowEdit={true} />
                                </div>
                            </div>

                            <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden p-6 lg:p-8">
                                <h3 className="text-[14px] font-black text-slate-800 uppercase tracking-widest mb-4">Kabul Dosyaları & Fiziki Evraklar</h3>
                                <PhotoUploader count={0} />
                            </div>
                        </div>
                    )}

                    {/* 2. ONAY BEKLİYOR */}
                    {status === 'WAITING_APPROVAL' && (
                        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                            <div className="bg-white rounded-3xl shadow-sm border border-sky-200/80 p-8 lg:p-12 flex flex-col items-center relative overflow-hidden">
                                <div className="absolute top-0 w-full h-2 bg-gradient-to-r from-sky-400 to-indigo-500"></div>
                                <div className="w-20 h-20 bg-sky-50 text-sky-500 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-sky-100">
                                    <IconActivity className="w-10 h-10" />
                                </div>
                                <h3 className="text-[24px] font-black text-slate-900 tracking-tight text-center">Fiyat ve İşlem Onayı Bekleniyor</h3>
                                <p className="text-[14px] font-medium text-slate-500 mt-3 text-center max-w-lg leading-relaxed">
                                    Müşteriye uygulanacak olan malzeme ve işçilik bedellerinin kesin onayını almanız, sonraki aşamalarda yaşanacak itirazları engeller.
                                </p>

                                <div className="w-full max-w-2xl bg-slate-50/50 border border-slate-200/80 rounded-3xl p-8 mt-10 mb-10 shadow-sm">
                                    <h4 className="font-black text-[11px] uppercase tracking-widest text-slate-400 pb-4 mb-4 border-b border-slate-200/80">Müşteriye Sunulacak Maliyet Özeti</h4>
                                    <div className="space-y-3">
                                        {items.length === 0 ? (
                                            <div className="flex items-center justify-center p-6 bg-white rounded-2xl border border-slate-100 border-dashed">
                                                <p className="text-sm font-semibold text-slate-400 text-center uppercase tracking-widest">Reçeteye hiçbir kalem yansıtılmamış.</p>
                                            </div>
                                        ) : items.map(i => (
                                            <div key={i.id} className="flex justify-between items-center text-[14px] font-bold text-slate-700 bg-white px-5 py-4 rounded-2xl border border-slate-100 shadow-sm">
                                                <span className="flex items-center gap-4">
                                                    <span className="text-sky-700 bg-sky-50 px-3 py-1 rounded-lg text-[11px] font-black border border-sky-100/50">{i.quantity} AD</span> 
                                                    <span className="truncate max-w-[250px]">{i.name}</span>
                                                </span>
                                                <span className="text-slate-900 font-black">{Number(i.totalPrice).toLocaleString()} ₺</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-between items-end font-black text-[22px] text-slate-900 border-t-2 border-slate-200/80 pt-6 mt-6">
                                        <span className="text-[12px] text-slate-500 uppercase tracking-widest">Genel Toplam (+Kdv)</span>
                                        <span className="text-[32px] text-sky-600 leading-none">{finalAmount.toLocaleString()} ₺</span>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-2xl">
                                    <button onClick={() => window.open(`/p/approval/${orderData.id}`, '_blank')} className="h-14 flex-1 bg-[#25D366] text-white rounded-2xl font-black uppercase tracking-widest text-[13px] shadow-lg shadow-[#25D366]/20 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3">
                                        WHATSAPP'TAN ONAY İSTE
                                    </button>
                                    <button onClick={() => handleTabChange('IN_PROGRESS')} className="h-14 flex-1 bg-white border-2 border-slate-200 text-slate-700 hover:border-slate-800 hover:text-slate-900 rounded-2xl font-black uppercase tracking-widest text-[13px] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3">
                                        MANUEL ONAY ALINDI
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 3. İŞLEMDE */}
                    {status === 'IN_PROGRESS' && (
                        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                            <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden p-6 lg:p-8">
                                <h3 className="text-[14px] font-black text-slate-800 uppercase tracking-widest mb-5">Operasyon (Usta) Çalışma Günlüğü</h3>
                                <div className="border border-slate-200 bg-slate-50 rounded-2xl overflow-hidden shadow-inner focus-within:ring-2 focus-within:ring-emerald-500/50 transition-all">
                                    <textarea 
                                        className="w-full h-48 p-6 text-[15px] font-medium text-slate-800 bg-transparent border-none focus:ring-0 outline-none resize-none placeholder:text-slate-400 leading-relaxed" 
                                        placeholder="Teknisyen işlem detaylarını buraya girebilir. (Örn: Anakart entegresi değiştirildi, termal macun yenilendi, testten başarıyla geçti...)"
                                        value={progressLog}
                                        onChange={e => setProgressLog(e.target.value)}
                                    ></textarea>
                                    <div className="bg-white border-t border-slate-200 p-4 flex justify-end">
                                        <button className="h-12 px-8 text-[12px] font-bold tracking-widest uppercase text-white bg-slate-900 rounded-xl hover:bg-slate-800 hover:-translate-y-0.5 shadow-lg shadow-slate-900/20 transition-all">
                                            GÜNLÜĞÜ KAYDET
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden p-6 lg:p-8">
                                <h3 className="text-[14px] font-black text-slate-800 uppercase tracking-widest mb-5">Ek Maliyet Ve Değişen Parça Kaydı (İsteğe Bağlı)</h3>
                                <ReceiptTable allowEdit={true} />
                            </div>

                            <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden p-6 lg:p-8">
                                <h3 className="text-[14px] font-black text-slate-800 uppercase tracking-widest mb-5">Tamir Anı Kareleri (Müşteriye Gösterilebilir)</h3>
                                <PhotoUploader count={2} />
                            </div>
                        </div>
                    )}

                    {/* 4. TESLİMAT (HAZIR) */}
                    {status === 'READY' && (
                        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                            <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-8 shadow-sm flex items-center gap-6">
                                <div className="w-16 h-16 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/30">
                                    <IconCheck className="w-8 h-8" strokeWidth={3} />
                                </div>
                                <div>
                                    <h4 className="text-[20px] font-black text-emerald-900 tracking-tight mb-1">KONTROL ONAYLANDI, CİHAZ TESLİME HAZIR</h4>
                                    <p className="text-[14px] font-medium text-emerald-700 leading-relaxed">Bu aşamada fatura kesebilir veya müşteriye cihazının teste başarıyla girdiğini bildiren SMS gönderebilirsiniz.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white border border-slate-200/60 rounded-3xl p-6 lg:p-8 shadow-sm">
                                    <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-widest mb-4">Usta Notu (Son Günlük)</h3>
                                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 text-[14px] font-medium text-slate-700 h-48 overflow-y-auto shadow-inner leading-relaxed custom-scrollbar">
                                        {progressLog ? progressLog : <span className="text-slate-400 italic">Teknisyen tarafından girilmiş final durum notu bulunmuyor.</span>}
                                    </div>
                                </div>
                                
                                <div className="bg-white border border-slate-200/60 rounded-3xl p-6 lg:p-8 shadow-sm flex flex-col justify-center">
                                    <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-widest mb-4 text-center">Otomatik Servis Hatırlatıcısı Kur</h3>
                                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 flex flex-col justify-center shadow-inner h-48">
                                        <select 
                                            className="w-full bg-white border border-slate-200 rounded-xl h-14 px-5 text-[14px] font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm cursor-pointer"
                                            value={reminder}
                                            onChange={e => setReminder(e.target.value)}
                                        >
                                            <option value="">-- HATIRLATMA KURULMAYACAK --</option>
                                            <option value="1">1 Ay Sonra (Periyodik Garanti Kontrolü)</option>
                                            <option value="6">6 Ay Sonra (Standart Bakım Çağrısı)</option>
                                            <option value="12">1 Yıl Sonra (Yıllık Detaylı Bakım)</option>
                                        </select>
                                        {reminder && (
                                            <div className="mt-5 p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                                                <p className="text-[11px] font-bold text-indigo-700 text-center uppercase tracking-widest leading-relaxed">Müşteri {reminder} ay sonra SMS ile otomatik olarak servis çağrısı alacaktır.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white border border-slate-200/60 rounded-3xl p-6 lg:p-8 shadow-sm">
                                <h3 className="text-[14px] font-black text-slate-900 uppercase tracking-widest mb-6">Nihai Hesaplaşma Özeti / Dekont</h3>
                                <ReceiptTable allowEdit={false} />
                            </div>
                        </div>
                    )}
                </div>

                {/* SAĞ KOLON: Sabit Müşteri & Cihaz Panelleri */}
                <div className="lg:col-span-4 relative hidden lg:block">
                    <div className="sticky top-6 space-y-6">
                        
                        {/* Müşteri Kimlik Kartı */}
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-6 overflow-hidden relative">
                            <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500"></div>
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div> Müşteri Dosyası
                            </h3>
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-black text-lg border border-slate-200">
                                        {orderData.customer?.name?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                    <div>
                                        <p className="text-[15px] font-black text-slate-900 tracking-tight leading-none">{orderData.customer?.name}</p>
                                        <p className="text-[12px] font-semibold text-slate-500 mt-1.5">{orderData.customer?.phone || 'Telefon Kayıtlı Değil'}</p>
                                    </div>
                                </div>
                                <div className="bg-slate-50 rounded-2xl p-4 mt-2 border border-slate-100 text-[12px] leading-relaxed font-medium text-slate-600">
                                    <span className="block text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">Özel Cari Notu</span>
                                    {orderData.customer?.email || 'Müşteriye ekli özel bir uyarı notu bulunmamaktadır.'}
                                </div>
                            </div>
                        </div>

                        {/* Cihaz Kimlik Kartı */}
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-6">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-sky-500"></div> Varlık / Cihaz Karnesi
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center py-2 border-b border-slate-100/60">
                                    <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Marka</span>
                                    <span className="font-black text-[13px] text-slate-800">{orderData.asset?.brand || '-'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-slate-100/60">
                                    <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Model</span>
                                    <span className="font-black text-[13px] text-slate-800">{orderData.asset?.model || '-'}</span>
                                </div>
                                
                                {orderData.asset?.metadata && Object.keys(orderData.asset.metadata).length > 0 && (
                                    <div className="pt-2 grid grid-cols-2 gap-2">
                                        {Object.entries(orderData.asset.metadata).map(([k,v]) => (
                                            <div key={k} className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                                <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{k}</span>
                                                <span className="font-black text-[13px] text-slate-900 truncate block">{String(v) || '-'}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Şikayet Kartı */}
                        <div className="bg-amber-50 rounded-3xl shadow-sm border border-amber-200/60 p-6 relative overflow-hidden">
                            <div className="absolute -right-6 -top-6 text-amber-500/10">
                                <IconAlertCircle className="w-24 h-24" />
                            </div>
                            <h3 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-4 flex items-center gap-2 relative z-10">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div> Onarım Talebi (Şikayet)
                            </h3>
                            <p className="text-[13px] font-bold text-amber-900 leading-relaxed relative z-10">
                                {orderData.complaint || 'Detaylı onarım notu alınmadı.'}
                            </p>
                        </div>

                    </div>
                </div>

            </div>

            {/* İŞÇİLİK / FASON / YEDEK PARÇA EKLEME MODALI (ENTERPRISE PREMIUM) */}
            {isItemModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 transition-opacity fade-in duration-300 backdrop-blur-md">
                    <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-[560px] max-h-[90vh] overflow-hidden flex flex-col transform scale-100 animate-in zoom-in-95 ease-out duration-300">
                        {/* Header */}
                        <div className="px-8 py-6 border-b border-slate-100/60 flex justify-between items-center bg-white z-10">
                            <div className="flex flex-col gap-1">
                                <h2 className="text-[16px] font-black tracking-tight text-slate-900 flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${itemModalType === 'PART' ? 'bg-sky-50 text-sky-600' : itemModalType === 'LABOR' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-600'}`}>
                                        <IconPlus className="w-4 h-4" />
                                    </div>
                                    {itemModalType === 'PART' ? 'Gelişmiş Çoklu Parça Ekle' : itemModalType === 'LABOR' ? 'İşçilik Ücreti Yansıt' : 'Dış Fason Hizmeti Ekle'}
                                </h2>
                                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest pl-11">Servis reçetenize eklenecektir</p>
                            </div>
                            <button onClick={() => setIsItemModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all">✕</button>
                        </div>
                        
                        {/* Body */}
                        <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                            
                            {/* DYNAMIC FIELD SELECTOR BASED ON TYPE */}
                            {itemModalType === 'PART' ? (
                                <div className="space-y-6">
                                    <div className="space-y-2 relative">
                                        <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400">Hızlı Envanter Arama</label>
                                        <select 
                                            className="w-full bg-slate-50 border-transparent hover:border-slate-200 transition-colors rounded-2xl h-14 px-5 text-[14px] font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:bg-white cursor-pointer shadow-sm"
                                            value=""
                                            onChange={e => {
                                                if (e.target.value) {
                                                    addToPartQueue(e.target.value);
                                                }
                                            }}
                                        >
                                            <option value="">-- Listeden parça seçerek sepetinize atın --</option>
                                            {products.map(p => (
                                                <option key={p.id} value={p.id}>Stok: {p.stock} | {p.code} - {p.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Eklenecek Parçalar Kuyruğu (Cart UI) */}
                                    <div className="pt-2">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-[12px] font-black uppercase tracking-widest text-slate-800">Seçilen Parçalar <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-[10px] ml-2">{partQueue.length}</span></h4>
                                        </div>
                                        
                                        {partQueue.length === 0 ? (
                                            <div className="text-center py-10 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200/60 text-[13px] text-slate-400 font-medium flex flex-col items-center justify-center gap-3">
                                                <IconActivity className="w-6 h-6 text-slate-300" />
                                                Devam etmek için üstten parça seçin.
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {partQueue.map(p => (
                                                    <div key={p.id} className="bg-white border border-slate-100 hover:border-slate-200 transition-colors rounded-2xl p-5 flex flex-col gap-4 shadow-sm relative group">
                                                        <button onClick={() => removePartQueueItem(p.id)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100">✕</button>
                                                        <p className="text-[14px] font-black text-slate-800 pr-10 line-clamp-1">{p.name}</p>
                                                        
                                                        <div className="flex gap-4">
                                                            <div className="flex-1">
                                                                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Miktar</label>
                                                                <input type="number" min="1" className="w-full bg-slate-50 border-transparent hover:border-slate-200 focus:bg-white rounded-xl h-11 text-center text-[14px] font-bold focus:ring-2 focus:ring-sky-500/40 transition-all outline-none" value={p.quantity} onChange={e => updatePartQueueItem(p.id, 'quantity', Number(e.target.value))} />
                                                            </div>
                                                            <div className="flex-[2]">
                                                                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Birim Fiyat (Satış)</label>
                                                                <input type="number" className="w-full bg-slate-50 border-transparent hover:border-slate-200 focus:bg-white rounded-xl h-11 text-right px-4 text-[14px] font-black text-sky-600 focus:ring-2 focus:ring-sky-500/40 transition-all outline-none" value={p.unitPrice} onChange={e => updatePartQueueItem(p.id, 'unitPrice', Number(e.target.value))} />
                                                            </div>
                                                        </div>
                                                        <div className="pt-2 flex items-center">
                                                            <label className="flex items-center gap-3 cursor-pointer group/cb">
                                                                <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${p.isWarrantyCovered ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20' : 'bg-slate-100 text-transparent border border-slate-200 group-hover/cb:border-amber-300 group-hover/cb:bg-amber-50'}`}>
                                                                    <IconCheck className="w-3.5 h-3.5" strokeWidth={3} />
                                                                </div>
                                                                <input type="checkbox" className="hidden" checked={p.isWarrantyCovered} onChange={e => updatePartQueueItem(p.id, 'isWarrantyCovered', e.target.checked)} />
                                                                <span className="text-[12px] font-bold text-slate-500 group-hover/cb:text-slate-800 transition-colors">Bedelsiz Yansıt (Garanti / İkram)</span>
                                                            </label>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 text-center tracking-widest mt-6">Bu parçalar işlem kaydedildiğinde envanterden (depodan) düşülecektir.</p>
                                </div>
                            ) : itemModalType === 'LABOR' ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">İşçilik Tarifesi Seç (Opsiyonel)</label>
                                        <input 
                                            list="laborRates"
                                            className="w-full bg-slate-50 border-transparent focus:bg-white rounded-2xl h-14 px-5 text-[14px] font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all shadow-sm" 
                                            placeholder="Listeden seçin veya özel kalem adı yazın" 
                                            value={itemForm.name} 
                                            onChange={e => {
                                                const val = e.target.value;
                                                const mappedPrice = serviceSettings ? serviceSettings[val] : undefined;
                                                setItemForm({
                                                    ...itemForm, 
                                                    name: val, 
                                                    unitPrice: mappedPrice !== undefined ? Number(mappedPrice) : itemForm.unitPrice
                                                });
                                            }} 
                                        />
                                        <datalist id="laborRates">
                                            {Object.entries(serviceSettings || {}).map(([key]) => <option key={key} value={key} />)}
                                        </datalist>
                                    </div>
                                    <p className="text-[11px] font-medium text-slate-500 text-center leading-relaxed">İşçilik bedeli malzeme çıkışı oluşturmaz, doğrudan hizmet geliri olarak şirketinize yazılır.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Fason Kalemi Açıklaması</label>
                                        <input type="text" className="w-full bg-slate-50 border-transparent focus:bg-white rounded-2xl h-14 px-5 text-[14px] font-bold focus:outline-none focus:ring-2 focus:ring-slate-800/40 transition-all shadow-sm" placeholder="Örn: Dışarıda yapılan boya veya torna işi" value={itemForm.name} onChange={e => setItemForm({...itemForm, name: e.target.value})} />
                                    </div>
                                </div>
                            )}

                            {/* PRICE AND QTY (For Non-Part) */}
                            {itemModalType !== 'PART' && (
                                <div className="bg-slate-50/50 rounded-2xl p-6 mt-6 border border-slate-100">
                                    <div className="grid grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Miktar (X)</label>
                                            <input type="number" min="1" className="w-full bg-white border border-slate-200 rounded-xl h-12 px-4 text-[16px] font-black focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-center transition-all shadow-sm" value={itemForm.quantity} onChange={e => setItemForm({...itemForm, quantity: Number(e.target.value)})} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Birim Fiyatı (₺)</label>
                                            <input type="number" className="w-full bg-white border border-slate-200 rounded-xl h-12 px-4 text-[16px] font-black focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-right text-indigo-700 transition-all shadow-sm" value={itemForm.unitPrice} onChange={e => setItemForm({...itemForm, unitPrice: Number(e.target.value)})} />
                                        </div>
                                    </div>

                                    <div className="mt-5 pt-5 border-t border-slate-200/60">
                                        <label className="flex items-center gap-3 cursor-pointer group/cb">
                                            <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${itemForm.isWarrantyCovered ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20' : 'bg-slate-100 text-transparent border border-slate-200 group-hover/cb:border-amber-300 group-hover/cb:bg-amber-50'}`}>
                                                <IconCheck className="w-3.5 h-3.5" strokeWidth={3} />
                                            </div>
                                            <input type="checkbox" className="hidden" checked={itemForm.isWarrantyCovered} onChange={e => setItemForm({...itemForm, isWarrantyCovered: e.target.checked})} />
                                            <span className="text-[12px] font-black uppercase tracking-widest text-slate-600 group-hover/cb:text-slate-900 transition-colors">Bedelsiz Yansıt (Garanti / İkram)</span>
                                        </label>
                                    </div>
                                </div>
                            )}

                        </div>
                        {/* Footer */}
                        <div className="p-6 pt-0 mt-4 border-t border-transparent bg-white">
                            <button onClick={saveItemsQueue} disabled={isSavingItem || (itemModalType === 'PART' && partQueue.length === 0)} className="h-14 w-full bg-slate-900 hover:bg-slate-800 hover:-translate-y-0.5 text-white font-black text-[14px] uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-slate-900/20 disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center">
                                {isSavingItem ? 'KAYDEDİLİYOR...' : 'SEÇİMLERİ REÇETEYE İŞLE'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
