"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

import { useInventory } from '@/contexts/InventoryContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useRouter } from 'next/navigation';

import { useModal } from '@/contexts/ModalContext';
import { ChevronLeft, Save, Plus, Trash2, Shield, Wrench, Package, Truck, User, Clock, CheckCircle, ScanLine, ShoppingCart, FileText } from 'lucide-react';


export default function ServiceDetailClient({ id }: { id: string }) {
    const { showError, showSuccess } = useModal();
    const [loading, setLoading] = useState(true);
    const [order, setOrder] = useState<any>(null);
    
    const [activeTab, setActiveTab] = useState<'details' | 'parts' | 'labor'>('details');
    // Technician Notes
    const [technicianNotes, setTechnicianNotes] = useState('');
    const [savingNotes, setSavingNotes] = useState(false);
    // Local state for adding parts or labor
    const [newItemName, setNewItemName] = useState('');
    const [newItemQty, setNewItemQty] = useState(1);
    const [newItemPrice, setNewItemPrice] = useState(0);
    const { products } = useInventory();
    const { serviceSettings, appSettings } = useSettings();
    const router = useRouter();

    const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
    const [nextKm, setNextKm] = useState<string>('');
    const [nextDate, setNextDate] = useState<string>('');
    const [productModalOpen, setProductModalOpen] = useState(false);
    const [productSearch, setProductSearch] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'cash'|'cc'|'iban'|'account'>('cash');
    const [isFinishing, setIsFinishing] = useState(false);


    useEffect(() => {
        if (id) fetchOrder();
    }, [id]);

    const fetchOrder = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/services/work-orders/${id}`);
            if (res.ok) {
                const data = await res.json();
                setOrder(data);
            setTechnicianNotes(data.technicianNotes || '');
            } else {
                showError("Hata", "İş emri bulunamadı.");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (newStatus: string) => {
        try {
            const res = await fetch(`/api/services/work-orders/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (res.ok) {
                showSuccess("Başarılı", "Durum güncellendi.");
                fetchOrder();
            } else {
                showError("Hata", "Durum güncellenemedi.");
            }
        } catch (e) {
            showError("Hata", "Bağlantı hatası.");
        }
    };

    const handleAddItem = async (type: 'PART' | 'LABOR') => {
        if (!newItemName || newItemPrice <= 0) {
            showError("Uyarı", "Lütfen geçerli bir ad ve tutar giriniz.");
            return;
        }

        try {
            const payload = {
                name: newItemName,
                quantity: newItemQty,
                unitPrice: newItemPrice,
                type
            };

            const res = await fetch(`/api/services/work-orders/${id}/items`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setNewItemName('');
                setNewItemPrice(0);
                setNewItemQty(1);
                fetchOrder();
                showSuccess("Eklendi", "Kalem başarıyla servis fişine eklendi.");
            } else {
                showError("Hata", "Kalem eklenemedi.");
            }
        } catch (e) {
            showError("Hata", "Bağlantı hatası.");
        }
    };

    const handleDeleteItem = async (itemId: string) => {
        try {
            const res = await fetch(`/api/services/work-orders/${id}/items/${itemId}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                fetchOrder();
            } else {
                showError("Hata", "Silinemedi.");
            }
        } catch (e) {
            showError("Hata", "Bağlantı hatası.");
        }
    };

    const handleSaveNotes = async () => {
        setSavingNotes(true);
        try {
            await fetch(`/api/services/work-orders/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ technicianNotes })
            });
            showSuccess('Kaydedildi', 'Teknik servis notları kaydedildi.');
            fetchOrder();
        } catch (e) {
            showError('Hata', 'Notlar kaydedilemedi.');
        } finally {
            setSavingNotes(false);
        }
    };

    const handleSendProposal = () => {
        if (!order || !order.customer) return;
        const phone = order.customer.phone || '';
        let cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.startsWith('0')) cleanPhone = '9' + cleanPhone;
        else if (!cleanPhone.startsWith('90')) cleanPhone = '90' + cleanPhone;

        const approvalLink = `https://${window.location.host}/p/approval/${id}`;
        
        let msg = `Merhaba ${order.customer.name},%0A%0A`;
        if (order.asset) {
            msg += `*${order.asset.brand}* marka cihazınız/aracınız için servis onarım teklifimiz hazırlanmıştır.%0A%0A`;
        } else {
            msg += `Servis işlemleriniz için onarım teklifimiz hazırlanmıştır.%0A%0A`;
        }
        
        msg += `Ayrıntılı dökümü güvenli bir şekilde incelemek ve onarım işlemlerine onay vermek için lütfen size özel oluşturulan aşağıdaki dijital onay formuna tıklayınız:%0A%0A`;
        msg += `🔗 ${approvalLink}%0A%0A`;
        msg += `Bizi tercih ettiğiniz için teşekkür ederiz.`;

        window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
        
        if (order.status === 'PENDING') {
            fetch(`/api/services/work-orders/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'WAITING_APPROVAL' }) }).then(() => fetchOrder());
        }
    };

    const handleVerbalApproval = async () => {
        try {
            const res = await fetch(`/api/services/work-orders/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'IN_PROGRESS' }) });
            if (res.ok) {
                fetchOrder();
                showSuccess('Onaylandı', 'Müşteriden alınan sözlü onay sisteme işlendi ve işlem başlatıldı.');
            }
        } catch(e) {
            showError('Hata', 'Onay kaydedilemedi.');
        }
    };

    if (loading) return <div className="p-10 flex items-center justify-center text-slate-500 font-bold">Yükleniyor...</div>;
    if (!order) return <div className="p-10 flex items-center justify-center text-red-500 font-bold">Bulunamadı</div>;

    const parts = order.items?.filter((i: any) => i.type === 'PART') || [];
    const labor = order.items?.filter((i: any) => i.type === 'LABOR') || [];

    const getStatusTheme = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
            case 'IN_PROGRESS': return 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20';
            default: return 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#F8FAFC] dark:bg-[#0B1220]">
            <div className="flex-shrink-0 border-b border-slate-200 dark:border-white/5 bg-white dark:bg-[#0B1220] z-10 sticky top-0 px-4 sm:px-6 py-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <Link href="/service" className="w-10 h-10 flex items-center justify-center rounded-[12px] bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0">
                            <ChevronLeft className="w-5 h-5" />
                        </Link>
                        <div className="w-10 h-10 rounded-[12px] bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shrink-0 shadow-lg shadow-slate-900/20">
                            <Wrench className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white leading-none truncate">
                                    {order.customer?.name}
                                </h1>
                                <span className={`px-2 py-0.5 rounded-[6px] text-[9px] sm:text-[10px] font-black uppercase border shrink-0 ${getStatusTheme(order.status)}`}>
                                    {order.status}
                                </span>
                            </div>
                            <span className="text-[11px] sm:text-[12px] font-medium text-slate-500 mt-1 truncate block">
                                <span className="hidden sm:inline">{order.customer?.phone} | {order.customer?.email}</span>
                                <span className="inline sm:hidden">{order.customer?.phone || 'Telefon Kaydı Yok'}</span>
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto bg-slate-50 sm:bg-transparent dark:bg-slate-800/50 sm:dark:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none border sm:border-transparent border-slate-100 dark:border-white/5">
                        <div className="flex flex-col items-start sm:items-end mr-2 sm:mr-4">
                            <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Ödenecek Tutar</span>
                            <span className="text-[14px] sm:text-[16px] font-black text-emerald-600 dark:text-emerald-400 leading-none">
                                {Number(order.totalAmount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleUpdateStatus('IN_PROGRESS')}
                                disabled={order.status === 'IN_PROGRESS'}
                                className="h-[32px] sm:h-[36px] px-3 sm:px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-blue-600 dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-white/5 rounded-[8px] font-bold text-[11px] sm:text-[12px] flex items-center justify-center transition-colors shadow-sm disabled:opacity-50"
                            >
                                İşleme Al
                            </button>
                            <button
                                onClick={() => setCheckoutModalOpen(true)}
                                disabled={order.status === 'COMPLETED'}
                                className="h-[32px] sm:h-[36px] px-3 sm:px-4 bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500 rounded-[8px] font-bold text-[11px] sm:text-[12px] flex items-center justify-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
                            >
                                <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Tamamla
                            </button>
                        </div>
                    </div>
                </div>

                
                {/* TABS REMOVED */}
            </div>

            <div className="flex-1 p-4 sm:p-6 lg:p-10 max-w-[1400px] mx-auto w-full space-y-8">
                {/* 1. DETAILS */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in zoom-in-95 duration-200">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[24px] shadow-sm p-6">
                            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-white/5 pb-2">
                                <FileText className="w-4 h-4" /> Şikayet & İstekler
                            </h3>
                            <p className="text-[14px] font-semibold text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                                {order.complaint || 'Belirtilmedi'}
                            </p>
                        </div>
                        
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[24px] shadow-sm p-6">
                            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-white/5 pb-2">
                                <Shield className="w-4 h-4" /> Cihaz Bilgisi & Araç Karnesi
                            </h3>
                            {order.asset ? (
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-500 flex items-center justify-center shrink-0">
                                            <Wrench className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <div className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                                {order.asset.brand} <span className="text-sm text-slate-400">{order.asset.primaryIdentifier}</span>
                                            </div>
                                            <div className="text-sm font-medium text-slate-500">
                                                {order.asset.model || 'Model Belirtilmemiş'} {order.asset.productionYear ? ` • ${order.asset.productionYear}` : ''} {order.asset.secondaryIdentifier ? ` • Şase: ${order.asset.secondaryIdentifier}` : ''}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mt-2 p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-xl">
                                        {order.dynamicMetadata && Object.keys(order.dynamicMetadata).length > 0 ? (
                                            Object.entries(order.dynamicMetadata).map(([key, value]) => {
                                                const schemaType = order.asset?.metadata?.type;
                                                const schema = appSettings?.asset_types_schema?.find((t:any) => t.name === schemaType || t.id === schemaType);
                                                const fieldLabel = schema?.fields?.find((f:any) => f.id === key)?.label || key;
                                                return (
                                                    <div key={key}>
                                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{fieldLabel}</div>
                                                        <div className="text-[13px] font-bold text-slate-700 dark:text-slate-200">{String(value) || '-'}</div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <>
                                                <div>
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Geliş KM / Tüketim</div>
                                                    <div className="text-[13px] font-bold text-slate-700 dark:text-slate-200">{order.currentKm_or_Use ? `${order.currentKm_or_Use.toLocaleString()}` : 'Belirtilmedi'}</div>
                                                </div>
                                                <div>
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Şase No / Özel Kod</div>
                                                    <div className="text-[13px] font-bold text-slate-700 dark:text-slate-200">{order.chassisNo || 'Belirtilmedi'}</div>
                                                </div>
                                            </>
                                        )}
                                        <div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Servise Geliş Tarihi</div>
                                            <div className="text-[13px] font-bold text-slate-700 dark:text-slate-200">{new Date(order.createdAt).toLocaleDateString('tr-TR')}</div>
                                        </div>
                                    </div>

                                    {(order.nextKm_or_Use || order.nextMaintenanceAt) && (
                                        <div className="mt-3 p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl flex flex-wrap gap-6 items-center">
                                            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500">
                                                <CheckCircle className="w-5 h-5" />
                                                <span className="text-[12px] font-black uppercase tracking-widest">Sonraki Bakım Hedefleri</span>
                                            </div>
                                            <div className="w-[1px] h-6 bg-emerald-200 dark:bg-emerald-500/20 hidden sm:block"></div>
                                            {order.nextKm_or_Use && (
                                                <div>
                                                    <div className="text-[9px] font-bold text-emerald-600/70 dark:text-emerald-400/80 uppercase tracking-wider mb-1">Sonraki KM / Periyot</div>
                                                    <div className="text-[13px] font-bold text-emerald-800 dark:text-emerald-400">{Number(order.nextKm_or_Use).toLocaleString()}</div>
                                                </div>
                                            )}
                                            {order.nextMaintenanceAt && (
                                                <div>
                                                    <div className="text-[9px] font-bold text-emerald-600/70 dark:text-emerald-400/80 uppercase tracking-wider mb-1">Sonraki Servis Tarihi</div>
                                                    <div className="text-[13px] font-bold text-emerald-800 dark:text-emerald-400">{new Date(order.nextMaintenanceAt).toLocaleDateString('tr-TR')}</div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <span className="text-sm font-medium text-slate-500">Cihaz belirtilmemiş.</span>
                            )}
                        </div>

                        {/* TEKNİK SERVİS NOTLARI */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[24px] shadow-sm p-6">
                            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-white/5 pb-2">
                                <FileText className="w-4 h-4" /> Teknik Servis Notları (Uzman Yorumu)
                            </h3>
                            <textarea
                                value={technicianNotes}
                                onChange={e => setTechnicianNotes(e.target.value)}
                                placeholder="Teknisyenin müdahale detayları, teşhisi veya müşteriye uyarıları..."
                                className="w-full min-h-[120px] p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-y"
                            />
                            <div className="flex justify-end mt-3">
                                <button onClick={handleSaveNotes} disabled={savingNotes} className="px-5 py-2.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-xs rounded-xl hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors disabled:opacity-50">
                                    {savingNotes ? 'Kaydediliyor...' : 'Notları Kaydet'}
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-[24px] shadow-sm p-6 flex flex-col justify-between">
                            <h3 className="text-[12px] font-black tracking-widest text-slate-500 uppercase mb-4">Finansal Özet</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm font-medium text-slate-600 dark:text-slate-400">
                                    <span>Yedek Parça</span>
                                    <span>{Number(parts.reduce((s:number, p:any) => s + Number(p.totalPrice), 0)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                                </div>
                                <div className="flex justify-between items-center text-sm font-medium text-slate-600 dark:text-slate-400">
                                    <span>İşçilik</span>
                                    <span>{Number(labor.reduce((s:number, l:any) => s + Number(l.totalPrice), 0)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                                </div>
                                <div className="h-px w-full bg-slate-200 dark:bg-white/10 my-2"></div>
                                <div className="flex justify-between items-center text-[18px] font-black text-slate-900 dark:text-white">
                                    <span>GENEL TOPLAM</span>
                                    <span className="text-blue-600 dark:text-blue-500">{Number(order.totalAmount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                                </div>
                                
                                <div className="pt-4 mt-2 border-t border-slate-100 dark:border-white/5">
                                    <button onClick={handleSendProposal} className="w-full py-3.5 bg-[#25D366] hover:bg-[#1ebd5a] active:scale-[0.98] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                                        Müşteriye Teklif Gönder
                                    </button>
                                    <button onClick={handleVerbalApproval} className="w-full mt-3 py-3 bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-700 rounded-xl font-bold text-[13px] flex items-center justify-center gap-2 transition-all border border-slate-200 shadow-sm">
                                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                                        Müşteriden Sözlü Onay Alındı
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. PARTS SECTION */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[24px] shadow-sm p-4 sm:p-6 lg:p-8 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Package className="w-5 h-5 text-blue-500" /> Kullanılan Yedek Parçalar & Ürün Satışı
                        </h3>
                        <button onClick={() => setProductModalOpen(true)} className="w-full sm:w-auto h-[36px] px-4 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-indigo-200 dark:border-indigo-500/20 hover:bg-indigo-100 dark:hover:bg-indigo-500/20">
                            <ScanLine className="w-4 h-4" /> Barkod / Katalogdan Seç
                        </button>
                    </div>

                    <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-widest font-bold border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/30">
                                    <th className="py-3 px-4 font-bold whitespace-nowrap">Açıklama</th>
                                    <th className="py-3 px-4 font-bold whitespace-nowrap text-right">Miktar</th>
                                    <th className="py-3 px-4 font-bold whitespace-nowrap text-right">B. Fiyat</th>
                                    <th className="py-3 px-4 font-bold whitespace-nowrap text-right">Toplam</th>
                                    <th className="py-3 px-4 font-bold whitespace-nowrap text-center">İşlem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {parts.length === 0 ? (
                                    <tr><td colSpan={5} className="py-8 text-center text-sm font-medium text-slate-500">Henüz yedek parça kayıt eklenmemiş.</td></tr>
                                ) : (
                                    parts.map((item: any) => (
                                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="py-3 px-4 text-sm font-semibold text-slate-900 dark:text-white">{item.name}</td>
                                            <td className="py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400 text-right">{Number(item.quantity)}</td>
                                            <td className="py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400 text-right">{Number(item.unitPrice).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                                            <td className="py-3 px-4 text-sm font-bold text-blue-600 dark:text-blue-400 text-right">{Number(item.totalPrice).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                                            <td className="py-3 px-4 text-center">
                                                <button onClick={() => handleDeleteItem(item.id)} className="w-8 h-8 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center justify-center mx-auto transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 3. LABOR SECTION */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[24px] shadow-sm p-4 sm:p-6 lg:p-8 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b border-slate-100 dark:border-white/5 pb-4">
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Clock className="w-5 h-5 text-amber-500" /> Uygulanan İşçilikler
                        </h3>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 mb-8 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-[16px] border border-slate-200 dark:border-white/10">
                        <div className="flex-1">
                            <label className="text-xs font-bold text-slate-500 mb-1.5 block">İşçilik / Hizmet Seçin (Ayarlardaki Tarifeler)</label>
                            <select 
                                value={newItemName} 
                                onChange={e => {
                                    const val = e.target.value;
                                    setNewItemName(val);
                                    if(serviceSettings && serviceSettings[val] !== undefined) {
                                        setNewItemPrice(Number(serviceSettings[val]));
                                    }
                                }} 
                                className="w-full h-[44px] sm:h-10 px-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-[13px] font-medium focus:ring-2 focus:ring-blue-500/50 outline-none"
                            >
                                <option value="">Bir İşçilik/Hizmet Seçiniz...</option>
                                {(serviceSettings ? Object.keys(serviceSettings) : []).map(tariffName => (
                                    <option key={tariffName} value={tariffName}>{tariffName}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex gap-3">
                            <div className="w-1/3 sm:w-20">
                                <label className="text-xs font-bold text-slate-500 mb-1.5 block">Miktar</label>
                                <input type="number" min="1" value={newItemQty} onChange={e => setNewItemQty(Number(e.target.value))} className="w-full h-[44px] sm:h-10 px-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-[13px] font-bold focus:ring-2 focus:ring-blue-500/50 outline-none text-center" />
                            </div>
                            <div className="w-2/3 sm:w-32">
                                <label className="text-xs font-bold text-slate-500 mb-1.5 block">Birim Fiyat (₺)</label>
                                <input type="number" min="0" value={newItemPrice} onChange={e => setNewItemPrice(Number(e.target.value))} className="w-full h-[44px] sm:h-10 px-3 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-800/50 text-[13px] font-bold outline-none text-right cursor-not-allowed" readOnly title="Ayarlardan Gelen Sabit Tarife" />
                            </div>
                        </div>
                        <div className="w-full sm:w-32 flex items-end mt-2 sm:mt-0">
                            <button disabled={!newItemName} onClick={() => handleAddItem('LABOR')} className="w-full h-[44px] sm:h-10 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed border border-amber-200 dark:border-amber-500/20 rounded-[10px] sm:rounded-lg text-sm sm:text-xs font-bold flex justify-center items-center gap-1.5 transition-colors">
                                <Plus className="w-5 h-5 sm:w-4 sm:h-4" /> İşçilik Ekle
                            </button>
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-widest font-bold border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/30">
                                    <th className="py-3 px-4 font-bold whitespace-nowrap">Açıklama</th>
                                    <th className="py-3 px-4 font-bold whitespace-nowrap text-right">Miktar</th>
                                    <th className="py-3 px-4 font-bold whitespace-nowrap text-right">B. Fiyat</th>
                                    <th className="py-3 px-4 font-bold whitespace-nowrap text-right">Toplam</th>
                                    <th className="py-3 px-4 font-bold whitespace-nowrap text-center">İşlem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {labor.length === 0 ? (
                                    <tr><td colSpan={5} className="py-8 text-center text-sm font-medium text-slate-500">Henüz işçilik kayıt eklenmemiş.</td></tr>
                                ) : (
                                    labor.map((item: any) => (
                                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="py-3 px-4 text-sm font-semibold text-slate-900 dark:text-white">{item.name}</td>
                                            <td className="py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400 text-right">{Number(item.quantity)}</td>
                                            <td className="py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400 text-right">{Number(item.unitPrice).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                                            <td className="py-3 px-4 text-sm font-bold text-amber-600 dark:text-amber-400 text-right">{Number(item.totalPrice).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                                            <td className="py-3 px-4 text-center">
                                                <button onClick={() => handleDeleteItem(item.id)} className="w-8 h-8 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center justify-center mx-auto transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {productModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-2xl bg-white dark:bg-[#0f172a] rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-2xl animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2"><ScanLine className="text-indigo-500" /> Katalogdan Parça Seçimi</h3>
                            <button onClick={() => setProductModalOpen(false)} className="w-8 h-8 flex justify-center items-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"><span className="font-bold">✕</span></button>
                        </div>
                        <input autoFocus placeholder="Barkod veya Ürün Adı Arama..." value={productSearch} onChange={e => setProductSearch(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-3 mb-4 focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white font-bold" />
                        <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-2 custom-scroll">
                            {(products || []).filter(p => !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.barcode?.includes(productSearch)).slice(0, 50).map(p => (
                                <div key={p.id} className="w-full text-left p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-colors flex justify-between items-center group">
                                    <div className="flex flex-col min-w-0 pr-4">
                                        <span className="font-bold text-[13px] text-slate-800 dark:text-slate-200 truncate">{p.name}</span>
                                        <span className="text-[11px] text-slate-500 mt-1">Stok: {p.stock} {p.unit || 'ADET'} • Barkod: {p.barcode || '-'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">₺{Number(p.price || 0).toLocaleString()}</span>
                                        <button onClick={async () => {
                                            if (p.stock <= 0) {
                                                showError("Stok Hatası", "Bu ürünün stoğu bulunmamaktadır.");
                                                return;
                                            }
                                            await fetch(`/api/services/work-orders/${id}/items`, {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ name: p.name, quantity: 1, unitPrice: Number(p.price || 0), type: 'PART', productId: p.id })
                                            });
                                            fetchOrder();
                                            showSuccess("Başarılı", `${p.name} yedek parça listesine eklendi.`);
                                            setProductSearch('');
                                        }} className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold hover:bg-indigo-600 hover:text-white transition-colors flex justify-center items-center">
                                            +
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {products?.length === 0 && <div className="text-center py-6 text-slate-500 font-bold text-sm">Ürün bulunamadı. Lütfen envanterinizi güncelleyin.</div>}
                        </div>
                    </div>
                </div>
            )}

            {/* CHECKOUT MODAL (TAMAMLA) */}
            {checkoutModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-lg bg-white dark:bg-[#0f172a] rounded-[24px] p-6 sm:p-8 border border-slate-200 dark:border-white/10 shadow-2xl animate-in fade-in slide-in-from-bottom-4">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 flex items-center justify-center rounded-full mx-auto mb-4">
                                <CheckCircle className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Servis İşlemini Tamamla</h3>
                            <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium mt-2">Bu iş emri kapatılacak ve finansal kaydı oluşturulacaktır.</p>
                        </div>

                        <div className="p-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[20px] mb-6 flex justify-between items-center shadow-sm">
                            <span className="font-bold text-[13px] text-slate-500 uppercase tracking-widest">Ödenecek Tutar</span>
                            <span className="text-[24px] font-black text-emerald-600 dark:text-emerald-400 leading-none">
                                {Number(order.totalAmount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                            </span>
                        </div>

                        <div className="space-y-4 mb-8">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-2">Ödeme / Kapatma Şekli Seçimi</label>
                            
                            <button onClick={() => setPaymentMethod('cash')} className={`w-full p-4 rounded-[16px] border flex items-center justify-between transition-all ${paymentMethod === 'cash' ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-500 shadow-sm' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10 hover:border-slate-300'}`}>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex justify-center items-center text-[20px]">💵</div>
                                    <div className="text-left"><div className={`font-bold text-[14px] ${paymentMethod === 'cash' ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-200'}`}>Nakit Kasa</div><div className="text-[11px] font-medium text-slate-500">Nakit tahsilat olarak kasaya işlenir.</div></div>
                                </div>
                                {paymentMethod === 'cash' && <div className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px]">✓</div>}
                            </button>

                            <button onClick={() => setPaymentMethod('cc')} className={`w-full p-4 rounded-[16px] border flex items-center justify-between transition-all ${paymentMethod === 'cc' ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-500 shadow-sm' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10 hover:border-slate-300'}`}>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex justify-center items-center text-[20px]">💳</div>
                                    <div className="text-left"><div className={`font-bold text-[14px] ${paymentMethod === 'cc' ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-200'}`}>POS / Kredi Kartı</div><div className="text-[11px] font-medium text-slate-500">Kredi kartı tahsilatı olarak işaretlenir.</div></div>
                                </div>
                                {paymentMethod === 'cc' && <div className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px]">✓</div>}
                            </button>
                            
                            <button onClick={() => setPaymentMethod('iban')} className={`w-full p-4 rounded-[16px] border flex items-center justify-between transition-all ${paymentMethod === 'iban' ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-500 shadow-sm' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10 hover:border-slate-300'}`}>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex justify-center items-center text-[20px]">🏦</div>
                                    <div className="text-left"><div className={`font-bold text-[14px] ${paymentMethod === 'iban' ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-200'}`}>Havale / EFT Şirket Hesabı</div><div className="text-[11px] font-medium text-slate-500">Bankaya gelen transfer olarak işlenir.</div></div>
                                </div>
                                {paymentMethod === 'iban' && <div className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px]">✓</div>}
                            </button>

                            <button onClick={() => setPaymentMethod('account')} className={`w-full p-4 rounded-[16px] border flex items-center justify-between transition-all ${paymentMethod === 'account' ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-500 shadow-sm' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10 hover:border-slate-300'}`}>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex justify-center items-center text-[20px]">📒</div>
                                    <div className="text-left"><div className={`font-bold text-[14px] ${paymentMethod === 'account' ? 'text-amber-700 dark:text-amber-400' : 'text-slate-800 dark:text-slate-200'}`}>Açık Hesap (Veresiye)</div><div className="text-[11px] font-medium text-slate-500">Müşteri carisine borç olarak eklenir. (Cari artar)</div></div>
                                </div>
                                {paymentMethod === 'account' && <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px]">✓</div>}
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-2">Sonraki Servis KM (Opsiyonel)</label>
                                <input type="number" value={nextKm} onChange={e => setNextKm(e.target.value)} className="w-full h-12 px-4 rounded-[12px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[13px] font-bold focus:border-emerald-500 outline-none" placeholder="Örn: 15000" />
                            </div>
                            <div>
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-2">Sonraki Servis Tarihi (Opsiyonel)</label>
                                <input type="date" value={nextDate} onChange={e => setNextDate(e.target.value)} className="w-full h-12 px-4 rounded-[12px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[13px] font-bold focus:border-emerald-500 outline-none" />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button disabled={isFinishing} onClick={() => setCheckoutModalOpen(false)} className="w-[120px] h-14 rounded-xl font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Vazgeç</button>
                            <button
                                disabled={isFinishing}
                                onClick={async () => {
                                    setIsFinishing(true);
                                    try {
                                        // 1. Mark Order Completed
                                        const resStatus = await fetch(`/api/services/work-orders/${id}`, {
                                            method: 'PATCH',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ status: 'COMPLETED', nextKm_or_Use: nextKm ? Number(nextKm) : undefined, nextMaintenanceAt: nextDate ? new Date(nextDate).toISOString() : undefined })
                                        });

                                        if (!resStatus.ok) throw new Error("İş emri güncellenirken hata oluştu.");

                                        // 2. Add Transaction/Invoice
                                        if (paymentMethod === 'account') {
                                            // VERESIYE -> Add Sales Transaction with no KasaId to just increase Customer debt.
                                            const resFin = await fetch('/api/financials/transactions', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    type: 'Sales',
                                                    amount: order.totalAmount,
                                                    customerId: order.customer.id,
                                                    isAccountTransaction: true,
                                                    description: `Servis Fişi (Müşteri Bedeli) - REF:${id}`
                                                })
                                            });
                                            if (!resFin.ok) throw new Error("Açık hesap finansal işlemi oluşturulamadı.");
                                        } else {
                                            // CASH, CC, IBAN -> redirect to native system payment screen for standard process
                                            // Wait! the safest way so we don't break Kasa balances without selecting specific Kasas.
                                            // Let's redirect to standard payment, prepopulated with amount, type, etc.
                                            // But since it's already recorded as Sales? No, standard payment doesn't record sales, it just records Collection.
                                            // IF WE RECORD COLLECTION, we must also record SALES for the debt, otherwise balance will go negative!
                                            // Let's record Sales first to balance it:
                                            await fetch('/api/financials/transactions', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    type: 'Sales',
                                                    amount: order.totalAmount,
                                                    customerId: order.customer.id,
                                                    isAccountTransaction: true,
                                                    description: `Servis Fişi (Müşteri Bedeli) - REF:${id}`
                                                })
                                            });

                                            // Then redirect to Collection Payment URL
                                            router.push(`/payment?amount=${order.totalAmount}&title=ServisFisiTahsilat-${encodeURIComponent(order.customer.name)}&ref=CUST-${order.customer.id}&type=collection`);
                                            return;
                                        }

                                        showSuccess("Başarılı", "Servis başarıyla tamamlandı ve portföye kaydedildi.");
                                        setCheckoutModalOpen(false);
                                        fetchOrder();
                                        
                                    } catch (err: any) {
                                        showError("Hata", err.message || "İşlem tamamlanamadı.");
                                    } finally {
                                        setIsFinishing(false);
                                    }
                                }}
                                className="flex-1 h-14 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 transition-all flex justify-center items-center disabled:opacity-50"
                            >
                                {isFinishing ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : 'ONAYLA VE BİTİR'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
</div>
    );
}
