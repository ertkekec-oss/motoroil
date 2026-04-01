"use client";

import React, { useState, useEffect } from "react";
import { 
    IconWrench, 
    IconCheck, 
    IconAlertCircle, 
    IconActivity,
    IconPrinter,
    IconFileText,
    IconSettings,
    IconUsers,
    IconPlus,
    IconSave
} from "@/components/icons/PremiumIcons";
import { useRouter, useParams } from "next/navigation";

const WORKFLOW = [
    { id: 'PENDING', label: '1. Kabul Aşaması' },
    { id: 'IN_PROGRESS', label: '2. İşlemde' },
    { id: 'WAITING_APPROVAL', label: '3. Onay Bekliyor' },
    { id: 'READY', label: '4. Teslimat (Hazır)' },
];

export default function ServiceOrderDetailPage() {
    const router = useRouter();
    const params = useParams();
    const [status, setStatus] = useState('PENDING'); // Acting ad dynamic tab and actual DB status
    const [items, setItems] = useState<any[]>([]);
    const [orderData, setOrderData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Modal States
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [itemModalType, setItemModalType] = useState<'PART'|'LABOR'|'OUTSOURCED'>('PART');
    const [staffList, setStaffList] = useState<any[]>([]);
    const [itemForm, setItemForm] = useState({ name: '', quantity: 1, unitPrice: 0, technicianId: '', isWarrantyCovered: false });
    const [isSavingItem, setIsSavingItem] = useState(false);

    // Logs / Forms state mock
    const [progressLog, setProgressLog] = useState('');
    const [reminder, setReminder] = useState('');

    useEffect(() => {
        if (!params || !params.id || params.id === 'new') return;
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

    const handleTabChange = async (newStatus: string) => {
        setStatus(newStatus);
        // Anında DB update (gerçek aşama geçişi)
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
            alert("Lütfen geçerli bir hizmet adı ve fiyat girin.");
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
    };

    const removeItem = async (itemId: string) => {
        if (!confirm('Kalemi silmek istediğinize emin misiniz?')) return;
        try {
            const res = await fetch(`/api/service-v2/${params.id}/items/${itemId}`, { method: 'DELETE' });
            if (res.ok) {
                fetchData();
            }
        } catch (e) {
            console.error(e);
        }
    };

    if (isLoading) return <div className="p-10 text-slate-500 font-semibold">Veriler yükleniyor...</div>;
    if (!orderData) return <div className="p-10 text-slate-500 font-semibold">İş emri bulunamadı.</div>;

    const totalAmount = items.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0);
    const taxAmount = totalAmount * 0.20;
    const finalAmount = totalAmount + taxAmount;

    // Ortak Reçete Tablosu Modülü (Tespit ve İşlemde kullanılacak)
    const ReceiptTable = ({ allowEdit = true }) => (
        <div className="border border-slate-200 bg-white rounded-md mt-4">
            <div className="bg-slate-50 border-b border-slate-200 p-3 flex justify-between items-center">
                <h4 className="font-semibold text-sm text-slate-700">Tespit & Kullanılan Malzeme / İşçilik</h4>
                {allowEdit && (
                    <div className="flex gap-2">
                        <button onClick={() => openAddItemModal('OUTSOURCED')} className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-50">Fason Ekle</button>
                        <button onClick={() => openAddItemModal('LABOR')} className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-50">İşçilik Ekle</button>
                        <button onClick={() => openAddItemModal('PART')} className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 border border-blue-700 rounded hover:bg-blue-700">Parça / Stok</button>
                    </div>
                )}
            </div>
            {items.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">Reçeteye henüz kayıt eklenmedi.</div>
            ) : (
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-slate-200 bg-white text-slate-500">
                            <th className="p-3 font-medium">Tur</th>
                            <th className="p-3 font-medium">Hizmet/Ürün</th>
                            <th className="p-3 font-medium text-center">Miktar</th>
                            <th className="p-3 font-medium text-right">Tutar</th>
                            {allowEdit && <th className="p-3 w-12 text-center"></th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {items.map(item => (
                            <tr key={item.id} className="hover:bg-slate-50">
                                <td className="p-3">
                                    <span className={`px-2 py-0.5 text-xs border rounded ${item.type === 'PART' ? 'border-blue-200 text-blue-700 bg-blue-50' : item.type === 'LABOR' ? 'border-green-200 text-green-700 bg-green-50' : 'border-orange-200 text-orange-700 bg-orange-50'}`}>
                                        {item.type === 'PART' ? 'Stok' : item.type === 'LABOR' ? 'İşçilik' : 'Fason'}
                                    </span>
                                </td>
                                <td className="p-3 text-slate-800">
                                    {item.name}
                                    {item.isWarrantyCovered && <span className="ml-2 text-[10px] bg-slate-100 border border-slate-200 px-1 rounded text-slate-500">(Garanti)</span>}
                                    {item.technician && <div className="text-[10px] text-slate-500 mt-0.5">Teknisyen: {item.technician.name}</div>}
                                </td>
                                <td className="p-3 text-center">{item.quantity}</td>
                                <td className="p-3 text-right">
                                    {item.isWarrantyCovered ? '0 ₺' : `${Number(item.totalPrice).toLocaleString()} ₺`}
                                </td>
                                {allowEdit && (
                                    <td className="p-3 text-center">
                                        <button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700 font-bold">×</button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
            <div className="bg-slate-50 border-t border-slate-200 p-4 shrink-0 flex justify-end">
                <div className="text-right w-64">
                    <div className="flex justify-between text-sm text-slate-500 mb-1">
                        <span>Ara Toplam:</span>
                        <span>{totalAmount.toLocaleString()} ₺</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-500 mb-2">
                        <span>KDV (%20):</span>
                        <span>{taxAmount.toLocaleString()} ₺</span>
                    </div>
                    <div className="flex justify-between text-lg font-semibold text-slate-800 border-t border-slate-200 pt-2">
                        <span>Genel Toplam:</span>
                        <span>{finalAmount.toLocaleString()} ₺</span>
                    </div>
                </div>
            </div>
        </div>
    );

    const PhotoUploader = ({ count }: { count: number }) => (
        <div className="border border-dashed border-slate-300 rounded-md p-6 bg-slate-50 text-center cursor-pointer hover:bg-slate-100 transition-colors mt-2">
            <IconPlus className="w-6 h-6 mx-auto mb-2 text-slate-400" />
            <p className="text-sm font-semibold text-slate-600">Fotoğraf Ekle</p>
            <p className="text-xs text-slate-400 mt-1">Belge, hasar veya onarım görseli yükleyin ({count} adet yüklü)</p>
        </div>
    );

    return (
        <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8 font-sans">
            
            {/* Header / Seri & Müşteri */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-5 mb-6">
                <div>
                    <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        İş Emri #{orderData.id.slice(0,8).toUpperCase()}
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Cihaz: {orderData.asset?.primaryIdentifier} • Müşteri: {orderData.customer?.name}</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded cursor-not-allowed opacity-50">E-Fatura</button>
                    <button className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 flex items-center gap-2">
                        <IconPrinter className="w-4 h-4" /> Servis Fişi Yazdır
                    </button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
                
                {/* SOL: DİNAMİK AŞAMALAR (SİDEBAR NAVIGATION) */}
                <div className="w-full md:w-64 shrink-0">
                    <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3 px-1">Tüm Aşamalar</h2>
                    <div className="flex flex-col gap-1">
                        {WORKFLOW.map((wf) => {
                            const active = status === wf.id;
                            return (
                                <button
                                    key={wf.id}
                                    onClick={() => handleTabChange(wf.id)}
                                    className={`text-left px-4 py-3 rounded-md border text-sm transition-all flex items-center justify-between ${
                                        active 
                                        ? 'bg-blue-50 border-blue-200 text-blue-800 font-semibold shadow-sm' 
                                        : 'bg-white border-transparent text-slate-600 hover:bg-slate-50 hover:border-slate-200'
                                    }`}
                                >
                                    {wf.label}
                                    {active && <IconCornerUpRight className="w-4 h-4 text-blue-500" />}
                                </button>
                            )
                        })}
                    </div>

                    <div className="mt-8 px-1">
                        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Müşteri Detayı</h2>
                        <div className="bg-slate-50 border border-slate-200 rounded p-4 text-sm text-slate-700 space-y-2">
                            <p><b>Müşteri:</b> {orderData.customer?.name}</p>
                            <p><b>Telefon:</b> {orderData.customer?.phone || '-'}</p>
                            <p className="pt-2 border-t border-slate-200 mt-2"><b>Eklenen Not:</b> {orderData.customer?.email || 'Kayıtlı not yok.'}</p>
                        </div>
                    </div>
                </div>

                {/* SAĞ: DİNAMİK İÇERİK SAYFALARI */}
                <div className="flex-1 min-w-0">
                    
                    {/* DİNAMİK İÇERİK: KABUL AŞAMASI */}
                    {status === 'PENDING' && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">Cihaz / Araç Karnesi & Arıza Bilgisi</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="border border-slate-200 rounded bg-white p-4">
                                        <p className="text-xs text-slate-500 font-medium mb-1">Cihaz Bilgisi</p>
                                        <p className="font-semibold text-slate-800">{orderData.asset?.brand} {orderData.asset?.model}</p>
                                        <p className="text-sm text-slate-600">Referans: {orderData.asset?.primaryIdentifier}</p>
                                    </div>
                                    <div className="border border-slate-200 rounded bg-white p-4">
                                        <p className="text-xs text-slate-500 font-medium mb-1">Müşteri Şikayeti / Arıza Notu</p>
                                        <p className="text-sm text-slate-800">{orderData.complaint || 'Detaylı onarım notu alınmadı.'}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">Tespit Raporu & Ön Maliyet</h3>
                                <ReceiptTable allowEdit={true} />
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">Görseller & Formlar</h3>
                                <PhotoUploader count={0} />
                            </div>
                        </div>
                    )}

                    {/* DİNAMİK İÇERİK: ONAY BEKLİYOR */}
                    {status === 'WAITING_APPROVAL' && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <div className="bg-orange-50 border border-orange-200 rounded-md p-6 text-center">
                                <IconAlertCircle className="w-10 h-10 text-orange-500 mx-auto mb-3" />
                                <h3 className="text-lg font-bold text-slate-800 mb-1">Kullanıcı Onayına Sunulmalı</h3>
                                <p className="text-sm text-slate-600 mb-6">Müşteriye teklif gönderip onay aldıktan sonra "İşlemde" aşamasına aktarın.</p>
                                
                                <div className="border border-slate-200 bg-white shadow-sm rounded-md p-6 max-w-lg mx-auto text-left mb-6">
                                    <h4 className="font-semibold border-b border-slate-100 pb-2 mb-4 text-slate-800">Teklif Özeti</h4>
                                    <div className="space-y-2 mb-4">
                                        {items.map(i => (
                                            <div key={i.id} className="flex justify-between text-sm text-slate-600">
                                                <span>{i.quantity}x {i.name}</span>
                                                <span>{Number(i.totalPrice).toLocaleString()} ₺</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-between font-bold text-lg text-slate-800 border-t border-slate-200 pt-3">
                                        <span>Teklif Tutarı (KDV Dh.)</span>
                                        <span className="text-blue-600">{finalAmount.toLocaleString()} ₺</span>
                                    </div>
                                </div>

                                <button onClick={() => window.open(`/p/approval/${orderData.id}`, '_blank')} className="px-6 py-2.5 bg-[#25D366] text-white rounded font-semibold flex items-center justify-center gap-2 mx-auto hover:bg-[#20bd5a] transition-colors">
                                    Müşteriye Gönder (WhatsApp)
                                </button>
                            </div>
                        </div>
                    )}

                    {/* DİNAMİK İÇERİK: İŞLEMDE */}
                    {status === 'IN_PROGRESS' && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">Usta Çalışma Logu / Neler Yapıldı?</h3>
                                <div className="border border-slate-200 bg-white rounded-md p-1">
                                    <textarea 
                                        className="w-full h-32 p-3 text-sm border-none focus:ring-0 outline-none resize-y" 
                                        placeholder="Satır satır yapılan işlemleri buraya yazabilirsiniz... Örn: Motor kulakları değişti, test sürüşü yapıldı."
                                        value={progressLog}
                                        onChange={e => setProgressLog(e.target.value)}
                                    ></textarea>
                                    <div className="bg-slate-50 border-t border-slate-100 p-2 flex justify-end">
                                        <button className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-800 rounded hover:bg-slate-700">Notu Kaydet</button>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">İşlem Anı Fotoğrafları</h3>
                                <PhotoUploader count={2} />
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">Reçete / Ek Maliyet Gelişimi</h3>
                                <ReceiptTable allowEdit={true} />
                            </div>
                        </div>
                    )}

                    {/* DİNAMİK İÇERİK: HAZIR (TESLİMAT) */}
                    {status === 'READY' && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <div className="bg-emerald-50 border border-emerald-200 rounded p-4 text-emerald-800 flex items-start gap-4 mb-2">
                                <IconCheck className="w-6 h-6 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-bold">Servis İşlemi Tamamlandı</h4>
                                    <p className="text-sm mt-1">Cihaz teste tabi tutuldu ve teslime hazır hale getirildi. Aşağıdan son özet faturayı ve bakım hatırlatıcıyı belirleyebilirsiniz.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">Yapılan İşler Özeti</h3>
                                    <div className="border border-slate-200 bg-white rounded p-4 text-sm text-slate-700 h-40 overflow-y-auto">
                                        {progressLog ? progressLog : <i>Usta tarafından girilmiş işlem notu bulunmuyor. Reçetede {items.length} kalem tamamlandı.</i>}
                                    </div>
                                </div>
                                
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">Bakım Hatırlatıcı Kur</h3>
                                    <div className="border border-slate-200 bg-white rounded p-4 space-y-4 h-40 flex flex-col justify-center">
                                        <label className="block text-sm font-semibold text-slate-600">Müşteriye Ne Zaman Hatırlatma SMS'i Gitsin?</label>
                                        <select 
                                            className="w-full border border-slate-300 rounded-md p-2.5 text-sm outline-none focus:border-blue-500"
                                            value={reminder}
                                            onChange={e => setReminder(e.target.value)}
                                        >
                                            <option value="">-- SMS Hatırlatıcı Kapalı --</option>
                                            <option value="1">1 Ay Sonra Periyodik Kontrol</option>
                                            <option value="6">6 Ay Sonra Periyodik Bakım</option>
                                            <option value="12">1 Yıl Sonra Genel Bakım</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">Son Fatura Görünümü</h3>
                                <ReceiptTable allowEdit={false} />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* FASON/İŞÇİLİK/PARÇA EKLEME MODALI */}
            {isItemModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
                    <div className="bg-white rounded border border-slate-200 shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                            <h2 className="text-sm font-bold text-slate-800">
                                {itemModalType === 'PART' ? 'Stok / Parça Yansıt' : itemModalType === 'LABOR' ? 'İşçilik Yansıt' : 'Fason İşlem Ekle'}
                            </h2>
                            <button onClick={() => setIsItemModalOpen(false)} className="text-slate-400 hover:text-slate-700">X</button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Açıklama / Kalem</label>
                                <input type="text" className="w-full border border-slate-300 rounded p-2 text-sm outline-none focus:border-blue-500" placeholder="Örn: Balata Değişimi" value={itemForm.name} onChange={e => setItemForm({...itemForm, name: e.target.value})} />
                            </div>

                            {itemModalType === 'LABOR' && (
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Maliyet Merkezi: Formeni / Usta Seç</label>
                                    <select className="w-full border border-slate-300 rounded p-2 text-sm outline-none focus:border-blue-500 bg-white" value={itemForm.technicianId} onChange={e => setItemForm({...itemForm, technicianId: e.target.value})}>
                                        <option value="">-- Merkezi Şirket Kârı --</option>
                                        {staffList.map(s => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
                                    </select>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Miktar (x)</label>
                                    <input type="number" min="1" className="w-full border border-slate-300 rounded p-2 text-sm text-center outline-none focus:border-blue-500" value={itemForm.quantity} onChange={e => setItemForm({...itemForm, quantity: Number(e.target.value)})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Birim Fiyatı (₺)</label>
                                    <input type="number" className="w-full border border-slate-300 rounded p-2 text-sm text-right outline-none focus:border-blue-500" value={itemForm.unitPrice} onChange={e => setItemForm({...itemForm, unitPrice: Number(e.target.value)})} />
                                </div>
                            </div>

                            <label className="flex items-center gap-2 p-3 border border-slate-200 rounded mt-2 cursor-pointer hover:bg-slate-50">
                                <input type="checkbox" className="w-4 h-4" checked={itemForm.isWarrantyCovered} onChange={e => setItemForm({...itemForm, isWarrantyCovered: e.target.checked})} />
                                <span className="text-sm font-semibold text-slate-700">Garanti / Sözleşme Kapsamında (Bedelsiz)</span>
                            </label>

                            <div className="pt-2">
                                <button onClick={saveItem} disabled={isSavingItem} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-2 rounded focus:outline-none focus:ring flex items-center justify-center transition-colors disabled:opacity-50">
                                    {isSavingItem ? 'KAYDEDİLİYOR...' : 'SEÇİMİ REÇETEYE EKLE'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
