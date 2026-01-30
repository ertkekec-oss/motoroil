"use client";

import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useModal } from '@/contexts/ModalContext';

interface SuspiciousEvent {
    id: string;
    timestamp: Date;
    detectedPhrase: string;
    confidence: number;
    hasSaleInLast5Min: boolean;
    branch: string;
    staff: string;
}

export default function SuspiciousActivityPage() {
    const { pendingProducts, approveProduct, rejectProduct, suspiciousEvents: events } = useApp();
    const { showSuccess, showError } = useModal();
    const [filter, setFilter] = useState<'all' | 'today' | 'week'>('today');
    const [branchFilter, setBranchFilter] = useState('all');
    const [activeSecurityTab, setActiveSecurityTab] = useState<'suspicious' | 'approvals'>('suspicious');

    useEffect(() => {
        // Notification permission request on mount for safety
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    const filteredEvents = events.filter(event => {
        const now = new Date();
        const eventDate = new Date(event.timestamp);

        if (filter === 'today') {
            return eventDate.toDateString() === now.toDateString();
        } else if (filter === 'week') {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return eventDate >= weekAgo;
        }

        if (branchFilter !== 'all' && event.branch !== branchFilter) {
            return false;
        }

        return true;
    });

    const todayCount = events.filter(e => new Date(e.timestamp).toDateString() === new Date().toDateString()).length;
    const weekCount = events.filter(e => {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return new Date(e.timestamp) >= weekAgo;
    }).length;

    return (
        <div className="container" style={{ padding: '40px 20px' }}>
            <header className="flex-between" style={{ marginBottom: '32px' }}>
                <div>
                    <h1 className="text-gradient">🛑️ Güvenlik Masası</h1>
                    <p className="text-muted">Şüpheli işlemler ve onay bekleyen talepler</p>
                </div>
                <div className="flex-center gap-4">
                    {activeSecurityTab === 'suspicious' && (
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value as any)}
                            style={{ padding: '8px 12px', background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '6px', color: 'white' }}
                        >
                            <option value="today">Bugün</option>
                            <option value="week">Son 7 Gün</option>
                            <option value="all">Tümü</option>
                        </select>
                    )}
                </div>
            </header>

            {/* Security Tabs */}
            <div className="flex-center mb-8" style={{ justifyContent: 'flex-start', borderBottom: '1px solid var(--border-light)', gap: '24px' }}>
                <button
                    onClick={() => setActiveSecurityTab('suspicious')}
                    className={`btn ${activeSecurityTab === 'suspicious' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ borderBottom: activeSecurityTab === 'suspicious' ? '2px solid var(--primary)' : 'none', borderRadius: '0', padding: '12px 24px' }}
                >
                    🚨 Şüpheli İşlemler ({events.length})
                </button>
                <button
                    onClick={() => setActiveSecurityTab('approvals')}
                    className={`btn ${activeSecurityTab === 'approvals' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ borderBottom: activeSecurityTab === 'approvals' ? '2px solid var(--primary)' : 'none', borderRadius: '0', padding: '12px 24px' }}
                >
                    📋 Onay Bekleyenler ({pendingProducts.filter(p => p.status === 'pending').length})
                </button>
            </div>

            {activeSecurityTab === 'suspicious' ? (
                <>
                    {/* Stats */}
                    <div className="grid-cols-3 gap-6" style={{ marginBottom: '32px' }}>
                        <div className="card glass">
                            <div className="text-muted" style={{ fontSize: '12px' }}>BUGÜN</div>
                            <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--danger)', marginTop: '8px' }}>{todayCount}</div>
                            <div style={{ fontSize: '11px', marginTop: '4px' }}>Şüpheli olay</div>
                        </div>
                        <div className="card glass">
                            <div className="text-muted" style={{ fontSize: '12px' }}>SON 7 GÜN</div>
                            <div style={{ fontSize: '32px', fontWeight: 'bold', marginTop: '8px' }}>{weekCount}</div>
                            <div style={{ fontSize: '11px', marginTop: '4px' }}>Toplam tespit</div>
                        </div>
                        <div className="card glass">
                            <div className="text-muted" style={{ fontSize: '12px' }}>TOPLAM</div>
                            <div style={{ fontSize: '32px', fontWeight: 'bold', marginTop: '8px' }}>{events.length}</div>
                            <div style={{ fontSize: '11px', marginTop: '4px' }}>Tüm kayıtlar</div>
                        </div>
                    </div>

                    {/* Events List */}
                    <div className="card glass">
                        <h3 className="mb-6">📋 Tespit Edilen Olaylar</h3>

                        {filteredEvents.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                                <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
                                <p>Henüz şüpheli olay tespit edilmedi</p>
                            </div>
                        ) : (
                            <div className="flex-col gap-4">
                                {filteredEvents.map(event => (
                                    <div key={event.id} className="card" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)' }}>
                                        <div className="flex-between mb-3">
                                            <div>
                                                <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--danger)' }}>
                                                    "{event.detectedPhrase}"
                                                </div>
                                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                                    {new Date(event.timestamp).toLocaleString('tr-TR')}
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Güven Skoru</div>
                                                <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--warning)' }}>
                                                    %{Math.round(event.confidence * 100)}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid-cols-2 gap-4">
                                            <div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ŞUBE</div>
                                                <div style={{ fontWeight: 'bold' }}>📍 {event.branch}</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>PERSONEL</div>
                                                <div style={{ fontWeight: 'bold' }}>👤 {event.staff}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            ) : (
                /* PENDING APPROVALS TAB */
                <div className="card glass">
                    <h3 className="mb-6">📋 Onay Bekleyen Ürün Kartları</h3>

                    {pendingProducts.filter(p => p.status === 'pending').length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
                            <p>Onay bekleyen talep bulunmuyor</p>
                        </div>
                    ) : (
                        <div className="flex-col gap-4">
                            {pendingProducts.filter(p => p.status === 'pending').map(pending => (
                                <div key={pending.id} className="card" style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid var(--primary)' }}>
                                    <div className="flex-between mb-4">
                                        <div>
                                            <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--primary)' }}>
                                                {pending.productData.name}
                                            </div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                                Talep Eden: {pending.requestedBy} • {new Date(pending.requestedAt).toLocaleString('tr-TR')}
                                            </div>
                                        </div>
                                        <div className="flex-center gap-3">
                                            <button
                                                onClick={() => {
                                                    approveProduct(pending.id);
                                                    showSuccess('Başarılı', '✅ Ürün kartı onaylandı ve envantere eklendi.');
                                                }}
                                                className="btn btn-primary"
                                                style={{ fontSize: '12px' }}
                                            >
                                                ✅ Onayla
                                            </button>
                                            <button
                                                onClick={() => {
                                                    rejectProduct(pending.id);
                                                    showError('Reddedildi', '❌ Talep reddedildi.');
                                                }}
                                                className="btn btn-outline"
                                                style={{ fontSize: '12px', color: 'var(--danger)', borderColor: 'var(--danger)' }}
                                            >
                                                ❌ Reddet
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid-cols-3 gap-4" style={{ fontSize: '13px' }}>
                                        <div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>STOK KODU</div>
                                            <div style={{ fontWeight: 'bold' }}>{pending.productData.code}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>KATEGORİ</div>
                                            <div style={{ fontWeight: 'bold' }}>{pending.productData.category} / {pending.productData.type}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>MARKA</div>
                                            <div style={{ fontWeight: 'bold' }}>{pending.productData.brand || '-'}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ALİŞ FİYATI</div>
                                            <div style={{ fontWeight: 'bold', color: 'var(--warning)' }}>₺ {pending.productData.buyPrice}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>SATIŞ FİYATI</div>
                                            <div style={{ fontWeight: 'bold', color: 'var(--success)' }}>₺ {pending.productData.price}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>STOK MİKTARI</div>
                                            <div style={{ fontWeight: 'bold' }}>{pending.productData.stock} Adet</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
