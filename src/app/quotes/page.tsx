"use client";

import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useModal } from '@/contexts/ModalContext';

export default function QuotesPage() {
    const { customers } = useApp();
    const { showSuccess, showError } = useModal();

    const [activeTab, setActiveTab] = useState<'list' | 'create' | 'template'>('list');

    return (
        <div className="p-6 pb-32">
            {/* Header */}
            <header className="mb-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-4xl font-black mb-2">📋 Teklif Yönetimi</h1>
                        <p className="text-muted">Müşterilerinize profesyonel teklifler oluşturun ve gönderin</p>
                    </div>
                    <button
                        onClick={() => setActiveTab('create')}
                        className="btn btn-primary"
                        style={{ padding: '12px 24px', fontSize: '14px', fontWeight: '700' }}
                    >
                        + Yeni Teklif Oluştur
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 border-b border-border-light">
                    {[
                        { id: 'list', label: 'Teklif Listesi', icon: '📋' },
                        { id: 'create', label: 'Yeni Teklif', icon: '➕' },
                        { id: 'template', label: 'Şablon Ayarları', icon: '🎨' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-6 py-3 font-bold text-sm transition-all ${activeTab === tab.id
                                    ? 'border-b-2 border-primary text-primary'
                                    : 'text-muted hover:text-main'
                                }`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>
            </header>

            {/* Content */}
            <div className="card glass" style={{ padding: '60px', textAlign: 'center' }}>
                <div style={{ fontSize: '64px', marginBottom: '20px' }}>🚧</div>
                <h2 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '12px' }}>
                    Teklif Yönetimi Sistemi
                </h2>
                <p style={{ opacity: 0.7, marginBottom: '24px', maxWidth: '600px', margin: '0 auto' }}>
                    Profesyonel teklif oluşturma, mail gönderimi ve şablon düzenleme özellikleri yakında eklenecek.
                </p>
                <div style={{ marginTop: '32px', padding: '24px', background: 'var(--bg-subtle)', borderRadius: '16px', maxWidth: '500px', margin: '32px auto 0' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '900', marginBottom: '16px' }}>Planlanan Özellikler:</h3>
                    <ul style={{ textAlign: 'left', lineHeight: '2' }}>
                        <li>✅ Teklif listesi görüntüleme</li>
                        <li>✅ Yeni teklif oluşturma</li>
                        <li>✅ Ürün/hizmet ekleme</li>
                        <li>✅ Otomatik fiyat hesaplama</li>
                        <li>✅ Mail ile gönderim</li>
                        <li>✅ PDF export</li>
                        <li>✅ Düzenlenebilir şablon</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
