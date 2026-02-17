"use client";

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('FRONTEND_ERROR_BOUNDARY:', error);
    }, [error]);

    return (
        <div style={{
            padding: '40px',
            background: '#0f0f12',
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontFamily: 'sans-serif'
        }}>
            <div style={{
                maxWidth: '600px',
                width: '100%',
                background: '#16161a',
                border: '1px solid #222',
                borderRadius: '16px',
                padding: '32px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
            }}>
                <div style={{
                    fontSize: '40px',
                    marginBottom: '20px'
                }}>⚠️</div>

                <h1 style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    marginBottom: '12px',
                    color: '#ff4444'
                }}>Sistem Hatası Yakalandı</h1>

                <p style={{
                    color: '#888',
                    marginBottom: '24px',
                    lineHeight: '1.6'
                }}>
                    Müşteri bilgileri yüklenirken teknik bir sorun oluştu.
                    Bu hata genellikle veri yapısındaki bir uyumsuzluktan kaynaklanır.
                </p>

                <div style={{
                    background: 'rgba(0,0,0,0.3)',
                    padding: '16px',
                    borderRadius: '8px',
                    marginBottom: '24px',
                }}>
                    <div style={{ fontSize: '12px', color: '#555', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Hata Detayı</div>
                    <code style={{
                        color: '#ff4444',
                        fontSize: '14px',
                        wordBreak: 'break-all'
                    }}>
                        {error.message || 'Bilinmeyen Hata'}
                    </code>
                    {error.digest && (
                        <div style={{ marginTop: '12px', fontSize: '11px', color: '#444' }}>
                            Digest: {error.digest}
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={() => reset()}
                        style={{
                            flex: 1,
                            padding: '12px',
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        Tekrar Dene
                    </button>
                    <button
                        onClick={() => window.location.href = '/customers'}
                        style={{
                            padding: '12px 20px',
                            background: 'transparent',
                            color: '#ccc',
                            border: '1px solid #333',
                            borderRadius: '8px',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        Listeye Dön
                    </button>
                </div>
            </div>
        </div>
    );
}
