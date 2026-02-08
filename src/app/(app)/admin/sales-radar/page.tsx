
"use client";

import { useState, useEffect } from 'react';
import { useModal } from '@/contexts/ModalContext';

export default function SalesRadarPage() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { showError } = useModal();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/admin/sales-radar');
                const json = await res.json();
                if (json.error) throw new Error(json.error);
                setData(json);
            } catch (e: any) {
                showError("Veri Hatası", e.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [showError]);

    if (loading) return <div style={{ padding: '40px', color: 'white' }}>Radar taranıyor...</div>;

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'CRITICAL_LIMIT': return <span style={{ background: '#ef4444', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>🔥 KRİTİK LİMİT</span>;
            case 'UPSELL_READY': return <span style={{ background: '#f59e0b', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>⚠️ HAZIR</span>;
            case 'EXPANSION_CANDIDATE': return <span style={{ background: '#3b82f6', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>🚀 ADAY</span>;
            default: return <span style={{ background: '#10b981', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>✅ SAĞLIKLI</span>;
        }
    };

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: '900', color: 'white', marginBottom: '8px' }}>🎯 SATIŞ RADARI (SALES RADAR)</h1>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>Veriye dayalı akıllı upsell fırsatlarını takip edin.</p>
            </div>

            <div style={{ display: 'grid', gap: '16px' }}>
                {data.map(item => (
                    <div key={item.id} style={{
                        background: 'var(--bg-card)',
                        padding: '20px',
                        borderRadius: '16px',
                        border: '1px solid rgba(255,255,255,0.06)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                                <h3 style={{ margin: 0, fontSize: '16px', color: 'white' }}>{item.name}</h3>
                                {getStatusBadge(item.status)}
                            </div>
                            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
                                {item.ownerEmail} • <strong>{item.currentPlan}</strong>
                            </div>
                        </div>

                        <div style={{ flex: 1.5, padding: '0 20px' }}>
                            {item.signal ? (
                                <div style={{
                                    background: 'rgba(255,255,255,0.03)',
                                    padding: '10px 15px',
                                    borderRadius: '8px',
                                    fontSize: '13px',
                                    color: 'rgba(255,255,255,0.8)',
                                    borderLeft: `3px solid ${item.status === 'CRITICAL_LIMIT' ? '#ef4444' : '#f59e0b'}`
                                }}>
                                    {item.signal.message}
                                </div>
                            ) : (
                                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.2)' }}>Aktif sinyal bulunmuyor.</div>
                            )}
                        </div>

                        <div style={{ textAlign: 'right', minWidth: '150px' }}>
                            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>
                                Firmalar: {item.metrics.companies} • Userlar: {item.metrics.users}
                            </div>
                            <button
                                onClick={() => window.location.href = `/admin/tenants/${item.id}`}
                                style={{
                                    padding: '8px 16px',
                                    background: 'rgba(255,255,255,0.1)',
                                    border: 'none',
                                    color: 'white',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    cursor: 'pointer'
                                }}
                            >
                                DETAYA GİT
                            </button>
                        </div>
                    </div>
                ))}

                {data.length === 0 && (
                    <div style={{ padding: '60px', textAlign: 'center', color: 'rgba(255,255,255,0.2)' }}>
                        Radar temiz. Gösterilecek aday bulunamadı.
                    </div>
                )}
            </div>
        </div>
    );
}
