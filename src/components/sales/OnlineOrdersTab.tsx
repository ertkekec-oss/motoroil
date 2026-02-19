
"use client";

import { useState, Fragment, useEffect } from 'react';
import Pagination from '@/components/Pagination';
import { MarketplaceActionButton } from '@/components/marketplaces/MarketplaceActionButton';

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
    showError
}: OnlineOrdersTabProps) {
    const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, NEW, SHIPPED, COMPLETED
    const [marketplaceFilter, setMarketplaceFilter] = useState('ALL'); // ALL, Trendyol, Hepsiburada, N11
    const [dateFilter, setDateFilter] = useState('ALL'); // ALL, TODAY, WEEK, MONTH, 3MONTHS, CUSTOM
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    const [turnoverFilter, setTurnoverFilter] = useState('TODAY');
    const [turnoverCustomStart, setTurnoverCustomStart] = useState('');
    const [turnoverCustomEnd, setTurnoverCustomEnd] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const ordersPerPage = 10;

    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

    const toggleExpand = (id: string) => {
        setExpandedOrderId(expandedOrderId === id ? null : id);
    };

    const toggleOrderSelection = (orderId: string) => {
        setSelectedOrders(prev =>
            prev.includes(orderId)
                ? prev.filter(id => id !== orderId)
                : [...prev, orderId]
        );
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
        }).filter(o => !['Cancelled', 'CANCELLED', 'İptal Edildi', 'İptal'].includes(o.status))
            .reduce((acc, curr) => acc + (parseFloat(curr.totalAmount) || 0), 0);
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

    const filteredOnlineOrders = onlineOrders.filter(order => {
        // Statü Filtresi
        let statusMatch = true;
        if (statusFilter !== 'ALL') {
            if (statusFilter === 'NEW') statusMatch = ['Yeni', 'Created', 'Picking', 'WaitingForApproval', 'Preparing', 'ReadyToShip', 'Unpaid'].includes(order.status);
            else if (statusFilter === 'SHIPPED') statusMatch = ['Kargolandı', 'Shipped', 'Hazırlanıyor', 'Invoiced'].includes(order.status);
            else if (statusFilter === 'COMPLETED') statusMatch = ['Tamamlandı', 'Delivered', 'Faturalandırıldı', 'Returned'].includes(order.status);
            else if (statusFilter === 'CANCELLED') statusMatch = ['Cancelled', 'CANCELLED', 'İptal Edildi', 'İptal'].includes(order.status);
        }

        // Tarih Filtresi
        let dateMatch = true;
        if (dateFilter !== 'ALL') {
            const orderDate = new Date(order.orderDate || order.date);
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            if (dateFilter === 'TODAY') {
                dateMatch = orderDate >= today;
            } else if (dateFilter === 'WEEK') {
                const oneWeekAgo = new Date(today);
                oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                dateMatch = orderDate >= oneWeekAgo;
            } else if (dateFilter === 'MONTH') {
                const oneMonthAgo = new Date(today);
                oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
                dateMatch = orderDate >= oneMonthAgo;
            } else if (dateFilter === '3MONTHS') {
                const threeMonthsAgo = new Date(today);
                threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
                dateMatch = orderDate >= threeMonthsAgo;
            } else if (dateFilter === 'CUSTOM' && customStartDate && customEndDate) {
                const start = new Date(customStartDate);
                const end = new Date(customEndDate);
                end.setHours(23, 59, 59);
                dateMatch = orderDate >= start && orderDate <= end;
            }
        }

        // Pazaryeri Filtresi
        let marketplaceMatch = true;
        if (marketplaceFilter !== 'ALL') {
            marketplaceMatch = order.marketplace === marketplaceFilter;
        }

        return marketplaceMatch && statusMatch && dateMatch;
    });

    const totalPages = Math.ceil(filteredOnlineOrders.length / ordersPerPage);
    const paginatedOrders = filteredOnlineOrders.slice((currentPage - 1) * ordersPerPage, currentPage * ordersPerPage);

    const toggleSelectAll = () => {
        if (selectedOrders.length === paginatedOrders.length && paginatedOrders.length > 0) {
            setSelectedOrders([]);
        } else {
            setSelectedOrders(paginatedOrders.map(o => o.id));
        }
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter, marketplaceFilter, dateFilter, customStartDate, customEndDate]);

    return (
        <div>
            {/* Stats Summary */}
            <div className="grid-cols-4" style={{ marginBottom: '32px', gap: '20px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="card glass">
                    <div className="text-muted" style={{ fontSize: '12px' }}>BEKLEYEN SİPARİŞ</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--primary)', marginTop: '8px' }}>
                        {onlineOrders.filter(o => ['Yeni', 'Hazırlanıyor', 'WaitingForApproval', 'Picking'].includes(o.status)).length} Adet
                    </div>
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>Hazırlanması gereken</div>
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
                        ₺ {calculateTurnover(onlineOrders).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>Seçili dönem cirosu</div>
                </div>
                <div className="card glass">
                    <div className="text-muted" style={{ fontSize: '12px' }}>STOK HATA ORANI</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '8px' }}>%0.1</div>
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>Senkronizasyon stabil</div>
                </div>
            </div>

            <div className="flex-between mb-4" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                <div className="flex-center gap-4">
                    <h3 className="text-gradient">E-Ticaret Siparişleri</h3>
                    <span style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '4px', background: 'var(--primary)', color: 'white' }}>LIVE v1.4</span>
                    {selectedOrders.length > 0 && (
                        <button
                            onClick={handleCollectBulk}
                            className="btn btn-success"
                            style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                            disabled={isCollecting}
                        >
                            <span>💰 Seçilenleri Tahsil Et ({selectedOrders.length})</span>
                        </button>
                    )}
                </div>

                <div className="flex-col gap-2" style={{ alignItems: 'flex-end' }}>
                    {/* Marketplace Filters */}
                    <div className="flex-center gap-2" style={{ background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '8px' }}>
                        <button onClick={() => setMarketplaceFilter('ALL')} style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', background: marketplaceFilter === 'ALL' ? 'var(--bg-hover)' : 'transparent', borderBottom: marketplaceFilter === 'ALL' ? '2px solid var(--primary)' : 'none', color: 'white', fontSize: '11px', cursor: 'pointer' }}>Hepsi</button>
                        <button onClick={() => setMarketplaceFilter('Trendyol')} style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', background: marketplaceFilter === 'Trendyol' ? 'rgba(242, 122, 26, 0.1)' : 'transparent', borderBottom: marketplaceFilter === 'Trendyol' ? '2px solid #F27A1A' : 'none', color: '#F27A1A', fontSize: '11px', cursor: 'pointer' }}>Trendyol</button>
                        <button onClick={() => setMarketplaceFilter('Hepsiburada')} style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', background: marketplaceFilter === 'Hepsiburada' ? 'rgba(255, 96, 0, 0.1)' : 'transparent', borderBottom: marketplaceFilter === 'Hepsiburada' ? '2px solid #FF6000' : 'none', color: '#FF6000', fontSize: '11px', cursor: 'pointer' }}>Hepsiburada</button>
                        <button onClick={() => setMarketplaceFilter('N11')} style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', background: marketplaceFilter === 'N11' ? 'rgba(94, 23, 235, 0.1)' : 'transparent', borderBottom: marketplaceFilter === 'N11' ? '2px solid #5E17EB' : 'none', color: '#5E17EB', fontSize: '11px', cursor: 'pointer' }}>N11</button>
                    </div>

                    {/* Status Filters */}
                    <div className="flex-center gap-2" style={{ background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '8px' }}>
                        <button onClick={() => setStatusFilter('ALL')} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: statusFilter === 'ALL' ? 'var(--primary)' : 'transparent', color: 'white', fontSize: '12px', cursor: 'pointer' }}>Tümü</button>
                        <button onClick={() => setStatusFilter('NEW')} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: statusFilter === 'NEW' ? 'var(--primary)' : 'transparent', color: 'white', fontSize: '12px', cursor: 'pointer' }}>Yeni</button>
                        <button onClick={() => setStatusFilter('SHIPPED')} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: statusFilter === 'SHIPPED' ? '#F59E0B' : 'transparent', color: 'white', fontSize: '12px', cursor: 'pointer' }}>Kargolandı</button>
                        <button onClick={() => setStatusFilter('COMPLETED')} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: statusFilter === 'COMPLETED' ? 'var(--success)' : 'transparent', color: 'white', fontSize: '12px', cursor: 'pointer' }}>Tamamlandı</button>
                        <button onClick={() => setStatusFilter('CANCELLED')} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: statusFilter === 'CANCELLED' ? '#EF4444' : 'transparent', color: 'white', fontSize: '12px', cursor: 'pointer' }}>İptal</button>
                    </div>

                    {/* Date Filters */}
                    <div className="flex-center gap-2" style={{ background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '8px' }}>
                        <button onClick={() => setDateFilter('ALL')} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: dateFilter === 'ALL' ? 'var(--secondary)' : 'transparent', color: dateFilter === 'ALL' ? 'black' : 'white', fontSize: '12px', cursor: 'pointer' }}>Tüm Zamanlar</button>
                        <button onClick={() => setDateFilter('TODAY')} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: dateFilter === 'TODAY' ? 'var(--secondary)' : 'transparent', color: dateFilter === 'TODAY' ? 'black' : 'white', fontSize: '12px', cursor: 'pointer' }}>Bugün</button>
                        <button onClick={() => setDateFilter('WEEK')} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: dateFilter === 'WEEK' ? 'var(--secondary)' : 'transparent', color: dateFilter === 'WEEK' ? 'black' : 'white', fontSize: '12px', cursor: 'pointer' }}>1 Hafta</button>
                        <button onClick={() => setDateFilter('MONTH')} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: dateFilter === 'MONTH' ? 'var(--secondary)' : 'transparent', color: dateFilter === 'MONTH' ? 'black' : 'white', fontSize: '12px', cursor: 'pointer' }}>1 Ay</button>
                        <button onClick={() => setDateFilter('3MONTHS')} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: dateFilter === '3MONTHS' ? 'var(--secondary)' : 'transparent', color: dateFilter === '3MONTHS' ? 'black' : 'white', fontSize: '12px', cursor: 'pointer' }}>3 Ay</button>
                        <button onClick={() => setDateFilter('CUSTOM')} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: dateFilter === 'CUSTOM' ? 'var(--secondary)' : 'transparent', color: dateFilter === 'CUSTOM' ? 'black' : 'white', fontSize: '12px', cursor: 'pointer' }}>Özel</button>
                    </div>

                    {dateFilter === 'CUSTOM' && (
                        <div className="flex-center gap-2" style={{ marginTop: '4px' }}>
                            <input type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} style={{ padding: '4px', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-deep)', color: 'white', fontSize: '12px' }} />
                            <span className="text-muted">-</span>
                            <input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} style={{ padding: '4px', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-deep)', color: 'white', fontSize: '12px' }} />
                        </div>
                    )}
                </div>
            </div>

            {filteredOnlineOrders.length === 0 ? (
                <div className="text-muted text-center py-8">
                    Bu filtreye uygun sipariş bulunamadı.
                </div>
            ) : (
                <table style={{ width: '100%', marginTop: '16px', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead className="text-muted" style={{ fontSize: '12px' }}>
                        <tr>
                            <th style={{ padding: '12px', width: '40px' }}>
                                <input
                                    type="checkbox"
                                    checked={paginatedOrders.length > 0 && selectedOrders.length === paginatedOrders.length}
                                    onChange={toggleSelectAll}
                                    style={{ cursor: 'pointer' }}
                                />
                            </th>
                            <th style={{ padding: '12px' }}>Sipariş No</th>
                            <th>Platform</th>
                            <th>Müşteri</th>
                            <th>Tutar</th>
                            <th>Durum</th>
                            <th>İşlem</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedOrders.map(o => {
                            const isExpanded = expandedOrderId === o.id;
                            return (
                                <Fragment key={o.id}>
                                    <tr style={{ borderTop: isExpanded ? 'none' : '1px solid var(--border-light)', cursor: 'pointer', background: isExpanded ? 'var(--bg-hover)' : 'transparent' }} onClick={() => toggleExpand(o.id)}>
                                        <td style={{ padding: '16px' }} onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                checked={selectedOrders.includes(o.id)}
                                                onChange={() => toggleOrderSelection(o.id)}
                                                style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                                            />
                                        </td>
                                        <td style={{ padding: '16px', fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--text-main)' }}>{o.orderNumber || o.id}</td>
                                        <td>
                                            <span style={{
                                                fontSize: '11px', padding: '2px 6px', borderRadius: '4px',
                                                border: '1px solid var(--border-light)',
                                                color: o.marketplace === 'Trendyol' ? '#F27A1A' :
                                                    o.marketplace === 'N11' ? '#5E17EB' :
                                                        o.marketplace === 'Hepsiburada' ? '#FF6000' :
                                                            'var(--secondary)'
                                            }}>
                                                {o.marketplace}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ color: 'var(--text-main)' }}>{o.customerName}</div>
                                            <div className="text-muted" style={{ fontSize: '11px' }}>{new Date(o.orderDate || o.date).toLocaleDateString('tr-TR')}</div>
                                        </td>
                                        <td style={{ fontWeight: 'bold' }}>{parseFloat(o.totalAmount).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {o.currency}</td>
                                        <td>
                                            <span style={{
                                                padding: '4px 8px', borderRadius: '4px', fontSize: '12px',
                                                background: ['Yeni', 'Created'].includes(o.status) ? 'var(--primary)' : ['Hazırlanıyor', 'Picking', 'Shipped', 'Kargolandı'].includes(o.status) ? '#F59E0B' : ['Faturalandırıldı', 'Tamamlandı'].includes(o.status) ? 'var(--success)' : ['Cancelled', 'CANCELLED'].includes(o.status) ? '#EF4444' : 'var(--bg-hover)',
                                                color: 'white'
                                            }}>
                                                {o.status}
                                            </span>
                                        </td>
                                        <td>
                                            {['Faturalandırıldı', 'Delivered', 'Cancelled'].includes(o.status) ? (
                                                <span style={{ color: 'var(--success)', fontSize: '12px' }}>✅ Tamamlandı</span>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setSelectedOrder(o); }}
                                                        className="btn btn-primary"
                                                        style={{ fontSize: '11px', padding: '6px 12px' }}
                                                        title="Faturalandır"
                                                    >
                                                        📄 Faturalandır
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                className="btn btn-ghost"
                                                style={{ fontSize: '12px', padding: '4px 8px' }}
                                            >
                                                {isExpanded ? '▲' : '▼'}
                                            </button>
                                        </td>
                                    </tr>
                                    {isExpanded && (
                                        <tr style={{ borderBottom: '1px solid var(--border-light)', background: 'var(--bg-hover)' }}>
                                            <td colSpan={7} style={{ padding: '0 20px 20px 20px' }}>
                                                <div style={{ padding: '20px', background: 'var(--bg-deep)', borderRadius: '8px', border: '1px solid var(--border-light)', maxHeight: '600px', overflowY: 'auto' }}>
                                                    <div className="flex-between mb-4" style={{ alignItems: 'center' }}>
                                                        <h4 style={{ color: 'var(--text-main)', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px', margin: 0 }}>📦 Sipariş Detayı</h4>
                                                    </div>
                                                    <table style={{ width: '100%', fontSize: '13px', textAlign: 'left' }}>
                                                        <thead style={{ color: 'var(--text-muted)' }}>
                                                            <tr>
                                                                <th style={{ paddingBottom: '8px' }}>Ürün Adı</th>
                                                                <th>Adet</th>
                                                                <th>Birim Fiyat</th>
                                                                <th style={{ textAlign: 'right' }}>Tutar (KDV Dahil)</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {o.items && o.items.map((item: any, idx: number) => (
                                                                <tr key={idx} style={{ borderTop: '1px solid var(--border-light)' }}>
                                                                    <td style={{ padding: '8px 0', color: 'var(--text-main)' }}>{item.name || item.productName}</td>
                                                                    <td style={{ color: 'var(--text-main)' }}>{item.qty || item.quantity}</td>
                                                                    <td style={{ color: 'var(--text-main)' }}>
                                                                        {item.unitPrice ? item.unitPrice.toFixed(2) :
                                                                            item.price ? item.price.toFixed(2) : '0.00'} ₺
                                                                    </td>
                                                                    <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--text-main)' }}>
                                                                        {item.total ? item.total.toFixed(2) :
                                                                            (item.price && item.quantity) ? (item.price * item.quantity).toFixed(2) : '0.00'} ₺
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                    {(!o.items || o.items.length === 0) && (
                                                        <div className="text-muted text-center" style={{ fontSize: '11px', padding: '10px' }}>Ürün detayı bulunamadı.</div>
                                                    )}

                                                    {/* PLATFORM ACTIONS */}
                                                    <div style={{
                                                        marginTop: '24px',
                                                        paddingTop: '16px',
                                                        borderTop: '2px solid #3b82f6',
                                                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                                        padding: '16px',
                                                        borderRadius: '8px'
                                                    }}>
                                                        <h5 style={{
                                                            color: '#3b82f6',
                                                            fontSize: '14px',
                                                            fontWeight: 'bold',
                                                            marginBottom: '12px',
                                                            textTransform: 'uppercase'
                                                        }}>
                                                            🚀 Platform Aksiyonları - {o.marketplace || 'BELİRSİZ'}
                                                        </h5>
                                                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                                            <MarketplaceActionButton
                                                                orderId={o.id}
                                                                marketplace={o.marketplace}
                                                                actionKey="REFRESH_STATUS"
                                                                onSuccess={fetchOnlineOrders}
                                                            />
                                                            {o.marketplace?.toLowerCase() === 'trendyol' && (
                                                                <>
                                                                    <MarketplaceActionButton
                                                                        orderId={o.id}
                                                                        marketplace={o.marketplace}
                                                                        actionKey="PRINT_LABEL_A4"
                                                                        shipmentPackageId={o.shipmentPackageId}
                                                                    />
                                                                    <MarketplaceActionButton
                                                                        orderId={o.id}
                                                                        marketplace={o.marketplace}
                                                                        actionKey="CHANGE_CARGO"
                                                                        variant="ghost"
                                                                        shipmentPackageId={o.shipmentPackageId}
                                                                        onSuccess={fetchOnlineOrders}
                                                                    />
                                                                </>
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
            )}

            {/* Pagination */}
            <div className="mt-4 pt-4 border-t border-white/10">
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
        </div>
    );
}
