import { getSession } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { EnterprisePageShell, EnterpriseCard } from '@/components/ui/enterprise';

export async function generateMetadata({ params }: { params: { slug: string } }) {
    const { slug } = await params;
    const article = await prisma.helpArticle.findUnique({ where: { slug } });
    if (!article) return { title: 'Makale Bulunamadı - Periodya' };
    return { title: `${article.title} - Periodya Support` };
}

export default async function KnowledgeBaseArticleDetailPage({ params }: { params: { slug: string } }) {
    const session = await getSession();
    if (!session?.tenantId) redirect('/login');

    const { slug } = await params;

    const article = await prisma.helpArticle.findUnique({
        where: { slug: decodeURIComponent(slug) },
        include: {
            category: true,
            recommendations: { include: { article: true }, take: 3 }
        }
    });

    if (!article || article.status !== 'PUBLISHED') {
        notFound();
    }

    if (article.tenantId && article.tenantId !== session.tenantId) {
        redirect('/help/articles');
    }

    // Background view increment
    prisma.helpArticle.update({
        where: { id: article.id },
        data: { viewCount: { increment: 1 } }
    }).catch(console.error);

    return (
        <EnterprisePageShell
            className="bg-slate-50 dark:bg-slate-950 min-h-screen"
            actions={
                <Link href="/help/articles" className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800">
                    ← Makalelere Dön
                </Link>
            }
        >
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                {/* Main Content */}
                <div className="lg:col-span-3 space-y-8">
                    <EnterpriseCard className="p-8!">
                        <div className="mb-6">
                            {article.category && (
                                <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-3 py-1 rounded mb-4 inline-block">
                                    {article.category.name}
                                </span>
                            )}
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">
                                {article.title}
                            </h1>
                            <p className="text-sm text-slate-500 font-medium">
                                Son Güncelleme: {article.updatedAt.toLocaleDateString('tr-TR')} • {article.viewCount + 1} Görüntülenme
                            </p>
                        </div>

                        <div className="prose prose-slate dark:prose-invert max-w-none text-slate-700 dark:text-slate-300">
                            {article.summary && (
                                <p className="text-lg font-medium text-slate-800 dark:text-slate-200 leading-relaxed mb-6">{article.summary}</p>
                            )}
                            <hr className="border-slate-200 dark:border-slate-800 my-6" />
                            <div className="whitespace-pre-wrap leading-relaxed">
                                {article.content}
                            </div>
                        </div>
                    </EnterpriseCard>

                    <EnterpriseCard className="text-center bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/40 p-10!">
                        <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 mb-2">Bu makale yardımcı oldu mu?</h3>
                        <p className="text-sm text-slate-500 mb-6">Geri bildiriminiz bilgi bankamızı geliştirmemizi sağlar.</p>

                        <div className="flex gap-4 justify-center">
                            <form action={`/api/help/articles/${article.id}/helpful`} method="POST">
                                <button type="submit" className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors">👍 Evet</button>
                            </form>
                            <Link href="/help/tickets/new" className="px-6 py-2.5 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors shadow-sm">
                                👎 Hayır, Destek Bileti Aç
                            </Link>
                        </div>
                    </EnterpriseCard>
                </div>

                {/* Right Sidebar */}
                <div className="space-y-6">
                    <EnterpriseCard>
                        <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">İlgili Konular</h4>

                        <div className="space-y-4">
                            {article.recommendations.length === 0 ? (
                                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 border-dashed rounded-lg text-xs text-slate-500 text-center">
                                    Önerilen makale yok.
                                </div>
                            ) : (
                                article.recommendations.map(rec => (
                                    <Link key={rec.id} href={`/help/articles/${rec.article.slug}`} className="block group">
                                        <h5 className="font-medium text-sm text-slate-800 dark:text-slate-200 group-hover:text-blue-600 transition-colors line-clamp-2">
                                            {rec.article.title}
                                        </h5>
                                        <span className="text-[10px] text-slate-400 uppercase tracking-widest mt-1 hidden group-hover:block transition-all">Oku →</span>
                                    </Link>
                                ))
                            )}
                        </div>
                    </EnterpriseCard>
                </div>
            </div>
        </EnterprisePageShell>
    );
}
