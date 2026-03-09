import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import HelpSearch from '@/components/HelpSearch';
import { EnterprisePageShell, EnterpriseCard, EnterpriseSectionHeader } from '@/components/ui/enterprise';

export const metadata = {
    title: 'Bilgi Bankası Makaleleri - Periodya'
};

export default async function KnowledgeBaseArticlesPage({
    searchParams
}: {
    searchParams: { category?: string; q?: string }
}) {
    const session = await getSession();
    if (!session?.tenantId) redirect('/login');

    const categoryId = searchParams.category;
    const q = searchParams.q;

    const whereClause: any = {
        status: 'PUBLISHED',
        OR: [{ tenantId: session.tenantId }, { tenantId: null }]
    };

    if (categoryId) whereClause.categoryId = categoryId;
    if (q) {
        whereClause.OR = [
            { title: { contains: q, mode: 'insensitive' } },
            { summary: { contains: q, mode: 'insensitive' } },
            { content: { contains: q, mode: 'insensitive' } }
        ];
    }

    const [articles, categories] = await Promise.all([
        prisma.helpArticle.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            include: { category: true }
        }),
        prisma.helpCategory.findMany({ orderBy: { order: 'asc' } })
    ]);

    return (
        <EnterprisePageShell
            title="Bilgi Bankası"
            description="Periodya modülleri ile ilgili tüm rehber, eğitim ve SSS dökümanları."
            className="bg-slate-50 dark:bg-slate-950 min-h-screen"
            actions={
                <Link href="/help" className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800">
                    ← Support Hub
                </Link>
            }
        >
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                {/* Filters Sidebar */}
                <div className="space-y-6">
                    <EnterpriseCard>
                        <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-4 tracking-tight">Kategoriler</h3>
                        <div className="space-y-1">
                            <Link href="/help/articles" className={`block px-3 py-2 text-sm rounded-lg transition-colors ${!categoryId ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-medium' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                                Tüm Kategoriler
                            </Link>
                            {categories.map(cat => (
                                <Link
                                    key={cat.id}
                                    href={`/help/articles?category=${cat.id}`}
                                    className={`block px-3 py-2 text-sm rounded-lg transition-colors ${categoryId === cat.id ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-medium' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                >
                                    {cat.icon} {cat.name}
                                </Link>
                            ))}
                        </div>
                    </EnterpriseCard>
                </div>

                {/* Articles List */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="w-full">
                        <HelpSearch />
                    </div>

                    <EnterpriseSectionHeader title={categoryId ? categories.find(c => c.id === categoryId)?.name || 'Kategori' : 'Tüm Makaleler'} subtitle={`${articles.length} sonuç bulundu.`} />

                    {articles.length === 0 ? (
                        <div className="p-10 border border-slate-200 dark:border-slate-800 border-dashed rounded-xl text-center">
                            <h3 className="font-semibold text-slate-700">Sonuç Bulunamadı</h3>
                            <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">Arama kriterlerinize uygun makale bulunamadı. Lütfen daha genel terimler deneyin veya doğrudan talep oluşturun.</p>
                            <Link href="/help/tickets/new" className="mt-4 inline-block text-sm font-bold text-slate-900 dark:text-white hover:underline">Destek Talebi Oluştur →</Link>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {articles.map(article => (
                                <Link href={`/help/articles/${article.slug}`} key={article.id} className="block group">
                                    <EnterpriseCard className="group-hover:border-slate-300 dark:group-hover:border-slate-700 transition-colors p-5!">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors">{article.title}</h4>
                                            {article.category && (
                                                <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded">
                                                    {article.category.name}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 md:line-clamp-3 mb-4">
                                            {article.summary || article.content.substring(0, 150) + '...'}
                                        </p>
                                        <div className="flex items-center justify-between text-[11px] font-medium text-slate-400 uppercase tracking-widest">
                                            <span>Okumaya Devam Et →</span>
                                            <span> {article.updatedAt.toLocaleDateString('tr-TR')} Güncellendi</span>
                                        </div>
                                    </EnterpriseCard>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </EnterprisePageShell>
    );
}
