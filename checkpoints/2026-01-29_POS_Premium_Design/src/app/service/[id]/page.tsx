
"use client";

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';

export default function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);
    const [service, setService] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;

        fetch(`/api/services/${id}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setService(data.service);
                } else {
                    setError(data.error || 'Servis kaydı bulunamadı.');
                }
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <div className="container flex-center" style={{ height: '100vh', color: '#888' }}>
                <div style={{ textAlign: 'center' }}>
                    <div className="spinner mb-4"></div>
                    <p>Servis detayı yükleniyor...</p>
                </div>
            </div>
        );
    }

    if (error || !service) {
        return (
            <div className="container flex-center" style={{ height: '100vh' }}>
                <div className="card glass" style={{ padding: '40px', textAlign: 'center' }}>
                    <h2 className="mb-4 text-danger">⚠️ Hata</h2>
                    <p className="text-muted mb-6">{error || 'Servis kaydı bulunamadı.'}</p>
                    <button onClick={() => router.back()} className="btn btn-primary">Geri Dön</button>
                </div>
            </div>
        );
    }

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        try {
            return new Date(dateString).toLocaleDateString('tr-TR');
        } catch (e) {
            return 'Geçersiz Tarih';
        }
    };

    // Calculate totals
    const items = service.items || [];
    const partsTotal = items.reduce((acc: number, item: any) => acc + (item.isWarranty ? 0 : item.price * item.quantity), 0);
    // Labor is implicitly included in totalAmount in the logic of new page, but let's see. 
    // In new page: totalCost = (totalParts + laborCost) * 1.2
    // We only have totalAmount and items. We can try to deduce labor or just show Total.

    // Actually, in new page we saved items + laborCost logic was not explicitly saved as an item in items, but just added to total.
    // Wait, the new page logic was:
    // items: selectedParts.map(...)
    // totalAmount: totalCost
    // So the labor cost is hidden in totalAmount and NOT in items if we didn't add it to items explicitly.
    // In new page `items` ONLY contains selectedParts.
    // This is a flaw in the save logic if we want to show breakdown.
    // But for now, let's show what we have.

    return (
        <div className="container" style={{ padding: '40px 20px' }}>

            {/* Header */}
            <div className="flex-between mb-8">
                <div>
                    <button onClick={() => router.back()} className="text-muted flex-center gap-2 mb-2 hover:text-white" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        ← Geri Dön
                    </button>
                    <h1 className="text-gradient">Servis Detayı</h1>
                    <div className="text-muted" style={{ fontSize: '14px', marginTop: '4px' }}>
                        Fiş No: <span style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>#{service.id}</span>
                    </div>
                </div>
                <div className="flex-center gap-4">
                    <button className="btn btn-outline" onClick={() => window.print()}>🖨️ Yazdır</button>
                    <div className={`tag ${service.status === 'Tamamlandı' ? 'success' : 'warning'}`} style={{ padding: '8px 16px', fontSize: '14px' }}>
                        {service.status}
                    </div>
                </div>
            </div>

            <div className="grid-cols-3 gap-6" style={{ gridTemplateColumns: '2fr 1fr', alignItems: 'start' }}>

                {/* LEFT: Details */}
                <div className="flex-col gap-6">

                    {/* Customer & Vehicle Info */}
                    <div className="card glass">
                        <h3 className="mb-4" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>Müşteri ve Araç Bilgileri</h3>
                        <div className="grid-cols-2 gap-6">
                            <div>
                                <label className="text-muted" style={{ fontSize: '12px' }}>MÜŞTERİ</label>
                                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{service.customer?.name}</div>
                                <div className="text-muted" style={{ fontSize: '13px' }}>{service.customer?.phone || '-'}</div>
                            </div>
                            <div>
                                <label className="text-muted" style={{ fontSize: '12px' }}>ARAÇ / PLAKA</label>
                                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{service.plate || 'Belirtilmemiş'}</div>
                                {service.vehicleBrand && <div style={{ color: 'var(--primary)', fontWeight: '500', marginTop: '4px' }}>{service.vehicleBrand}</div>}
                                {service.vehicleSerial && <div className="text-muted" style={{ fontSize: '12px' }}>Seri No: {service.vehicleSerial}</div>}
                                <div className="text-muted" style={{ fontSize: '13px', marginTop: '4px' }}>{service.km ? `${service.km} KM` : '-'}</div>
                            </div>
                        </div>
                    </div>

                    {/* Service Items */}
                    <div className="card glass">
                        <h3 className="mb-4" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>Yapılan İşlemler ve Parçalar</h3>

                        {items.length > 0 ? (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr className="text-muted" style={{ fontSize: '12px', textAlign: 'left' }}>
                                        <th style={{ paddingBottom: '12px' }}>PARÇA / İŞLEM</th>
                                        <th style={{ paddingBottom: '12px', width: '80px' }}>ADET</th>
                                        <th style={{ paddingBottom: '12px', textAlign: 'right' }}>BİRİM FİYAT</th>
                                        <th style={{ paddingBottom: '12px', textAlign: 'right' }}>TUTAR</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item: any, i: number) => (
                                        <tr key={i} style={{ borderBottom: '1px solid var(--border-light)', opacity: item.isWarranty ? 0.7 : 1 }}>
                                            <td style={{ padding: '12px 0' }}>
                                                <div className="flex-col">
                                                    <span>{item.name}</span>
                                                    {item.isWarranty && <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 'bold' }}>🛡️ GARANTİ KAPSAMINDA</span>}
                                                </div>
                                            </td>
                                            <td>{item.quantity}</td>
                                            <td style={{ textAlign: 'right' }}>
                                                <span style={{ textDecoration: item.isWarranty ? 'line-through' : 'none', opacity: item.isWarranty ? 0.5 : 1 }}>
                                                    ₺{item.price}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <span style={{ fontWeight: item.isWarranty ? 'normal' : 'bold' }}>
                                                    {item.isWarranty ? '₺0.00' : `₺${(item.price * item.quantity).toFixed(2)}`}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="text-muted">Bu serviste kayıtlı parça/işlem bulunmamaktadır.</p>
                        )}

                        <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                            <label className="text-muted" style={{ fontSize: '12px' }}>NOTLAR</label>
                            <p style={{ marginTop: '4px' }}>{service.notes || '-'}</p>
                        </div>
                    </div>

                </div>

                {/* RIGHT: Summary */}
                <div className="card" style={{ position: 'sticky', top: '20px', borderTop: '4px solid var(--primary)' }}>
                    <h3 className="mb-4">Özet</h3>

                    <div className="flex-between mb-2">
                        <span className="text-muted">İşlem Tarihi</span>
                        <span>{formatDate(service.createdAt)}</span>
                    </div>
                    {service.nextDate && (
                        <div className="flex-between mb-2" style={{ color: 'var(--success)' }}>
                            <span className="text-muted">Sonraki Bakım</span>
                            <span style={{ fontWeight: 'bold' }}>{formatDate(service.nextDate)}</span>
                        </div>
                    )}

                    <div style={{ margin: '20px 0', borderTop: '1px solid var(--border-light)' }}></div>

                    {/* Since we don't have labor logic saved explicitly, we rely on totalAmount */}
                    <div className="flex-between mb-2">
                        <span className="text-muted">Parça Toplamı</span>
                        <span>₺{partsTotal.toFixed(2)}</span>
                    </div>

                    <div className="flex-between mt-4 pt-4" style={{ borderTop: '1px solid var(--border-light)', fontSize: '20px', fontWeight: 'bold' }}>
                        <span>GENEL TOPLAM</span>
                        <span style={{ color: 'var(--primary)' }}>₺{parseFloat(service.totalAmount).toFixed(2)}</span>
                    </div>
                </div>

            </div>
        </div>
    );
}
