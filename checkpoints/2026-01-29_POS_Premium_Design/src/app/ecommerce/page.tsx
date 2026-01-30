"use client";

import React, { useState, Fragment } from 'react';
import Link from 'next/link';
import { useModal } from '@/contexts/ModalContext';

export default function EcommercePage() {
    const { showSuccess, showConfirm } = useModal();
    const [activeTab, setActiveTab] = useState('orders'); // orders, products, settings
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

    // Mock Data: Online Siparişler
    const [orders, setOrders] = useState([
        {
            id: 'ORD-9921',
            customer: 'Caner Erkin',
            platform: 'Kendi Sitemiz',
            date: '24.01.2026 14:30',
            total: 450,
            status: 'Yeni Sipariş',
            cargoCompany: 'Yurtiçi Kargo',
            items: [
                { name: 'Motul 7100 10W40 4L', qty: 1, unitPrice: 381.36, tax: 18, total: 450 }
            ],
            commission: 0, shipping: 25, serviceFee: 0, withholding: 0
        },
        {
            id: 'ORD-9920',
            customer: 'Ayşe Yılmaz',
            platform: 'Trendyol',
            date: '24.01.2026 13:15',
            total: 1200,
            status: 'Hazırlanıyor',
            cargoCompany: 'MNG Kargo',
            items: [
                { name: 'Shimano Vites Kolu', qty: 2, unitPrice: 508.47, tax: 18, total: 1200 }
            ],
            commission: 180, shipping: 25, serviceFee: 24, withholding: 0
        },
        {
            id: 'ORD-9919',
            customer: 'Mehmet Demir',
            platform: 'N11',
            date: '24.01.2026 10:00',
            total: 850,
            status: 'Kargolandı',
            cargoCompany: 'Aras Kargo',
            items: [
                { name: 'Zincir Yağı', qty: 1, unitPrice: 720.34, tax: 18, total: 850 }
            ],
            commission: 85, shipping: 18, serviceFee: 8.5, withholding: 0
        },
        {
            id: 'ORD-9918',
            customer: 'Selin Kaya',
            platform: 'Hepsiburada',
            date: '23.01.2026 18:45',
            total: 2200,
            status: 'Teslim Edildi',
            cargoCompany: 'Sürat Kargo',
            items: [
                { name: 'Kask', qty: 1, unitPrice: 1864.41, tax: 18, total: 2200 }
            ],
            commission: 264, shipping: 20, serviceFee: 33, withholding: 220
        },
    ]);

    const calculateNetProfit = (order: any) => {
        return order.total - order.commission - order.shipping - order.serviceFee - order.withholding;
    };

    const toggleExpand = (id: string) => {
        if (expandedOrderId === id) {
            setExpandedOrderId(null);
        } else {
            setExpandedOrderId(id);
        }
    };

    const handleAction = (action: string, orderId: string) => {
        if (action === 'İptal Et') {
            showConfirm('Siparişi İptal Et', `Sipariş #${orderId} iptal edilecek. Emin misiniz?`, () => {
                showSuccess('İptal Edildi', `Sipariş ${orderId} iptal süreci başlatıldı.`);
            });
        } else {
            showSuccess('İşlem Başlatıldı', `${action} işlemi başlatıldı.\nSipariş: ${orderId}`);
        }
    };

    const updateCargoCompany = (orderId: string, company: string) => {
        const updatedOrders = orders.map(o => {
            if (o.id === orderId) {
                return { ...o, cargoCompany: company };
            }
            return o;
        });
        setOrders(updatedOrders);
        // Burada API çağrısı yapılmalı
        showSuccess('Güncellendi', `Kargo firması ${company} olarak güncellendi.`);
    };

    return (
        <div className="container" style={{ padding: '40px 20px' }}>

            {/* Header */}
            <header className="flex-between" style={{ marginBottom: '32px' }}>
                <div>
                    <div className="flex-center gap-2" style={{ justifyContent: 'flex-start' }}>
                        <h1 className="text-gradient">E-Ticaret Yönetimi (GÜNCEL)</h1>
                        <span style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '4px', background: 'var(--primary)', color: 'white' }}>LIVE v1.4</span>
                    </div>
                    <p className="text-muted">Web Sitesi ve Pazaryeri Siparişleri</p>
                </div>
                <div className="flex-center gap-4">
                    {/* Platform Status */}
                    <div className="card flex-center gap-4" style={{ padding: '8px 16px', background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
                        <div style={{ fontSize: '12px' }}><span style={{ color: 'var(--success)' }}>●</span> Website</div>
                        <div style={{ fontSize: '12px' }}><span style={{ color: 'var(--success)' }}>●</span> Trendyol</div>
                        <div style={{ fontSize: '12px' }}><span style={{ color: 'var(--success)' }}>●</span> N11</div>
                        <div style={{ fontSize: '12px' }}><span style={{ color: 'var(--success)' }}>●</span> Hepsiburada</div>
                    </div>
                    <Link href="/ecommerce/reports">
                        <button className="btn btn-outline" style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}>
                            📊 Pazaryeri Analizi
                        </button>
                    </Link>
                </div>
            </header>

            {/* Stats Summary */}
            <div className="grid-cols-4" style={{ marginBottom: '32px' }}>
                <div className="card glass">
                    <div className="text-muted" style={{ fontSize: '12px' }}>BEKLEYEN SİPARİŞ</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--primary)', marginTop: '8px' }}>5 Adet</div>
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>Hazırlanması gereken</div>
                </div>
                <div className="card glass">
                    <div className="text-muted" style={{ fontSize: '12px' }}>BUGÜNKÜ ONLİNE CİRO</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--success)', marginTop: '8px' }}>₺ 12,450</div>
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>Düne göre +22%</div>
                </div>
                <div className="card glass">
                    <div className="text-muted" style={{ fontSize: '12px' }}>PAZARYERI GİDERLERİ</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--danger)', marginTop: '8px' }}>₺ 1,850</div>
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>Komisyon + Kargo</div>
                </div>
                <div className="card glass">
                    <div className="text-muted" style={{ fontSize: '12px' }}>STOK HATA ORANI</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '8px' }}>%0.1</div>
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>Senkronizasyon stabil</div>
                </div>
            </div>

            {/* Main Content Actions */}
            <div className="card glass">

                {/* Filter Tabs */}
                <div className="flex-center" style={{ justifyContent: 'flex-start', borderBottom: '1px solid var(--border-light)', marginBottom: '24px', gap: '20px' }}>
                    {['Tüm Siparişler', 'Hazırlanacaklar', 'Kargo Bekleyen', 'İadeler'].map((tab, i) => (
                        <button key={i} style={{
                            padding: '12px 0',
                            background: 'transparent',
                            border: 'none',
                            borderBottom: i === 0 ? '2px solid var(--primary)' : '2px solid transparent',
                            color: i === 0 ? 'white' : 'var(--text-muted)',
                            cursor: 'pointer', fontWeight: '500'
                        }}>
                            {tab}
                        </button>
                    ))}
                    <input type="text" placeholder="Sipariş No veya Müşteri Ara..." style={{ marginLeft: 'auto', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-deep)', color: 'white', width: '250px' }} />
                </div>

                {/* Order List Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead className="text-muted" style={{ fontSize: '12px', borderBottom: '1px solid var(--border-light)' }}>
                        <tr>
                            <th style={{ padding: '12px' }}>Sipariş No</th>
                            <th>Platform</th>
                            <th>Müşteri</th>
                            <th>Ürün Özeti</th>
                            <th>Brüt Tutar</th>
                            <th>Giderler</th>
                            <th>Net Gelir</th>
                            <th>Durum</th>
                            <th>İşlem</th>
                        </tr>
                    </thead>
                    <tbody style={{ fontSize: '14px' }}>
                        {orders.map((order) => {
                            const netProfit = calculateNetProfit(order);
                            const totalExpenses = order.commission + order.shipping + order.serviceFee + order.withholding;
                            const isExpanded = expandedOrderId === order.id;

                            // We need both rows to be siblings, so we return an array or Fragment.
                            // However, key must be on the Fragment.
                            return (
                                <Fragment key={order.id}>
                                    <tr style={{ borderBottom: isExpanded ? 'none' : '1px solid rgba(255,255,255,0.05)', background: isExpanded ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                                        <td style={{ padding: '16px 12px', fontFamily: 'monospace', fontWeight: 'bold' }}>{order.id}</td>
                                        <td>
                                            <span style={{
                                                fontSize: '11px', padding: '2px 6px', borderRadius: '4px',
                                                border: '1px solid var(--border-light)',
                                                color: order.platform === 'Trendyol' ? '#F27A1A' :
                                                    order.platform === 'N11' ? '#5E17EB' :
                                                        order.platform === 'Hepsiburada' ? '#FF6000' :
                                                            'var(--secondary)'
                                            }}>
                                                {order.platform}
                                            </span>
                                        </td>
                                        <td>
                                            <div>{order.customer}</div>
                                            <div className="text-muted" style={{ fontSize: '12px' }}>{order.date}</div>
                                        </td>
                                        <td className="text-muted">
                                            {order.items.length} Ürün
                                            <div style={{ fontSize: '11px' }}>{order.items[0].name} {order.items.length > 1 ? `+${order.items.length - 1} diğer` : ''}</div>
                                        </td>
                                        <td style={{ fontWeight: 'bold' }}>{order.total} ₺</td>
                                        <td>
                                            <div style={{ fontSize: '12px', color: 'var(--danger)' }}>
                                                - {totalExpenses.toFixed(2)} ₺
                                            </div>
                                            <div className="text-muted" style={{ fontSize: '10px' }}>
                                                {order.commission > 0 && `K: ${order.commission}₺ `}
                                                {order.shipping > 0 && `+ Krg: ${order.shipping}₺`}
                                            </div>
                                        </td>
                                        <td style={{ fontWeight: 'bold', color: 'var(--success)' }}>
                                            {netProfit.toFixed(2)} ₺
                                            <div className="text-muted" style={{ fontSize: '10px' }}>
                                                %{((netProfit / order.total) * 100).toFixed(1)} marj
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{
                                                padding: '4px 8px', borderRadius: '4px', fontSize: '12px',
                                                background: order.status === 'Yeni Sipariş' ? 'var(--primary)' : 'var(--bg-hover)',
                                                color: order.status === 'Yeni Sipariş' ? 'white' : 'var(--text-muted)'
                                            }}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => toggleExpand(order.id)}
                                                className={`btn ${isExpanded ? 'btn-primary' : 'btn-outline'}`}
                                                style={{ fontSize: '12px', padding: '6px 12px' }}
                                            >
                                                {isExpanded ? '▲ Gizle' : '▼ Detay'}
                                            </button>
                                        </td>
                                    </tr>

                                    {/* Expanded Detail Row */}
                                    {isExpanded && (
                                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
                                            <td colSpan={9} style={{ padding: '0 20px 20px 20px' }}>
                                                <div style={{ padding: '20px', background: 'var(--bg-deep)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>

                                                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>

                                                        {/* Sol Taraf: Ürünler ve Finans */}
                                                        <div>
                                                            <h4 className="mb-4" style={{ color: 'var(--text-main)', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>📦 Sipariş İçeriği</h4>
                                                            <table style={{ width: '100%', fontSize: '13px', textAlign: 'left', marginBottom: '20px' }}>
                                                                <thead style={{ color: 'var(--text-muted)' }}>
                                                                    <tr>
                                                                        <th style={{ paddingBottom: '8px' }}>Ürün Adı</th>
                                                                        <th>Birim Fiyat</th>
                                                                        <th>Adet</th>
                                                                        <th>KDV</th>
                                                                        <th style={{ textAlign: 'right' }}>Toplam</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {order.items.map((item, idx) => (
                                                                        <tr key={idx} style={{ borderTop: '1px solid var(--border-light)' }}>
                                                                            <td style={{ padding: '8px 0' }}>{item.name}</td>
                                                                            <td>{item.unitPrice.toFixed(2)} ₺</td>
                                                                            <td>{item.qty}</td>
                                                                            <td>%{item.tax}</td>
                                                                            <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{item.total.toFixed(2)} ₺</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>

                                                            <div className="flex-center gap-4">
                                                                <div className="badge badge-success">Kargo: {order.cargoCompany}</div>
                                                                <div className="text-muted" style={{ fontSize: '12px' }}>Fatura Adresi: {order.customer}, İstanbul/Türkiye</div>
                                                            </div>
                                                        </div>

                                                        {/* Sağ Taraf: İşlemler */}
                                                        <div style={{ borderLeft: '1px solid var(--border-light)', paddingLeft: '20px' }}>
                                                            <h4 className="mb-4" style={{ color: 'var(--text-main)', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>⚡ İşlemler</h4>

                                                            <div className="flex-col gap-3">
                                                                <div className="flex-col gap-1">
                                                                    <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>KARGO FİRMASI</label>
                                                                    <select
                                                                        value={order.cargoCompany}
                                                                        onChange={(e) => updateCargoCompany(order.id, e.target.value)}
                                                                        style={{ padding: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '4px', color: 'white', width: '100%' }}
                                                                    >
                                                                        <option>Yurtiçi Kargo</option>
                                                                        <option>Aras Kargo</option>
                                                                        <option>MNG Kargo</option>
                                                                        <option>Sürat Kargo</option>
                                                                        <option>PTT Kargo</option>
                                                                        <option>Kolay Gelsin</option>
                                                                    </select>
                                                                </div>

                                                                <button onClick={() => handleAction('Fatura Oluştur', order.id)} className="btn btn-primary" style={{ justifyContent: 'flex-start' }}>📄 Faturayı Kes & Gönder</button>
                                                                <button onClick={() => handleAction('Kargo Etiketi', order.id)} className="btn btn-outline" style={{ justifyContent: 'flex-start' }}>🖨️ Kargo Etiketi Yazdır</button>

                                                                <div className="flex-center gap-2 mt-2">
                                                                    <button onClick={() => handleAction('Onayla', order.id)} className="btn btn-success" style={{ flex: 1 }}>✅ Onayla</button>
                                                                    <button onClick={() => handleAction('İptal Et', order.id)} className="btn btn-outline" style={{ flex: 1, borderColor: 'var(--danger)', color: 'var(--danger)' }}>❌ İptal</button>
                                                                </div>
                                                            </div>
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

            {/* Info Box */}
            <div className="card" style={{ marginTop: '24px', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid var(--primary)' }}>
                <h4 style={{ color: 'var(--primary)', marginBottom: '8px' }}>💡 Pazaryeri Gider Hesaplaması</h4>
                <p style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--text-muted)' }}>
                    Tablodaki <b>Giderler</b> ve <b>Net Gelir</b> sütunları, <b>Ayarlar → E-Ticaret Pazaryerleri</b> bölümünde tanımladığınız
                    komisyon, kargo ve hizmet bedeli oranlarına göre otomatik hesaplanmaktadır. Gerçek giderler pazaryerinden gelen faturalara göre değişiklik gösterebilir.
                </p>
            </div>

        </div>
    );
}
