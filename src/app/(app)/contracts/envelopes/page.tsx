import { EnterprisePageShell, EnterpriseCard, EnterpriseTable, EnterpriseButton } from '@/components/ui/enterprise';
import { fetchEnvelopes } from '@/actions/contracts/envelopes';
import Link from 'next/link';

export default async function EnvelopesPage() {
    const envelopes = await fetchEnvelopes();

    return (
        <EnterprisePageShell
            title="İmza Paketleri (Zarflar)"
            description="İmzaya gönderilmiş veya gönderilmeyi bekleyen sözleşme paketleri."
            actions={
                <Link href="/contracts/envelopes/new">
                    <EnterpriseButton variant="primary">
                        + Zarf Oluştur
                    </EnterpriseButton>
                </Link>
            }
        >
            <EnterpriseCard noPadding>
                {envelopes.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">Kayıtlı imza paketi bulunmuyor.</div>
                ) : (
                    <EnterpriseTable headers={['Doküman', 'Durum', 'Alıcılar', 'Oluşturulma']}>
                        {envelopes.map(env => (
                            <tr key={env.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                                <td className="p-4 text-sm font-medium">
                                    <Link href={`/contracts/envelopes/${env.id}`} className="text-blue-600 hover:underline">
                                        {env.document.subject}
                                    </Link>
                                </td>
                                <td className="p-4 text-sm"><span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${env.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'}`}>{env.status}</span></td>
                                <td className="p-4 text-sm text-slate-500">{env.recipients.length} Alıcı</td>
                                <td className="p-4 text-sm text-slate-500">{new Date(env.createdAt).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </EnterpriseTable>
                )}
            </EnterpriseCard>
        </EnterprisePageShell>
    );
}
