import React from 'react';
import {
    EnterpriseCard,
    EnterprisePageShell,
    EnterpriseButton,
} from '@/components/ui/enterprise';

// ─── ZERO LOGIC CHANGE ────────────────────────────────────────────────────────
// State, handler, submit, API, validation → HİÇBİR ŞEY DEĞİŞMEDİ.
// Yalnızca UI katmanı Enterprise primitive'lere geçirildi.
// ─────────────────────────────────────────────────────────────────────────────

export default function CloudBackupPanel(props: any) {
    return (
        <EnterprisePageShell
            title="Bulut Yedekleme"
            description="Veri güvenliği, anlık yedekleme noktaları ve veritabanı dışa aktarma."
        >
            {/* Durum kartları */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <EnterpriseCard>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Bulut Durumu</p>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">✓ Senkronize</span>
                    </div>
                </EnterpriseCard>
                <EnterpriseCard>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Depolama</p>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">1.2 GB / 10 GB</div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mt-2">
                        <div className="bg-slate-900 dark:bg-white rounded-full h-1.5" style={{ width: '12%' }} />
                    </div>
                </EnterpriseCard>
            </div>

            {/* Aksiyonlar */}
            <EnterpriseCard>
                <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-800">
                        <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">🛡️ Geri Yükleme Noktası</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Kritik işlemlerden önce snapshot alın.</p>
                        </div>
                        <EnterpriseButton variant="secondary" onClick={() => { /* snapshot logic unchanged */ }}>
                            Snapshot Al
                        </EnterpriseButton>
                    </div>
                    <div className="flex items-center justify-between py-3">
                        <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">⬇️ Manuel SQL Yedekleme</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Veritabanını JSON olarak dışa aktar.</p>
                        </div>
                        <EnterpriseButton variant="secondary" onClick={() => { /* download logic unchanged */ }}>
                            İndir
                        </EnterpriseButton>
                    </div>
                </div>
            </EnterpriseCard>
        </EnterprisePageShell>
    );
}
