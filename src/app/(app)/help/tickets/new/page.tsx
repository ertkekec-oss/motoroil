import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { EnterprisePageShell } from '@/components/ui/enterprise';
import { NewTicketForm } from '@/components/help/NewTicketForm';

export const metadata = {
    title: 'Yeni Destek Talebi - Periodya'
};

export default async function NewTicketPage() {
    const session = await getSession();
    if (!session?.tenantId) redirect('/login');

    return (
        <EnterprisePageShell
            title="Yeni Destek Talebi Oluştur"
            description="Lütfen karşılaştığınız sorunu en ince detayına kadar açıklayıcı şekilde belirtin."
            className="bg-slate-50 dark:bg-slate-950 min-h-screen"
        >
            <NewTicketForm />
        </EnterprisePageShell>
    );
}
