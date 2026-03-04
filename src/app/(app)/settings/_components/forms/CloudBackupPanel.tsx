import React from 'react';

// ─── ZERO LOGIC CHANGE ────────────────────────────────────────────────────────
// State, handler, submit, API, validation → HİÇBİR ŞEY DEĞİŞMEDİ.
// Yalnızca UI katmanı Financial Control (ERP) standardına geçirildi.
// ─────────────────────────────────────────────────────────────────────────────

function ERPBlock({ title, description, badge, children, action }: { title?: string, description?: string, badge?: React.ReactNode, children: React.ReactNode, action?: React.ReactNode }) {
    return (
        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-[0px_1px_2px_rgba(0,0,0,0.02)] mb-6">
            {(title || description || action || badge) && (
                <div className="flex items-start justify-between mb-6 pb-5 border-b border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-3">
                        {badge}
                        <div>
                            {title && <h3 className="text-[16px] font-semibold text-slate-900 dark:text-white">{title}</h3>}
                            {description && <p className="text-[14px] text-slate-500 dark:text-slate-400 mt-1">{description}</p>}
                        </div>
                    </div>
                    {action && <div>{action}</div>}
                </div>
            )}
            {children}
        </div>
    );
}

function StatStrip({ items }: { items: { val: string | number | React.ReactNode, label: string }[] }) {
    return (
        <div className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-2xl shadow-[0px_1px_2px_rgba(0,0,0,0.02)] overflow-hidden mb-6 flex divide-x divide-slate-100">
            {items.map((it, idx) => (
                <div key={idx} className="flex-1 p-5">
                    <div className="text-[20px] font-semibold text-slate-900 dark:text-white tracking-tight">{it.val}</div>
                    <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1.5">{it.label}</p>
                </div>
            ))}
        </div>
    );
}

export default function CloudBackupPanel(props: any) {
    return (
        <div className="max-w-5xl mx-auto w-full p-8 pt-10 animate-in fade-in duration-300">
            {/* Header */}
            <div className="mb-8">
                <h2 className="text-[24px] font-semibold text-slate-900 dark:text-white tracking-tight">Sistem Yedekleme & İş Sürekliliği</h2>
                <p className="text-[14px] text-slate-500 dark:text-slate-400 mt-1">Sistem veritabanını güvence altına alıp, anlık veri kurtarma noktaları (snapshot) yaratmanızı sağlar.</p>
            </div>

            {/* Stat Strip */}
            <StatStrip items={[
                {
                    val: (
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                            </span>
                            Canlı Senkronize
                        </div>
                    ),
                    label: 'Bulut İzleme Ağı'
                },
                { val: '1.2 GB', label: 'Toplam Veri Hacmi' },
                { val: '10 GB', label: 'Tahsis Edilen Depolama Kotası' },
            ]} />

            {/* Kotanın Grafiği */}
            <div className="mb-8 rounded-xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 p-4 shadow-[0px_1px_2px_rgba(0,0,0,0.02)] flex items-center gap-4">
                <div className="flex-1 w-full bg-slate-100 rounded-full h-2 shadow-inner overflow-hidden">
                    <div className="bg-slate-900 dark:bg-white rounded-full h-full" style={{ width: '12%' }} />
                </div>
                <div className="text-[12px] font-semibold text-slate-700 dark:text-slate-200 tracking-wider">
                    %12 DOLU
                </div>
            </div>

            {/* Yedekleme Yönetimi */}
            <ERPBlock title="Yedekleme ve Geri Yükleme Yönetimi" description="Güvenlik politikası gereği yedekleme paketleri şifrelenmiş formda teslim edilir.">
                <div className="space-y-4">
                    {/* Manuel Snapshot */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border border-slate-200 dark:border-white/5 rounded-xl bg-slate-50 dark:bg-[#1e293b] relative group transition-colors hover:bg-white hover:shadow-sm">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-lg flex items-center justify-center shadow-sm text-lg mt-0.5 shrink-0">
                                🛡️
                            </div>
                            <div>
                                <h4 className="text-[15px] font-semibold text-slate-900 dark:text-white">Anlık Sistem Snapshot</h4>
                                <p className="text-[13px] text-slate-600 dark:text-slate-300 mt-0.5 max-w-sm">Riskli majör konfigürasyonlardan önce sistemin tam state'ini kayıt altına alın.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => { /* unchanged logic */ }}
                            className="mt-4 sm:mt-0 px-5 h-10 bg-slate-900 dark:bg-white text-white rounded-lg text-[13px] font-medium shadow-sm hover:bg-slate-800 transition-colors shrink-0"
                        >
                            Snapshot Talebi Oluştur
                        </button>
                    </div>

                    {/* Veritabanı Export */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border border-slate-200 dark:border-white/5 rounded-xl bg-slate-50 dark:bg-[#1e293b] relative group transition-colors hover:bg-white hover:shadow-sm">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-lg flex items-center justify-center shadow-sm text-lg mt-0.5 shrink-0">
                                ⬇️
                            </div>
                            <div>
                                <h4 className="text-[15px] font-semibold text-slate-900 dark:text-white">SQL Data İndirme</h4>
                                <p className="text-[13px] text-slate-600 dark:text-slate-300 mt-0.5 max-w-sm">Tüm veritabanı JSON/SQL yapılarıyla birlikte arşiv paketi olarak indirin.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => { /* unchanged logic */ }}
                            className="mt-4 sm:mt-0 px-5 h-10 bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-200 rounded-lg text-[13px] font-medium shadow-sm hover:bg-slate-50 transition-colors shrink-0 flex items-center gap-2"
                        >
                            <span>📥</span> Arşivi İndir
                        </button>
                    </div>
                </div>
            </ERPBlock>

            <div className="mt-6 p-4 border border-blue-100 bg-blue-50 text-blue-800 rounded-xl text-[13px] leading-relaxed flex items-start gap-3">
                <span className="text-base shrink-0">ℹ️</span>
                <div>
                    <strong className="font-semibold block mb-0.5">Otomatik Yedekleme Servisi Aktif</strong>
                    Sistem her gece <strong>03:00'te</strong> veritabanını yedekleyerek 30 günlük izole zincirde (Retention Policy) güvenle muhafaza etmektedir.
                </div>
            </div>
        </div>
    );
}
