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

export default function ServiceFeesPanel(props: any) {
    const {
        localServiceSettings,
        setLocalServiceSettings,
        handleSaveServiceSettings,
        vehicleTypes
    } = props;

    const getIcon = (type: string) => {
        const lower = type.toLowerCase();
        if (lower.includes('moto')) return '🏍️';
        if (lower.includes('bisiklet')) return '🚲';
        if (lower.includes('otomobil') || lower.includes('araba')) return '🚗';
        if (lower.includes('kamyon')) return '🚚';
        if (lower.includes('elektrikli')) return '⚡';
        return '🔧';
    };

    const services = (vehicleTypes || []).map((type: string) => ({
        icon: getIcon(type),
        label: `${type} Periyodik Bakım`,
        field: type,
        price: localServiceSettings?.[type] ?? 0,
    }));

    return (
        <div className="max-w-5xl mx-auto w-full p-8 pt-10 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-[24px] font-semibold text-slate-900 dark:text-white tracking-tight">Servis & İşçilik Tarifeleri</h2>
                    <p className="text-[14px] text-slate-500 dark:text-slate-400 mt-1">İş emri açılışlarında varsayılan olarak satırlara eklenecek olan hizmet bedelleri.</p>
                </div>

                <div className="shrink-0 flex items-center gap-3">
                    <button
                        onClick={handleSaveServiceSettings}
                        className="h-10 px-6 bg-slate-900 dark:bg-white border border-slate-900 rounded-lg text-white text-[14px] font-medium hover:bg-slate-800 transition-colors shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 dark:focus:ring-white/20 flex items-center gap-2"
                    >
                        <span>💾</span> Bilanço Tarifesini Kaydet
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-2xl shadow-[0px_1px_2px_rgba(0,0,0,0.02)] overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h3 className="text-[16px] font-semibold text-slate-900 dark:text-white">Sabit Hizmet Kalemleri Listesi</h3>
                        <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">Bakım formları oluşturulduğunda maliyete otomatik yansıyacaktır.</p>
                    </div>
                </div>

                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-white dark:bg-[#0f172a] border-b border-slate-200 dark:border-white/5">
                            <th className="px-6 py-4 text-[12px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest w-2/3">Servis Operasyon Dalı</th>
                            <th className="px-6 py-4 text-[12px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">Sabit Tarife (TRY)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {services.map((s) => (
                            <tr key={s.field} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 flex items-center justify-center text-lg shadow-sm shrink-0">
                                            {s.icon}
                                        </div>
                                        <div>
                                            <div className="text-[14px] font-medium text-slate-900 dark:text-white">{s.label}</div>
                                            <div className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">Genel işçilik ve diagnoz inceleme bedeli fiks tarifesi.</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-5 align-middle text-right w-48">
                                    <div className="relative inline-block w-32">
                                        <ERPInput
                                            type="number"
                                            value={s.price}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                setLocalServiceSettings({
                                                    ...localServiceSettings,
                                                    [s.field]: Number(e.target.value),
                                                })
                                            }
                                            className="text-right font-mono font-semibold pr-8 pb-1 pt-1 h-10 w-full"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[14px] font-bold text-slate-400 dark:text-slate-500">₺</span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

        </div>
    );
}
