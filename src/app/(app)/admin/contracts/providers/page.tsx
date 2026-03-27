import { EnterprisePageShell, EnterpriseCard, EnterpriseTable, EnterpriseButton, EnterpriseEmptyState } from '@/components/ui/enterprise';
import { fetchProviderConfigs } from '@/actions/contracts/admin';
import Link from 'next/link';
import { Plus, Cable, CheckCircle2, ShieldAlert } from 'lucide-react';

export default async function ProvidersPage() {
    const providers = await fetchProviderConfigs();

    return (
        <EnterprisePageShell
            title="E-İmza & SMS Sağlayıcıları"
            description="Tenant bazlı elektronik imza veya SMS sağlayıcı yapılandırmalarının global listesi."
            actions={
                <Link href="/admin/contracts/providers/new">
                    <EnterpriseButton variant="primary">
                        <Plus className="w-4 h-4" /> Konfigürasyon Ekle
                    </EnterpriseButton>
                </Link>
            }
        >
            <EnterpriseCard noPadding>
                {providers.length === 0 ? (
                    <EnterpriseEmptyState 
                        icon={<Cable className="w-10 h-10" />}
                        title="Aktif Sağlayıcı Yok"
                        description="Sistem üzerinde yapılandırılmış herhangi bir E-İmza veya SMS/OTP sağlayıcısı tanımlanmamış."
                    />
                ) : (
                    <EnterpriseTable headers={['Yüklenici Firma', 'Erişim Durumu', 'Kurulum Tarihi']}>
                        {providers?.map((p: any) => (
                            <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer group">
                                <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">{p.providerKey}</td>
                                <td className="px-6 py-4">
                                    {p.isActive ? (
                                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 rounded-md text-[10px] font-black uppercase tracking-widest w-fit shadow-sm">
                                            <CheckCircle2 className="w-3.5 h-3.5" /> AKTİF
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 rounded-md text-[10px] font-black uppercase tracking-widest w-fit shadow-sm">
                                            <ShieldAlert className="w-3.5 h-3.5" /> PASİF
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-sm font-medium text-slate-500 dark:text-slate-400">
                                    {new Date(p.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                </td>
                            </tr>
                        ))}
                    </EnterpriseTable>
                )}
            </EnterpriseCard>
        </EnterprisePageShell>
    );
}
