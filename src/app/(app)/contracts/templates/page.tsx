import { EnterprisePageShell, EnterpriseCard, EnterpriseTable, EnterpriseButton, EnterpriseBadge } from '@/components/ui/enterprise';
import { fetchTemplates } from '@/actions/contracts/templates';
import Link from 'next/link';

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
    const templates = await fetchTemplates();

    return (
        <EnterprisePageShell
            title="Doküman Şablonları (Sözleşmeler)"
            description="Kira, IK Sözleşmeleri, Bayilik ve NDA taslaklarınızı yönetin."
            actions={
                <Link href="/contracts/templates/new">
                    <EnterpriseButton variant="primary">
                        + Şablon Oluştur
                    </EnterpriseButton>
                </Link>
            }
        >
            <EnterpriseCard noPadding>
                {templates.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">Henüz şablon bulunmuyor.</div>
                ) : (
                    <EnterpriseTable headers={['Adı', 'Durum', 'Motor', 'Güncelleme']}>
                        {templates.map(t => (
                            <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                                <td className="p-4 text-sm font-medium">{t.name}</td>
                                <td className="p-4 text-sm">{t.status}</td>
                                <td className="p-4 text-sm">{t.engine}</td>
                                <td className="p-4 text-sm text-slate-500">{new Date(t.updatedAt).toLocaleDateString('tr-TR')}</td>
                            </tr>
                        ))}
                    </EnterpriseTable>
                )}
            </EnterpriseCard>
        </EnterprisePageShell>
    );
}
