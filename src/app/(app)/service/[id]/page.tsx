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
                unitPrice: Number(prod.price || 0),
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
                // Paralel kayıt atılıyor
                await Promise.all(partQueue.map(p => 
                    fetch(`/api/service-v2/${params.id}/items`, {
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
                    })
                ));
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

    // Component: Receipt Table
    const ReceiptTable = ({ allowEdit = true }) => (
        <div className="border border-slate-200 bg-white rounded-xl mt-4 shadow-sm overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h4 className="font-bold text-[14px] text-slate-800 tracking-tight">Kullanılan Malzeme & İşçilik Reçetesi</h4>
                {allowEdit && (
                    <div className="flex flex-wrap gap-2">
                        <button onClick={() => openAddItemModal('OUTSOURCED')} className="h-8 px-3 text-[11px] font-bold tracking-widest text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-50 shadow-sm transition-all uppercase">FASON/DIŞ EK</button>
                        <button onClick={() => openAddItemModal('LABOR')} className="h-8 px-3 text-[11px] font-bold tracking-widest text-indigo-700 bg-indigo-50 border border-indigo-200 rounded hover:bg-indigo-100 transition-all shadow-sm uppercase">İŞÇİLİK YANSIT</button>
                        <button onClick={() => openAddItemModal('PART')} className="h-8 px-3 text-[11px] font-bold tracking-widest text-white bg-slate-900 border border-slate-900 rounded hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2 uppercase">
                            <IconPlus className="w-3 h-3" /> Çoklu Parça Seç
                        </button>
                    </div>
                )}
            </div>
            {items.length === 0 ? (
                <div className="p-10 text-center text-[13px] font-semibold text-slate-400">Reçeteye henüz işlem eklenmemiş.</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[600px]">
                        <thead>
                            <tr className="border-b border-slate-100 bg-white text-slate-400 uppercase tracking-widest text-[10px]">
                                <th className="px-4 py-3 font-black">Tür</th>
                                <th className="px-4 py-3 font-black">Kalem / Açıklama</th>
                                <th className="px-4 py-3 font-black text-center">Miktar</th>
                                <th className="px-4 py-3 font-black text-right">Tutar (KDV Dahil)</th>
                                {allowEdit && <th className="px-4 py-3 text-center"></th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {items.map(item => (
                                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-4 py-3 w-32">
                                        <span className={`inline-block px-2 py-1 text-[9px] font-bold border rounded uppercase ${item.type === 'PART' ? 'border-sky-200 text-sky-700 bg-sky-50' : item.type === 'LABOR' ? 'border-indigo-200 text-indigo-700 bg-indigo-50' : 'border-slate-200 text-slate-600 bg-slate-100'}`}>
                                            {item.type === 'PART' ? 'Y.PARÇA / STOK' : item.type === 'LABOR' ? 'İŞÇİLİK' : 'DIŞ FASON'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-[13px] font-semibold text-slate-800">
                                        {item.name}
                                        {item.isWarrantyCovered && <span className="ml-2 px-1 text-[9px] bg-amber-100 text-amber-700 rounded font-bold uppercase tracking-widest">Garanti İçi</span>}
                                    </td>
                                    <td className="px-4 py-3 text-center font-bold text-[13px] text-slate-600">{item.quantity}</td>
                                    <td className="px-4 py-3 text-right font-black text-[13px] text-slate-800">
                                        {item.isWarrantyCovered ? '0.00 ₺' : `${Number(item.totalPrice).toLocaleString()} ₺`}
                                    </td>
                                    {allowEdit && (
                                        <td className="px-4 py-3 text-center w-12">
                                            <button onClick={() => removeItem(item.id)} className="w-6 h-6 flex items-center justify-center rounded bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-colors" title="Satırı Sil">✕</button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            <div className="bg-slate-50 border-t border-slate-200 p-4 flex flex-col items-end">
                <div className="w-full sm:w-64 space-y-2">
                    <div className="flex justify-between text-[13px] font-bold text-slate-500">
                        <span>Ara Toplam:</span>
                        <span>{totalAmount.toLocaleString()} ₺</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-bold tracking-widest text-slate-400 uppercase">
                        <span>Vergiler:</span>
                        <span>{taxAmount.toLocaleString()} ₺</span>
                    </div>
                    <div className="flex justify-between text-[18px] font-black text-slate-900 border-t border-slate-200 pt-3 mt-1">
                        <span>TOPLAM:</span>
                        <span>{finalAmount.toLocaleString()} ₺</span>
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
        <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8 font-sans pb-32 animate-in fade-in duration-500">
            
            {/* Header / Seri & Müşteri */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between border-b border-slate-200 pb-5 mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
                        İŞ EMRİ #{orderData.id.slice(0,8).toUpperCase()}
                    </h1>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-[13px] font-semibold text-slate-500">
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 uppercase tracking-widest text-[10px]">{orderData.asset?.brand || 'MARKA YOK'} {orderData.asset?.model || ''}</span>
                        <span>Ref: <strong className="text-slate-700">{orderData.asset?.primaryIdentifier}</strong></span>
                        <span className="hidden sm:inline text-slate-300">•</span>
                        <span>Müşteri: <strong className="text-slate-700">{orderData.customer?.name}</strong></span>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                    <button className="h-10 flex-1 lg:flex-none px-5 text-[13px] font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm flex items-center justify-center gap-2">
                        <IconPrinter className="w-4 h-4" /> YAZDIR
                    </button>
                    <button className="h-10 flex-1 lg:flex-none px-5 text-[13px] font-bold text-white bg-slate-900 border border-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-sm">
                        E-FATURA KES
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                
                {/* SOL KOLON: İŞ AKIŞI YÖNETİMİ */}
                <div className="xl:col-span-3">
                    <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1 border-b border-slate-100 pb-2">SERVİS İŞ AKIŞI</h2>
                    <div className="flex flex-col gap-1.5">
                        {WORKFLOW.map((wf) => {
                            const active = status === wf.id;
                            return (
                                <button
                                    key={wf.id}
                                    onClick={() => handleTabChange(wf.id)}
                                    className={`text-left px-5 py-3.5 rounded-xl border text-[13px] font-bold transition-all flex items-center justify-between group ${
                                        active 
                                        ? 'bg-slate-900 border-slate-900 text-white shadow-xl scale-[1.02]' 
                                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 shadow-sm'
                                    }`}
                                >
                                    <span>{wf.label}</span>
                                    {active && <IconCornerUpRight className="w-4 h-4 text-white opacity-80" />}
                                </button>
                            )
                        })}
                    </div>

                    <div className="mt-10">
                        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1 border-b border-slate-100 pb-2">MÜŞTERİ ÖZETİ</h2>
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-[13px] text-slate-700 space-y-3 font-medium shadow-sm">
                            <p className="flex flex-col gap-1"><span className="text-slate-400 text-[10px] uppercase tracking-widest font-bold">Unvan</span> <strong className="text-slate-900">{orderData.customer?.name}</strong></p>
                            <p className="flex flex-col gap-1"><span className="text-slate-400 text-[10px] uppercase tracking-widest font-bold">Gsm Telefon</span> <strong className="text-slate-900">{orderData.customer?.phone || 'Kayıtlı Değil'}</strong></p>
                            <div className="pt-3 border-t border-slate-200 mt-2">
                                <span className="block text-slate-400 text-[10px] uppercase tracking-widest font-bold mb-1">Cari Dosya Form Notları</span>
                                <span className="text-[12px] text-slate-600 leading-relaxed">{orderData.customer?.email || 'Müşteriye ekli özel bir not bulunmamaktadır.'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SAĞ KOLON: İLGİLİ AŞAMA EKRANI */}
                <div className="xl:col-span-9">
                    
                    {/* 1. KABUL AŞAMASI */}
                    {status === 'PENDING' && (
                        <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                            <div>
                                <h3 className="text-[14px] font-black text-slate-800 uppercase tracking-widest border-b border-amber-500 pb-2 mb-5 inline-block">Müşteri Şikayeti & Cihaz Detayı</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="border border-slate-200 rounded-xl bg-white p-6 shadow-sm">
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-4 border-b border-slate-50 pb-2">Cihaz Karnesi (Ayar Kutuları)</p>
                                        <div className="space-y-3 text-[13px] font-medium text-slate-700">
                                            {/* We iterate over metadata object populated during intake */}
                                            {orderData.asset?.metadata && Object.keys(orderData.asset.metadata).length > 0 ? (
                                                Object.entries(orderData.asset.metadata).map(([k,v]) => (
                                                    <div key={k} className="flex flex-col gap-1 bg-slate-50 p-2 px-3 rounded-lg border border-slate-100">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{k}</span>
                                                        <span className="font-bold text-slate-900">{String(v) || '-'}</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center py-4 bg-slate-50 rounded-lg border border-slate-100 border-dashed text-slate-400">Özel içerik kutusu kaydedilmemiş.</div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="border border-slate-200 rounded-xl bg-amber-50/30 p-6 shadow-sm">
                                        <p className="text-[10px] text-amber-600 font-black uppercase tracking-widest mb-4 border-b border-amber-100 pb-2">Onarım Talebi (Kabul Notu)</p>
                                        <p className="text-[14px] font-medium text-slate-800 leading-relaxed whitespace-pre-wrap">{orderData.complaint || 'Detaylı onarım notu alınmadı.'}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <h3 className="text-[14px] font-black text-slate-800 uppercase tracking-widest border-b border-indigo-500 pb-2 mb-5 inline-block">Sisteme Yansılatılacak Maliyetler (Reçete)</h3>
                                <ReceiptTable allowEdit={true} />
                            </div>

                            <div>
                                <h3 className="text-[14px] font-black text-slate-800 uppercase tracking-widest border-b border-slate-300 pb-2 mb-5 inline-block mt-4">Kabul Dosyaları & Fiziki Evraklar</h3>
                                <PhotoUploader count={0} />
                            </div>
                        </div>
                    )}

                    {/* 2. ONAY BEKLİYOR */}
                    {status === 'WAITING_APPROVAL' && (
                        <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                            <div className="bg-sky-50 border border-sky-200 rounded-2xl p-6 sm:p-10 text-center shadow-sm">
                                <h3 className="text-[20px] font-black text-slate-800 mb-2">Müşteri Onayı Gerekli</h3>
                                <p className="text-[14px] font-medium text-slate-600 mb-8 max-w-xl mx-auto">Tespit edilen arızanın ve maliyet tablosunun (reçetenin) işleme alınmadan önce müşteri tarafından onaylanması tavsiye edilir.</p>
                                
                                <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 sm:p-8 max-w-lg mx-auto text-left mb-8">
                                    <h4 className="font-black text-[12px] uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-3 mb-4">Hazırlanan Teklif Özeti</h4>
                                    <div className="space-y-3 mb-6">
                                        {items.length === 0 ? (
                                            <p className="text-sm text-slate-500 text-center italic py-2">Reçeteye hiçbir kalem yansıtılmamış.</p>
                                        ) : items.map(i => (
                                            <div key={i.id} className="flex justify-between text-[13px] font-semibold text-slate-600 items-center gap-2">
                                                <span className="flex items-center gap-2">
                                                    <span className="text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0">{i.quantity}x</span> 
                                                    <span className="truncate max-w-[200px] sm:max-w-xs">{i.name}</span>
                                                </span>
                                                <span className="text-slate-800 font-bold shrink-0">{Number(i.totalPrice).toLocaleString()} ₺</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-between items-end font-black text-[16px] text-slate-900 border-t border-slate-200 pt-4">
                                        <span className="text-[12px] text-slate-500 uppercase">Teklif Tutarı (+Kdv)</span>
                                        <span className="text-[20px] sm:text-[24px] text-sky-600 tracking-tight">{finalAmount.toLocaleString()} ₺</span>
                                    </div>
                                </div>

                                <button onClick={() => window.open(`/p/approval/${orderData.id}`, '_blank')} className="h-12 w-full sm:w-auto px-8 bg-[#25D366] text-white rounded-xl font-black uppercase tracking-widest text-[13px] shadow-lg hover:bg-[#20bd5a] transition-all hover:-translate-y-0.5 inline-flex items-center justify-center gap-2">
                                    TEKLİFİ WHATSAPP İLE ONAYA İLET
                                </button>
                            </div>
                        </div>
                    )}

                    {/* 3. İŞLEMDE */}
                    {status === 'IN_PROGRESS' && (
                        <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                            <div>
                                <h3 className="text-[14px] font-black text-slate-800 uppercase tracking-widest border-b border-emerald-500 pb-2 mb-5 inline-block">Operasyon (Usta) Çalışma Günlüğü</h3>
                                <div className="border border-slate-200 bg-white rounded-xl overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-emerald-500 transition-all">
                                    <textarea 
                                        className="w-full h-40 p-5 text-[14px] font-medium text-slate-800 border-none focus:ring-0 outline-none resize-none placeholder:text-slate-300" 
                                        placeholder="Usta/Teknisyen buraya işlem notlarını girecek. (Örn: Anakart entegresi değiştirildi, test edildi...)"
                                        value={progressLog}
                                        onChange={e => setProgressLog(e.target.value)}
                                    ></textarea>
                                    <div className="bg-slate-50 border-t border-slate-100 p-3 flex justify-end">
                                        <button className="h-9 px-6 text-[12px] font-bold tracking-widest uppercase text-white bg-slate-800 rounded-lg hover:bg-slate-700 shadow-sm transition-colors">
                                            GÜNLÜĞÜ KAYDET
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <h3 className="text-[14px] font-black text-slate-800 uppercase tracking-widest border-b border-slate-300 pb-2 mb-5 inline-block">Ek Maliyet Ve Değişen Parça Kaydı (İsteğe Bağlı)</h3>
                                <ReceiptTable allowEdit={true} />
                            </div>

                            <div>
                                <h3 className="text-[14px] font-black text-slate-800 uppercase tracking-widest border-b border-slate-300 pb-2 mb-5 inline-block">Tamir Anı Kareleri (Müşteriye Gösterilebilir)</h3>
                                <PhotoUploader count={2} />
                            </div>
                        </div>
                    )}

                    {/* 4. TESLİMAT (HAZIR) */}
                    {status === 'READY' && (
                        <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 shadow-sm flex items-start gap-4">
                                <div className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center shrink-0">
                                    <IconCheck className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="text-[16px] font-black text-emerald-900 tracking-tight">KONTROL ONAYLANDI, CİHAZ TESLİME HAZIR</h4>
                                    <p className="text-[13px] font-medium text-emerald-700 mt-1">Bu aşamada fatura kesebilir veya müşteriye cihazının teste başarıyla girdiği mesajını gönderebilirsiniz.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <h3 className="text-[14px] font-black text-slate-800 uppercase tracking-widest border-b border-slate-200 pb-2 mb-5">Çalışma Günlüğü (Son Hali)</h3>
                                    <div className="border border-slate-200 bg-white rounded-xl p-5 text-[13px] font-medium text-slate-700 h-48 overflow-y-auto shadow-sm leading-relaxed">
                                        {progressLog ? progressLog : <i className="text-slate-400">Teknisyen tarafından girilmiş onarım notu bulunmuyor.</i>}
                                    </div>
                                </div>
                                
                                <div>
                                    <h3 className="text-[14px] font-black text-slate-800 uppercase tracking-widest border-b border-slate-200 pb-2 mb-5">Zamanlanmış Hatırlatıcı Kur</h3>
                                    <div className="border border-slate-200 bg-white rounded-xl p-6 flex flex-col justify-center h-48 shadow-sm">
                                        <label className="block text-[11px] font-black uppercase text-slate-500 tracking-widest mb-3">Tekrar Servise Çağrı Zamanı</label>
                                        <select 
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg h-11 px-4 text-[13px] font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            value={reminder}
                                            onChange={e => setReminder(e.target.value)}
                                        >
                                            <option value="">-- OTOMATİK HATIRLATMA KAPALI --</option>
                                            <option value="1">1 Ay Sonra (Periyodik Garanti Kontrolü)</option>
                                            <option value="6">6 Ay Sonra (Standart Bakım Çağrısı)</option>
                                            <option value="12">1 Yıl Sonra (Yıllık Detaylı Bakım)</option>
                                        </select>
                                        {reminder && <p className="text-[11px] font-bold text-amber-600 mt-4 text-center">Müşteri {reminder} ay sonra SMS ile otomatik davet edilecek.</p>}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-[14px] font-black text-slate-800 uppercase tracking-widest border-b border-slate-200 pb-2 mb-5">Nihai Hesaplaşma Özeti / Dekont</h3>
                                <ReceiptTable allowEdit={false} />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* İŞÇİLİK / FASON / YEDEK PARÇA EKLEME MODALI */}
            {isItemModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 transition-opacity fade-in duration-200 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[500px] max-h-[90vh] overflow-y-auto transform scale-100 animate-in zoom-in-95">
                        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
                            <h2 className="text-[14px] font-black tracking-widest text-slate-800 uppercase flex items-center gap-2">
                                <IconPlus className="w-4 h-4 text-indigo-500" />
                                {itemModalType === 'PART' ? 'Gelişmiş Çoklu Parça Ekle' : itemModalType === 'LABOR' ? 'İşçilik Ücreti Yansıt' : 'Dış Fason Hizmeti Ekle'}
                            </h2>
                            <button onClick={() => setIsItemModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition-colors">✕</button>
                        </div>
                        <div className="p-6 space-y-6">
                            
                            {/* DYNAMIC FIELD SELECTOR BASED ON TYPE */}
                            {itemModalType === 'PART' ? (
                                <div className="space-y-6">
                                    <div className="bg-sky-50 border border-sky-200 rounded-xl p-4">
                                        <label className="block text-[11px] font-black uppercase tracking-widest text-slate-500 mb-2">Hızlı Envanter Arama</label>
                                        <select 
                                            className="w-full bg-white border border-slate-200 rounded-xl h-11 px-4 text-[13px] font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
                                            value=""
                                            onChange={e => {
                                                if (e.target.value) {
                                                    addToPartQueue(e.target.value);
                                                }
                                            }}
                                        >
                                            <option value="">-- Listeden seçerek sepete atın --</option>
                                            {products.map(p => (
                                                <option key={p.id} value={p.id}>Stok: {p.stock} | {p.code} - {p.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Eklenecek Parçalar Kuyruğu (Cart UI) */}
                                    <div>
                                        <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-800 border-b border-slate-100 pb-2 mb-3">Eklenecek Parçalar ({partQueue.length})</h4>
                                        {partQueue.length === 0 ? (
                                            <div className="text-center py-6 bg-slate-50 rounded border border-dashed border-slate-200 text-[12px] text-slate-400 font-semibold">
                                                Lütfen yukarıdan 1 veya daha fazla parça seçin.
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {partQueue.map(p => (
                                                    <div key={p.id} className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col gap-3 shadow-sm relative">
                                                        <button onClick={() => removePartQueueItem(p.id)} className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center bg-red-50 text-red-500 rounded hover:bg-red-500 hover:text-white transition-colors">✕</button>
                                                        <p className="text-[13px] font-bold text-slate-800 pr-8 line-clamp-1">{p.name}</p>
                                                        
                                                        <div className="flex gap-2">
                                                            <div className="flex-1">
                                                                <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Miktar</label>
                                                                <input type="number" min="1" className="w-full bg-slate-50 border border-slate-200 rounded-lg h-9 text-center text-[13px] font-bold" value={p.quantity} onChange={e => updatePartQueueItem(p.id, 'quantity', Number(e.target.value))} />
                                                            </div>
                                                            <div className="flex-[2]">
                                                                <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Birim Fiyat (Satış)</label>
                                                                <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-lg h-9 text-right px-2 text-[13px] font-bold text-sky-600" value={p.unitPrice} onChange={e => updatePartQueueItem(p.id, 'unitPrice', Number(e.target.value))} />
                                                            </div>
                                                        </div>
                                                        <label className="flex items-center gap-2 cursor-pointer mt-1">
                                                            <input type="checkbox" className="w-4 h-4 accent-amber-500" checked={p.isWarrantyCovered} onChange={e => updatePartQueueItem(p.id, 'isWarrantyCovered', e.target.checked)} />
                                                            <span className="text-[11px] font-bold text-slate-500">Bedelsiz (Garanti / İkram)</span>
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[10px] uppercase font-bold text-sky-600 text-center tracking-widest mt-2">Bu parçalar faturaya dönüştüğünde depodan düşülecektir.</p>
                                </div>
                            ) : itemModalType === 'LABOR' ? (
                                <div>
                                    <label className="block text-[11px] font-black uppercase tracking-widest text-slate-500 mb-2">Otomatik İşçilik Tarifesi Seç (Opsiyonel)</label>
                                    <input 
                                        list="laborRates"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl h-11 px-4 text-[13px] font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500" 
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
                                    <p className="text-[10px] uppercase font-bold text-slate-400 mt-2 tracking-widest text-center">Ayarlar'dan eklediğiniz fiks tarifeleri arayabilirsiniz. İşçilik bedeli doğrudan şirket kasasına yazılır.</p>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-[11px] font-black uppercase tracking-widest text-slate-500 mb-2">Açıklama / Fason Kalemi</label>
                                    <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl h-11 px-4 text-[13px] font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Örn: Dışarıda yapılan boya veya torna işi" value={itemForm.name} onChange={e => setItemForm({...itemForm, name: e.target.value})} />
                                </div>
                            )}

                            {/* PRICE AND QTY (For Non-Part) */}
                            {itemModalType !== 'PART' && (
                                <>
                                    <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-5 mt-5">
                                        <div>
                                            <label className="block text-[11px] font-black uppercase tracking-widest text-slate-500 mb-2">Miktar (X)</label>
                                            <input type="number" min="1" className="w-full bg-slate-50 border border-slate-200 rounded-xl h-11 px-4 text-[16px] font-black focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center" value={itemForm.quantity} onChange={e => setItemForm({...itemForm, quantity: Number(e.target.value)})} />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-black uppercase tracking-widest text-slate-500 mb-2">Birim Fiyatı (₺)</label>
                                            <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl h-11 px-4 text-[16px] font-black focus:outline-none focus:ring-2 focus:ring-indigo-500 text-right text-indigo-700" value={itemForm.unitPrice} onChange={e => setItemForm({...itemForm, unitPrice: Number(e.target.value)})} />
                                        </div>
                                    </div>

                                    <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl mt-2 cursor-pointer hover:bg-amber-50 group transition-colors">
                                        <input type="checkbox" className="w-5 h-5 accent-amber-500" checked={itemForm.isWarrantyCovered} onChange={e => setItemForm({...itemForm, isWarrantyCovered: e.target.checked})} />
                                        <span className="text-[12px] font-black uppercase tracking-widest text-slate-700 group-hover:text-amber-800 transition-colors">Bedelsiz Yansıt (Garanti / İkram)</span>
                                    </label>
                                </>
                            )}

                            <div className="pt-4 border-t border-slate-100 sticky bottom-0 bg-white pb-2">
                                <button onClick={saveItemsQueue} disabled={isSavingItem || (itemModalType === 'PART' && partQueue.length === 0)} className="h-12 w-full bg-slate-900 hover:bg-slate-800 text-white font-black text-[13px] uppercase tracking-widest rounded-xl transition-all disabled:opacity-50 hover:shadow-lg flex items-center justify-center">
                                    {isSavingItem ? 'KAYDEDİLİYOR...' : 'SEÇİMLERİ REÇETEYE İŞLE'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
