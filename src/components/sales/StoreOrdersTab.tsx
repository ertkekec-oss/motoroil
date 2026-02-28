"use client";

import { useState, Fragment, useEffect } from 'react';
import Pagination from '@/components/Pagination';

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

    const totalPages = Math.ceil(storeOrders.length / ordersPerPage);
    const paginatedOrders = storeOrders.slice((currentPage - 1) * ordersPerPage, currentPage * ordersPerPage);

    const cardClass = isLight
        ? "bg-white border border-slate-200 shadow-sm"
        : "bg-slate-900 border border-slate-800";

    const textLabelClass = isLight ? "text-slate-500" : "text-slate-400";
    const textValueClass = isLight ? "text-slate-900" : "text-white";

    return (
        <div className="space-y-8 font-sans">
            <div className="flex justify-between items-center">
                <h3 className={`text-[18px] font-semibold ${textValueClass}`}>Mağaza Satış Geçmişi (POS)</h3>
                <button
                    onClick={fetchStoreOrders}
                    className={`h-[40px] px-4 items-center justify-center flex gap-2 rounded-[12px] font-medium text-[13px] border transition-colors ${isLight ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                        }`}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    Yenile
                </button>
            </div>

            {/* Store Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={`p-5 rounded-[14px] ${cardClass}`}>
                    <div className={`text-[11px] font-semibold uppercase tracking-wide ${textLabelClass}`}>TOPLAM İŞLEM</div>
                    <div className={`text-[28px] font-semibold mt-2 tracking-tight ${isLight ? 'text-blue-600' : 'text-blue-500'}`}>
                        {storeOrders.length} <span className={`text-[14px] font-medium ml-1 ${textLabelClass}`}>Adet</span>
                    </div>
                    <div className={`text-[12px] mt-1 ${textLabelClass}`}>Tüm zamanlar</div>
                </div>
                <div className={`p-5 rounded-[14px] ${cardClass}`}>
                    <div className="flex justify-between items-center">
                        <div className={`text-[11px] font-semibold uppercase tracking-wide ${textLabelClass}`}>{getTurnoverTitle()}</div>
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

                    <div className={`text-[28px] font-semibold mt-2 tracking-tight ${isLight ? 'text-emerald-600' : 'text-emerald-500'}`}>
                        ₺ {calculateTurnover(storeOrders).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className={`text-[12px] mt-1 ${textLabelClass}`}>Mağaza cirosu</div>
                </div>
                <div className={`p-5 rounded-[14px] ${cardClass}`}>
                    <div className={`text-[11px] font-semibold uppercase tracking-wide ${textLabelClass}`}>ORTALAMA SEPET</div>
                    <div className={`text-[28px] font-semibold mt-2 tracking-tight ${textValueClass}`}>
                        ₺ {storeOrders.length > 0 ? (storeOrders.reduce((acc, curr) => acc + (parseFloat(curr.totalAmount) || 0), 0) / storeOrders.length).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0,00'}
                    </div>
                    <div className={`text-[12px] mt-1 ${textLabelClass}`}>İşlem başına</div>
                </div>
            </div>

            {isLoadingStore ? (
                <div className={`text-[14px] py-8 font-medium ${textLabelClass}`}>Yükleniyor...</div>
            ) : storeOrders.length === 0 ? (
                <div className={`text-[14px] py-8 text-center font-medium ${textLabelClass}`}>Henüz kayıtlı mağaza satışı bulunmuyor.</div>
            ) : (
                <div className={`rounded-[16px] border p-6 overflow-hidden ${cardClass}`}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead className="sticky top-0 bg-transparent">
                                <tr className={`border-b ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                                    <th className={`h-[48px] px-4 text-left text-[11px] uppercase tracking-wide font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Sipariş No</th>
                                    <th className={`h-[48px] px-4 text-left text-[11px] uppercase tracking-wide font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Tarih</th>
                                    <th className={`h-[48px] px-4 text-left text-[11px] uppercase tracking-wide font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Müşteri</th>
                                    <th className={`h-[48px] px-4 text-left text-[11px] uppercase tracking-wide font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Tutar</th>
                                    <th className={`h-[48px] px-4 text-left text-[11px] uppercase tracking-wide font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Ödeme</th>
                                    <th className={`h-[48px] px-4 text-left text-[11px] uppercase tracking-wide font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Durum</th>
                                    <th className={`h-[48px] px-4 text-center text-[11px] uppercase tracking-wide font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>İşlem</th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${isLight ? 'divide-slate-100' : 'divide-slate-800/50'}`}>
                                {paginatedOrders.map(o => {
                                    const isExpanded = expandedStoreOrderId === o.id;
                                    return (
                                        <Fragment key={o.id}>
                                            <tr
                                                onClick={() => toggleStoreExpand(o.id)}
                                                className={`h-[52px] cursor-pointer transition-colors ${isExpanded
                                                        ? (isLight ? 'bg-blue-50/30' : 'bg-blue-900/10')
                                                        : (isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/50')
                                                    }`}
                                            >
                                                <td className={`px-4 align-middle font-medium text-[13px] ${textValueClass}`}>{o.orderNumber || o.id.substring(0, 8)}</td>
                                                <td className={`px-4 align-middle text-[12px] ${textLabelClass}`}>{new Date(o.orderDate || o.date).toLocaleString('tr-TR')}</td>
                                                <td className={`px-4 align-middle text-[13px] font-medium ${textValueClass}`}>{o.customerName || 'Davetsiz Müşteri'}</td>
                                                <td className={`px-4 align-middle text-[13px] font-semibold ${textValueClass}`}>
                                                    {parseFloat(o.totalAmount).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className={`text-[11px] font-normal ${textLabelClass}`}>{o.currency || 'TL'}</span>
                                                </td>
                                                <td className="px-4 align-middle">
                                                    <span className={`px-2 py-1 text-[11px] font-medium border rounded-[6px] inline-block ${isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-300'}`}>
                                                        {o.sourceType === 'INVOICE' || o.rawData?.paymentMode === 'account' ? 'Cari / Veresiye' : (o.rawData?.paymentMode === 'cash' ? 'Nakit' : o.rawData?.paymentMode === 'credit_card' ? 'Kredi Kartı' : o.rawData?.paymentMode === 'bank_transfer' ? 'Havale/EFT' : (o.rawData?.paymentMode || 'Nakit').toUpperCase())}
                                                    </span>
                                                </td>
                                                <td className="px-4 align-middle">
                                                    <span className={`px-2 py-1 text-[11px] font-medium border rounded-[6px] inline-block ${isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                                                        {o.status || 'Tamamlandı'}
                                                    </span>
                                                </td>
                                                <td className="px-4 align-middle text-center">
                                                    <div className="flex gap-2 items-center justify-center" onClick={e => e.stopPropagation()}>
                                                        <div className={`p-1.5 cursor-pointer rounded-[6px] ${isLight ? 'text-slate-400 hover:bg-slate-100' : 'text-slate-500 hover:bg-slate-800'}`} onClick={() => toggleStoreExpand(o.id)}>
                                                            {isExpanded ? '▲' : '▼'}
                                                        </div>
                                                        <button
                                                            onClick={() => handleDeleteStoreSale(o.id)}
                                                            className={`px-3 py-1.5 rounded-[8px] text-[12px] font-medium transition-colors border ${isLight ? 'border-red-200 text-red-600 bg-red-50 hover:bg-red-100' : 'border-red-500/30 text-red-400 bg-red-500/10 hover:bg-red-500/20'
                                                                }`}
                                                        >
                                                            Sil
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
                                                                    {o.items && Array.isArray(o.items) && o.items.length > 0 ? o.items.map((item: any, i: number) => {
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
