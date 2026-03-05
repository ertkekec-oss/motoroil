import { EnterprisePageShell, EnterpriseCard, EnterpriseTable, EnterpriseButton } from '@/components/ui/enterprise';
import { prisma } from '@/lib/prisma';
import { getStrictTenantId } from '@/services/contracts/tenantContext';
import { notFound } from 'next/navigation';
import { sendEnvelope } from '@/actions/contracts/envelopes';
import RenderPdfButton from '../../documents/RenderPdfButton';

export const dynamic = "force-dynamic";

export default async function EnvelopeDetailPage({ params }: { params: { envelopeId: string } }) {
    const tenantId = await getStrictTenantId();

    // Server components fetch directly via prisma or action wrapper. Using prisma for direct detail view as common in Periodya MVP.
    const env = await prisma.envelope.findFirst({
        where: { id: params.envelopeId, tenantId },
        include: {
            document: true,
            documentVersion: true,
            recipients: {
                orderBy: { orderIndex: 'asc' },
                include: { signingSession: true }
            },
            auditEvents: {
                orderBy: { createdAt: 'desc' }
            }
        }
    });

    if (!env) {
        return <div className="p-8 text-center text-red-500">Zarf bulunamadı veya yetkiniz yok.</div>;
    }

    const handleSendAction = async () => {
        "use server";
        await sendEnvelope(env.id);
    };

    return (
        <EnterprisePageShell
            title={`Zarf: ${env.document.subject}`}
            description={`Durum: ${env.status} | Eklenme: ${new Date(env.createdAt).toLocaleString('tr-TR')}`}
            actions={
                <div className="flex gap-2 items-center">
                    {!env.documentVersion.fileBlobId && (
                        <div className="text-sm font-semibold text-orange-600 mr-2 flex items-center">
                            <span className="w-2 h-2 rounded-full bg-orange-600 mr-2 animate-pulse"></span>
                            Render Required
                        </div>
                    )}
                    <RenderPdfButton
                        documentId={env.documentId}
                        initialPdfReady={!!env.documentVersion.fileBlobId}
                        documentVersionId={env.documentVersion.id}
                    />
                    {env.status === 'DRAFT' && env.documentVersion.fileBlobId && (
                        <form action={handleSendAction}>
                            <EnterpriseButton type="submit" variant="primary">İmzaya Gönder</EnterpriseButton>
                        </form>
                    )}
                </div>
            }
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h3 className="text-lg font-medium mb-4">Alıcılar (İmzacı Rotaları)</h3>
                    <EnterpriseCard noPadding>
                        <EnterpriseTable headers={['Sıra', 'İsim', 'E-posta', 'Rol', 'Durum', 'Doğrulama', 'Link (Kopya)']}>
                            {env.recipients.map(r => (
                                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                                    <td className="p-4 text-sm font-medium">{r.orderIndex}</td>
                                    <td className="p-4 text-sm">{r.name}</td>
                                    <td className="p-4 text-sm">{r.email}</td>
                                    <td className="p-4 text-sm">{r.role}</td>
                                    <td className="p-4 text-sm">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${r.status === 'SIGNED' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'}`}>{r.status}</span>
                                    </td>
                                    <td className="p-4 text-sm">{r.authMethod}</td>
                                    <td className="p-4 text-sm">
                                        {r.signingSession ? (
                                            <div className="text-[10px] break-all text-slate-400">
                                                (Token gizli tutuluyor)
                                            </div>
                                        ) : '-'}
                                    </td>
                                </tr>
                            ))}
                        </EnterpriseTable>
                    </EnterpriseCard>
                </div>

                <div>
                    <h3 className="text-lg font-medium mb-4">Denetim İzi (Audit Trail)</h3>
                    <EnterpriseCard noPadding>
                        <div className="max-h-96 overflow-y-auto">
                            <EnterpriseTable headers={['Tarih', 'Aksiyon', 'Aktör', 'Detay']}>
                                {env.auditEvents.map(a => (
                                    <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 text-xs">
                                        <td className="p-3 whitespace-nowrap">{new Date(a.createdAt).toLocaleString('tr-TR')}</td>
                                        <td className="p-3 font-semibold">{a.action}</td>
                                        <td className="p-3">{a.actorType} {a.actorId && `(${a.actorId})`}</td>
                                        <td className="p-3 break-all">{JSON.stringify(a.meta || {})}</td>
                                    </tr>
                                ))}
                            </EnterpriseTable>
                        </div>
                    </EnterpriseCard>
                </div>
            </div>
        </EnterprisePageShell>
    );
}
