import { EnterprisePageShell, EnterpriseCard, EnterpriseTable, EnterpriseEmptyState } from '@/components/ui/enterprise';
import { fetchAuditLogs } from '@/actions/contracts/admin';
import { History } from 'lucide-react';

export default async function AuditPage() {
    const logs = await fetchAuditLogs();

    return (
        <EnterprisePageShell
            title="Sözleşme Denetim İzleri (Audit Ledger)"
            description="Tenant bazlı değiştirilemez (append-only) imza işlemi trafik logları."
        >
            <EnterpriseCard noPadding>
                {logs.length === 0 ? (
                    <EnterpriseEmptyState 
                        icon={<History className="w-10 h-10" />}
                        title="İz Kaydı Bulunamadı"
                        description="Sistemde henüz denetlenen bir sözleşme olayı gerçekleşmedi."
                    />
                ) : (
                    <EnterpriseTable headers={['Zaman Damgası', 'Olay', 'Aktör', 'Aktör Tipi', 'Zarf / Belge ID', 'IP / Metadata']}>
                        {logs?.map((log: any) => (
                            <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer group">
                                <td className="px-6 py-4 text-xs font-mono font-medium text-slate-500 dark:text-slate-400">
                                    {new Date(log.createdAt).toLocaleString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td className="px-6 py-4 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">{log.action}</td>
                                <td className="px-6 py-4 text-xs font-medium text-slate-500 dark:text-slate-400">{log.actorId || '-'}</td>
                                <td className="px-6 py-4 text-xs font-bold text-indigo-600 dark:text-indigo-400">{log.actorType}</td>
                                <td className="px-6 py-4 text-[10px] font-mono font-bold text-slate-500 dark:text-slate-500 break-all max-w-[150px]">
                                    {log.envelopeId || '-'}
                                </td>
                                <td className="px-6 py-4 text-[10px] text-slate-400 dark:text-slate-500 font-mono break-all max-w-[200px]">
                                    <span className="block mb-1 opacity-70 truncate">{JSON.stringify(log.meta) !== '{}' ? JSON.stringify(log.meta) : ''}</span>
                                    <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400 font-bold">{log.ip || '-'}</span>
                                </td>
                            </tr>
                        ))}
                    </EnterpriseTable>
                )}
            </EnterpriseCard>
        </EnterprisePageShell>
    );
}
