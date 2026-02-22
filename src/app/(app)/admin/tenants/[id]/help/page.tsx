import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import HelpManager from './HelpManager';

export const metadata = { title: 'Yardım Merkezi Yönetimi' };

export default async function AdminTenantHelpPage({ params }: { params: { id: string } }) {
    const session = await getSession();
    if (!session || (session.tenantId !== 'PLATFORM_ADMIN' && session.role !== 'SUPER_ADMIN' && session.role !== 'SUPPORT_AGENT')) {
        redirect('/login');
    }

    const tenantId = params.id;
    const isGlobal = tenantId === 'global'; // using 'global' as keyword to manage global topics

    const categories = await prisma.helpCategory.findMany({
        orderBy: { order: 'asc' },
        include: {
            topics: {
                where: isGlobal ? { tenantId: null } : { tenantId },
                orderBy: { order: 'asc' }
            }
        }
    });

    return (
        <div className="p-6 md:p-8 max-w-6xl mx-auto font-sans">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-white">Yardım Konuları ({isGlobal ? 'Global' : 'Kiracı Özel'})</h1>
                    <p className="text-gray-400 text-sm mt-1">Bu alandan destek merkezi dokümanlarınızı (Knowledge Base) yönetebilirsiniz.</p>
                </div>
            </div>

            <HelpManager initialCategories={categories} tenantId={tenantId} />

            <div className="mt-8 p-6 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
                <h4 className="text-blue-400 font-bold text-sm mb-2 flex items-center gap-2">ℹ️ MVP+ Bilgilendirmesi</h4>
                <p className="text-xs text-blue-400/80 leading-relaxed">
                    Uygulama artık Makale Oluşturma / Düzenleme desteğine sahiptir. Markdown destekleyen editör üzerinden dökümanlarınızı oluşturabilirsiniz. Hazırlanan ve 'Yayında' (PUBLISHED) durumuna çekilen dökümanlar direkt olarak Müşteri portalında Kullanıcı Yardım Merkezi sayfasında gözükmeye başlayacaktır. Kategori güncelleme/silme işlemleri şimdilik arayüzde kısıtlanmıştır (Veritabanı bazında çalışmaktadır).
                </p>
            </div>
        </div>
    );
}
