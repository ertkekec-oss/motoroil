import { EnterprisePageShell, EnterpriseCard, EnterpriseTable, EnterpriseButton } from '@/components/ui/enterprise';
import { fetchProviderConfigs } from '@/actions/contracts/admin';
import Link from 'next/link';

export default async function ProvidersPage() {
    const providers = await fetchProviderConfigs();

    return (
        <EnterprisePageShell
            title="E-İmza Sağlayıcıları"
            description="Tenant bazlı elektronik imza veya SMS sağlayıcı yapılandırmaları."
            actions={
                <Link href="/admin/contracts/providers/new">
                    <EnterpriseButton variant="primary">
                        + Konfigürasyon Ekle
                    </EnterpriseButton>
                </Link>
            }
        >
            <EnterpriseCard noPadding>
                {providers.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">Henüz konfigürasyon eklenmedi.</div>
                ) : (
                    <EnterpriseTable headers={['Sağlayıcı', 'Durum', 'Kurulum Tarihi']}>
                        {providers.map(p => (
                            <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                                <td className="p-4 text-sm font-medium">{p.providerKey}</td>
                                <td className="p-4 text-sm">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${p.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {p.isActive ? "Aktif" : "Pasif"}
                                    </span>
                                </td>
                                <td className="p-4 text-sm text-slate-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </EnterpriseTable>
                )}
            </EnterpriseCard>
        </EnterprisePageShell>
    );
}
