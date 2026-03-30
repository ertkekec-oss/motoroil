"use client";

import { useState, Fragment, useEffect } from 'react';
import Pagination from '@/components/Pagination';
import { MarketplaceActionButton } from '@/components/marketplaces/MarketplaceActionButton';
import { useModal } from "@/contexts/ModalContext";

interface OnlineOrdersTabProps {
    onlineOrders: any[];
    fetchOnlineOrders: () => Promise<void>;
    setSelectedOrder: (order: any) => void;
    handleCollectBulk: () => Promise<void>;
    isCollecting: boolean;
    selectedOrders: string[];
    setSelectedOrders: (orders: string[] | ((prev: string[]) => string[])) => void;
    handlePrintLabel: (orderId: string, marketplace: string) => Promise<void>;
    isLoadingLabel: string | null;
    showWarning: (title: string, message: string) => void;
    showError: (title: string, message: string) => void;
    posTheme?: 'dark' | 'light';
}

function getStatusBadge(status: string, isLight: boolean) {
    if (['Hazırlanıyor', 'Picking', 'ReadyToShip', 'Preparing'].includes(status))
        return isLight ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    if (['Shipped', 'Kargolandı', 'Invoiced'].includes(status))
        return isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-slate-800 text-slate-300 border-slate-700';
    if (['Faturalandırıldı', 'Tamamlandı', 'Delivered'].includes(status))
        return isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (['Cancelled', 'CANCELLED', 'İptal Edildi', 'İptal', 'Returned'].includes(status))
        return isLight ? 'bg-red-50 text-red-700 border-red-200' : 'bg-red-500/10 text-red-400 border-red-500/20';

    // Default / Yeni
    return isLight ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-blue-500/10 text-blue-400 border-blue-500/20';
}

export function OnlineOrdersTab({
    onlineOrders,
    fetchOnlineOrders,
    setSelectedOrder,
    handleCollectBulk,
    isCollecting,
    selectedOrders,
    setSelectedOrders,
    handlePrintLabel,
    isLoadingLabel,
    showWarning,
    showError,
    posTheme = 'dark'
}: OnlineOrdersTabProps) {
    const { showConfirm, showSuccess: modalSuccess, showError: modalError, showWarning: modalWarning } = useModal();
    const isLight = posTheme === 'light';

    const [statusFilter, setStatusFilter] = useState('NEW');
    const [marketplaceFilter, setMarketplaceFilter] = useState('ALL');
    const [dateFilter, setDateFilter] = useState('ALL');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [turnoverFilter, setTurnoverFilter] = useState('TODAY');
    const [turnoverCustomStart, setTurnoverCustomStart] = useState('');
    const [turnoverCustomEnd, setTurnoverCustomEnd] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
    const [isGeneratingBulk, setIsGeneratingBulk] = useState(false);
    const [bulkInvoiceStatus, setBulkInvoiceStatus] = useState<string | null>(null);

    const toggleExpand = async (id: string, order?: any) => {
        const isExpanding = expandedOrderId !== id;
        setExpandedOrderId(isExpanding ? id : null);
        if (isExpanding && order && order.marketplace === 'Pazarama' && !order.detailsFetchedAt) {
            try {
                const res = await fetch('/api/integrations/marketplace/hydrate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ orderId: id, marketplace: 'Pazarama' })
                });
                if (res.ok) { const data = await res.json(); if (data.success && data.order) await fetchOnlineOrders(); }
            } catch (err) { console.error('Hydration failed:', err); }
        }
    };

    useEffect(() => {
        const pazaramaMissingDetails = onlineOrders.filter(o =>
            o.marketplace === 'Pazarama' &&
            (!o.detailsFetchedAt || !o.items || o.items.length === 0 || Number(o.totalAmount) === 0)
        ).filter(o => !['Cancelled', 'CANCELLED', 'İptal Edildi', 'İptal'].includes(o.status));
        if (pazaramaMissingDetails.length > 0) {
            const timer = setTimeout(async () => {
                const order = pazaramaMissingDetails[0];
                try {
                    const res = await fetch('/api/integrations/marketplace/hydrate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId: order.id, marketplace: 'Pazarama' }) });
                    if (res.ok) await fetchOnlineOrders();
                } catch (err) { console.error('[AUTO-HYDRATE] Background hydration failed:', err); }
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [onlineOrders, fetchOnlineOrders]);

    const toggleOrderSelection = (orderId: string) => {
        setSelectedOrders(prev => prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]);
    };

    const calculateTurnover = (orders: any[]) => {
        return orders.filter(o => {
            const d = new Date(o.orderDate || o.date);
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            if (turnoverFilter === 'TODAY') return d.toDateString() === now.toDateString();
            if (turnoverFilter === 'WEEK') { const w = new Date(today); w.setDate(w.getDate() - 7); return d >= w; }
            if (turnoverFilter === 'MONTH') return d >= new Date(now.getFullYear(), now.getMonth(), 1);
            if (turnoverFilter === 'CUSTOM' && turnoverCustomStart && turnoverCustomEnd) {
                const end = new Date(turnoverCustomEnd); end.setHours(23, 59, 59);
                return d >= new Date(turnoverCustomStart) && d <= end;
            }
            return false;
        }).filter(o => !['Cancelled', 'CANCELLED', 'İptal Edildi', 'İptal'].includes(o.status))
            .reduce((acc, curr) => acc + (parseFloat(curr.totalAmount) || 0), 0);
    };

    const getTurnoverTitle = () => ({ TODAY: 'BUGÜNKÜ CİRO', WEEK: 'SON 1 HAFTA CİRO', MONTH: 'BU AY CİRO', CUSTOM: 'ÖZEL TARİH CİRO' }[turnoverFilter] || 'CİRO');

    const filteredOnlineOrders = onlineOrders.filter(order => {
        let statusMatch = true;
        if (statusFilter !== 'ALL') {
            if (statusFilter === 'NEW') statusMatch = ['Yeni', 'Created', 'Picking', 'WaitingForApproval', 'Preparing', 'ReadyToShip', 'Unpaid', 'PENDING_APPROVAL', 'APPROVED', 'PAID_PENDING_APPROVAL', 'PAID'].includes(order.status);
            else if (statusFilter === 'SHIPPED') statusMatch = ['Kargolandı', 'Shipped', 'Hazırlanıyor', 'Invoiced'].includes(order.status);
            else if (statusFilter === 'COMPLETED') statusMatch = ['Tamamlandı', 'Delivered', 'Faturalandırıldı', 'Returned'].includes(order.status);
            else if (statusFilter === 'CANCELLED') statusMatch = ['Cancelled', 'CANCELLED', 'İptal Edildi', 'İptal', 'REJECTED'].includes(order.status);
        }
        let dateMatch = true;
        if (dateFilter !== 'ALL') {
            const orderDate = new Date(order.orderDate || order.date);
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            if (dateFilter === 'TODAY') dateMatch = orderDate >= today;
            else if (dateFilter === 'WEEK') { const w = new Date(today); w.setDate(w.getDate() - 7); dateMatch = orderDate >= w; }
            else if (dateFilter === 'MONTH') { const m = new Date(today); m.setMonth(m.getMonth() - 1); dateMatch = orderDate >= m; }
            else if (dateFilter === '3MONTHS') { const m3 = new Date(today); m3.setMonth(m3.getMonth() - 3); dateMatch = orderDate >= m3; }
            else if (dateFilter === 'CUSTOM' && customStartDate && customEndDate) {
                const end = new Date(customEndDate); end.setHours(23, 59, 59);
                dateMatch = orderDate >= new Date(customStartDate) && orderDate <= end;
            }
        }
        let marketplaceMatch = marketplaceFilter === 'ALL' ? !['B2B_NETWORK', 'B2B'].includes(order.marketplace) : order.marketplace === marketplaceFilter;
        return marketplaceMatch && statusMatch && dateMatch;
    });

    const ordersPerPage = 10;
    const totalPages = Math.ceil(filteredOnlineOrders.length / ordersPerPage);
    const paginatedOrders = filteredOnlineOrders.slice((currentPage - 1) * ordersPerPage, currentPage * ordersPerPage);

    const toggleSelectAll = () => {
        if (selectedOrders.length === paginatedOrders.length && paginatedOrders.length > 0) setSelectedOrders([]);
        else setSelectedOrders(paginatedOrders?.map(o => o.id));
    };

    useEffect(() => { setCurrentPage(1); }, [statusFilter, marketplaceFilter, dateFilter, customStartDate, customEndDate]);

    const cardClass = isLight
        ? "bg-white border border-slate-200 shadow-sm"
        : "bg-slate-900 border border-slate-800";

    const textLabelClass = isLight ? "text-slate-500" : "text-slate-400";
    const textValueClass = isLight ? "text-slate-900" : "text-white";

    // Enterprise Outline Chip component
    const OutlineChip = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
        <button onClick={onClick} className={`h-[36px] px-5 rounded-full text-[11px] font-black uppercase tracking-widest border transition-all whitespace-nowrap outline-none ${active
                ? (isLight ? 'bg-blue-50/50 border-blue-600 text-blue-700 shadow-sm' : 'bg-blue-500/10 border-blue-500/50 text-blue-400 shadow-sm')
                : (isLight ? 'bg-white border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50' : 'bg-slate-900 border-slate-700/50 text-slate-400 hover:text-slate-300 hover:bg-slate-800')
            }`}>
            {children}
        </button>
    );

    return (
        <div className="space-y-8 font-sans">
            {/* ═══════════════ KPI CARDS ═══════════════ */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* KPI 1: Bekleyen */}
                <div className={`p-5 rounded-[14px] ${cardClass}`}>
                    <div className={`text-[11px] font-semibold uppercase tracking-wide ${textLabelClass}`}>
                        Bekleyen Sipariş
                    </div>
                    <div className={`text-[28px] font-semibold mt-2 tracking-tight ${isLight ? 'text-blue-600' : 'text-blue-500'}`}>
                        {onlineOrders.filter(o => o.marketplace !== 'B2B_NETWORK' && ['Yeni', 'Hazırlanıyor', 'WaitingForApproval', 'Picking'].includes(o.status)).length}
                        <span className={`text-[14px] font-medium ml-2 ${textLabelClass}`}>adet</span>
                    </div>
                    <div className={`text-[12px] mt-1 ${textLabelClass}`}>Hazırlanması gereken</div>
                </div>

                {/* KPI 2: Ciro */}
                <div className={`p-5 rounded-[14px] ${cardClass}`}>
                    <div className="flex justify-between items-center">
                        <div className={`text-[11px] font-semibold uppercase tracking-wide ${textLabelClass}`}>
                            {getTurnoverTitle()}
                        </div>
                        <select
                            value={turnoverFilter}
                            onChange={(e) => setTurnoverFilter(e.target.value)}
                            className={`text-[11px] font-medium border rounded-[6px] px-2 py-1 outline-none ${isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-800 border-slate-700 text-slate-300'
                                }`}
                        >
                            <option value="TODAY">Bugün</option>
                            <option value="WEEK">1 Hafta</option>
                            <option value="MONTH">Bu Ay</option>
                            <option value="CUSTOM">Özel</option>
                        </select>
                    </div>
                    {turnoverFilter === 'CUSTOM' && (
                        <div className="flex gap-2 mt-2 text-[11px]">
                            <input type="date" value={turnoverCustomStart} onChange={e => setTurnoverCustomStart(e.target.value)} className={`px-2 py-1 rounded-[6px] border ${isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-300'}`} />
                            <span className={textLabelClass}>–</span>
                            <input type="date" value={turnoverCustomEnd} onChange={e => setTurnoverCustomEnd(e.target.value)} className={`px-2 py-1 rounded-[6px] border ${isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-300'}`} />
                        </div>
                    )}
                    <div className={`text-[28px] font-semibold mt-2 tracking-tight ${textValueClass}`}>
                        ₺{calculateTurnover(onlineOrders).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className={`text-[12px] mt-1 ${textLabelClass}`}>Seçili dönem cirosu</div>
                </div>

                {/* KPI 3: Stok */}
                <div className={`p-5 rounded-[14px] ${cardClass}`}>
                    <div className={`text-[11px] font-semibold uppercase tracking-wide ${textLabelClass}`}>
                        Stok Hata Oranı
                    </div>
                    <div className={`text-[28px] font-semibold mt-2 tracking-tight ${isLight ? 'text-emerald-600' : 'text-emerald-500'}`}>
                        %0.1
                    </div>
                    <div className={`text-[12px] mt-1 ${isLight ? 'text-emerald-600' : 'text-emerald-500'} font-medium`}>Senkronizasyon stabil</div>
                </div>
            </div>

            {/* ═══════════════ HEADER + FILTERS ═══════════════ */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">

                {/* Left: Title + LIVE badge + bulk action */}
                <div className="flex items-center gap-4 flex-wrap">
                    <h3 className={`text-[18px] font-semibold ${textValueClass}`}>
                        Sipariş Listesi
                    </h3>
                    <span className={`px-2.5 py-1 text-[10px] uppercase font-bold tracking-wide rounded-[8px] border ${isLight ? 'border-blue-200 text-blue-600' : 'border-blue-500/30 text-blue-400'}`}>
                        LIVE v1.4
                    </span>
                    {selectedOrders.length > 0 && (
                        <>
                            <button
                            disabled={isGeneratingBulk}
                            onClick={async () => {
                                const selectedOrderData = onlineOrders.filter(o => selectedOrders.includes(o.id)).map(o => ({
                                    marketplace: o.marketplace?.toLowerCase() || '',
                                    id: o.id,
                                    shipmentPackageId: o.shipmentPackageId || (['hepsiburada', 'pazarama', 'n11'].includes(o.marketplace?.toLowerCase() || '') ? o.orderNumber : undefined)
                                })).filter(o => o.shipmentPackageId);
                                
                                if (selectedOrderData.length === 0) {
                                     showError("Hata", "Seçili siparişlerin etiket numaraları bulunamadı.");
                                     return;
                                }
                                
                                setIsGeneratingBulk(true);
                                const newWindow = window.open('', '_blank');
                                if (!newWindow) {
                                    setIsGeneratingBulk(false);
                                    showError("Tarayıcı Engeli", "Lütfen açılır pencere (popup) engelleyicisini kapatın ve tekrar deneyin.");
                                    return;
                                }
                                newWindow.document.write('<body style="background:#0f172a;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;text-align:center;margin:0;"><div><h2>Toplu Etiketler Hazırlanıyor...</h2><p style="color:#94a3b8;">Lütfen bekleyin, PDF birleştirme işlemi biraz zaman alabilir.</p></div></body>');

                                try {
                                    const res = await fetch('/api/marketplaces/bulk-label', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ orders: selectedOrderData })
                                    });
                                    if (!res.ok) {
                                        const err = await res.json().catch(()=>({}));
                                        throw new Error(err?.error || "Toplu etiket oluşturulamadı");
                                    }
                                    const blob = await res.blob();
                                    const url = URL.createObjectURL(blob);
                                    newWindow.location.href = url;
                                } catch(e: any) {
                                    if (newWindow) newWindow.close();
                                    showError("İşlem Başarısız", e.message);
                                } finally {
                                    setIsGeneratingBulk(false);
                                }
                            }}
                            className={`h-[40px] px-5 rounded-full font-bold tracking-wide text-[13px] transition-colors flex items-center justify-center gap-2 shadow-sm ${isLight ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white'} ${isGeneratingBulk ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isGeneratingBulk ? (
                                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
                            ) : (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                            )}
                            {isGeneratingBulk ? 'Etiketler Hazırlanıyor...' : `Toplu Etiket Yazdır (${selectedOrders.length})`}
                        </button>
                        
                        <button
                            disabled={!!bulkInvoiceStatus || isGeneratingBulk}
                            onClick={async () => {

                                const selectedOrderData = onlineOrders.filter(o => selectedOrders.includes(o.id));
                                
                                if (selectedOrderData.filter(o => !['Faturalandırıldı', 'Tamamlandı'].includes(o.status)).length === 0) {
                                     modalError("Hata", "Seçili siparişler zaten faturalandırılmış.");
                                     return;
                                }

                                showConfirm("Toplu Faturalandırma", `${selectedOrderData.filter(o => !['Faturalandırıldı', 'Tamamlandı'].includes(o.status)).length} adet sipariş otomatik olarak faturalandırılıp resmileştirilecektir (e-Fatura/e-Arşiv gönderimi). Devam etmek istiyor musunuz?`, async () => {
                                    setBulkInvoiceStatus(`Hazırlanıyor...`);
                                    let successCount = 0;
                                    let failCount = 0;

                                    try {
                                        const mappingRes = await fetch('/api/integrations/marketplace/get-mapping');
                                        const mappingData = await mappingRes.json();
                                        const rawMappings = mappingData.mappings || [];

                                        for(let i = 0; i < selectedOrderData.length; i++) {
                                            const o = selectedOrderData[i];
                                            
                                            // Zaten faturalıysa atla
                                            if (['Faturalandırıldı', 'Tamamlandı'].includes(o.status)) {
                                                continue;
                                            }

                                            setBulkInvoiceStatus(`Faturalandırılıyor: ${i+1}/${selectedOrderData.length}`);
                                            
                                            const saleItems = o.items?.map((item: any) => {
                                                const code = item.code || item.barcode || item.name;
                                                const mapMatch = rawMappings.find((m: any) => m.marketplace?.toLowerCase() === o.marketplace?.toLowerCase() && m.marketplaceCode === code);
                                                return {
                                                    productId: mapMatch ? mapMatch.productId : undefined,
                                                    qty: item.qty || item.quantity || 1,
                                                    name: item.name,
                                                    price: item.price || 0,
                                                    vat: item.vat || 20,
                                                    otv: item.otv || 0
                                                };
                                            }) || [];

                                            const convRes = await fetch('/api/sales/invoices/ecommerce-convert', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ orderId: o.id, items: saleItems })
                                            });
                                            const convData = await convRes.json();
                                            
                                            if (convData.success && convData.invoice) {
                                                const sendRes = await fetch('/api/sales/invoices', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ action: 'formal-send', invoiceId: convData.invoice.id })
                                                });
                                                if (sendRes.ok) successCount++;
                                                else failCount++;
                                            } else {
                                                failCount++;
                                            }
                                        }

                                        if (failCount > 0) {
                                            modalError("Kısmi Başarı / Hata", `${successCount} fatura başarıyla oluşturuldu ve gönderildi. ${failCount} siparişte hata oluştu.`);
                                        } else {
                                            modalSuccess("Bilgi", `Başarılı: Tüm faturalar başarıyla oluşturuldu ve gönderildi. (${successCount} adet)`);
                                        }
                                        
                                    } catch(e: any) {
                                        modalError("İşlem Başarısız", e.message || "Bilinmeyen bir hata oluştu.");
                                    } finally {
                                        setBulkInvoiceStatus(null);
                                        setSelectedOrders([]);
                                        fetchOnlineOrders();
                                    }
                                });
                            }}
                            className={`h-[40px] px-5 rounded-full font-bold tracking-wide text-[13px] transition-colors flex items-center justify-center gap-2 shadow-sm ${isLight ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'} ${(!!bulkInvoiceStatus || isGeneratingBulk) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {!!bulkInvoiceStatus ? (
                                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
                            ) : (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                            )}
                            {bulkInvoiceStatus ? bulkInvoiceStatus : `Toplu Fatura Oluştur (${selectedOrders.length})`}
                        </button>
                        </>
                    )}
                </div>

                {/* Right: Consolidated Filter Panel */}
                <div className={`flex flex-wrap items-center gap-4 p-2 rounded-[16px] border ${isLight ? 'bg-slate-50/50 border-slate-200' : 'bg-slate-900/50 border-slate-800'}`}>
                    {/* Groups container internally separating, but visually unified */}
                    <div className="flex gap-2">
                        <OutlineChip active={marketplaceFilter === 'ALL'} onClick={() => setMarketplaceFilter('ALL')}>Tüm Platformlar</OutlineChip>
                        {['Trendyol', 'Hepsiburada', 'N11', 'Pazarama']?.map(mp => (
                            <OutlineChip key={mp} active={marketplaceFilter === mp} onClick={() => setMarketplaceFilter(mp)}>
                                {mp}
                            </OutlineChip>
                        ))}
                    </div>

                    <div className={`w-[1px] h-[24px] ${isLight ? 'bg-slate-200' : 'bg-slate-700'}`}></div>

                    <div className="flex gap-2">
                        {[
                            { val: 'ALL', label: 'Tüm Durumlar' },
                            { val: 'NEW', label: 'Onaylanan & Yeni' },
                            { val: 'SHIPPED', label: 'Hazırlanıyor & Kargo' },
                            { val: 'COMPLETED', label: 'Faturalandı / Tamamlandı' },
                        ]?.map(({ val, label }) => (
                            <OutlineChip key={val} active={statusFilter === val} onClick={() => setStatusFilter(val)}>{label}</OutlineChip>
                        ))}
                    </div>

                    <div className={`w-[1px] h-[24px] ${isLight ? 'bg-slate-200' : 'bg-slate-700'}`}></div>

                    <div className="flex gap-2 items-center">
                        <select
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className={`h-[36px] px-3 rounded-[10px] text-[13px] font-medium border outline-none transition-colors ${
                                isLight ? 'bg-white border-slate-200 text-slate-700 focus:border-blue-500' : 'bg-slate-800 border-slate-700 text-slate-300 focus:border-blue-500'
                            }`}
                        >
                            <option value="ALL">Tüm Zamanlar</option>
                            <option value="TODAY">Bugün</option>
                            <option value="WEEK">Son 1 Hafta</option>
                            <option value="MONTH">Son 1 Ay</option>
                            <option value="3MONTHS">Son 3 Ay</option>
                            <option value="CUSTOM">Özel Tarih</option>
                        </select>
                        {dateFilter === 'CUSTOM' && (
                             <div className="flex gap-2 text-[12px] items-center">
                                 <input type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} className={`h-[36px] px-2 rounded-[6px] border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-800 border-slate-700'} text-slate-600 dark:text-slate-300`} />
                                 <span className={textLabelClass}>-</span>
                                 <input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} className={`h-[36px] px-2 rounded-[6px] border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-800 border-slate-700'} text-slate-600 dark:text-slate-300`} />
                             </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ═══════════════ TABLE ═══════════════ */}
            {filteredOnlineOrders.length === 0 ? (
                <div className="text-center py-16">
                    <div className={`text-[32px] mb-4`}>📭</div>
                    <div className={`text-[15px] font-semibold ${textLabelClass}`}>Bu filtreye uygun sipariş bulunamadı.</div>
                </div>
            ) : (
                <div className={`rounded-[16px] border p-6 overflow-hidden ${cardClass}`}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead className="sticky top-0 bg-transparent">
                                <tr className={`border-b ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                                    <th className="h-[48px] px-4 w-[40px]">
                                        <input type="checkbox" checked={paginatedOrders.length > 0 && selectedOrders.length === paginatedOrders.length} onChange={toggleSelectAll} className="cursor-pointer" />
                                    </th>
                                    {['Sipariş No', 'Platform', 'Müşteri', 'Tutar', 'Durum', 'İşlem']?.map(h => (
                                        <th key={h} className={`h-[48px] px-4 text-left text-[11px] uppercase tracking-wide font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${isLight ? 'divide-slate-100' : 'divide-slate-800/50'}`}>
                                {paginatedOrders?.map(o => {
                                    const isExpanded = expandedOrderId === o.id;
                                    const isCompleted = ['Faturalandırıldı', 'Delivered', 'Cancelled'].includes(o.status);
                                    return (
                                        <Fragment key={o.id}>
                                            <tr
                                                onClick={() => toggleExpand(o.id, o)}
                                                className={`h-[52px] cursor-pointer transition-colors ${isExpanded
                                                        ? (isLight ? 'bg-blue-50/30' : 'bg-blue-900/10')
                                                        : (isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/50')
                                                    }`}
                                            >
                                                <td className="px-4 align-middle" onClick={e => e.stopPropagation()}>
                                                    <input type="checkbox" checked={selectedOrders.includes(o.id)} onChange={() => toggleOrderSelection(o.id)} className="cursor-pointer" />
                                                </td>
                                                <td className={`px-4 align-middle font-medium text-[13px] ${textValueClass}`}>
                                                    {o.orderNumber || o.id}
                                                </td>
                                                <td className="px-4 align-middle">
                                                    <span className={`text-[12px] font-medium px-2 py-1 border rounded-[6px] ${isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-300'}`}>
                                                        {o.marketplace === 'B2B_NETWORK' ? 'B2B Ağı' : o.marketplace}
                                                    </span>
                                                </td>
                                                <td className="px-4 align-middle py-1.5">
                                                    <div className={`font-medium text-[13px] ${textValueClass}`}>{o.customerName}</div>
                                                    <div className={`text-[11px] mt-0.5 ${textLabelClass}`}>{new Date(o.orderDate || o.date).toLocaleDateString('tr-TR')}</div>
                                                </td>
                                                <td className={`px-4 align-middle font-semibold text-[13px] ${textValueClass}`}>
                                                    {parseFloat(o.totalAmount).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className={`text-[11px] font-normal ${textLabelClass}`}>{o.currency}</span>
                                                </td>
                                                <td className="px-4 align-middle">
                                                    <span className={`px-2 py-1 text-[11px] font-medium border rounded-[6px] inline-block ${getStatusBadge(o.status, isLight)}`}>
                                                        {o.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 align-middle">
                                                    <div className="flex gap-2 items-center">
                                                        {isCompleted ? (
                                                            <span className={`text-[12px] font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Tamamlandı</span>
                                                        ) : (
                                                            <button
                                                                onClick={e => { e.stopPropagation(); setSelectedOrder(o); }}
                                                                className={`h-[32px] px-4 rounded-full text-[12px] font-bold tracking-wide transition-colors shadow-sm ${isLight ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' : 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50'}`}
                                                            >
                                                                Faturalandır
                                                            </button>
                                                        )}
                                                        <div className={`p-1.5 rounded-[6px] ${isLight ? 'text-slate-400 hover:bg-slate-100' : 'text-slate-500 hover:bg-slate-800'}`}>
                                                            {isExpanded ? '▲' : '▼'}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>

                                            {/* Expanded row */}
                                            {isExpanded && (
                                                <tr className={`border-b-0 ${isLight ? 'bg-blue-50/20' : 'bg-blue-900/5'}`}>
                                                    <td colSpan={7} className="p-4">
                                                        <div className={`p-5 rounded-[12px] border ${isLight ? 'bg-white border-blue-100' : 'bg-slate-900 border-blue-900/50'}`}>
                                                            <h4 className={`text-[14px] font-semibold mb-3 pb-3 border-b ${isLight ? 'text-slate-800 border-slate-100' : 'text-slate-200 border-slate-800'}`}>
                                                                Sipariş İçeriği
                                                            </h4>
                                                            <table className="w-full text-left font-medium text-[13px]">
                                                                <thead>
                                                                    <tr>
                                                                        <th className={`pb-2 text-[11px] uppercase tracking-wide font-semibold ${textLabelClass}`}>Ürün Adı</th>
                                                                        <th className={`pb-2 text-[11px] uppercase tracking-wide font-semibold text-center ${textLabelClass}`}>Adet</th>
                                                                        <th className={`pb-2 text-[11px] uppercase tracking-wide font-semibold text-right ${textLabelClass}`}>Tutar</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className={`divide-y ${isLight ? 'divide-slate-100' : 'divide-slate-800'}`}>
                                                                    {o.items && o.items?.map((item: any, idx: number) => (
                                                                        <tr key={idx}>
                                                                            <td className={`py-2 ${textValueClass}`}>{item.name || item.productName}</td>
                                                                            <td className={`py-2 text-center ${textValueClass}`}>{item.qty || item.quantity}</td>
                                                                            <td className={`py-2 text-right ${textValueClass}`}>{(item.total ? item.total : (item.price * item.quantity)).toFixed(2)} ₺</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>

                                                            {/* Platform Actions */}
                                                            <div className={`mt-5 pt-4 border-t ${isLight ? 'border-slate-100' : 'border-slate-800'}`}>
                                                                <div className="flex gap-3 flex-wrap">
                                                                    <MarketplaceActionButton orderId={o.id} marketplace={o.marketplace} actionKey="REFRESH_STATUS" onSuccess={fetchOnlineOrders} />
                                                                    {['trendyol', 'hepsiburada', 'pazarama', 'n11'].includes(o.marketplace?.toLowerCase() || '') && (
                                                                        <MarketplaceActionButton orderId={o.id} marketplace={o.marketplace} actionKey="PRINT_LABEL_A4" shipmentPackageId={o.shipmentPackageId || (['hepsiburada', 'pazarama', 'n11'].includes(o.marketplace?.toLowerCase() || '') ? o.orderNumber : undefined)} />
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className={`pt-4 border-t ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
        </div>
    );
}
