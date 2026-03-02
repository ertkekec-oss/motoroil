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

export default function ServiceFeesPanel(props: any) {
    const {
        localServiceSettings,
        setLocalServiceSettings,
        handleSaveServiceSettings,
    } = props;

    const services = [
        {
            icon: '🏍️',
            label: 'Motosiklet Bakım',
            field: 'motoMaintenancePrice',
            price: localServiceSettings?.motoMaintenancePrice ?? 0,
        },
        {
            icon: '🚲',
            label: 'Bisiklet Bakım',
            field: 'bikeMaintenancePrice',
            price: localServiceSettings?.bikeMaintenancePrice ?? 0,
        },
    ];

    return (
        <EnterprisePageShell
            title="Servis Ücretleri"
            description="Hizmet türlerine göre otomatik uygulanan işçilik ücretlerini belirleyin."
        >
            <EnterpriseCard>
                <div className="space-y-4 mb-6">
                    {services.map((s) => (
                        <div
                            key={s.field}
                            className="flex items-center justify-between gap-6 p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl"
                        >
                            <div>
                                <div className="text-sm font-medium text-slate-900 dark:text-white">
                                    {s.icon} {s.label}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    Otomatik uygulanan işçilik bedeli
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <EnterpriseInput
                                    type="number"
                                    value={s.price}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        setLocalServiceSettings({
                                            ...localServiceSettings,
                                            [s.field]: Number(e.target.value),
                                        })
                                    }
                                    className="w-28 text-right"
                                />
                                <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 w-4">₺</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
                    <EnterpriseButton variant="primary" onClick={handleSaveServiceSettings}>
                        💾 Ayarları Kaydet
                    </EnterpriseButton>
                </div>
            </EnterpriseCard>
        </EnterprisePageShell>
    );
}
