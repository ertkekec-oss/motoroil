"use client";

import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useModal } from '@/contexts/ModalContext';

export default function BranchSettingsPage() {
    const { kasalar, currentUser, hasPermission, branches: contextBranches } = useApp();
    const { showSuccess } = useModal();
    const isSystemAdmin = currentUser === null;

    // Branch configuration state (Hardcoded default for now, could be dynamic)
    const [branchConfigs, setBranchConfigs] = useState<{ [branch: string]: number[] }>({
        'Merkez': [1, 2, 3],
    });

    const branches = contextBranches?.length > 0 ? contextBranches.map(b => b.name) : ['Merkez', 'Kadıköy'];

    const toggleKasaForBranch = (branch: string, kasaId: number) => {
        const currentKasalar = branchConfigs[branch] || [];
        const newKasalar = currentKasalar.includes(kasaId)
            ? currentKasalar.filter(id => id !== kasaId)
            : [...currentKasalar, kasaId];

        setBranchConfigs({
            ...branchConfigs,
            [branch]: newKasalar
        });
    };

    const saveSettings = () => {
        // In a real app, this would save to backend/database
        showSuccess('Başarılı', '✅ Şube ayarları kaydedildi!');
    };

    if (!hasPermission('settings_manage')) {
        return (
            <div className="container" style={{ padding: '100px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: '60px', marginBottom: '20px' }}>🔐</div>
                <h1 className="text-gradient">Yetkisiz Erişim</h1>
                <p className="text-muted">Şube ayarlarını görüntüleme yetkiniz bulunmamaktadır.</p>
            </div>
        );
    }

    return (
        <div className="container" style={{ padding: '40px 20px' }}>
            <header className="flex-between" style={{ marginBottom: '32px' }}>
                <div>
                    <h1 className="text-gradient">🏢 Şube Ayarları</h1>
                    <p className="text-muted">Şube bazlı kasa/banka erişim yetkileri</p>
                </div>
                <button onClick={saveSettings} className="btn btn-primary">
                    💾 Ayarları Kaydet
                </button>
            </header>

            <div className="card glass">
                <h3 className="mb-6">Şube - Kasa/Banka Eşleştirmeleri</h3>
                <p className="text-muted mb-6" style={{ fontSize: '13px' }}>
                    Her şubenin hangi kasa ve banka hesaplarında işlem yapabileceğini belirleyin.
                    Personeller sadece kendi şubelerine tanımlı hesaplarda işlem görebilir ve yapabilir.
                </p>

                <div className="flex-col gap-6">
                    {branches.map(branch => (
                        <div key={branch} className="card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)' }}>
                            <div className="flex-between mb-4">
                                <div>
                                    <div style={{ fontSize: '18px', fontWeight: 'bold' }}>📍 {branch}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                        {(branchConfigs[branch] || []).length} kasa/banka tanımlı
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
                                {kasalar.map(kasa => {
                                    const isAssigned = (branchConfigs[branch] || []).includes(Number(kasa.id));
                                    return (
                                        <div
                                            key={kasa.id}
                                            onClick={() => toggleKasaForBranch(branch, Number(kasa.id))}
                                            style={{
                                                padding: '16px',
                                                background: isAssigned ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.02)',
                                                border: `2px solid ${isAssigned ? 'var(--success)' : 'var(--border-light)'}`,
                                                borderRadius: '12px',
                                                cursor: 'pointer',
                                                transition: '0.3s',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px'
                                            }}
                                            className="hover-lift"
                                        >
                                            <div style={{
                                                width: '24px',
                                                height: '24px',
                                                borderRadius: '6px',
                                                background: isAssigned ? 'var(--success)' : 'rgba(255,255,255,0.1)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '14px'
                                            }}>
                                                {isAssigned ? '✓' : ''}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{kasa.name}</div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                    {kasa.type} • ₺ {kasa.balance.toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <style jsx>{`
                .hover-lift:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 16px rgba(0,0,0,0.2);
                }
            `}</style>
        </div>
    );
}
