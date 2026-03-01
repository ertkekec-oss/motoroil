"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useFinancials } from '@/contexts/FinancialContext';
import { useModal } from '@/contexts/ModalContext';

export default function BranchSettingsPage() {
    const { currentUser, hasPermission, branches: contextBranches } = useApp();
    const { kasalar } = useFinancials();
    const { showSuccess } = useModal();
    const isSystemAdmin = currentUser === null;

    // Memoize branches to prevent re-creation on every render
    const branches = useMemo(() =>
        contextBranches?.length > 0 ? contextBranches.map(b => b.name) : [],
        [contextBranches]
    );

    // Branch configuration state - using string IDs for kasalar (CUID format)
    const [branchConfigs, setBranchConfigs] = useState<{ [branch: string]: string[] }>({});

    // Track if we've initialized to prevent re-initialization
    const isInitialized = useRef(false);

    // Initialize branch configs from DB or context
    useEffect(() => {
        const fetchConfigs = async () => {
            if (branches.length > 0 && !isInitialized.current) {
                try {
                    const res = await fetch('/api/settings');
                    const data = await res.json();
                    if (data && data.branchKasaMappings) {
                        setBranchConfigs(data.branchKasaMappings);
                    } else {
                        const configs: { [branch: string]: string[] } = {};
                        branches.forEach(branch => {
                            configs[branch] = [];
                        });
                        setBranchConfigs(configs);
                    }
                    isInitialized.current = true;
                } catch (e) {
                    console.error('Fetch error:', e);
                }
            }
        };
        fetchConfigs();
    }, [branches]);

    const toggleKasaForBranch = (branch: string, kasaId: string) => {
        setBranchConfigs(prevConfigs => {
            const currentKasalar = prevConfigs[branch] || [];
            const isCurrentlyAssigned = currentKasalar.includes(kasaId);
            const newKasalar = isCurrentlyAssigned
                ? currentKasalar.filter(id => id !== kasaId)
                : [...currentKasalar, kasaId];

            return {
                ...prevConfigs,
                [branch]: newKasalar
            };
        });
    };

    const saveSettings = async () => {
        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ branchKasaMappings: branchConfigs })
            });
            if (res.ok) {
                showSuccess('Başarılı', '✅ Şube ayarları veritabanına kaydedildi!');
            }
        } catch (e) {
            console.error('Save error:', e);
        }
    };

    if (!hasPermission('settings_manage')) {
        return (
            <div className="container">
                <div>🔐</div>
                <h1 className="text-[30px] font-bold text-slate-800 dark:text-white">Yetkisiz Erişim</h1>
                <p className="text-muted">Şube ayarlarını görüntüleme yetkiniz bulunmamaktadır.</p>
            </div>
        );
    }

    return (
        <div className="container">
            <header className="flex-between">
                <div>
                    <h1 className="text-[30px] font-bold text-slate-800 dark:text-white">🏢 Şube Ayarları</h1>
                    <p className="text-muted">Şube bazlı kasa/banka erişim yetkileri</p>
                </div>
                <button onClick={saveSettings} className="btn bg-blue-600 hover:bg-blue-700 text-white !border-none transition-colors">
                    💾 Ayarları Kaydet
                </button>
            </header>

            <div className="bg-white dark:bg-[#111827] rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm transition-all">
                <h3 className="mb-6">Şube - Kasa/Banka Eşleştirmeleri</h3>
                <p className="text-muted mb-6">
                    Her şubenin hangi kasa ve banka hesaplarında işlem yapabileceğini belirleyin.
                    Personeller sadece kendi şubelerine tanımlı hesaplarda işlem görebilir ve yapabilir.
                </p>

                <div className="flex-col gap-6">
                    {branches.map(branch => (
                        <div key={branch} className="card">
                            <div className="flex-between mb-4">
                                <div>
                                    <div>📍 {branch}</div>
                                    <div>
                                        {(branchConfigs[branch] || []).length} kasa/banka tanımlı
                                    </div>
                                </div>
                            </div>

                            <div>
                                {kasalar.map(kasa => {
                                    // Use string ID directly - no conversion needed
                                    const kasaId = String(kasa.id);
                                    const isAssigned = (branchConfigs[branch] || []).includes(kasaId);

                                    return (
                                        <div
                                            key={kasa.id}
                                            onClick={() => toggleKasaForBranch(branch, kasaId)}
                                            className="hover-lift"
                                        >
                                            <div>
                                                {isAssigned ? '✓' : ''}
                                            </div>
                                            <div>
                                                <div>{kasa.name}</div>
                                                <div>
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
                    box-shadow: 0 8px 16px 'transparent';
                }
            `}</style>
        </div>
    );
}
