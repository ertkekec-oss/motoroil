import React from 'react';
import {
    EnterpriseCard,
    EnterprisePageShell,
    EnterpriseField,
    EnterpriseInput,
    EnterpriseTextarea,
    EnterpriseButton,
} from '@/components/ui/enterprise';

// ─── ZERO LOGIC CHANGE ────────────────────────────────────────────────────────
// State, handler, submit, API, validation → HİÇBİR ŞEY DEĞİŞMEDİ.
// Yalnızca UI katmanı Enterprise primitive'lere geçirildi.
// ─────────────────────────────────────────────────────────────────────────────

export default function InvoiceSettingsPanel(props: any) {
    const {
        invoiceSettings,
        updateInvoiceSettings,
    } = props;

    return (
        <EnterprisePageShell
            title="Fatura Ayarları"
            description="Belge seri numarası ve varsayılan fatura notlarını yapılandırın."
        >
            <EnterpriseCard>
                <div className="space-y-6">
                    {/* Fatura notu */}
                    <EnterpriseField
                        label="FATURA NOTU (VARSAYILAN)"
                        hint="Her yeni faturada otomatik olarak bu not eklenir."
                    >
                        <EnterpriseTextarea
                            rows={3}
                            value={invoiceSettings?.defaultNote || ''}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                                updateInvoiceSettings({ ...invoiceSettings, defaultNote: e.target.value })
                            }
                            placeholder="Örn: Ödeme 30 gün içinde yapılmalıdır."
                        />
                    </EnterpriseField>

                    {/* Seri no ayarları */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <EnterpriseField
                            label="SERİ ÖN EKİ"
                            hint="Fatura numarasının başına eklenir."
                        >
                            <EnterpriseInput
                                type="text"
                                value={invoiceSettings?.prefix || ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    updateInvoiceSettings({ ...invoiceSettings, prefix: e.target.value })
                                }
                                placeholder="Örn: INV-"
                            />
                        </EnterpriseField>
                        <EnterpriseField
                            label="SIRADAKİ NUMARA"
                            hint="Bir sonraki faturaya atanacak numara."
                        >
                            <EnterpriseInput
                                type="number"
                                value={invoiceSettings?.nextNumber || 0}
                                readOnly
                            />
                        </EnterpriseField>
                    </div>

                    {/* Aksiyon */}
                    <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
                        <EnterpriseButton
                            variant="primary"
                            onClick={() => updateInvoiceSettings(invoiceSettings)}
                        >
                            💾 Ayarları Kaydet
                        </EnterpriseButton>
                    </div>
                </div>
            </EnterpriseCard>
        </EnterprisePageShell>
    );
}
