
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
            <div className="flex-between mb-4">
                <h3>Mağaza Satış Geçmişi (POS)</h3>
                <button onClick={fetchStoreOrders} className="btn btn-outline" style={{ fontSize: '12px' }}>🔄 Yenile</button>
            </div>

            {/* Store Stats Summary */}
            <div className="grid-cols-4" style={{ marginBottom: '32px', gap: '20px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="card glass">
                    <div className="text-muted" style={{ fontSize: '12px' }}>TOPLAM İŞLEM</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--primary)', marginTop: '8px' }}>
                        {storeOrders.length} Adet
                    </div>
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>Tüm zamanlar</div>
                </div>
                <div className="card glass" style={{ position: 'relative' }}>
                    <div className="flex-between">
                        <div className="text-muted" style={{ fontSize: '12px' }}>{getTurnoverTitle()}</div>
                        <select
                            value={turnoverFilter}
                            onChange={(e) => setTurnoverFilter(e.target.value)}
                            style={{ fontSize: '10px', padding: '2px', background: 'var(--bg-deep)', color: 'white', border: 'none', borderRadius: '4px' }}
                        >
                            <option value="TODAY">Bugün</option>
                            <option value="WEEK">1 Hafta</option>
                            <option value="MONTH">Bu Ay</option>
                            <option value="CUSTOM">Özel</option>
                        </select>
                    </div>
                    {turnoverFilter === 'CUSTOM' && (
                        <div className="flex-center gap-1 mt-1" style={{ fontSize: '10px' }}>
                            <input type="date" value={turnoverCustomStart} onChange={e => setTurnoverCustomStart(e.target.value)} style={{ padding: '2px', width: '80px', background: 'var(--bg-deep)', color: 'white', border: 'none' }} />
                            <span>-</span>
                            <input type="date" value={turnoverCustomEnd} onChange={e => setTurnoverCustomEnd(e.target.value)} style={{ padding: '2px', width: '80px', background: 'var(--bg-deep)', color: 'white', border: 'none' }} />
                        </div>
                    )}

                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--success)', marginTop: '8px' }}>
                        ₺ {calculateTurnover(storeOrders).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>Mağaza cirosu</div>
                </div>
                <div className="card glass">
                    <div className="text-muted" style={{ fontSize: '12px' }}>ORTALAMA SEPET</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '8px' }}>
                        ₺ {storeOrders.length > 0 ? (storeOrders.reduce((acc, curr) => acc + (parseFloat(curr.totalAmount) || 0), 0) / storeOrders.length).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0,00'}
                    </div>
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>İşlem başına</div>
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
                                                            {o.items && Array.isArray(o.items) && o.items.length > 0 ? o.items.map((item: any, i: number) => {
                                                                const pName = item.name || item.productName || 'Ürün';
                                                                const pQty = item.qty || item.quantity || 1;
                                                                const pPrice = Number(item.price || item.unitPrice || 0);
                                                                return (
                                                                    <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                                                        <td style={{ padding: '8px 0' }}>{pName}</td>
                                                                        <td align="center">{pQty}</td>
                                                                        <td align="right">{pPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺</td>
                                                                        <td align="right">{(pPrice * pQty).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺</td>
                                                                    </tr>
                                                                );
                                                            }) : (
                                                                <tr><td colSpan={4} className="text-muted text-center py-4">Satış detayları yüklenemedi.</td></tr>
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
