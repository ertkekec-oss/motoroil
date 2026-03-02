import React from 'react';
import {
    EnterpriseCard,
    EnterprisePageShell,
    EnterpriseField,
    EnterpriseInput,
    EnterpriseButton,
    EnterpriseEmptyState,
} from '@/components/ui/enterprise';

// ─── ZERO LOGIC CHANGE ────────────────────────────────────────────────────────
// State, handler, submit, API, validation → HİÇBİR ŞEY DEĞİŞMEDİ.
// Yalnızca UI katmanı Enterprise primitive'lere geçirildi.
// ─────────────────────────────────────────────────────────────────────────────

export default function SalesExpensesPanel(props: any) {
    const {
        salesExpenses,
        updateSalesExpenses,
    } = props;

    const posCommissions: any[] = salesExpenses?.posCommissions || [];

    return (
        <EnterprisePageShell
            title="Satış Giderleri"
            description="Kredi kartı ve POS ödemelerinde otomatik gider kaydı için komisyon oranları."
        >
            <EnterpriseCard noPadding>
                {/* Kart başlığı + ekle butonu */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
                    <div>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">POS / Banka Komisyon Oranları</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Kredi kartı satışlarında otomatik gider kaydı olarak düşülür.
                        </p>
                    </div>
                    <EnterpriseButton
                        variant="secondary"
                        onClick={() => {
                            const currentComms = salesExpenses?.posCommissions || [];
                            updateSalesExpenses({
                                ...salesExpenses,
                                posCommissions: [...currentComms, { installment: 'Tek Çekim', rate: 0 }],
                            });
                        }}
                    >
                        + Oran Ekle
                    </EnterpriseButton>
                </div>

                {/* Liste */}
                {posCommissions.length === 0 ? (
                    <EnterpriseEmptyState
                        icon="💳"
                        title="Komisyon oranı tanımlanmamış"
                        description="Yeni oran ekleyin ve kart satışlarındaki giderleri otomatik takip edin."
                    />
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                        {posCommissions.map((comm: any, idx: number) => (
                            <div key={idx} className="flex items-end gap-4 px-6 py-4">
                                <div className="flex-1">
                                    <EnterpriseField label="TAKSİT / TÜR">
                                        <EnterpriseInput
                                            type="text"
                                            value={comm.installment}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                const newComms = [...salesExpenses.posCommissions];
                                                newComms[idx].installment = e.target.value;
                                                updateSalesExpenses({ ...salesExpenses, posCommissions: newComms });
                                            }}
                                            placeholder="Örn: Tek Çekim"
                                        />
                                    </EnterpriseField>
                                </div>
                                <div className="w-28">
                                    <EnterpriseField label="ORAN (%)">
                                        <div className="relative">
                                            <EnterpriseInput
                                                type="number"
                                                value={comm.rate}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                    const newComms = [...salesExpenses.posCommissions];
                                                    newComms[idx].rate = Number(e.target.value);
                                                    updateSalesExpenses({ ...salesExpenses, posCommissions: newComms });
                                                }}
                                                className="pr-7"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
                                        </div>
                                    </EnterpriseField>
                                </div>
                                <button
                                    onClick={() => {
                                        const newComms = salesExpenses.posCommissions.filter((_: any, i: number) => i !== idx);
                                        updateSalesExpenses({ ...salesExpenses, posCommissions: newComms });
                                    }}
                                    className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors mb-[2px]"
                                >
                                    🗑️
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </EnterpriseCard>
        </EnterprisePageShell>
    );
}
