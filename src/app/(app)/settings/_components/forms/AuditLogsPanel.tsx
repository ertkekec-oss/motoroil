import React from 'react';
import {
    EnterpriseCard,
    EnterprisePageShell,
    EnterpriseButton,
    EnterpriseTable,
    EnterpriseEmptyState,
} from '@/components/ui/enterprise';

// ─── ZERO LOGIC CHANGE ────────────────────────────────────────────────────────
// State, handler, submit, API, validation → HİÇBİR ŞEY DEĞİŞMEDİ.
// Yalnızca UI katmanı Enterprise primitive'lere geçirildi.
// ─────────────────────────────────────────────────────────────────────────────

export default function AuditLogsPanel(props: any) {
    const {
        logs,
        isLogsLoading,
        fetchLogs,
    } = props;

    return (
        <EnterprisePageShell
            title="İşlem Günlükleri"
            description="Sistemdeki son değişiklikler ve kullanıcı eylemleri."
            actions={
                <EnterpriseButton variant="secondary" onClick={fetchLogs} disabled={isLogsLoading}>
                    {isLogsLoading ? (
                        <><div className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" /> Yükleniyor</>
                    ) : (
                        <><span>🔄</span> Yenile</>
                    )}
                </EnterpriseButton>
            }
        >
            {logs?.length === 0 ? (
                <EnterpriseEmptyState
                    icon="📜"
                    title="Kayıt bulunamadı"
                    description="Henüz herhangi bir işlem günlüğü oluşturulmamış."
                    action={
                        <EnterpriseButton variant="secondary" onClick={fetchLogs}>
                            🔄 Günlükleri Yükle
                        </EnterpriseButton>
                    }
                />
            ) : (
                <EnterpriseTable
                    headers={[
                        'Tarih / Kullanıcı',
                        'İşlem',
                        'Nesne',
                        'Detay',
                    ]}
                >
                    {(logs || []).map((log: any) => (
                        <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="px-4 py-3">
                                <div className="text-xs font-medium text-slate-900 dark:text-white whitespace-nowrap">
                                    {new Date(log.createdAt).toLocaleString('tr-TR')}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    {log.userName || 'Sistem'}
                                </div>
                            </td>
                            <td className="px-4 py-3">
                                <span className="px-2 py-1 text-[10px] font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                                    {log.action}
                                </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                                {log.entity}
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 max-w-xs truncate">
                                {log.details}
                            </td>
                        </tr>
                    ))}
                </EnterpriseTable>
            )}
        </EnterprisePageShell>
    );
}
