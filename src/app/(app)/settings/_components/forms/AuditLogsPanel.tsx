import React from 'react';

// ─── ZERO LOGIC CHANGE ────────────────────────────────────────────────────────
// State, handler, submit, API, validation → HİÇBİR ŞEY DEĞİŞMEDİ.
// Yalnızca UI katmanı Financial Control (ERP) standardına geçirildi.
// ─────────────────────────────────────────────────────────────────────────────

function ERPTable({ headers, children }: { headers: string[], children: React.ReactNode }) {
    return (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-[0px_1px_2px_rgba(0,0,0,0.02)] overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-200">
                            {headers.map((h, i) => (
                                <th key={i} className="px-6 py-4 text-[12px] font-semibold text-slate-500 uppercase tracking-widest whitespace-nowrap">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {children}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default function AuditLogsPanel(props: any) {
    const {
        logs,
        isLogsLoading,
        fetchLogs,
    } = props;

    // Sadece mevcut log varsa tablo, yoksa boş durum
    const hasLogs = logs && logs.length > 0;

    return (
        <div className="max-w-6xl animate-in fade-in duration-300">
            {/* Header Alanı */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-[24px] font-semibold text-slate-900 tracking-tight">Sistem İşlem Günlükleri (Audit)</h2>
                    <p className="text-[14px] text-slate-500 mt-1">Sistemdeki tüm konfigürasyon değişiklikleri ve kritik kullanıcı eylemleri denetim izine kaydedilir.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        className="h-10 px-4 bg-white border border-slate-300 rounded-lg text-slate-700 text-[14px] font-medium hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                        disabled={true}
                    >
                        <span>📥</span> Dışa Aktar (CSV)
                    </button>
                    <button
                        onClick={fetchLogs}
                        disabled={isLogsLoading}
                        className="h-10 px-4 bg-slate-900 border border-slate-900 rounded-lg text-white text-[14px] font-medium hover:bg-slate-800 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
                    >
                        {isLogsLoading ? (
                            <><div className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" /> Veriler İndiriliyor</>
                        ) : (
                            <>🔄 Günlükleri Tazele</>
                        )}
                    </button>
                </div>
            </div>

            {/* Filtre / Bilgi Strip Alanı */}
            <div className="mb-6 p-4 bg-white border border-slate-200 rounded-xl shadow-[0px_1px_2px_rgba(0,0,0,0.02)] flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
                    <div>
                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest leading-none mb-1">Kayıt Durumu</p>
                        <p className="text-[13px] font-medium text-slate-900">Gerçek Zamanlı İzleme Aktif</p>
                    </div>
                </div>
                <div className="w-px h-8 bg-slate-200 hidden sm:block" />
                <div>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest leading-none mb-1">Görünür Kayıt</p>
                    <p className="text-[14px] font-semibold text-slate-900">{logs?.length || 0} Adet İşlem</p>
                </div>
            </div>

            {/* Veri Tablosu veya Boş Durum */}
            {!hasLogs ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-[0px_1px_2px_rgba(0,0,0,0.02)]">
                    <div className="w-16 h-16 mx-auto bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-sm">
                        📜
                    </div>
                    <h3 className="text-[16px] font-semibold text-slate-900 mb-2">Denetim Kaydı Bulunamadı</h3>
                    <p className="text-[14px] text-slate-500 max-w-sm mx-auto mb-6">
                        Bu hesaba ait herhangi bir sistem eylemi veya konfigürasyon değişikliği izi bulunmuyor.
                    </p>
                    <button
                        onClick={fetchLogs}
                        className="h-10 px-5 bg-white border border-slate-300 rounded-lg text-slate-700 text-[14px] font-medium hover:bg-slate-50 transition-colors shadow-sm"
                    >
                        Tekrar Sorgula
                    </button>
                </div>
            ) : (
                <ERPTable
                    headers={[
                        'Tarih / Zaman',
                        'Kullanıcı İşlemi',
                        'Sistem Nesnesi',
                        'Log Detayı'
                    ]}
                >
                    {(logs || []).map((log: any) => (
                        <tr key={log.id} className="hover:bg-slate-50/80 transition-colors group">
                            <td className="px-6 py-4">
                                <div className="text-[13px] font-medium text-slate-900 whitespace-nowrap">
                                    {new Date(log.createdAt).toLocaleString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div className="text-[12px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                    {log.userName || 'Sistem Yürütmesi'}
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700 uppercase tracking-widest">
                                    {log.action}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <span className="text-[13px] font-medium text-slate-800 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                                    {log.entity}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <div className="text-[13px] text-slate-600 truncate max-w-sm group-hover:whitespace-normal group-hover:max-w-none transition-all">
                                    {log.details || '-'}
                                </div>
                            </td>
                        </tr>
                    ))}
                </ERPTable>
            )}
        </div>
    );
}
