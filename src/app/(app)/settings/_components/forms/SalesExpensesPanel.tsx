import React from 'react';

// ─── ZERO LOGIC CHANGE ────────────────────────────────────────────────────────
// State, handler, submit, API, validation → HİÇBİR ŞEY DEĞİŞMEDİ.
// Yalnızca UI katmanı Financial Control (ERP) standardına geçirildi.
// ─────────────────────────────────────────────────────────────────────────────

function ERPInput(props: any) {
    return (
        <input
            {...props}
            className={`w-full h-10 px-3 bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-white/20 rounded-lg text-[14px] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white/20 focus:border-slate-900 dark:focus:border-white/30 transition-all shadow-sm disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:text-slate-500 dark:disabled:text-slate-400 disabled:border-slate-200 dark:disabled:border-white/10 ${props.className || ''}`}
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

export default function SalesExpensesPanel(props: any) {
    const {
        salesExpenses,
        updateSalesExpenses,
    } = props;

    const posCommissions: any[] = salesExpenses?.posCommissions || [];

    return (
        <div className="max-w-5xl mx-auto w-full p-4 lg:p-8 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">E-Tahsilat / POS Komisyon Katmanları</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Kredi kartı ile tahsil edilen tutarlardaki aracı banka/finans firması kesinti sözleşmeleri.</p>
                </div>
            </div>

            {/* FİLTRE & AKSİYON STRIP ÜSTTE */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-5 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-slate-800/50">
                    <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">Ciro Kesinti Maliyetleri</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 block">Tanımlanan oranlar kartlı ödemelerde faturadan otomatik düşülüp gider fişi (komisyon bedeli) olarak kaydedilecektir.</p>
                    </div>
                    <button
                        onClick={() => {
                            const currentComms = salesExpenses?.posCommissions || [];
                            updateSalesExpenses({
                                ...salesExpenses,
                                posCommissions: [...currentComms, { installment: 'Taksit X', rate: 0 }],
                            });
                        }}
                        className="h-10 px-5 bg-indigo-600 hover:bg-indigo-700 text-white border border-transparent rounded-xl text-[13px] font-bold transition-all shadow-sm shadow-indigo-500/20 whitespace-nowrap shrink-0"
                    >
                        + Yeni Dilim Ekle
                    </button>
                </div>

                {posCommissions.length === 0 ? (
                    <div className="p-16 text-center">
                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 border border-slate-200 dark:border-white/5 shadow-sm">
                            💳
                        </div>
                        <p className="text-[15px] font-bold text-slate-900 dark:text-white mb-2">Komisyon Matrisi Boş</p>
                        <p className="text-[13px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
                            Herhangi bir banka veya ödeme geçidi komisyon sözleşmesi tanımlanmamış. Satışlarda kesinti hesaplanmayacaktır.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-white/10">
                                    <th className="px-6 py-4 text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest w-1/2">Bankacılık Enstrümanı / Taksit Türü</th>
                                    <th className="px-6 py-4 text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest w-1/3 text-center">Sanal POS Kesintisi (%)</th>
                                    <th className="px-6 py-4 text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">İşlem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {posCommissions.map((comm: any, idx: number) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <ERPInput
                                                type="text"
                                                value={comm.installment}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                    const newComms = [...salesExpenses.posCommissions];
                                                    newComms[idx].installment = e.target.value;
                                                    updateSalesExpenses({ ...salesExpenses, posCommissions: newComms });
                                                }}
                                                placeholder="Örn: Garanti POS, Peşin Tek Çekim"
                                                className="font-bold bg-white dark:bg-slate-900 dark:text-white dark:border-white/10"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="relative max-w-[150px] mx-auto">
                                                <ERPInput
                                                    type="number"
                                                    value={comm.rate}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                        const newComms = [...salesExpenses.posCommissions];
                                                        newComms[idx].rate = Number(e.target.value);
                                                        updateSalesExpenses({ ...salesExpenses, posCommissions: newComms });
                                                    }}
                                                    className="pr-10 text-right font-mono font-bold bg-white dark:bg-slate-900 dark:text-white dark:border-white/10"
                                                />
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[14px] text-slate-400 dark:text-slate-500 font-bold">%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => {
                                                    const newComms = salesExpenses.posCommissions.filter((_: any, i: number) => i !== idx);
                                                    updateSalesExpenses({ ...salesExpenses, posCommissions: newComms });
                                                }}
                                                className="h-10 px-4 text-[13px] font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors shrink-0"
                                            >
                                                Kaldır
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="mt-8 p-5 border border-indigo-200 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/5 text-indigo-800 dark:text-indigo-300 rounded-2xl text-sm leading-relaxed flex items-start gap-4 shadow-[0px_1px_2px_rgba(0,0,0,0.02)]">
                <span className="text-2xl shrink-0">ℹ️</span>
                <div>
                    <strong className="font-black block mb-1.5 uppercase tracking-wide">Mali Tabloya Etkisi</strong>
                    Sisteme girilen komisyon tutarları, ilgili faturanın "Ödeme Planında" belirtilen taksit tipine göre hesaplanır. Net kasa girişi, Yekûn tutar üzerinden Komisyon Kesintisinin düşülmesiyle bilançoya yansıtılır.
                </div>
            </div>
        </div>
    );
}
