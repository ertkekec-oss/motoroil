"use client";

import { useState, Fragment, useEffect } from 'react';
import Pagination from '@/components/Pagination';
import { MarketplaceActionButton } from '@/components/marketplaces/MarketplaceActionButton';
import { useModal } from "@/contexts/ModalContext";
import { Search, ChevronDown } from 'lucide-react';

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
            {/* LOCAL KPIS REMOVED IN FAVOR OF GLOBAL TOP PILLS */}

            {/* ═══════════════ HEADER + FILTERS ═══════════════ */}
            {/* ═══════════════ SEARCH & FILTERS ═══════════════ */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-2 mb-6">
                <div className="relative w-full md:w-[350px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Kayıt ara..."
                        className="w-full pl-9 pr-4 h-[44px] bg-white rounded-[12px] border border-slate-200 text-[13px] outline-none transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:bg-[#1e293b] dark:border-white/10 dark:text-white"
                    />
                </div>
                <select 
                    value={marketplaceFilter} 
                    onChange={e => setMarketplaceFilter(e.target.value)}
                    className="h-[44px] px-4 bg-white rounded-[12px] border border-slate-200 text-[13px] outline-none font-medium text-slate-700 min-w-[140px] appearance-none dark:bg-[#1e293b] dark:border-white/10 dark:text-white cursor-pointer"
                    style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center', backgroundSize: '16px' }}
                >
                    <option value="ALL">Tüm Platformlar</option>
                    <option value="Trendyol">Trendyol</option>
                    <option value="Hepsiburada">Hepsiburada</option>
                    <option value="N11">N11</option>
                    <option value="Pazarama">Pazarama</option>
                </select>
                <select 
                    value={statusFilter} 
                    onChange={e => setStatusFilter(e.target.value)}
                    className="h-[44px] px-4 bg-white rounded-[12px] border border-slate-200 text-[13px] outline-none font-medium text-slate-700 min-w-[140px] appearance-none dark:bg-[#1e293b] dark:border-white/10 dark:text-white cursor-pointer"
                    style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center', backgroundSize: '16px' }}
                >
                    <option value="ALL">Tüm Durumlar</option>
                    <option value="NEW">Onaylanan & Yeni</option>
                    <option value="SHIPPED">Hazırlanıyor & Kargo</option>
                    <option value="COMPLETED">Tamamlandı</option>
                </select>
            </div>

            {/* Bulk Actions Context (Only visible when items selected) */}
            {selectedOrders.length > 0 && (
                <div className="flex justify-center gap-3 mb-6">
                    <button disabled={isGeneratingBulk} onClick={/*...existing...*/} className={`h-[36px] px-5 rounded-[12px] font-semibold text-[12px] transition-colors flex items-center justify-center gap-2 shadow-sm bg-indigo-600 hover:bg-indigo-700 text-white ${isGeneratingBulk ? 'opacity-50 cursor-not-allowed' : ''}`}>
                         {isGeneratingBulk ? 'Etiketler Hazırlanıyor...' : `Toplu Etiket Yazdır (${selectedOrders.length})`}
                    </button>
                    <button disabled={!!bulkInvoiceStatus} onClick={/*...existing...*/} className={`h-[36px] px-5 rounded-[12px] font-semibold text-[12px] transition-colors flex items-center justify-center gap-2 shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white ${!!bulkInvoiceStatus ? 'opacity-50 cursor-not-allowed' : ''}`}>
                         {bulkInvoiceStatus ? bulkInvoiceStatus : `Toplu Fatura (${selectedOrders.length})`}
                    </button>
                </div>
            )}

            {/* ═══════════════ TABLE ═══════════════ */}
            {filteredOnlineOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#0f172a] rounded-[24px] border border-slate-200 dark:border-white/5 shadow-sm">
                    <div className="text-[12px] font-black uppercase tracking-widest text-slate-400">Sonuç bulunamadı</div>
                </div>
            ) : (
                <div className="bg-white dark:bg-[#0f172a] rounded-[24px] border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead className="bg-transparent border-b border-slate-200 dark:border-white/5">
                                <tr>
                                    <th className="h-[48px] px-6 align-middle w-12">
                                        <div className="w-4 h-4 rounded-[4px] border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 transition-colors" onClick={toggleSelectAll}>
                                            {paginatedOrders.length > 0 && selectedOrders.length === paginatedOrders.length && <CheckCircle2 className="w-3 h-3 text-indigo-500" />}
                                        </div>
                                    </th>
                                    {['Sipariş No', 'Müşteri', 'Platform', 'Durum', 'Tutar', 'İşlem']?.map(h => (
                                        <th key={h} className="h-[48px] px-6 text-left text-[10px] whitespace-nowrap uppercase tracking-widest font-bold text-slate-500 dark:text-slate-400">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {paginatedOrders?.map(o => {
                                    const isExpanded = expandedOrderId === o.id;
                                    const isCompleted = ['Faturalandırıldı', 'Delivered', 'Cancelled'].includes(o.status);
                                    return (
                                        <Fragment key={o.id}>
                                            <tr
                                                onClick={() => toggleExpand(o.id, o)}
                                                className="hover:bg-slate-50 dark:hover:bg-[#1e293b]/80 transition-colors h-[72px] group cursor-pointer"
                                            >
                                                <td className="px-6 py-3 align-middle w-12" onClick={e => e.stopPropagation()}>
                                                    <div className="w-4 h-4 rounded-[4px] border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 transition-colors" onClick={() => toggleOrderSelection(o.id)}>
                                                        {selectedOrders.includes(o.id) && <CheckCircle2 className="w-3 h-3 text-indigo-500" />}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3 align-middle whitespace-nowrap">
                                                    <div className="text-[13px] font-black text-slate-800 dark:text-white mb-0.5">{o.orderNumber || o.id}</div>
                                                    <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{new Date(o.orderDate || o.date).toLocaleDateString('tr-TR')}</div>
                                                </td>
                                                <td className="px-6 py-3 align-middle whitespace-nowrap">
                                                    <div className="text-[13px] font-black text-slate-800 dark:text-white mb-0.5">{o.customerName}</div>
                                                    <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Bireysel Müşteri</div>
                                                </td>
                                                <td className="px-6 py-3 align-middle whitespace-nowrap">
                                                    <div className="text-[13px] font-bold text-slate-800 dark:text-white mb-0.5 tracking-wide">{o.marketplace === 'B2B_NETWORK' ? 'B2B Ağı' : o.marketplace}</div>
                                                </td>
                                                <td className="px-6 py-3 align-middle whitespace-nowrap">
                                                    <span className={`px-2 py-1 text-[10px] font-bold tracking-widest uppercase border rounded-[8px] inline-block ${getStatusBadge(o.status, isLight)}`}>
                                                        {o.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3 align-middle whitespace-nowrap">
                                                    <div className="text-[13px] font-black text-slate-800 dark:text-white mb-0.5">{parseFloat(o.totalAmount).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺</div>
                                                </td>
                                                <td className="px-6 py-3 align-middle whitespace-nowrap">
                                                    <div className="flex gap-2 items-center">
                                                        {isCompleted ? (
                                                            <span className="text-[12px] font-bold uppercase tracking-widest text-slate-400">Tamamlandı</span>
                                                        ) : (
                                                            <button
                                                                onClick={e => { e.stopPropagation(); setSelectedOrder(o); }}
                                                                className="h-[32px] px-4 rounded-[12px] text-[11px] font-bold tracking-widest uppercase transition-colors shadow-sm bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/50"
                                                            >
                                                                Faturalandır
                                                            </button>
                                                        )}
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
