import { EnterprisePageShell, EnterpriseCard, EnterpriseTable } from '@/components/ui/enterprise';
import { fetchAuditLogs } from '@/actions/contracts/admin';

export default async function AuditPage() {
    const logs = await fetchAuditLogs();

    return (
        <EnterprisePageShell
            title="Sözleşme Denetim İzleri (Audit Ledger)"
            description="Tenant bazlı değiştirilemez (append-only) imza işlemi trafik logları."
        >
            <EnterpriseCard noPadding>
                {logs.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">Log kaydı bulunamadı.</div>
                ) : (
                    <EnterpriseTable headers={['Zaman Damgası', 'Olay', 'Aktör', 'Aktör Tipi', 'Zarf / Belge ID', 'IP / Metadata']}>
                        {logs?.map(log => (
                            <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 text-xs">
                                <td className="p-4 font-mono">{new Date(log.createdAt).toLocaleString('tr-TR')}</td>
                                <td className="p-4 font-bold">{log.action}</td>
                                <td className="p-4">{log.actorId || '-'}</td>
                                <td className="p-4">{log.actorType}</td>
                                <td className="p-4 font-mono text-[10px] break-all max-w-[150px]">{log.envelopeId || '-'}</td>
                                <td className="p-4 break-all max-w-[200px] text-[10px]">{JSON.stringify(log.meta)} <br /> {log.ip}</td>
                            </tr>
                        ))}
                    </EnterpriseTable>
                )}
            </EnterpriseCard>
        </EnterprisePageShell>
    );
}
