
"use client";

import { useState, Fragment, useEffect } from 'react';
import Pagination from '@/components/Pagination';

interface InvoicesTabProps {
    invoiceSubTab: 'sales' | 'incoming' | 'wayslips';
    setInvoiceSubTab: (tab: 'sales' | 'incoming' | 'wayslips') => void;
    fetchInvoices: () => Promise<void>;
    fetchPurchaseInvoices: () => Promise<void>;
    fetchWayslips: () => Promise<void>;
    isLoadingInvoices: boolean;
    isLoadingPurchaseInvoices: boolean;
    isLoadingWayslips: boolean;
    realInvoices: any[];
    purchaseInvoices: any[];
    wayslips: any[];
    handleApproveInvoice: (id: string) => Promise<void>;
    handleDeleteInvoice: (id: string) => Promise<void>;
    handleSendToELogo: (id: string, type: any) => Promise<void>;
    handleViewPDF: (id: string) => Promise<void>;
    handleAcceptPurchaseInvoice: (id: string) => Promise<void>;
    handleRejectPurchaseInvoice: (id: string) => Promise<void>;
    setView: (view: any) => void;
    showWarning: (title: string, message: string) => void;
}

export function InvoicesTab({
    invoiceSubTab,
    setInvoiceSubTab,
    fetchInvoices,
    fetchPurchaseInvoices,
    fetchWayslips,
    isLoadingInvoices,
    isLoadingPurchaseInvoices,
    isLoadingWayslips,
    realInvoices,
    purchaseInvoices,
    wayslips,
    handleApproveInvoice,
    handleDeleteInvoice,
    handleSendToELogo,
    handleViewPDF,
    handleAcceptPurchaseInvoice,
    handleRejectPurchaseInvoice,
    setView,
    showWarning
}: InvoicesTabProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const ordersPerPage = 10;
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
    const [wayslipType, setWayslipType] = useState<'gelen' | 'giden'>('giden');

    const toggleExpand = (id: string) => {
        setExpandedOrderId(expandedOrderId === id ? null : id);
    };

    let activeList = [];
    if (invoiceSubTab === 'sales') {
        activeList = realInvoices;
    } else if (invoiceSubTab === 'incoming') {
        activeList = purchaseInvoices;
    } else if (invoiceSubTab === 'wayslips') {
        const filterType = wayslipType === 'gelen' ? 'Gelen' : 'Giden';
        activeList = (wayslips || []).filter(w => w.type === filterType);
    }

    const totalPages = Math.ceil((activeList?.length || 0) / ordersPerPage);
    const paginatedList = activeList.slice((currentPage - 1) * ordersPerPage, currentPage * ordersPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [invoiceSubTab]);

    return (
        <div>
            {/* Invoices Sub-Tabs - Only show if not in wayslips mode */}
            {invoiceSubTab !== 'wayslips' && (
                <div className="flex-center" style={{ justifyContent: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '24px', gap: '8px' }}>
                    <button
                        onClick={() => setInvoiceSubTab('sales')}
                        style={{
                            padding: '12px 24px',
                            background: invoiceSubTab === 'sales' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                            border: 'none', color: invoiceSubTab === 'sales' ? 'var(--primary)' : 'white',
                            borderBottom: invoiceSubTab === 'sales' ? '2px solid var(--primary)' : 'none',
                            cursor: 'pointer', fontWeight: 'bold', fontSize: '13px'
                        }}
                    >
                        📄 Satış Faturaları
                    </button>
                    <button
                        onClick={() => setInvoiceSubTab('incoming')}
                        style={{
                            padding: '12px 24px',
                            background: invoiceSubTab === 'incoming' ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                            border: 'none', color: invoiceSubTab === 'incoming' ? 'var(--success)' : 'white',
                            borderBottom: invoiceSubTab === 'incoming' ? '2px solid var(--success)' : 'none',
                            cursor: 'pointer', fontWeight: 'bold', fontSize: '13px'
                        }}
                    >
                        📥 Gelen Faturalar
                    </button>
                </div>
            )}

            {/* SUB-TAB CONTENT: SALES INVOICES */}
            {invoiceSubTab === 'sales' && (
                <div>
                    <div className="flex-between mb-4">
                        <h3>📑 Kesilen Satış Faturaları</h3>
                        <button onClick={fetchInvoices} className="btn btn-outline" style={{ fontSize: '12px' }}>🔄 Yenile</button>
                    </div>

                    {isLoadingInvoices ? <p>Yükleniyor...</p> : (
                        <table style={{ width: '100%', marginTop: '16px', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead className="text-muted" style={{ fontSize: '12px' }}>
                                <tr>
                                    <th style={{ padding: '12px' }}>Fatura No</th>
                                    <th>Cari</th>
                                    <th>Tarih</th>
                                    <th>Tutar</th>
                                    <th>Durum</th>
                                    <th style={{ textAlign: 'center' }}>İşlem</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedList.length === 0 ? (
                                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px' }} className="text-muted">Fatura bulunamadı.</td></tr>
                                ) : paginatedList.map(inv => {
                                    const isExpanded = expandedOrderId === inv.id;
                                    return (
                                        <Fragment key={inv.id}>
                                            <tr style={{ borderTop: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', background: isExpanded ? 'rgba(255,255,255,0.02)' : 'transparent' }} onClick={() => toggleExpand(inv.id)}>
                                                <td style={{ padding: '16px', fontWeight: 'bold' }}>{inv.invoiceNo}</td>
                                                <td>{inv.customer?.name}</td>
                                                <td style={{ fontSize: '12px' }}>{new Date(inv.invoiceDate).toLocaleDateString('tr-TR')}</td>
                                                <td style={{ fontWeight: 'bold' }}>{inv.totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺</td>
                                                <td>
                                                    <span style={{
                                                        padding: '4px 8px', borderRadius: '4px', fontSize: '11px',
                                                        background: inv.isFormal ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                        color: inv.isFormal ? 'var(--success)' : 'var(--warning)',
                                                        border: `1px solid ${inv.isFormal ? 'var(--success)' : 'var(--warning)'}`
                                                    }}>
                                                        {inv.isFormal ? 'Faturalandırıldı' : inv.status}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'center', padding: '12px' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }} onClick={e => e.stopPropagation()}>
                                                        {!inv.isFormal ? (
                                                            <button
                                                                onClick={() => handleSendToELogo(inv.id, 'EFATURA')}
                                                                className="btn btn-primary"
                                                                style={{
                                                                    fontSize: '11px',
                                                                    padding: '8px 16px',
                                                                    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                                                                    border: 'none',
                                                                    borderRadius: '8px',
                                                                    fontWeight: 'bold',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '6px',
                                                                    boxShadow: '0 4px 10px rgba(249, 115, 22, 0.2)'
                                                                }}
                                                            >
                                                                🧾 Faturalandır
                                                            </button>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    onClick={() => handleViewPDF(inv.id)}
                                                                    className="btn btn-outline"
                                                                    style={{
                                                                        fontSize: '11px',
                                                                        padding: '6px 14px',
                                                                        background: 'rgba(255,255,255,0.03)',
                                                                        borderRadius: '8px',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '6px',
                                                                        border: '1px solid rgba(255,255,255,0.1)'
                                                                    }}
                                                                >
                                                                    📄 İndir (PDF)
                                                                </button>
                                                                {inv.formalId && (
                                                                    <div style={{
                                                                        fontSize: '9px',
                                                                        color: 'rgba(16, 185, 129, 0.6)',
                                                                        fontFamily: 'monospace',
                                                                        maxWidth: '120px',
                                                                        overflow: 'hidden',
                                                                        textOverflow: 'ellipsis',
                                                                        whiteSpace: 'nowrap'
                                                                    }} title={inv.formalId}>
                                                                        ID: {inv.formalId}
                                                                    </div>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                                                    <td colSpan={6} style={{ padding: '20px' }}>
                                                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px' }}>
                                                            <div className="flex-between mb-3">
                                                                <h5 className="m-0">Fatura İçeriği</h5>
                                                                <button onClick={() => showWarning('Bilgi', 'Düzenleme yakında eklenecek')} className="btn btn-outline btn-sm" style={{ fontSize: '11px' }}>✏️ İçeriği Düzenle</button>
                                                            </div>
                                                            <table style={{ width: '100%', fontSize: '13px' }}>
                                                                <thead className="text-muted">
                                                                    <tr><th>Ürün</th><th>Miktar</th><th>Birim Fiyat</th><th style={{ textAlign: 'right' }}>Toplam</th></tr>
                                                                </thead>
                                                                <tbody>
                                                                    {(inv.items as any[]).map((item, idx) => (
                                                                        <tr key={idx} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                                                            <td style={{ padding: '8px 0' }}>{item.name}</td>
                                                                            <td>{item.qty}</td>
                                                                            <td style={{ textAlign: 'right' }}>{item.price.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺</td>
                                                                            <td style={{ textAlign: 'right' }}>{(item.qty * item.price).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                            <div className="flex-end mt-4" style={{ fontSize: '16px', fontWeight: 'bold' }}>
                                                                TOPLAM: {inv.totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                                                            </div>

                                                            {/* E-FATURA İŞLEMLERİ */}
                                                            {!inv.isFormal && (
                                                                <div style={{ marginTop: '24px', padding: '20px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                                                                    <h6 style={{ margin: '0 0 16px 0', color: '#3b82f6', fontSize: '14px', fontWeight: 'bold' }}>📄 E-DÖNÜŞÜM İŞLEMLERİ</h6>
                                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                                                        <button
                                                                            onClick={() => handleSendToELogo(inv.id, 'EFATURA')}
                                                                            className="btn btn-primary"
                                                                            style={{
                                                                                padding: '16px 24px',
                                                                                fontSize: '15px',
                                                                                fontWeight: 'bold',
                                                                                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                                                                border: 'none',
                                                                                borderRadius: '10px',
                                                                                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                                                                                cursor: 'pointer',
                                                                                transition: 'all 0.3s ease'
                                                                            }}
                                                                        >
                                                                            🧾 e-Fatura / e-Arşiv Gönder
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleSendToELogo(inv.id, 'EIRSALIYE')}
                                                                            className="btn btn-outline"
                                                                            style={{
                                                                                padding: '16px 24px',
                                                                                fontSize: '15px',
                                                                                fontWeight: 'bold',
                                                                                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                                                                color: 'white',
                                                                                border: 'none',
                                                                                borderRadius: '10px',
                                                                                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                                                                                cursor: 'pointer',
                                                                                transition: 'all 0.3s ease'
                                                                            }}
                                                                        >
                                                                            🚚 e-İrsaliye Gönder
                                                                        </button>
                                                                    </div>
                                                                    <p style={{ margin: '12px 0 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
                                                                        💡 Müşteri VKN durumuna göre otomatik olarak e-Fatura veya e-Arşiv gönderilir
                                                                    </p>
                                                                </div>
                                                            )}

                                                            {inv.isFormal && (
                                                                <div style={{ marginTop: '24px', padding: '20px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                    <div>
                                                                        <h6 style={{ margin: '0 0 8px 0', color: '#10b981', fontSize: '14px', fontWeight: 'bold' }}>✅ Resmileştirildi</h6>
                                                                        <p style={{ margin: '0', fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
                                                                            <strong>UUID:</strong> {inv.formalId}<br />
                                                                            <strong>Tip:</strong> {inv.formalType}
                                                                        </p>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => handleViewPDF(inv.id)}
                                                                        className="btn btn-primary"
                                                                        style={{ padding: '10px 16px', fontSize: '13px', background: '#10b981', border: 'none' }}
                                                                    >
                                                                        📄 PDF Görüntüle
                                                                    </button>
                                                                </div>
                                                            )}
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
                </div>
            )}

            {/* SUB-TAB CONTENT: INCOMING INVOICES */}
            {invoiceSubTab === 'incoming' && (
                <div>
                    <div className="flex-between mb-4">
                        <h3>📥 Gelen Alım Faturaları (Tedarikçiler)</h3>
                        <div className="flex-center gap-2">
                            <button onClick={fetchPurchaseInvoices} className="btn btn-outline" style={{ fontSize: '12px' }}>🔄 Yenile</button>
                        </div>
                    </div>

                    {isLoadingPurchaseInvoices ? <p>Yükleniyor...</p> : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead className="text-muted" style={{ fontSize: '12px', borderBottom: '1px solid var(--border-light)' }}>
                                <tr>
                                    <th style={{ padding: '12px' }}>Fatura Bilgisi</th>
                                    <th>Tarih</th>
                                    <th>Tutar</th>
                                    <th>Durum</th>
                                    <th style={{ textAlign: 'right' }}>İşlem</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedList.length === 0 ? (
                                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px' }} className="text-muted">Gelen fatura bulunamadı.</td></tr>
                                ) : paginatedList.map((inv, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '16px 12px' }}>
                                            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{inv.supplier}</div>
                                            <div className="text-muted" style={{ fontSize: '11px' }}>{inv.id} - {inv.msg}</div>
                                        </td>
                                        <td>{inv.date}</td>
                                        <td style={{ fontWeight: 'bold' }}>{inv.total.toLocaleString()} ₺</td>
                                        <td>
                                            <span style={{
                                                padding: '4px 8px', borderRadius: '4px', fontSize: '11px',
                                                background: inv.status === 'Bekliyor' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                                color: inv.status === 'Bekliyor' ? '#F59E0B' : 'var(--success)',
                                                border: `1px solid ${inv.status === 'Bekliyor' ? '#F59E0B' : 'var(--success)'}`
                                            }}>
                                                {inv.status}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div className="flex-end gap-2">
                                                {inv.status === 'Bekliyor' && (
                                                    <>
                                                        <button onClick={() => handleAcceptPurchaseInvoice(inv.id)} className="btn btn-primary" style={{ fontSize: '11px', background: 'var(--success)', border: 'none' }}>Kabul Et</button>
                                                        <button onClick={() => handleRejectPurchaseInvoice(inv.id)} className="btn btn-outline" style={{ fontSize: '11px', color: '#ff4444', borderColor: '#ff4444' }}>Reddet</button>
                                                    </>
                                                )}
                                                <button onClick={() => handleViewPDF(inv.id)} className="btn btn-ghost" style={{ fontSize: '11px' }}>📄 PDF Görüntüle</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* SUB-TAB CONTENT: WAYSLIPS (İRSALİYELER) */}
            {invoiceSubTab === 'wayslips' && (
                <div>
                    <div className="flex-between mb-4">
                        <h3>🚚 e-İrsaliye Yönetimi</h3>
                        <div className="flex-center gap-2">
                            <button onClick={() => setView('new_wayslip')} className="btn btn-primary" style={{ fontSize: '12px' }}>+ Yeni İrsaliye Oluştur</button>
                            <button onClick={fetchWayslips} className="btn btn-outline" style={{ fontSize: '12px' }}>🔄 Yenile</button>
                        </div>
                    </div>

                    {/* Wayslip Sub-Tabs */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', background: 'rgba(255,255,255,0.02)', padding: '4px', borderRadius: '10px', width: 'fit-content' }}>
                        <button
                            onClick={() => setWayslipType('giden')}
                            style={{
                                padding: '8px 20px',
                                borderRadius: '8px',
                                border: 'none',
                                background: wayslipType === 'giden' ? 'rgba(167, 139, 250, 0.15)' : 'transparent',
                                color: wayslipType === 'giden' ? '#A78BFA' : 'rgba(255,255,255,0.5)',
                                fontSize: '13px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            📤 Giden İrsaliyeler
                        </button>
                        <button
                            onClick={() => setWayslipType('gelen')}
                            style={{
                                padding: '8px 20px',
                                borderRadius: '8px',
                                border: 'none',
                                background: wayslipType === 'gelen' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                                color: wayslipType === 'gelen' ? '#3B82F6' : 'rgba(255,255,255,0.5)',
                                fontSize: '13px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            📥 Gelen İrsaliyeler
                        </button>
                    </div>

                    {isLoadingWayslips ? <p>Yükleniyor...</p> : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead className="text-muted" style={{ fontSize: '12px', borderBottom: '1px solid var(--border-light)' }}>
                                <tr>
                                    <th style={{ padding: '12px' }}>Belge / Sistem No</th>
                                    <th>Tip</th>
                                    <th>Taraf</th>
                                    <th>Tarih</th>
                                    <th>Tutar</th>
                                    <th>Durum</th>
                                    <th style={{ textAlign: 'right' }}>İşlem</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedList.length === 0 ? (
                                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px' }} className="text-muted">İrsaliye bulunamadı.</td></tr>
                                ) : paginatedList.map((irs) => {
                                    const isExpanded = expandedOrderId === irs.id;
                                    return (
                                        <Fragment key={irs.id}>
                                            <tr
                                                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', background: isExpanded ? 'rgba(255,255,255,0.02)' : 'transparent' }}
                                                onClick={() => toggleExpand(irs.id)}
                                            >
                                                <td style={{ padding: '16px 12px' }}>
                                                    <div style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{irs.formalId || irs.invoiceNo || irs.id}</div>
                                                    {irs.formalId && <div style={{ fontSize: '10px', color: 'var(--success)' }}>Resmi e-İrsaliye</div>}
                                                </td>
                                                <td>
                                                    <span style={{
                                                        fontSize: '10px', padding: '2px 6px', borderRadius: '4px',
                                                        background: irs.type === 'Gelen' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(167, 139, 250, 0.1)',
                                                        color: irs.type === 'Gelen' ? '#3B82F6' : '#A78BFA'
                                                    }}>
                                                        {irs.type}
                                                    </span>
                                                </td>
                                                <td style={{ fontWeight: '500' }}>{irs.customer || irs.supplier}</td>
                                                <td style={{ fontSize: '12px' }}>{new Date(irs.date).toLocaleDateString('tr-TR')}</td>
                                                <td>{irs.total?.toLocaleString()} ₺</td>
                                                <td>
                                                    <span style={{
                                                        padding: '4px 8px', borderRadius: '4px', fontSize: '11px',
                                                        background: irs.isFormal ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                        color: irs.isFormal ? 'var(--success)' : 'var(--warning)',
                                                        border: `1px solid ${irs.isFormal ? 'var(--success)' : 'var(--warning)'}`
                                                    }}>
                                                        {irs.status}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <div className="flex-end gap-2">
                                                        {irs.type === 'Giden' && !irs.isFormal && (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleSendToELogo(irs.id, 'EIRSALIYE'); }}
                                                                className="btn btn-primary"
                                                                style={{ fontSize: '11px', padding: '4px 8px', background: 'var(--warning)', border: 'none', color: 'black' }}
                                                            >
                                                                🚀 e-İrsaliye Gönder
                                                            </button>
                                                        )}
                                                        <button
                                                            className="btn btn-outline"
                                                            style={{ fontSize: '11px', padding: '4px 8px' }}
                                                            onClick={(e) => { e.stopPropagation(); toggleExpand(irs.id); }}
                                                        >
                                                            {isExpanded ? 'Kapat' : 'Yönet'}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                                                    <td colSpan={7} style={{ padding: '20px' }}>
                                                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px' }}>
                                                            <div className="flex-between mb-3">
                                                                <h5 className="m-0">İrsaliye İçeriği</h5>
                                                                <div className="flex gap-2">
                                                                    {irs.isFormal && (
                                                                        <button onClick={() => handleViewPDF(irs.id)} className="btn btn-outline btn-sm" style={{ fontSize: '11px' }}>📄 PDF Görüntüle</button>
                                                                    )}
                                                                    {!irs.isFormal && irs.type === 'Giden' && (
                                                                        <button onClick={() => handleDeleteInvoice(irs.id)} className="btn btn-outline btn-sm text-danger" style={{ fontSize: '11px', borderColor: 'rgba(239, 68, 68, 0.3)' }}>🗑️ Sil</button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <table style={{ width: '100%', fontSize: '13px' }}>
                                                                <thead className="text-muted">
                                                                    <tr><th>Ürün</th><th>Miktar</th><th style={{ textAlign: 'right' }}>Birim Fiyat</th><th style={{ textAlign: 'right' }}>Toplam</th></tr>
                                                                </thead>
                                                                <tbody>
                                                                    {(irs.items || []).map((item: any, idx: number) => (
                                                                        <tr key={idx} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                                                            <td style={{ padding: '8px 0' }}>{item.name || item.Name}</td>
                                                                            <td>{item.qty || item.Quantity} {item.unit || item.UnitType}</td>
                                                                            <td style={{ textAlign: 'right' }}>{(item.price || item.Price || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                                                                            <td style={{ textAlign: 'right' }}>{((item.qty || item.Quantity || 0) * (item.price || item.Price || 0)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                            <div className="flex-end mt-4" style={{ fontSize: '16px', fontWeight: 'bold' }}>
                                                                TOPLAM: {irs.total?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
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
                </div>
            )}

            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
    );
}
