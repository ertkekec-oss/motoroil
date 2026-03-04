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
        <div className="max-w-5xl mx-auto w-full p-8 pt-10 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-[24px] font-semibold text-slate-900 dark:text-white tracking-tight">E-Tahsilat / POS Komisyon Katmanları</h2>
                    <p className="text-[14px] text-slate-500 dark:text-slate-400 mt-1">Kredi kartı ile tahsil edilen tutarlardaki aracı banka/finans firması kesinti sözleşmeleri.</p>
                </div>
            </div>

            {/* FİLTRE & AKSİYON STRIP ÜSTTE (Master prompt kuralı) */}
            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-2xl shadow-[0px_1px_2px_rgba(0,0,0,0.02)] overflow-hidden">
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-white/5 bg-slate-50/50">
                    <div>
                        <h3 className="text-[16px] font-semibold text-slate-900 dark:text-white">Ciro Kesinti Maliyetleri</h3>
                        <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">Tanımlanan oranlar kartlı ödemelerde faturadan otomatik düşülüp gider fişi (komisyon bedeli) olarak kaydedilecektir.</p>
                    </div>
                    <button
                        onClick={() => {
                            const currentComms = salesExpenses?.posCommissions || [];
                            updateSalesExpenses({
                                ...salesExpenses,
                                posCommissions: [...currentComms, { installment: 'Taksit X', rate: 0 }],
                            });
                        }}
                        className="h-10 px-5 bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-white/20 rounded-lg text-slate-700 dark:text-slate-200 text-[13px] font-medium hover:bg-slate-50 transition-colors shadow-sm whitespace-nowrap"
                    >
                        + Yeni Dilim Ekle
                    </button>
                </div>

                {posCommissions.length === 0 ? (
                    <div className="p-16 text-center">
                        <div className="w-16 h-16 bg-slate-50 dark:bg-[#1e293b] rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 border border-slate-200 dark:border-white/5 shadow-sm">
                            💳
                        </div>
                        <p className="text-[15px] font-semibold text-slate-900 dark:text-white">Komisyon Matrisi Boş</p>
                        <p className="text-[13px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                            Herhangi bir banka veya ödeme geçidi komisyon sözleşmesi tanımlanmamış. Satışlarda kesinti hesaplanmayacaktır.
                        </p>
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white dark:bg-[#0f172a] border-b border-slate-200 dark:border-white/5">
                                <th className="px-6 py-4 text-[12px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest w-1/2">Bankacılık Enstrümanı / Taksit Türü</th>
                                <th className="px-6 py-4 text-[12px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest w-1/3">Sanal POS Kesintisi (%)</th>
                                <th className="px-6 py-4 text-[12px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">Düzenle</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {posCommissions.map((comm: any, idx: number) => (
                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 align-top">
                                        <ERPInput
                                            type="text"
                                            value={comm.installment}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                const newComms = [...salesExpenses.posCommissions];
                                                newComms[idx].installment = e.target.value;
                                                updateSalesExpenses({ ...salesExpenses, posCommissions: newComms });
                                            }}
                                            placeholder="Örn: Garanti POS, Peşin Tek Çekim"
                                            className="font-medium bg-transparent border-transparent hover:border-slate-300 focus:bg-white"
                                        />
                                    </td>
                                    <td className="px-6 py-4 align-top">
                                        <div className="relative max-w-[150px]">
                                            <ERPInput
                                                type="number"
                                                value={comm.rate}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                    const newComms = [...salesExpenses.posCommissions];
                                                    newComms[idx].rate = Number(e.target.value);
                                                    updateSalesExpenses({ ...salesExpenses, posCommissions: newComms });
                                                }}
                                                className="pr-10 text-right font-mono font-semibold"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[14px] text-slate-500 dark:text-slate-400 font-bold">%</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 align-top text-right">
                                        <button
                                            onClick={() => {
                                                const newComms = salesExpenses.posCommissions.filter((_: any, i: number) => i !== idx);
                                                updateSalesExpenses({ ...salesExpenses, posCommissions: newComms });
                                            }}
                                            className="h-10 px-4 text-[13px] font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                        >
                                            Kaldır
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {/* Kaydetme Butonu Yok çunku handle direkt state'i güncel tutuyor, ama master component 'updateSalesExpenses' çağırıyor. */}
            </div>

            <div className="mt-6 p-5 border border-amber-200 bg-amber-50 text-amber-800 rounded-xl text-[13px] leading-relaxed flex items-start gap-3">
                <span className="text-xl shrink-0 mt-0.5">⚠️</span>
                <div>
                    <strong className="font-semibold block mb-1">Mali Tabloya Etkisi</strong>
                    Sisteme girilen komisyon tutarları, ilgili faturanın "Ödeme Planında" belirtilen taksit tipine göre hesaplanır. Net Kasa girişi = Yekûn Tutar - Komisyon Kesintisi Şablonu olarak bilançoya yansıtılacaktır.
                </div>
            </div>
        </div>
    );
}
