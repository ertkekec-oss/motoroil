import React from 'react';

// ─── ZERO LOGIC CHANGE ────────────────────────────────────────────────────────
// State, handler, submit, API, validation → HİÇBİR ŞEY DEĞİŞMEDİ.
// Yalnızca UI katmanı Financial Control (ERP) standardına geçirildi.
// ─────────────────────────────────────────────────────────────────────────────

function ERPInput(props: any) {
    return (
        <input
            {...props}
            className={`w-full h-10 px-3 bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-white/10 rounded-lg text-[14px] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white/20 focus:border-slate-900 dark:focus:border-white/30 transition-all shadow-sm disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:text-slate-500 disabled:border-slate-200 ${props.className || ''}`}
        />
    );
}

function ERPTextarea(props: any) {
    return (
        <textarea
            {...props}
            className={`w-full p-3 bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-white/10 rounded-lg text-[14px] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white/20 focus:border-slate-900 dark:focus:border-white/30 transition-all shadow-sm ${props.className || ''}`}
        />
    );
}

function ERPField({ label, hint, children }: { label: string, hint?: string, children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1.5 focus-within:text-slate-900">
            <div className="flex items-center justify-between">
                <label className="text-[12px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest transition-colors">{label}</label>
                {hint && <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">{hint}</span>}
            </div>
            {children}
        </div>
    );
}

function ERPBlock({ title, description, children }: { title?: string, description?: string, children: React.ReactNode }) {
    return (
        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-[0px_1px_2px_rgba(0,0,0,0.02)] mb-6">
            {(title || description) && (
                <div className="mb-6 pb-5 border-b border-slate-100 dark:border-white/5">
                    {title && <h3 className="text-[16px] font-semibold text-slate-900 dark:text-white">{title}</h3>}
                    {description && <p className="text-[14px] text-slate-500 dark:text-slate-400 mt-1">{description}</p>}
                </div>
            )}
            {children}
        </div>
    );
}

export default function InvoiceSettingsPanel(props: any) {
    const {
        invoiceSettings,
        updateInvoiceSettings,
    } = props;

    return (
        <div className="max-w-4xl animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-[24px] font-semibold text-slate-900 dark:text-white tracking-tight">Fatura Formatı & Serileme Modülü</h2>
                    <p className="text-[14px] text-slate-500 dark:text-slate-400 mt-1">E-arşiv matbaası, teklif ve irsaliyelerde kullanılacak yasal dizinim metrikleri.</p>
                </div>

                <div className="shrink-0">
                    <button
                        onClick={() => updateInvoiceSettings(invoiceSettings)}
                        className="h-10 px-6 bg-slate-900 dark:bg-white border border-slate-900 rounded-lg text-white text-[14px] font-medium hover:bg-slate-800 transition-colors shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 dark:focus:ring-white/20 flex items-center gap-2"
                    >
                        <span>💾</span> Blok Ayarlarını Kaydet
                    </button>
                </div>
            </div>

            {/* Bölüm: Genel Fatura İçeriği */}
            <ERPBlock title="Varsayılan İçerik Blokları" description="Oluşturulacak belgenin altında daima yer alacak standart metinlerdir.">
                <ERPField
                    label="OTOMATİK TEBLİGAT NOTU"
                    hint="Fatura altı yasal bilgilendirme"
                >
                    <ERPTextarea
                        rows={4}
                        value={invoiceSettings?.defaultNote || ''}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                            updateInvoiceSettings({ ...invoiceSettings, defaultNote: e.target.value })
                        }
                        placeholder="Örn: İsbu faturaya itiraz süresi 8 gündür. Gecikmelerde vade farkı uygulanacaktır."
                    />
                </ERPField>
            </ERPBlock>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Bölüm: Seri Çekirdeği */}
                <ERPBlock title="Seri Format Ön Eki" description="Numara üreticisinin alfa sayısal parametresi.">
                    <div className="flex flex-col gap-4">
                        <ERPField label="PREFIX KODU" hint="Örn: INV, FAT">
                            <ERPInput
                                type="text"
                                value={invoiceSettings?.prefix || ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    updateInvoiceSettings({ ...invoiceSettings, prefix: e.target.value })
                                }
                                placeholder="INV-"
                            />
                        </ERPField>
                        <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-800 text-[12px] leading-relaxed">
                            <strong className="block mb-1">Mali Onaylı Serileme</strong>
                            Maliye bakanlığı standartlarında özel entegratör üzerinden otomatik olarak E-FATURA portallarından numara alınmaktadır. Buradaki ek, sadece iç sistemler içindir.
                        </div>
                    </div>
                </ERPBlock>

                {/* Bölüm: Increment Matrix */}
                <ERPBlock title="Yürütme Çarpanı (Sıra)" description="Matbaaya gönderilecek ilk belgenin referans sırası.">
                    <ERPField label="SIRADAKİ FATURA İNDEKSİ" hint="Üretilmiş son belgeden +1 fazlasıdır.">
                        <ERPInput
                            type="number"
                            value={invoiceSettings?.nextNumber || 0}
                            readOnly
                            className="bg-slate-50 dark:bg-[#1e293b] text-slate-600 dark:text-slate-300 font-mono text-lg"
                        />
                    </ERPField>

                    <div className="mt-4 flex items-center justify-between p-3 border border-slate-200 dark:border-white/5 rounded-lg text-[13px] font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-[#1e293b]">
                        <span>Gösterim:</span>
                        <span className="font-mono text-slate-900 dark:text-white font-bold bg-white dark:bg-[#0f172a] px-2 py-1 border border-slate-200 dark:border-white/5 rounded">
                            {invoiceSettings?.prefix || 'INV-'}{invoiceSettings?.nextNumber?.toString().padStart(6, '0') || '000000'}
                        </span>
                    </div>
                </ERPBlock>
            </div>
        </div>
    );
}
