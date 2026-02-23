
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
    posTheme?: 'dark' | 'light';
}

const LIGHT = {
    pageBg: '#F7F9FB',
    card: '#FFFFFF',
    border: '#E6EBF0',
    borderStrong: '#D0D7E2',
    textMain: '#1A1F36',
    textMuted: '#8B95A5',
    textSubtle: '#B8C0C8',
    shadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
    shadowHover: '0 4px 12px rgba(36,123,254,0.12), 0 8px 24px rgba(0,0,0,0.06)',
    primary: '#247BFE',
    primaryLight: 'rgba(36,123,254,0.08)',
    primaryMid: 'rgba(36,123,254,0.15)',
    purple: '#6260FE',
    purpleLight: 'rgba(98,96,254,0.08)',
    success: '#02C951',
    successLight: 'rgba(2,201,81,0.1)',
    teal: '#02BC7E',
    tealLight: 'rgba(2,188,126,0.1)',
    amber: '#C9AF7C',
    amberLight: 'rgba(201,175,124,0.12)',
    danger: '#E53E3E',
    dangerLight: 'rgba(229,62,62,0.08)',
    filterBg: '#F0F4F9',
    rowHover: 'rgba(36,123,254,0.04)',
};

function getStatusStyle(status: string, isLight: boolean): React.CSSProperties {
    if (isLight) {
        if (['Yeni', 'Created', 'WaitingForApproval', 'Unpaid'].includes(status))
            return { background: LIGHT.primaryLight, color: LIGHT.primary, border: `1px solid ${LIGHT.primaryMid}` };
        if (['Hazırlanıyor', 'Picking', 'ReadyToShip', 'Preparing'].includes(status))
            return { background: LIGHT.purpleLight, color: LIGHT.purple, border: `1px solid rgba(98,96,254,0.2)` };
        if (['Shipped', 'Kargolandı', 'Invoiced'].includes(status))
            return { background: LIGHT.tealLight, color: LIGHT.teal, border: `1px solid rgba(2,188,126,0.2)` };
        if (['Faturalandırıldı', 'Tamamlandı', 'Delivered'].includes(status))
            return { background: LIGHT.successLight, color: LIGHT.success, border: `1px solid rgba(2,201,81,0.2)` };
        if (['Cancelled', 'CANCELLED', 'İptal Edildi', 'İptal', 'Returned'].includes(status))
            return { background: LIGHT.dangerLight, color: LIGHT.danger, border: `1px solid rgba(229,62,62,0.15)` };
        return { background: LIGHT.filterBg, color: LIGHT.textMuted, border: `1px solid ${LIGHT.border}` };
    }
    // dark
    if (['Yeni', 'Created', 'WaitingForApproval', 'Unpaid'].includes(status)) return { background: 'var(--primary)', color: 'white' };
    if (['Hazırlanıyor', 'Picking', 'ReadyToShip', 'Preparing'].includes(status)) return { background: '#8B5CF6', color: 'white' };
    if (['Shipped', 'Kargolandı', 'Invoiced'].includes(status)) return { background: '#F59E0B', color: 'white' };
    if (['Faturalandırıldı', 'Tamamlandı', 'Delivered'].includes(status)) return { background: 'var(--success)', color: 'white' };
    if (['Cancelled', 'CANCELLED', 'İptal Edildi', 'İptal', 'Returned'].includes(status)) return { background: '#EF4444', color: 'white' };
    return { background: 'var(--bg-hover)', color: 'white' };
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
    const isLight = posTheme === 'light';

    const [statusFilter, setStatusFilter] = useState('ALL');
    const [marketplaceFilter, setMarketplaceFilter] = useState('ALL');
    const [dateFilter, setDateFilter] = useState('ALL');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [turnoverFilter, setTurnoverFilter] = useState('TODAY');
    const [turnoverCustomStart, setTurnoverCustomStart] = useState('');
    const [turnoverCustomEnd, setTurnoverCustomEnd] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

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
            if (statusFilter === 'NEW') statusMatch = ['Yeni', 'Created', 'Picking', 'WaitingForApproval', 'Preparing', 'ReadyToShip', 'Unpaid'].includes(order.status);
            else if (statusFilter === 'SHIPPED') statusMatch = ['Kargolandı', 'Shipped', 'Hazırlanıyor', 'Invoiced'].includes(order.status);
            else if (statusFilter === 'COMPLETED') statusMatch = ['Tamamlandı', 'Delivered', 'Faturalandırıldı', 'Returned'].includes(order.status);
            else if (statusFilter === 'CANCELLED') statusMatch = ['Cancelled', 'CANCELLED', 'İptal Edildi', 'İptal'].includes(order.status);
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
        let marketplaceMatch = marketplaceFilter === 'ALL' ? true : order.marketplace === marketplaceFilter;
        return marketplaceMatch && statusMatch && dateMatch;
    });

    const ordersPerPage = 10;
    const totalPages = Math.ceil(filteredOnlineOrders.length / ordersPerPage);
    const paginatedOrders = filteredOnlineOrders.slice((currentPage - 1) * ordersPerPage, currentPage * ordersPerPage);

    const toggleSelectAll = () => {
        if (selectedOrders.length === paginatedOrders.length && paginatedOrders.length > 0) setSelectedOrders([]);
        else setSelectedOrders(paginatedOrders.map(o => o.id));
    };

    useEffect(() => { setCurrentPage(1); }, [statusFilter, marketplaceFilter, dateFilter, customStartDate, customEndDate]);

    // ---- Light mode pill chip builder ----
    const FilterChip = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
        <button onClick={onClick} style={{
            padding: isLight ? '5px 14px' : '6px 12px',
            borderRadius: isLight ? '20px' : '6px',
            border: isLight ? (active ? `1px solid ${LIGHT.primary}` : `1px solid ${LIGHT.border}`) : 'none',
            background: isLight ? (active ? LIGHT.primaryLight : LIGHT.card) : (active ? 'var(--primary)' : 'transparent'),
            color: isLight ? (active ? LIGHT.primary : LIGHT.textMuted) : 'white',
            fontSize: '12px',
            fontWeight: active ? '600' : '400',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap' as const,
        }}>
            {children}
        </button>
    );

    const DateChip = ({ val, label }: { val: string; label: string }) => (
        <button onClick={() => setDateFilter(val)} style={{
            padding: isLight ? '5px 14px' : '6px 12px',
            borderRadius: isLight ? '20px' : '6px',
            border: isLight ? (dateFilter === val ? `1px solid ${LIGHT.teal}` : `1px solid ${LIGHT.border}`) : 'none',
            background: isLight ? (dateFilter === val ? LIGHT.tealLight : LIGHT.card) : (dateFilter === val ? '#00F0FF' : 'transparent'),
            color: isLight ? (dateFilter === val ? LIGHT.teal : LIGHT.textMuted) : (dateFilter === val ? 'black' : 'white'),
            fontSize: '12px',
            fontWeight: dateFilter === val ? '600' : '400',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
        }}>
            {label}
        </button>
    );

    // Marketplace chip colours preserved in both modes
    const MP_COLORS: Record<string, string> = { Trendyol: '#F27A1A', Hepsiburada: '#FF6000', N11: '#5E17EB', Pazarama: '#006BFF' };

    const MpChip = ({ mp }: { mp: string }) => {
        const active = marketplaceFilter === mp;
        const c = MP_COLORS[mp] || LIGHT.primary;
        return (
            <button onClick={() => setMarketplaceFilter(mp)} style={{
                padding: isLight ? '5px 14px' : '4px 10px',
                borderRadius: isLight ? '20px' : '6px',
                border: isLight ? (active ? `1px solid ${c}` : `1px solid ${LIGHT.border}`) : 'none',
                background: isLight ? (active ? `${c}14` : LIGHT.card) : (active ? `${c}18` : 'transparent'),
                color: c,
                fontSize: '11px',
                fontWeight: active ? '700' : '500',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                borderBottom: !isLight ? (active ? `2px solid ${c}` : 'none') : undefined,
            }}>
                {mp}
            </button>
        );
    };

    return (
        <div style={{ padding: isLight ? '0' : '0' }}>
            {/* ═══════════════ KPI CARDS ═══════════════ */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: isLight ? '16px' : '20px', marginBottom: isLight ? '28px' : '32px' }}>

                {/* KPI 1: Bekleyen */}
                <div style={{
                    background: isLight ? LIGHT.card : undefined,
                    border: isLight ? `1px solid ${LIGHT.border}` : undefined,
                    borderRadius: isLight ? '14px' : undefined,
                    boxShadow: isLight ? LIGHT.shadow : undefined,
                    padding: isLight ? '20px 24px' : undefined,
                }} className={isLight ? '' : 'card glass'}>
                    <div style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: isLight ? LIGHT.textSubtle : undefined }} className={isLight ? '' : 'text-muted'}>
                        Bekleyen Sipariş
                    </div>
                    <div style={{
                        fontSize: isLight ? '36px' : '28px',
                        fontWeight: isLight ? '700' : 'bold',
                        color: isLight ? LIGHT.primary : 'var(--primary)',
                        marginTop: isLight ? '10px' : '8px',
                        lineHeight: 1,
                    }}>
                        {onlineOrders.filter(o => ['Yeni', 'Hazırlanıyor', 'WaitingForApproval', 'Picking'].includes(o.status)).length}
                        <span style={{ fontSize: '16px', fontWeight: '500', marginLeft: '6px', color: isLight ? LIGHT.textMuted : undefined }}>adet</span>
                    </div>
                    <div style={{ fontSize: '12px', marginTop: '6px', color: isLight ? LIGHT.textMuted : undefined }} className={isLight ? '' : ''}>Hazırlanması gereken</div>
                </div>

                {/* KPI 2: Ciro */}
                <div style={{
                    background: isLight ? LIGHT.card : undefined,
                    border: isLight ? `1px solid ${LIGHT.border}` : undefined,
                    borderRadius: isLight ? '14px' : undefined,
                    boxShadow: isLight ? LIGHT.shadow : undefined,
                    padding: isLight ? '20px 24px' : undefined,
                    position: 'relative' as const,
                }} className={isLight ? '' : 'card glass'}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: isLight ? LIGHT.textSubtle : undefined }} className={isLight ? '' : 'text-muted'}>
                            {getTurnoverTitle()}
                        </div>
                        <select
                            value={turnoverFilter}
                            onChange={(e) => setTurnoverFilter(e.target.value)}
                            style={{
                                fontSize: '10px', padding: '3px 6px',
                                background: isLight ? LIGHT.filterBg : 'var(--bg-deep)',
                                color: isLight ? LIGHT.textMuted : 'white',
                                border: isLight ? `1px solid ${LIGHT.border}` : 'none',
                                borderRadius: '6px', cursor: 'pointer',
                            }}
                        >
                            <option value="TODAY">Bugün</option>
                            <option value="WEEK">1 Hafta</option>
                            <option value="MONTH">Bu Ay</option>
                            <option value="CUSTOM">Özel</option>
                        </select>
                    </div>
                    {turnoverFilter === 'CUSTOM' && (
                        <div style={{ display: 'flex', gap: '4px', marginTop: '6px', fontSize: '10px' }}>
                            <input type="date" value={turnoverCustomStart} onChange={e => setTurnoverCustomStart(e.target.value)} style={{ padding: '2px', width: '90px', background: isLight ? LIGHT.filterBg : 'var(--bg-deep)', color: isLight ? LIGHT.textMain : 'white', border: isLight ? `1px solid ${LIGHT.border}` : 'none', borderRadius: '4px' }} />
                            <span style={{ color: isLight ? LIGHT.textMuted : 'white' }}>–</span>
                            <input type="date" value={turnoverCustomEnd} onChange={e => setTurnoverCustomEnd(e.target.value)} style={{ padding: '2px', width: '90px', background: isLight ? LIGHT.filterBg : 'var(--bg-deep)', color: isLight ? LIGHT.textMain : 'white', border: isLight ? `1px solid ${LIGHT.border}` : 'none', borderRadius: '4px' }} />
                        </div>
                    )}
                    <div style={{ fontSize: isLight ? '32px' : '28px', fontWeight: isLight ? '700' : 'bold', color: isLight ? LIGHT.teal : 'var(--success)', marginTop: isLight ? '10px' : '8px', lineHeight: 1 }}>
                        ₺{calculateTurnover(onlineOrders).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontSize: '12px', marginTop: '6px', color: isLight ? LIGHT.textMuted : undefined }}>Seçili dönem cirosu</div>
                </div>

                {/* KPI 3: Stok */}
                <div style={{
                    background: isLight ? LIGHT.card : undefined,
                    border: isLight ? `1px solid ${LIGHT.border}` : undefined,
                    borderRadius: isLight ? '14px' : undefined,
                    boxShadow: isLight ? LIGHT.shadow : undefined,
                    padding: isLight ? '20px 24px' : undefined,
                }} className={isLight ? '' : 'card glass'}>
                    <div style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: isLight ? LIGHT.textSubtle : undefined }} className={isLight ? '' : 'text-muted'}>
                        Stok Hata Oranı
                    </div>
                    <div style={{ fontSize: isLight ? '36px' : '28px', fontWeight: isLight ? '700' : 'bold', marginTop: isLight ? '10px' : '8px', color: isLight ? LIGHT.success : undefined, lineHeight: 1 }}>
                        %0.1
                    </div>
                    <div style={{ fontSize: '12px', marginTop: '6px', color: isLight ? LIGHT.success : undefined, fontWeight: '500' }}>● Senkronizasyon stabil</div>
                </div>
            </div>

            {/* ═══════════════ HEADER + FILTERS ═══════════════ */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' as const, gap: '16px', marginBottom: '20px' }}>

                {/* Left: Title + LIVE badge + bulk action */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' as const }}>
                    <h3 style={{
                        margin: 0,
                        fontSize: isLight ? '20px' : undefined,
                        fontWeight: isLight ? '700' : undefined,
                        color: isLight ? LIGHT.textMain : undefined,
                    }} className={isLight ? '' : 'text-gradient'}>
                        E-Ticaret Siparişleri
                    </h3>
                    {/* LIVE badge — amber only */}
                    <span style={{
                        fontSize: '10px', padding: '3px 10px', borderRadius: '20px', fontWeight: '700', letterSpacing: '0.06em',
                        background: isLight ? LIGHT.amberLight : 'var(--primary)',
                        color: isLight ? LIGHT.amber : 'white',
                        border: isLight ? `1px solid rgba(201,175,124,0.3)` : 'none',
                    }}>
                        LIVE v1.4
                    </span>
                    {selectedOrders.length > 0 && (
                        <button
                            onClick={handleCollectBulk}
                            disabled={isCollecting}
                            style={{
                                padding: '8px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                                background: isLight ? LIGHT.success : undefined,
                                color: 'white', fontSize: '13px', fontWeight: '600',
                                boxShadow: isLight ? '0 4px 14px rgba(2,201,81,0.25)' : undefined,
                                display: 'flex', alignItems: 'center', gap: '6px',
                                opacity: isCollecting ? 0.7 : 1,
                            }}
                            className={isLight ? '' : 'btn btn-success'}
                        >
                            💰 Seçilenleri Tahsil Et ({selectedOrders.length})
                        </button>
                    )}
                </div>

                {/* Right: Filter groups */}
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px', alignItems: 'flex-end' }}>

                    {/* Marketplace chips */}
                    <div style={{
                        display: 'flex', gap: '6px', flexWrap: 'wrap' as const,
                        background: isLight ? LIGHT.filterBg : 'rgba(255,255,255,0.05)',
                        padding: isLight ? '6px 8px' : '4px',
                        borderRadius: isLight ? '24px' : '8px',
                        border: isLight ? `1px solid ${LIGHT.border}` : 'none',
                    }}>
                        <button onClick={() => setMarketplaceFilter('ALL')} style={{
                            padding: isLight ? '5px 14px' : '4px 10px',
                            borderRadius: isLight ? '20px' : '6px',
                            border: isLight ? (marketplaceFilter === 'ALL' ? `1px solid ${LIGHT.primary}` : `1px solid ${LIGHT.border}`) : 'none',
                            background: isLight ? (marketplaceFilter === 'ALL' ? LIGHT.primaryLight : LIGHT.card) : (marketplaceFilter === 'ALL' ? 'var(--bg-hover)' : 'transparent'),
                            color: isLight ? (marketplaceFilter === 'ALL' ? LIGHT.primary : LIGHT.textMuted) : 'white',
                            fontSize: '11px', fontWeight: marketplaceFilter === 'ALL' ? '600' : '400', cursor: 'pointer',
                            borderBottom: !isLight ? (marketplaceFilter === 'ALL' ? '2px solid var(--primary)' : 'none') : undefined,
                        }}>Hepsi</button>
                        {['Trendyol', 'Hepsiburada', 'N11', 'Pazarama'].map(mp => <MpChip key={mp} mp={mp} />)}
                    </div>

                    {/* Status chips */}
                    <div style={{
                        display: 'flex', gap: '6px', flexWrap: 'wrap' as const,
                        background: isLight ? LIGHT.filterBg : 'rgba(255,255,255,0.05)',
                        padding: isLight ? '6px 8px' : '4px',
                        borderRadius: isLight ? '24px' : '8px',
                        border: isLight ? `1px solid ${LIGHT.border}` : 'none',
                    }}>
                        {[
                            { val: 'ALL', label: 'Tümü' },
                            { val: 'NEW', label: 'Yeni' },
                            { val: 'SHIPPED', label: 'Kargolandı' },
                            { val: 'COMPLETED', label: 'Tamamlandı' },
                            { val: 'CANCELLED', label: 'İptal' },
                        ].map(({ val, label }) => (
                            <FilterChip key={val} active={statusFilter === val} onClick={() => setStatusFilter(val)}>{label}</FilterChip>
                        ))}
                    </div>

                    {/* Date chips */}
                    <div style={{
                        display: 'flex', gap: '6px', flexWrap: 'wrap' as const,
                        background: isLight ? LIGHT.filterBg : 'rgba(255,255,255,0.05)',
                        padding: isLight ? '6px 8px' : '4px',
                        borderRadius: isLight ? '24px' : '8px',
                        border: isLight ? `1px solid ${LIGHT.border}` : 'none',
                    }}>
                        {[
                            { val: 'ALL', label: 'Tüm Zamanlar' },
                            { val: 'TODAY', label: 'Bugün' },
                            { val: 'WEEK', label: '1 Hafta' },
                            { val: 'MONTH', label: '1 Ay' },
                            { val: '3MONTHS', label: '3 Ay' },
                            { val: 'CUSTOM', label: 'Özel' },
                        ].map(({ val, label }) => <DateChip key={val} val={val} label={label} />)}
                    </div>

                    {dateFilter === 'CUSTOM' && (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '2px' }}>
                            <input type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} style={{ padding: '5px 8px', borderRadius: '8px', border: `1px solid ${isLight ? LIGHT.border : 'var(--border-light)'}`, background: isLight ? LIGHT.card : 'var(--bg-deep)', color: isLight ? LIGHT.textMain : 'white', fontSize: '12px' }} />
                            <span style={{ color: isLight ? LIGHT.textMuted : 'white' }}>–</span>
                            <input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} style={{ padding: '5px 8px', borderRadius: '8px', border: `1px solid ${isLight ? LIGHT.border : 'var(--border-light)'}`, background: isLight ? LIGHT.card : 'var(--bg-deep)', color: isLight ? LIGHT.textMain : 'white', fontSize: '12px' }} />
                        </div>
                    )}
                </div>
            </div>

            {/* ═══════════════ TABLE ═══════════════ */}
            {filteredOnlineOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: isLight ? LIGHT.textMuted : undefined }} className={isLight ? '' : 'text-muted text-center py-8'}>
                    {isLight ? (
                        <div>
                            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📭</div>
                            <div style={{ fontSize: '15px', fontWeight: '600', color: LIGHT.textMuted }}>Bu filtreye uygun sipariş bulunamadı.</div>
                            <div style={{ fontSize: '12px', color: LIGHT.textSubtle, marginTop: '6px' }}>Farklı filtre kombinasyonu deneyin.</div>
                        </div>
                    ) : 'Bu filtreye uygun sipariş bulunamadı.'}
                </div>
            ) : (
                <div style={{
                    background: isLight ? LIGHT.card : undefined,
                    border: isLight ? `1px solid ${LIGHT.border}` : undefined,
                    borderRadius: isLight ? '16px' : undefined,
                    boxShadow: isLight ? LIGHT.shadow : undefined,
                    overflow: 'hidden',
                }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{
                                background: isLight ? LIGHT.filterBg : undefined,
                                borderBottom: `1px solid ${isLight ? LIGHT.border : 'var(--border-light)'}`,
                            }}>
                                <th style={{ padding: isLight ? '14px 16px' : '12px', width: '40px' }}>
                                    <input type="checkbox" checked={paginatedOrders.length > 0 && selectedOrders.length === paginatedOrders.length} onChange={toggleSelectAll} style={{ cursor: 'pointer', accentColor: LIGHT.primary }} />
                                </th>
                                {['Sipariş No', 'Platform', 'Müşteri', 'Tutar', 'Durum', 'İşlem'].map(h => (
                                    <th key={h} style={{ padding: isLight ? '14px 12px' : '12px', fontSize: '11px', fontWeight: '600', letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: isLight ? LIGHT.textSubtle : undefined }} className={isLight ? '' : 'text-muted'}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedOrders.map(o => {
                                const isExpanded = expandedOrderId === o.id;
                                return (
                                    <Fragment key={o.id}>
                                        <tr
                                            onClick={() => toggleExpand(o.id, o)}
                                            style={{
                                                borderBottom: `1px solid ${isLight ? LIGHT.border : 'var(--border-light)'}`,
                                                cursor: 'pointer',
                                                background: isLight
                                                    ? (isExpanded ? LIGHT.primaryLight : LIGHT.card)
                                                    : (isExpanded ? 'var(--bg-hover)' : 'transparent'),
                                                transition: 'background 0.15s ease',
                                            }}
                                            onMouseEnter={e => { if (!isExpanded && isLight) (e.currentTarget as HTMLTableRowElement).style.background = LIGHT.rowHover; }}
                                            onMouseLeave={e => { if (!isExpanded && isLight) (e.currentTarget as HTMLTableRowElement).style.background = LIGHT.card; }}
                                        >
                                            <td style={{ padding: isLight ? '16px 16px' : '16px' }} onClick={e => e.stopPropagation()}>
                                                <input type="checkbox" checked={selectedOrders.includes(o.id)} onChange={() => toggleOrderSelection(o.id)} style={{ cursor: 'pointer', transform: 'scale(1.2)', accentColor: LIGHT.primary }} />
                                            </td>
                                            <td style={{ padding: isLight ? '16px 12px' : '16px', fontFamily: 'monospace', fontWeight: 'bold', fontSize: '13px', color: isLight ? LIGHT.textMain : 'var(--text-main)' }}>
                                                {o.orderNumber || o.id}
                                            </td>
                                            <td style={{ padding: isLight ? '16px 12px' : '0' }}>
                                                <span style={{
                                                    fontSize: '11px', padding: isLight ? '4px 10px' : '2px 6px', borderRadius: '20px',
                                                    border: isLight ? `1px solid ${LIGHT.border}` : `1px solid var(--border-light)`,
                                                    background: isLight ? LIGHT.filterBg : 'transparent',
                                                    fontWeight: '600',
                                                }}>
                                                    {o.marketplace === 'Trendyol' && <span style={{ color: '#F27A1A' }}>Trendyol</span>}
                                                    {o.marketplace === 'Hepsiburada' && <span style={{ color: '#FF6000' }}>Hepsiburada</span>}
                                                    {o.marketplace === 'N11' && <span style={{ color: '#5E17EB' }}>N11</span>}
                                                    {o.marketplace === 'Pazarama' && <span style={{ color: '#006BFF' }}>Pazarama</span>}
                                                    {!['Trendyol', 'Hepsiburada', 'N11', 'Pazarama'].includes(o.marketplace) && <span style={{ color: isLight ? LIGHT.primary : 'var(--secondary)' }}>{o.marketplace}</span>}
                                                </span>
                                            </td>
                                            <td style={{ padding: isLight ? '16px 12px' : '0' }}>
                                                <div style={{ fontWeight: '600', fontSize: '14px', color: isLight ? LIGHT.textMain : 'var(--text-main)' }}>{o.customerName}</div>
                                                <div style={{ fontSize: '11px', color: isLight ? LIGHT.textMuted : undefined }} className={isLight ? '' : 'text-muted'}>{new Date(o.orderDate || o.date).toLocaleDateString('tr-TR')}</div>
                                            </td>
                                            <td style={{ padding: isLight ? '16px 12px' : '0', fontWeight: '700', fontSize: '15px', color: isLight ? LIGHT.textMain : undefined }}>
                                                {parseFloat(o.totalAmount).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                <span style={{ fontSize: '11px', marginLeft: '3px', color: isLight ? LIGHT.textMuted : undefined, fontWeight: '400' }}>{o.currency}</span>
                                            </td>
                                            <td style={{ padding: isLight ? '16px 12px' : '0' }}>
                                                <span style={{
                                                    padding: isLight ? '5px 12px' : '4px 8px',
                                                    borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                                                    ...getStatusStyle(o.status, isLight)
                                                }}>
                                                    {o.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: isLight ? '16px 12px' : '0' }}>
                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                    {['Faturalandırıldı', 'Delivered', 'Cancelled'].includes(o.status) ? (
                                                        <span style={{ color: isLight ? LIGHT.success : 'var(--success)', fontSize: '12px', fontWeight: '600' }}>✅ Tamamlandı</span>
                                                    ) : (
                                                        <button
                                                            onClick={e => { e.stopPropagation(); setSelectedOrder(o); }}
                                                            title="Faturalandır"
                                                            style={{
                                                                padding: isLight ? '7px 16px' : '6px 12px',
                                                                borderRadius: isLight ? '10px' : undefined,
                                                                border: 'none', cursor: 'pointer',
                                                                background: isLight ? LIGHT.primary : undefined,
                                                                color: 'white', fontSize: '12px', fontWeight: '600',
                                                                boxShadow: isLight ? '0 2px 8px rgba(36,123,254,0.3)' : undefined,
                                                                transition: 'all 0.15s ease',
                                                            }}
                                                            className={isLight ? '' : 'btn btn-primary'}
                                                        >
                                                            📄 Faturalandır
                                                        </button>
                                                    )}
                                                    <button
                                                        style={{
                                                            padding: isLight ? '7px 10px' : '4px 8px',
                                                            borderRadius: isLight ? '8px' : undefined,
                                                            border: isLight ? `1px solid ${LIGHT.border}` : 'none',
                                                            background: isLight ? LIGHT.filterBg : 'transparent',
                                                            color: isLight ? LIGHT.textMuted : 'white',
                                                            fontSize: '12px', cursor: 'pointer',
                                                        }}
                                                        className={isLight ? '' : 'btn btn-ghost'}
                                                    >
                                                        {isExpanded ? '▲' : '▼'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>

                                        {/* Expanded row */}
                                        {isExpanded && (
                                            <tr style={{ borderBottom: `1px solid ${isLight ? LIGHT.border : 'var(--border-light)'}`, background: isLight ? `${LIGHT.primaryLight}60` : 'var(--bg-hover)' }}>
                                                <td colSpan={7} style={{ padding: isLight ? '0 20px 20px 20px' : '0 20px 20px 20px' }}>
                                                    <div style={{
                                                        padding: '20px',
                                                        background: isLight ? LIGHT.card : 'var(--bg-deep)',
                                                        borderRadius: isLight ? '12px' : '8px',
                                                        border: `1px solid ${isLight ? LIGHT.border : 'var(--border-light)'}`,
                                                        marginTop: '4px',
                                                    }}>
                                                        <h4 style={{ color: isLight ? LIGHT.textMain : 'var(--text-main)', borderBottom: `1px solid ${isLight ? LIGHT.border : 'var(--border-light)'}`, paddingBottom: '10px', margin: '0 0 16px 0', fontSize: '15px', fontWeight: '700' }}>
                                                            📦 Sipariş Detayı
                                                        </h4>
                                                        <table style={{ width: '100%', fontSize: '13px', textAlign: 'left', borderCollapse: 'collapse' }}>
                                                            <thead>
                                                                <tr>
                                                                    {['Ürün Adı', 'Adet', 'Birim Fiyat', 'Tutar (KDV Dahil)'].map((h, i) => (
                                                                        <th key={h} style={{ paddingBottom: '10px', color: isLight ? LIGHT.textSubtle : 'var(--text-muted)', fontSize: '11px', fontWeight: '600', letterSpacing: '0.06em', textTransform: 'uppercase' as const, textAlign: i === 3 ? 'right' as const : 'left' as const }}>
                                                                            {h}
                                                                        </th>
                                                                    ))}
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {o.items && o.items.map((item: any, idx: number) => (
                                                                    <tr key={idx} style={{ borderTop: `1px solid ${isLight ? LIGHT.border : 'var(--border-light)'}` }}>
                                                                        <td style={{ padding: '10px 0', color: isLight ? LIGHT.textMain : 'var(--text-main)', fontWeight: '500' }}>{item.name || item.productName}</td>
                                                                        <td style={{ color: isLight ? LIGHT.textMain : 'var(--text-main)' }}>{item.qty || item.quantity}</td>
                                                                        <td style={{ color: isLight ? LIGHT.textMain : 'var(--text-main)' }}>{item.unitPrice ? item.unitPrice.toFixed(2) : item.price ? item.price.toFixed(2) : '0.00'} ₺</td>
                                                                        <td style={{ textAlign: 'right', fontWeight: '700', color: isLight ? LIGHT.textMain : 'var(--text-main)' }}>
                                                                            {item.total ? item.total.toFixed(2) : (item.price && item.quantity) ? (item.price * item.quantity).toFixed(2) : '0.00'} ₺
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                        {(!o.items || o.items.length === 0) && (
                                                            <div style={{ textAlign: 'center', fontSize: '12px', padding: '12px', color: isLight ? LIGHT.textMuted : undefined }} className={isLight ? '' : 'text-muted'}>Ürün detayı bulunamadı.</div>
                                                        )}

                                                        {/* Platform Actions */}
                                                        <div style={{
                                                            marginTop: '20px',
                                                            paddingTop: '16px',
                                                            borderTop: `2px solid ${isLight ? LIGHT.primary : '#3b82f6'}`,
                                                            background: isLight ? LIGHT.primaryLight : 'rgba(59,130,246,0.1)',
                                                            padding: '16px',
                                                            borderRadius: '10px',
                                                        }}>
                                                            <h5 style={{ color: isLight ? LIGHT.primary : '#3b82f6', fontSize: '12px', fontWeight: '700', marginBottom: '12px', textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>
                                                                🚀 Platform Aksiyonları — {o.marketplace || 'BELİRSİZ'}
                                                            </h5>
                                                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' as const }}>
                                                                <MarketplaceActionButton orderId={o.id} marketplace={o.marketplace} actionKey="REFRESH_STATUS" onSuccess={fetchOnlineOrders} />
                                                                {['trendyol', 'hepsiburada', 'pazarama', 'n11'].includes(o.marketplace?.toLowerCase() || '') && (
                                                                    <MarketplaceActionButton orderId={o.id} marketplace={o.marketplace} actionKey="PRINT_LABEL_A4" shipmentPackageId={o.shipmentPackageId || (['hepsiburada', 'pazarama', 'n11'].includes(o.marketplace?.toLowerCase() || '') ? o.orderNumber : undefined)} />
                                                                )}
                                                                {o.marketplace?.toLowerCase() === 'trendyol' && (
                                                                    <MarketplaceActionButton orderId={o.id} marketplace={o.marketplace} actionKey="CHANGE_CARGO" variant="ghost" shipmentPackageId={o.shipmentPackageId} onSuccess={fetchOnlineOrders} />
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
            )}

            {/* Pagination */}
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: `1px solid ${isLight ? LIGHT.border : 'rgba(255,255,255,0.1)'}` }}>
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
        </div>
    );
}
