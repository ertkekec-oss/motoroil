import React from 'react';

// ─── ZERO LOGIC CHANGE ────────────────────────────────────────────────────────
// State, handler, submit, API, validation → HİÇBİR ŞEY DEĞİŞMEDİ.
// Yalnızca UI katmanı Financial Control (ERP) standardına geçirildi.
// ─────────────────────────────────────────────────────────────────────────────

function ERPInput(props: any) {
    return (
        <input
            {...props}
            className={`w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-all shadow-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200 ${props.className || ''}`}
        />
    );
}

export default function ServiceFeesPanel(props: any) {
    const {
        localServiceSettings,
        setLocalServiceSettings,
        handleSaveServiceSettings,
    } = props;

    const services = [
        {
            icon: '🏍️',
            label: 'Motosiklet Periyodik Bakım',
            field: 'motoMaintenancePrice',
            price: localServiceSettings?.motoMaintenancePrice ?? 0,
        },
        {
            icon: '🚲',
            label: 'Bisiklet Periyodik Bakım',
            field: 'bikeMaintenancePrice',
            price: localServiceSettings?.bikeMaintenancePrice ?? 0,
        },
    ];

    return (
        <div className="max-w-4xl animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-[24px] font-semibold text-slate-900 tracking-tight">Servis & İşçilik Tarifeleri</h2>
                    <p className="text-[14px] text-slate-500 mt-1">İş emri açılışlarında varsayılan olarak satırlara eklenecek olan hizmet bedelleri.</p>
                </div>

                <div className="shrink-0 flex items-center gap-3">
                    <button
                        onClick={handleSaveServiceSettings}
                        className="h-10 px-6 bg-slate-900 border border-slate-900 rounded-lg text-white text-[14px] font-medium hover:bg-slate-800 transition-colors shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 flex items-center gap-2"
                    >
                        <span>💾</span> Bilanço Tarifesini Kaydet
                    </button>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-[0px_1px_2px_rgba(0,0,0,0.02)] overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h3 className="text-[16px] font-semibold text-slate-900">Sabit Hizmet Kalemleri Listesi</h3>
                        <p className="text-[13px] text-slate-500 mt-0.5">Bakım formları oluşturulduğunda maliyete otomatik yansıyacaktır.</p>
                    </div>
                </div>

                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-white border-b border-slate-200">
                            <th className="px-6 py-4 text-[12px] font-semibold text-slate-500 uppercase tracking-widest w-2/3">Servis Operasyon Dalı</th>
                            <th className="px-6 py-4 text-[12px] font-semibold text-slate-500 uppercase tracking-widest text-right">Sabit Tarife (TRY)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {services.map((s) => (
                            <tr key={s.field} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-lg shadow-sm shrink-0">
                                            {s.icon}
                                        </div>
                                        <div>
                                            <div className="text-[14px] font-medium text-slate-900">{s.label}</div>
                                            <div className="text-[12px] text-slate-500 mt-0.5">Genel işçilik ve diagnoz inceleme bedeli fiks tarifesi.</div>
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
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[14px] font-bold text-slate-400">₺</span>
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
