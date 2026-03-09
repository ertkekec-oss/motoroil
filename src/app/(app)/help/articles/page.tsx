import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import HelpSearch from '@/components/HelpSearch';
import { EnterprisePageShell, EnterpriseCard, EnterpriseSectionHeader, EnterpriseEmptyState } from '@/components/ui/enterprise';
import { Book, ChevronRight } from 'lucide-react';

export const metadata = {
    title: 'Bilgi Bankası Makaleleri - Periodya Enterprise'
};

export const revalidate = 60;

export default async function KnowledgeHubArticlesPage({
    searchParams
}: {
    searchParams: { category?: string; q?: string; page?: string }
}) {
    const session = await getSession();
    if (!session?.tenantId) redirect('/login');

    const categoryId = searchParams.category;
    const q = searchParams.q;
    const page = parseInt(searchParams.page || '1', 10);
    const limit = 20;

    const whereClause: any = {
        status: 'PUBLISHED',
        OR: [{ tenantId: session.tenantId }, { tenantId: null }]
    };

    if (categoryId) whereClause.categoryId = categoryId;
    if (q) {
        whereClause.OR = [
            ...(whereClause.OR || []),
            { title: { contains: q, mode: 'insensitive' } },
            { summary: { contains: q, mode: 'insensitive' } },
            { tags: { has: q } }
        ];
    }

    const [articles, categories, totalItems] = await Promise.all([
        prisma.helpArticle.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            include: { category: true },
            skip: (page - 1) * limit,
            take: limit
        }),
        prisma.helpCategory.findMany({
            orderBy: { order: 'asc' },
            take: 50 // generous limit for enterprise categories
        }),
        prisma.helpArticle.count({ where: whereClause })
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return (
        <EnterprisePageShell
            title="Sistem Kütüphanesi"
            description="Tüm platform modülleri, entegrasyon rehberleri ve otonom süreçlerin dökümantasyonu."
            className="bg-slate-50 dark:bg-slate-950 min-h-screen"
            actions={
                <Link href="/help" className="px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    ← Yardım Merkezine Dön
                </Link>
            }
        >
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                {/* Filters Sidebar */}
                <div className="space-y-6">
                    <EnterpriseCard className="p-5! border-slate-200 dark:border-slate-800">
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4 text-sm tracking-tight border-b border-slate-100 dark:border-slate-800 pb-2">Kategoriler</h3>
                        <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                            <Link href="/help/articles" className={`flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-all ${!categoryId ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-medium shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                                <span>Tüm Kategoriler</span>
                            </Link>
                            {categories.map(cat => (
                                <Link
                                    key={cat.id}
                                    href={`/help/articles?category=${cat.id}`}
                                    className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all ${categoryId === cat.id ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-medium shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                >
                                    <span className="w-5 text-center">{cat.icon}</span>
                                    <span className="flex-1 truncate">{cat.name}</span>
                                </Link>
                            ))}
                        </div>
                    </EnterpriseCard>
                </div>

                {/* Articles List */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="w-full relative z-20">
                        <HelpSearch />
                    </div>

                    <div className="flex items-center justify-between mt-4">
                        <EnterpriseSectionHeader
                            title={categoryId ? categories.find(c => c.id === categoryId)?.name || 'Kategori' : 'Tüm Makaleler'}
                            subtitle={totalItems > 0 ? `${totalItems} sonuç bulundu.` : 'Bulunan sonuç yok.'}
                        />
                    </div>

                    {articles.length === 0 ? (
                        <EnterpriseEmptyState
                            title="Arama kriterlerinize uygun makale bulunamadı"
                            description="Lütfen daha genel terimler deneyin veya doğrudan talep oluşturun."
                            icon="🔍"
                        />
                    ) : (
                        <div className="space-y-4">
                            {articles.map(article => (
                                <Link href={`/help/articles/${article.slug}`} key={article.id} className="block group">
                                    <EnterpriseCard className="group-hover:border-slate-300 dark:group-hover:border-slate-700 transition-colors p-6! border-slate-200 dark:border-slate-800">
                                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    {article.category && (
                                                        <span className="text-[10px] font-bold uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2.5 py-1 rounded">
                                                            {article.category.name}
                                                        </span>
                                                    )}
                                                </div>
                                                <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-2">
                                                    {article.title}
                                                </h4>
                                                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                                    {article.summary || article.content.substring(0, 180).replace(/[#*]/g, '') + '...'}
                                                </p>
                                            </div>

                                            <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center shrink-0 min-w-32 gap-3 mt-4 md:mt-0">
                                                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                                                    <Book className="w-4 h-4" />
                                                    {article.viewCount} Kez Okundu
                                                </div>
                                                <div className="text-[11px] text-slate-400 font-medium">
                                                    {article.updatedAt.toLocaleDateString('tr-TR')}
                                                </div>
                                                <div className="hidden md:flex items-center text-[10px] uppercase font-bold text-blue-600 tracking-widest mt-2 group-hover:-translate-x-1 transition-transform">
                                                    İncele <ChevronRight className="w-4 h-4 ml-1" />
                                                </div>
                                            </div>
                                        </div>
                                    </EnterpriseCard>
                                </Link>
                            ))}

                            {/* Pagination Component */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-center pt-8 pb-4 gap-2">
                                    {page > 1 && (
                                        <Link href={`/help/articles?page=${page - 1}${categoryId ? `&category=${categoryId}` : ''}${q ? `&q=${q}` : ''}`} className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 text-sm font-medium hover:bg-slate-50">
                                            Önceki
                                        </Link>
                                    )}
                                    <span className="px-4 py-2 text-sm font-semibold text-slate-500">
                                        Sayfa {page} / {totalPages}
                                    </span>
                                    {page < totalPages && (
                                        <Link href={`/help/articles?page=${page + 1}${categoryId ? `&category=${categoryId}` : ''}${q ? `&q=${q}` : ''}`} className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 text-sm font-medium hover:bg-slate-50">
                                            Sonraki
                                        </Link>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </EnterprisePageShell>
    );
}
