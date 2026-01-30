
"use client";

import { useState } from 'react';

export default function InvoicesPage() {
    const [activeTab, setActiveTab] = useState('incoming'); // incoming, outgoing, settings

    // MOCK DATA: Gelen E-Faturalar (Tedarikçilerden)
    const incomingInvoices = [
        { id: 'FAT-2026-001', supplier: 'Motul Otomotiv A.Ş.', date: '24.01.2026', amount: 45000, status: 'Onay Bekliyor', items: 'Motor Yağı, Hidrolik...' },
        { id: 'FAT-2026-002', supplier: 'Shimano Türkiye', date: '23.01.2026', amount: 12400, status: 'Onaylandı', items: 'Vites Grubu, Balata' },
        { id: 'FAT-2026-003', supplier: 'Enerjisa Elektrik', date: '20.01.2026', amount: 1200, status: 'Onaylandı', items: 'Elektrik Tüketim Bedeli' },
    ];

    // MOCK DATA: Giden E-Faturalar (Bizim Kestiklerimiz)
    const outgoingInvoices = [
        { id: 'GIB-2026-992', customer: 'Ahmet Yılmaz', date: '24.01.2026', amount: 3200, status: 'GİB\'e İletildi', type: 'e-Arşiv' },
        { id: 'GIB-2026-991', customer: 'Motor Kurye Ltd.', date: '24.01.2026', amount: 1500, status: 'Başarılı', type: 'e-Fatura' },
        { id: 'GIB-2026-990', customer: 'Hasan Demir', date: '24.01.2026', amount: 450, status: 'Başarılı', type: 'e-Arşiv' },
    ];

    return (
        <div className="container" style={{ padding: '40px 20px' }}>

            {/* Header */}
            <header className="flex-between" style={{ marginBottom: '32px' }}>
                <div>
                    <h1 className="text-gradient">E-Fatura Merkezi</h1>
                    <p className="text-muted">Gelen/Giden Faturalar ve Entegrasyon</p>
                </div>
                <div className="flex-center gap-4">
                    {/* Entegratör Durumu */}
                    <div className="card flex-center gap-2" style={{ padding: '8px 16px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid #3B82F6' }}>
                        <span style={{ width: '8px', height: '8px', background: '#3B82F6', borderRadius: '50%' }}></span>
                        <span style={{ fontSize: '12px', color: '#3B82F6' }}>Entegratör: NİLVERA</span>
                    </div>
                </div>
            </header>

            {/* Main Content Card */}
            <div className="card glass" style={{ minHeight: '600px' }}>

                {/* Tabs */}
                <div className="flex-center" style={{ justifyContent: 'flex-start', borderBottom: '1px solid var(--border-light)', marginBottom: '24px' }}>
                    <button
                        onClick={() => setActiveTab('incoming')}
                        style={{
                            padding: '16px 24px',
                            background: 'transparent',
                            border: 'none',
                            borderBottom: activeTab === 'incoming' ? '2px solid var(--primary)' : '2px solid transparent',
                            color: activeTab === 'incoming' ? 'white' : 'var(--text-muted)',
                            cursor: 'pointer', fontWeight: '500'
                        }}
                    >
                        ↓ Gelen Faturalar <span style={{ fontSize: '12px', background: 'var(--bg-hover)', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px' }}>3</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('outgoing')}
                        style={{
                            padding: '16px 24px',
                            background: 'transparent',
                            border: 'none',
                            borderBottom: activeTab === 'outgoing' ? '2px solid var(--primary)' : '2px solid transparent',
                            color: activeTab === 'outgoing' ? 'white' : 'var(--text-muted)',
                            cursor: 'pointer', fontWeight: '500'
                        }}
                    >
                        ↑ Giden Faturalar
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        style={{
                            padding: '16px 24px', marginLeft: 'auto',
                            background: 'transparent', border: 'none',
                            color: activeTab === 'settings' ? 'white' : 'var(--text-muted)',
                            cursor: 'pointer'
                        }}
                    >
                        ⚙ Entegrasyon Ayarları
                    </button>
                </div>

                {/* --- INCOMING INVOICES TAB --- */}
                {activeTab === 'incoming' && (
                    <div>
                        <div className="flex-between" style={{ marginBottom: '16px' }}>
                            <span className="text-muted">Nilvera üzerinden çekilen faturalar</span>
                            <button className="btn btn-outline" style={{ fontSize: '12px' }}>⟳ Şimdi Eşitle</button>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead className="text-muted" style={{ fontSize: '12px', borderBottom: '1px solid var(--border-light)' }}>
                                <tr>
                                    <th style={{ padding: '12px' }}>Fatura No</th>
                                    <th>Tedarikçi</th>
                                    <th>İçerik</th>
                                    <th>Tutar</th>
                                    <th>Durum</th>
                                    <th>İşlem</th>
                                </tr>
                            </thead>
                            <tbody style={{ fontSize: '14px' }}>
                                {incomingInvoices.map((inv) => (
                                    <tr key={inv.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '16px 12px', fontFamily: 'monospace' }}>{inv.id}</td>
                                        <td style={{ fontWeight: '500' }}>
                                            {inv.supplier}
                                            <div className="text-muted" style={{ fontSize: '12px' }}>{inv.date}</div>
                                        </td>
                                        <td className="text-muted" style={{ fontSize: '13px' }}>{inv.items}</td>
                                        <td style={{ fontWeight: 'bold' }}>{inv.amount.toLocaleString()} ₺</td>
                                        <td>
                                            <span style={{
                                                padding: '4px 8px', borderRadius: '4px', fontSize: '12px',
                                                background: inv.status === 'Onay Bekliyor' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                                                color: inv.status === 'Onay Bekliyor' ? '#F59E0B' : 'var(--success)'
                                            }}>
                                                {inv.status}
                                            </span>
                                        </td>
                                        <td>
                                            {inv.status === 'Onay Bekliyor' ? (
                                                <button className="btn btn-primary" style={{ padding: '6px 16px', fontSize: '12px' }}>Stoklara İşle</button>
                                            ) : (
                                                <button className="btn btn-outline" style={{ padding: '6px 16px', fontSize: '12px', opacity: 0.5 }} disabled>İşlendi</button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* --- OUTGOING INVOICES TAB --- */}
                {activeTab === 'outgoing' && (
                    <div>
                        <div className="flex-between" style={{ marginBottom: '16px' }}>
                            <span className="text-muted">Nilvera Giden Kutusu</span>
                            <div className="flex-center gap-2">
                                <input type="text" placeholder="Fatura ara..." style={{ background: 'var(--bg-deep)', border: '1px solid var(--border-light)', padding: '8px', borderRadius: '4px', color: 'white' }} />
                            </div>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead className="text-muted" style={{ fontSize: '12px', borderBottom: '1px solid var(--border-light)' }}>
                                <tr>
                                    <th style={{ padding: '12px' }}>Belge No</th>
                                    <th>Müşteri</th>
                                    <th>Tip</th>
                                    <th>Tutar</th>
                                    <th>GİB Durumu</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody style={{ fontSize: '14px' }}>
                                {outgoingInvoices.map((inv) => (
                                    <tr key={inv.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '16px 12px', fontFamily: 'monospace' }}>{inv.id}</td>
                                        <td>
                                            {inv.customer}
                                            <div className="text-muted" style={{ fontSize: '12px' }}>{inv.date}</div>
                                        </td>
                                        <td>
                                            <span style={{ fontSize: '12px', border: '1px solid var(--border-light)', padding: '2px 6px', borderRadius: '4px' }}>
                                                {inv.type}
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: 'bold' }}>{inv.amount.toLocaleString()} ₺</td>
                                        <td style={{ color: 'var(--success)' }}>✔ {inv.status}</td>
                                        <td style={{ textAlign: 'right' }}>
                                            <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '12px' }}>PDF</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* --- SETTINGS TAB (NILVERA) --- */}
                {activeTab === 'settings' && (
                    <div style={{ maxWidth: '600px' }}>
                        <div className="flex-center gap-4" style={{ marginBottom: '24px', justifyContent: 'flex-start' }}>
                            <div style={{ padding: '8px', background: 'white', borderRadius: '8px' }}>
                                {/* Nilvera Logo Placeholder */}
                                <span style={{ color: '#000', fontWeight: 'bold' }}>NİLVERA</span>
                            </div>
                            <h3 style={{ margin: 0 }}>Entegrasyon Ayarları</h3>
                        </div>

                        <div className="flex-col gap-4">

                            <div className="card" style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid #3B82F6' }}>
                                <p style={{ fontSize: '13px', color: '#93C5FD' }}>
                                    ℹ Nilvera portalından alacağınız API Key'i aşağıya giriniz.
                                    Test ortamı için 'Sandbox' seçeneğini kullanın.
                                </p>
                            </div>

                            <div className="flex-col gap-2">
                                <label className="text-muted" style={{ fontSize: '12px' }}>ÇALIŞMA ORTAMI</label>
                                <select style={{ padding: '12px', background: 'var(--bg-deep)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'white' }}>
                                    <option value="live">CANLI (Gerçek Faturalar)</option>
                                    <option value="sandbox">SANDBOX (Test Ortamı)</option>
                                </select>
                            </div>

                            <div className="flex-col gap-2">
                                <label className="text-muted" style={{ fontSize: '12px' }}>API KEY (AUTHORIZATION)</label>
                                <input
                                    type="password"
                                    placeholder="API Anahtarınızı buraya yapıştırın..."
                                    defaultValue="nilvera_api_key_xxxxx"
                                    style={{ padding: '12px', background: 'var(--bg-deep)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'white' }}
                                />
                            </div>

                            <div className="flex-col gap-2">
                                <label className="text-muted" style={{ fontSize: '12px' }}>VERGİ NUMARASI (VKN)</label>
                                <input type="text" placeholder="Şirket Vergi No" style={{ padding: '12px', background: 'var(--bg-deep)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'white' }} />
                            </div>

                            <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-light)', paddingTop: '20px' }}>
                                <div className="flex-between" style={{ marginBottom: '16px' }}>
                                    <div>
                                        <div style={{ fontWeight: '500' }}>Otomatik Fatura Eşitleme</div>
                                        <div className="text-muted" style={{ fontSize: '12px' }}>Gelen/Giden faturaları Nilvera ile anlık senkronize et</div>
                                    </div>
                                    <input type="checkbox" checked readOnly style={{ width: '20px', height: '20px', accentColor: 'var(--primary)' }} />
                                </div>

                                <div className="flex-between">
                                    <div>
                                        <div style={{ fontWeight: '500' }}>WhatsApp/SMS Bildirimi</div>
                                        <div className="text-muted" style={{ fontSize: '12px' }}>Fatura kesildiğinde müşteriye link gönder</div>
                                    </div>
                                    <input type="checkbox" style={{ width: '20px', height: '20px' }} />
                                </div>
                            </div>

                            <div className="flex-center gap-4 mt-4">
                                <button className="btn btn-primary w-full">Bağlantıyı Test Et & Kaydet</button>
                                <button className="btn btn-outline">Log Kayıtları</button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
