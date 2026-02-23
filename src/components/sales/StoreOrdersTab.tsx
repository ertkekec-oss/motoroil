
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

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h3 className={posTheme === 'light' ? "text-2xl font-black text-slate-800" : "text-2xl font-bold text-white"}>Mağaza Satış Geçmişi (POS)</h3>
                <button onClick={fetchStoreOrders} className="flex items-center gap-2 px-4 py-2 border border-pos glass rounded-lg text-pos hover:bg-white/10 transition-all text-xs">
                    🔄 Yenile
                </button>
            </div>

            {/* Store Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="card glass p-6">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">TOPLAM İŞLEM</div>
                    <div className="text-3xl font-black text-indigo-500">
                        {storeOrders.length} Adet
                    </div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase mt-1">Tüm zamanlar</div>
                </div>
                <div className="card glass p-6 relative">
                    <div className="flex justify-between items-center mb-1">
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{getTurnoverTitle()}</div>
                        <select
                            value={turnoverFilter}
                            onChange={(e) => setTurnoverFilter(e.target.value)}
                            className="bg-white/5 border border-white/10 text-pos text-[10px] rounded px-1 outline-none"
                        >
                            <option value="TODAY">Bugün</option>
                            <option value="WEEK">1 Hafta</option>
                            <option value="MONTH">Bu Ay</option>
                            <option value="CUSTOM">Özel</option>
                        </select>
                    </div>
                    {turnoverFilter === 'CUSTOM' && (
                        <div className="flex items-center gap-1 mt-1 text-[10px]">
                            <input type="date" value={turnoverCustomStart} onChange={e => setTurnoverCustomStart(e.target.value)} className="px-1 w-24 rounded bg-white/5 border border-white/10 text-pos outline-none" />
                            <span className="text-gray-400">-</span>
                            <input type="date" value={turnoverCustomEnd} onChange={e => setTurnoverCustomEnd(e.target.value)} className="px-1 w-24 rounded bg-white/5 border border-white/10 text-pos outline-none" />
                        </div>
                    )}
                    <div className="text-3xl font-black text-emerald-500 mt-2">
                        ₺ {calculateTurnover(storeOrders).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase mt-1">Mağaza cirosu</div>
                </div>
                <div className="card glass p-6">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">ORTALAMA SEPET</div>
                    <div className={posTheme === 'light' ? "text-3xl font-black text-slate-800" : "text-3xl font-bold text-white"}>
                        ₺ {storeOrders.length > 0 ? (storeOrders.reduce((acc, curr) => acc + (parseFloat(curr.totalAmount) || 0), 0) / storeOrders.length).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0,00'}
                    </div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase mt-1">İşlem başına</div>
                </div>
            </div>

            {isLoadingStore ? (
                <p className="text-muted mt-4">Yükleniyor...</p>
            ) : storeOrders.length === 0 ? (
                <p className="text-muted mt-4">Henüz kayıtlı mağaza satışı bulunmuyor.</p>
            ) : (
                <table style={{ width: '100%', marginTop: '16px', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead className="text-muted" style={{ fontSize: '12px' }}>
                        <tr>
                            <th style={{ padding: '12px' }}>Sipariş No</th>
                            <th>Tarih</th>
                            <th>Müşteri</th>
                            <th>Tutar</th>
                            <th>Ödeme</th>
                            <th>Durum</th>
                            <th style={{ textAlign: 'center' }}>İşlem</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedOrders.map(o => {
                            const isExpanded = expandedStoreOrderId === o.id;
                            return (
                                <Fragment key={o.id}>
                                    <tr
                                        style={{ borderTop: isExpanded ? 'none' : '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', background: isExpanded ? 'rgba(255,255,255,0.02)' : 'transparent' }}
                                        onClick={() => toggleStoreExpand(o.id)}
                                    >
                                        <td style={{ padding: '16px' }}>{o.orderNumber || o.id.substring(0, 8)}</td>
                                        <td>{new Date(o.orderDate || o.date).toLocaleString('tr-TR')}</td>
                                        <td>{o.customerName || 'Davetsiz Müşteri'}</td>
                                        <td style={{ fontWeight: 'bold' }}>{parseFloat(o.totalAmount).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {o.currency || 'TL'}</td>
                                        <td>
                                            <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                                                {o.sourceType === 'INVOICE' || o.rawData?.paymentMode === 'account' ? 'Cari / Veresiye' : (o.rawData?.paymentMode === 'cash' ? 'Nakit' : o.rawData?.paymentMode === 'credit_card' ? 'Kredi Kartı' : o.rawData?.paymentMode === 'bank_transfer' ? 'Havale/EFT' : (o.rawData?.paymentMode || 'Nakit').toUpperCase())}
                                            </span>
                                        </td>
                                        <td>
                                            <span style={{
                                                padding: '4px 8px', borderRadius: '4px', fontSize: '12px',
                                                background: 'var(--success)', color: 'white'
                                            }}>
                                                {o.status || 'Tamamlandı'}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <div className="flex-center gap-2" onClick={e => e.stopPropagation()}>
                                                <button onClick={() => toggleStoreExpand(o.id)} className="btn btn-ghost" style={{ fontSize: '12px', padding: '4px 8px' }}>
                                                    {isExpanded ? '▲' : 'v'}
                                                </button>
                                                <button onClick={() => handleDeleteStoreSale(o.id)} className="btn btn-outline" style={{ fontSize: '11px', padding: '6px 10px', color: '#ff4444', borderColor: '#ff4444' }}>Sil</button>
                                            </div>
                                        </td>
                                    </tr>
                                    {isExpanded && (
                                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
                                            <td colSpan={7} style={{ padding: '0 20px 20px 20px' }}>
                                                <div style={{ padding: '16px', background: 'var(--bg-deep)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                                                    <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>🛍️ Satış Detayları</h4>
                                                    <table style={{ width: '100%', fontSize: '13px' }}>
                                                        <thead className="text-muted">
                                                            <tr>
                                                                <th align="left">Ürün</th>
                                                                <th align="center">Adet</th>
                                                                <th align="right">Birim Fiyat</th>
                                                                <th align="right">Toplam</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {o.items && Array.isArray(o.items) ? o.items.map((item: any, i: number) => (
                                                                <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                                                    <td style={{ padding: '8px 0' }}>{item.name || item.productName || 'Ürün'}</td>
                                                                    <td align="center">{item.qty || item.quantity || 1}</td>
                                                                    <td align="right">{(item.price || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺</td>
                                                                    <td align="right">{((item.price || 0) * (item.qty || item.quantity || 1)).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺</td>
                                                                </tr>
                                                            )) : (
                                                                <tr><td colSpan={4} className="text-muted text-center py-2">Detay bulunamadı (Eski kayıt)</td></tr>
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
            )}
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
    );
}
