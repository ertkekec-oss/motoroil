"use client";

import React from 'react';

interface GlobalErrorProps {
    error: any;
    reset?: () => void;
}

export default function GlobalErrorScreen({ error, reset }: GlobalErrorProps) {
    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--bg-deep)',
            color: 'var(--text-main)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
            textAlign: 'center',
            fontFamily: "'Outfit', sans-serif"
        }}>
            <div style={{
                fontSize: '60px',
                marginBottom: '20px',
                animation: 'pulse 2s infinite'
            }}>
                🚫
            </div>

            <h1 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                marginBottom: '10px',
                color: '#ef4444'
            }}>
                Sistem Güvenliği Devreye Girdi
            </h1>

            <p style={{
                maxWidth: '500px',
                marginBottom: '30px',
                opacity: 0.8,
                lineHeight: '1.6'
            }}>
                Veri bütünlüğünü korumak için uygulama durduruldu.
                Aşağıdaki kritik modüllerde veri akışı sağlanamadı veya güvenlik ihlali algılandı:
            </p>

            <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '30px',
                fontFamily: 'monospace',
                fontSize: '14px',
                color: '#fca5a5'
            }}>
                Error Code: {error?.message || 'UNKNOWN_CRITICAL_FAILURE'}
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>
                <button
                    onClick={() => window.location.reload()}
                    style={{
                        background: 'var(--primary)',
                        color: 'white',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: '6px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    Tekrar Dene
                </button>

                <button
                    onClick={() => window.location.href = '/login'}
                    style={{
                        background: 'transparent',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border-light)',
                        padding: '12px 24px',
                        borderRadius: '6px',
                        fontWeight: '600',
                        cursor: 'pointer'
                    }}
                >
                    Güvenli Çıkış
                </button>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes pulse {
                    0% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.7; transform: scale(0.95); }
                    100% { opacity: 1; transform: scale(1); }
                }
            ` }} />
        </div>
    );
}
