"use client";

import { useState, Fragment, useEffect } from 'react';
import Pagination from '@/components/Pagination';
import { Search, CheckCircle2 } from 'lucide-react';

interface StoreOrdersTabProps {
    storeOrders: any[];
    fetchStoreOrders: () => Promise<void>;
    handleDeleteStoreSale: (id: string) => Promise<void>;
    isLoadingStore: boolean;
    posTheme?: 'dark' | 'light';
}

export function StoreOrdersTab({
    storeOrders,
    fetchStoreOrders,
    handleDeleteStoreSale,
    isLoadingStore,
    posTheme = 'dark'
}: StoreOrdersTabProps) {
    const isLight = posTheme === 'light';

    const [turnoverFilter, setTurnoverFilter] = useState('TODAY');
    const [turnoverCustomStart, setTurnoverCustomStart] = useState('');
    const [turnoverCustomEnd, setTurnoverCustomEnd] = useState('');

    const [dateFilter, setDateFilter] = useState('MONTH');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const ordersPerPage = 10;

    const [expandedStoreOrderId, setExpandedStoreOrderId] = useState<string | null>(null);

    const toggleStoreExpand = (id: string) => {
        setExpandedStoreOrderId(expandedStoreOrderId === id ? null : id);
    };

    const calculateTurnover = (orders: any[]) => {
        return orders.filter(o => {
            const d = new Date(o.orderDate || o.date);
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            if (turnoverFilter === 'TODAY') {
                return d.toDateString() === now.toDateString();
            } else if (turnoverFilter === 'WEEK') {
                const oneWeekAgo = new Date(today);
                oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                return d >= oneWeekAgo;
            } else if (turnoverFilter === 'MONTH') {
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                return d >= startOfMonth;
            } else if (turnoverFilter === 'CUSTOM' && turnoverCustomStart && turnoverCustomEnd) {
                const start = new Date(turnoverCustomStart);
                const end = new Date(turnoverCustomEnd);
                end.setHours(23, 59, 59);
                return d >= start && d <= end;
            }
            return false;
        }).reduce((acc, curr) => acc + (parseFloat(curr.totalAmount) || 0), 0);
    };

    const getTurnoverTitle = () => {
        switch (turnoverFilter) {
            case 'TODAY': return 'BUGÜNKÜ CİRO';
            case 'WEEK': return 'SON 1 HAFTA CİRO';
            case 'MONTH': return 'BU AY CİRO';
            case 'CUSTOM': return 'ÖZEL TARİH CİRO';
            default: return 'CİRO';
        }
    };

    const filteredOrders = storeOrders.filter(o => {
        if (dateFilter === 'ALL') return true;
        const d = new Date(o.orderDate || o.date);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (dateFilter === 'TODAY') return d >= today;
        if (dateFilter === 'WEEK') { const w = new Date(today); w.setDate(w.getDate() - 7); return d >= w; }
        if (dateFilter === 'MONTH') { const m = new Date(today); m.setMonth(m.getMonth() - 1); return d >= m; }
        if (dateFilter === '3MONTHS') { const m = new Date(today); m.setMonth(m.getMonth() - 3); return d >= m; }
        if (dateFilter === 'CUSTOM' && customStartDate && customEndDate) {
            const end = new Date(customEndDate); end.setHours(23, 59, 59);
            return d >= new Date(customStartDate) && d <= end;
        }
        return true;
    });

    const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
    const paginatedOrders = filteredOrders.slice((currentPage - 1) * ordersPerPage, currentPage * ordersPerPage);

    useEffect(() => { setCurrentPage(1); }, [dateFilter, customStartDate, customEndDate]);

    const cardClass = isLight
        ? "bg-white border border-slate-200 shadow-sm"
        : "bg-slate-900 border border-slate-800";

    const textLabelClass = isLight ? "text-slate-500" : "text-slate-400";
    const textValueClass = isLight ? "text-slate-900" : "text-white";

    return (
        <div className="space-y-8 font-sans">
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
                    value={dateFilter} 
                    onChange={e => setDateFilter(e.target.value)}
                    className="h-[44px] px-4 bg-white rounded-[12px] border border-slate-200 text-[13px] outline-none font-medium text-slate-700 min-w-[140px] appearance-none dark:bg-[#1e293b] dark:border-white/10 dark:text-white cursor-pointer"
                    style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center', backgroundSize: '16px' }}
                >
                    <option value="ALL">Tüm Satışlar</option>
                    <option value="TODAY">Bugünki Satışlar</option>
                    <option value="WEEK">Son 1 Hafta</option>
                    <option value="MONTH">Son 1 Ay</option>
                </select>
                <select 
                    value={turnoverFilter} 
                    onChange={e => setTurnoverFilter(e.target.value)}
                    className="h-[44px] px-4 bg-white rounded-[12px] border border-slate-200 text-[13px] outline-none font-medium text-slate-700 min-w-[140px] appearance-none dark:bg-[#1e293b] dark:border-white/10 dark:text-white cursor-pointer"
                    style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center', backgroundSize: '16px' }}
                >
                    <option value="TODAY">Tüm Kasalar</option>
                    <option value="WEEK">Kasa 1 (Ana Kasa)</option>
                    <option value="MONTH">Kasa 2 (Yedek)</option>
                </select>
            </div>

            {isLoadingStore ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#0f172a] rounded-[24px] border border-slate-200 dark:border-white/5 shadow-sm">
                    <div className="text-[12px] font-black uppercase tracking-widest text-slate-400">Yükleniyor...</div>
                </div>
            ) : storeOrders.length === 0 ? (
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
                                        <div className="w-4 h-4 rounded-[4px] border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center cursor-not-allowed">
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
                                    const isExpanded = expandedStoreOrderId === o.id;
                                    return (
                                        <Fragment key={o.id}>
                                            <tr
                                                onClick={() => toggleStoreExpand(o.id)}
                                                className="hover:bg-slate-50 dark:hover:bg-[#1e293b]/80 transition-colors h-[72px] group cursor-pointer"
                                            >
                                                <td className="px-6 py-3 align-middle w-12" onClick={e => e.stopPropagation()}>
                                                    <div className="w-4 h-4 rounded-[4px] border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3 align-middle whitespace-nowrap">
                                                    <div className="text-[13px] font-black text-slate-800 dark:text-white mb-0.5">{o.orderNumber || o.id.substring(0, 8)}</div>
                                                    <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{new Date(o.orderDate || o.date).toLocaleDateString('tr-TR')}</div>
                                                </td>
                                                <td className="px-6 py-3 align-middle whitespace-nowrap">
                                                    <div className="text-[13px] font-black text-slate-800 dark:text-white mb-0.5">{o.customerName || 'Davetsiz Müşteri'}</div>
                                                    <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Bireysel Müşteri</div>
                                                </td>
                                                <td className="px-6 py-3 align-middle whitespace-nowrap">
                                                    <div className="text-[13px] font-bold text-slate-800 dark:text-white mb-0.5 tracking-wide">
                                                        {o.sourceType === 'INVOICE' || o.rawData?.paymentMode === 'account' ? 'Cari / Veresiye' : (o.rawData?.paymentMode === 'cash' ? 'Nakit' : o.rawData?.paymentMode === 'credit_card' ? 'Kredi Kartı' : o.rawData?.paymentMode === 'bank_transfer' ? 'Havale/EFT' : (o.rawData?.paymentMode || 'Nakit').toUpperCase())}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3 align-middle whitespace-nowrap">
                                                    <span className={`px-2 py-1 text-[10px] font-bold tracking-widest uppercase border rounded-[8px] inline-block ${isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                                                        {o.status || 'Tamamlandı'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3 align-middle whitespace-nowrap">
                                                    <div className="text-[13px] font-black text-slate-800 dark:text-white mb-0.5">{parseFloat(o.totalAmount).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {o.currency || 'TL'}</div>
                                                </td>
                                                <td className="px-6 py-3 align-middle whitespace-nowrap">
                                                    <div className="flex gap-2 items-center">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleDeleteStoreSale(o.id) }}
                                                            className="px-4 h-[32px] rounded-[12px] text-[11px] font-bold tracking-widest uppercase transition-colors shadow-sm bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/50"
                                                        >
                                                            İptal Et
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
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
                                                                        <th className={`pb-2 text-[11px] uppercase tracking-wide font-semibold text-right ${textLabelClass}`}>Birim Fiyat</th>
                                                                        <th className={`pb-2 text-[11px] uppercase tracking-wide font-semibold text-right ${textLabelClass}`}>Tutar</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className={`divide-y ${isLight ? 'divide-slate-100' : 'divide-slate-800'}`}>
                                                                    {o.items && Array.isArray(o.items) && o.items.length > 0 ? o.items?.map((item: any, i: number) => {
                                                                        const pName = item.name || item.productName || 'Ürün';
                                                                        const pQty = item.qty || item.quantity || 1;
                                                                        const pPrice = Number(item.price || item.unitPrice || 0);
                                                                        return (
                                                                            <tr key={i}>
                                                                                <td className={`py-2 ${textValueClass}`}>{pName}</td>
                                                                                <td className={`py-2 text-center ${textValueClass}`}>{pQty}</td>
                                                                                <td className={`py-2 text-right ${textValueClass}`}>{pPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺</td>
                                                                                <td className={`py-2 text-right font-bold ${textValueClass}`}>{(pPrice * pQty).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺</td>
                                                                            </tr>
                                                                        );
                                                                    }) : (
                                                                        <tr><td colSpan={4} className={`text-center py-4 ${textLabelClass}`}>Satış detayları yüklenemedi.</td></tr>
                                                                    )}
                                                                </tbody>
                                                            </table>
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
