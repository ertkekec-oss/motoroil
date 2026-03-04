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

function ERPField({ label, children }: { label: string, children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1.5 focus-within:text-slate-900">
            <label className="text-[12px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest transition-colors">{label}</label>
            {children}
        </div>
    );
}

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
        <div className="max-w-4xl animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-[24px] font-semibold text-slate-900 dark:text-white tracking-tight">KDV & Vergi Matrah Yapılandırması</h2>
                    <p className="text-[14px] text-slate-500 dark:text-slate-400 mt-1">Stok/Hizmet tanımlarında kullanılmak üzere yasal vergi dilimlerini belirleyin.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* SOL PANEL: Ekleyici Form */}
                <div className="md:col-span-5">
                    <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-[0px_1px_2px_rgba(0,0,0,0.02)] sticky top-6">
                        <div className="mb-6 pb-5 border-b border-slate-100 dark:border-white/5">
                            <h3 className="text-[16px] font-semibold text-slate-900 dark:text-white">Yeni Oran Deklarasyonu</h3>
                            <p className="text-[14px] text-slate-500 dark:text-slate-400 mt-1">Mali takvime eklenen yeni yasal istisnai oranlar.</p>
                        </div>

                        <div className="space-y-4">
                            <ERPField label="EKLENECEK KDV ORANI (%)">
                                <div className="flex gap-2 relative">
                                    <ERPInput
                                        type="number"
                                        placeholder="Örn: 18"
                                        value={newKdv}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewKdv(e.target.value)}
                                        onKeyDown={(e: React.KeyboardEvent) => {
                                            if (e.key === 'Enter') addKdv();
                                        }}
                                        className="font-mono text-[15px] font-semibold pr-8"
                                    />
                                    <span className="absolute left-[calc(100%-4rem)] top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-bold ml-1">%</span>

                                    <button
                                        onClick={addKdv}
                                        className="h-10 px-5 bg-slate-900 dark:bg-white text-white rounded-lg text-[13px] font-medium shadow-sm hover:bg-slate-800 transition-colors shrink-0 flex items-center gap-2"
                                    >
                                        Ekle <span>+</span>
                                    </button>
                                </div>
                            </ERPField>
                        </div>
                    </div>
                </div>

                {/* SAĞ PANEL: Liste */}
                <div className="md:col-span-7">
                    <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-2xl shadow-[0px_1px_2px_rgba(0,0,0,0.02)] overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h3 className="text-[16px] font-semibold text-slate-900 dark:text-white">Geçerli Yasal Dilimler</h3>
                                <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">Aşağıdaki oranlar fatura kalemlerinde seçilebilir durumdadır.</p>
                            </div>
                            <span className="inline-flex items-center justify-center min-w-8 h-8 px-2 bg-slate-100 text-[12px] font-bold text-slate-700 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-white/5 shadow-sm shrink-0">
                                {kdvRates.length}
                            </span>
                        </div>

                        {kdvRates.length > 0 ? (
                            <table className="w-full text-left">
                                <tbody className="divide-y divide-slate-100">
                                    {kdvRates.map((rate: number, idx: number) => (
                                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[15px] font-bold text-indigo-700 shadow-sm">
                                                        %{rate}
                                                    </div>
                                                    <div>
                                                        <div className="text-[14px] font-semibold text-slate-900 dark:text-white">Katma Değer Vergisi</div>
                                                        <div className="text-[12px] text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">SİSTEM ONAYLI</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right align-middle">
                                                <button
                                                    onClick={() => {
                                                        const currentRates = (invoiceSettings as any)?.kdvRates || [];
                                                        const newRates = currentRates.filter((_: any, i: number) => i !== idx);
                                                        updateInvoiceSettings({ ...invoiceSettings, kdvRates: newRates });
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 h-8 px-3 text-[12px] font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded bg-white dark:bg-[#0f172a] border border-red-200 transition-all focus:opacity-100"
                                                >
                                                    İptal Et
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="p-16 text-center">
                                <div className="w-16 h-16 bg-slate-50 dark:bg-[#1e293b] rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 border border-slate-200 dark:border-white/5 shadow-sm">
                                    🧾
                                </div>
                                <p className="text-[15px] font-semibold text-slate-900 dark:text-white">Vergi Dilimi Bulunamadı</p>
                                <p className="text-[13px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                                    Sistemde mevcut bir hesaplama oranı tanımlanmamış. Sol panele girip ekleme yapınız.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
