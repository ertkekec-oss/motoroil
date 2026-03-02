import React from 'react';
import {
    EnterpriseCard,
    EnterprisePageShell,
    EnterpriseField,
    EnterpriseInput,
    EnterpriseButton,
} from '@/components/ui/enterprise';

// ─── ZERO LOGIC CHANGE ────────────────────────────────────────────────────────
// State, handler, submit, API, validation → HİÇBİR ŞEY DEĞİŞMEDİ.
// Yalnızca UI katmanı Enterprise primitive'lere geçirildi.
// ─────────────────────────────────────────────────────────────────────────────

export default function TaxesPanel(props: any) {
    const {
        invoiceSettings,
        updateInvoiceSettings,
        newKdv,
        setNewKdv,
        addKdv,
    } = props;

    const kdvRates: number[] = (invoiceSettings as any)?.kdvRates || [];

    return (
        <EnterprisePageShell
            title="KDV & Vergiler"
            description="Sistemde kullanılacak KDV oranlarını bu panelden yönetin."
        >
            <EnterpriseCard>
                {/* Mevcut oranlar */}
                {kdvRates.length > 0 ? (
                    <div className="space-y-2 mb-6">
                        {kdvRates.map((rate: number, idx: number) => (
                            <div
                                key={idx}
                                className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-lg font-semibold text-slate-900 dark:text-white">%{rate}</span>
                                    <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">KDV Oranı</span>
                                </div>
                                <button
                                    onClick={() => {
                                        const currentRates = (invoiceSettings as any)?.kdvRates || [];
                                        const newRates = currentRates.filter((_: any, i: number) => i !== idx);
                                        updateInvoiceSettings({ ...invoiceSettings, kdvRates: newRates });
                                    }}
                                    className="text-rose-500 hover:text-rose-600 text-sm font-medium transition-colors px-3 py-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20"
                                >
                                    Kaldır
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 text-slate-400 dark:text-slate-600 mb-6">
                        <div className="text-3xl mb-2">📋</div>
                        <p className="text-sm">Henüz vergi oranı tanımlanmamış.</p>
                    </div>
                )}

                {/* Yeni oran ekle */}
                <div className="border-t border-slate-200 dark:border-slate-800 pt-5">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Yeni Vergi Oranı Ekle</p>
                    <div className="flex items-end gap-3">
                        <div className="flex-1 relative">
                            <EnterpriseField label="KDV ORANI (%)">
                                <EnterpriseInput
                                    type="number"
                                    placeholder="0"
                                    value={newKdv}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewKdv(e.target.value)}
                                    onKeyDown={(e: React.KeyboardEvent) => {
                                        if (e.key === 'Enter') addKdv();
                                    }}
                                />
                            </EnterpriseField>
                        </div>
                        <EnterpriseButton variant="primary" onClick={addKdv} className="shrink-0 mb-0">
                            + Ekle
                        </EnterpriseButton>
                    </div>
                </div>
            </EnterpriseCard>
        </EnterprisePageShell>
    );
}
