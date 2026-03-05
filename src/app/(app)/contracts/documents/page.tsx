import { EnterprisePageShell, EnterpriseCard, EnterpriseTable, EnterpriseButton } from '@/components/ui/enterprise';
import { fetchDocuments } from '@/actions/contracts/documents';
import Link from 'next/link';
import RenderPdfButton from './RenderPdfButton';

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
    const docs = await fetchDocuments();

    return (
        <EnterprisePageShell
            title="Doküman Arşivi"
            description="Hazırlanan veya sisteme yüklenen dokümanların merkezi arşivi."
            actions={
                <Link href="/contracts/documents/new">
                    <EnterpriseButton variant="primary">
                        + Yeni Doküman
                    </EnterpriseButton>
                </Link>
            }
        >
            <EnterpriseCard noPadding>
                {docs.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">Kayıtlı doküman bulunamadı.</div>
                ) : (
                    <EnterpriseTable headers={['Doküman Konusu', 'Kaynak', 'Şablon', 'Durum', 'Tarih', 'İşlemler']}>
                        {docs.map(doc => {
                            const latestVersion = doc.versions?.length > 0 ? doc.versions[0] : null;
                            const isPdfReady = !!latestVersion?.fileBlobId;

                            return (
                                <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                                    <td className="p-4 text-sm font-medium">{doc.subject}</td>
                                    <td className="p-4 text-sm"><span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300">{doc.source}</span></td>
                                    <td className="p-4 text-sm text-slate-500">{doc.templateVersion?.template?.name || '-'}</td>
                                    <td className="p-4 text-sm">{doc.status}</td>
                                    <td className="p-4 text-sm text-slate-500">{new Date(doc.createdAt).toLocaleDateString()}</td>
                                    <td className="p-4 text-sm">
                                        {latestVersion && (
                                            <RenderPdfButton
                                                documentId={doc.id}
                                                documentVersionId={latestVersion.id}
                                                initialPdfReady={isPdfReady}
                                            />
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </EnterpriseTable>
                )}
            </EnterpriseCard>
        </EnterprisePageShell>
    );
}
