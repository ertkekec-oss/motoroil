import { getSession } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { EnterprisePageShell, EnterpriseCard } from '@/components/ui/enterprise';
import { Clock, Calendar, CheckCircle2, AlertCircle, Sparkles, LifeBuoy } from 'lucide-react';

export async function generateMetadata({ params }: { params: { slug: string } }) {
    const { slug } = await params;
    const article = await prisma.helpArticle.findUnique({ where: { slug: decodeURIComponent(slug) } });
    if (!article) return { title: 'Makale Yok - Periodya' };
    return { title: `${article.title} - Periodya Support Hub` };
}

export const revalidate = 60;

export default async function KnowledgeHubArticleDetail({ params }: { params: { slug: string } }) {
    const session = await getSession();
    if (!session?.tenantId) redirect('/login');

    const { slug } = await params;

    const article = await prisma.helpArticle.findUnique({
        where: { slug: decodeURIComponent(slug) },
        include: {
            category: true,
        }
    });

    if (!article || article.status !== 'PUBLISHED') {
        notFound();
    }

    if (article.tenantId && article.tenantId !== session.tenantId) {
        redirect('/help/articles');
    }

    // Get related articles (same category, excluding current)
    const relatedArticles = await prisma.helpArticle.findMany({
        where: { categoryId: article.categoryId, id: { not: article.id }, status: 'PUBLISHED' },
        take: 3,
        orderBy: { viewCount: 'desc' },
        include: { category: true }
    });

    // Background view increment
    prisma.helpArticle.update({
        where: { id: article.id },
        data: { viewCount: { increment: 1 } }
    }).catch(console.error);

    // Calculate reading time
    const words = article.content.split(/\s+/).length;
    const readTimeMinutes = Math.max(1, Math.ceil(words / 200));

    return (
        <EnterprisePageShell
            className="bg-slate-50 dark:bg-slate-950 min-h-screen"
            actions={
                <Link href="/help/articles" className="px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-colors">
                    ← Tüm Makaleler
                </Link>
            }
        >
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 max-w-7xl mx-auto pb-16">

                {/* Main Content */}
                <div className="lg:col-span-3 space-y-10">
                    <EnterpriseCard className="p-8 md:p-12! border-slate-200 dark:border-slate-800">
                        <div className="mb-8">
                            {article.category && (
                                <Link href={`/help/articles?category=${article.category.id}`} className="text-xs font-bold uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-3 py-1.5 rounded-md mb-6 inline-block hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                                    {article.category.icon} {article.category.name}
                                </Link>
                            )}
                            <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-6 tracking-tight leading-tight">
                                {article.title}
                            </h1>

                            <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500 font-medium pb-8 border-b border-slate-100 dark:border-slate-800/60">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-slate-400" />
                                    <span>Güncelleme: {article.updatedAt.toLocaleDateString('tr-TR')}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-slate-400" />
                                    <span>{readTimeMinutes} dk okuma süresi</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-slate-400" />
                                    <span>{article.viewCount + 1} Görüntülenme</span>
                                </div>
                            </div>
                        </div>

                        <div className="prose prose-slate dark:prose-invert prose-lg max-w-none text-slate-700 dark:text-slate-300">
                            {article.summary && (
                                <p className="text-xl font-medium text-slate-800 dark:text-slate-100 leading-relaxed mb-10 pb-6 border-b border-dashed border-slate-200 dark:border-slate-800 line-clamp-3">
                                    {article.summary}
                                </p>
                            )}
                            <div 
                                className="whitespace-pre-wrap leading-loose break-words"
                                dangerouslySetInnerHTML={{ __html: article.content }}
                            />
                        </div>
                    </EnterpriseCard>

                    {/* Feedback Action Card */}
                    <EnterpriseCard className="text-center bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/40 p-12! shadow-inner">
                        <h3 className="font-extrabold text-2xl text-slate-900 dark:text-slate-100 mb-3 tracking-tight">Bu makale sorununuzu çözdü mü?</h3>
                        <p className="text-base text-slate-500 mb-8 max-w-lg mx-auto">Geri bildiriminiz Enterprise Knowledge Hub altyapısını geliştirmemize yardımcı olur.</p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <form action={`/api/help/articles/${article.id}/helpful`} method="POST">
                                <button type="submit" className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 transition-all shadow-sm">
                                    <CheckCircle2 className="w-5 h-5 text-green-500" /> Evet, faydalı
                                </button>
                            </form>
                            <Link href="/support/new" className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-xl hover:bg-slate-800 dark:hover:bg-slate-200 transition-all shadow-md">
                                <AlertCircle className="w-5 h-5" /> Hayır, Talep Oluştur
                            </Link>
                        </div>
                    </EnterpriseCard>

                    {/* Related Articles Strip (only shown if there are related) */}
                    {relatedArticles.length > 0 && (
                        <div className="pt-6">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6">İlgili Konular</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {relatedArticles.map((rel) => (
                                    <Link key={rel.id} href={`/help/articles/${rel.slug}`} className="block h-full group">
                                        <EnterpriseCard className="h-full p-5! hover:border-slate-300 dark:hover:border-slate-700 transition-colors flex flex-col justify-between cursor-pointer rounded-xl">
                                            <div>
                                                {rel.category && <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2.5">{rel.category.name}</p>}
                                                <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-base mb-3 group-hover:text-blue-600 transition-colors">{rel.title}</h4>
                                            </div>
                                            <p className="text-xs font-medium text-slate-500 group-hover:underline decoration-blue-500 underline-offset-4 decoration-2">İncele →</p>
                                        </EnterpriseCard>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Sidebar */}
                <div className="space-y-6 hidden lg:block">
                    <div className="sticky top-24">
                        <EnterpriseCard className="p-6! border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                            <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-3 mb-4 flex items-center gap-2">
                                <LifeBuoy className="w-4 h-4 text-blue-500" /> Hızlı Yardıma mı İhtiyacınız Var?
                            </h4>
                            <p className="text-sm text-slate-500 mb-6 leading-relaxed">Dökümantasyon sorununuzu çözmediyse hiç vakit kaybetmeden teknik ekibimize ulaşın. Talebiniz AI tarafından analiz edilip uygun uzmana iletilecektir.</p>
                            <Link href="/support/new" className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-bold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg hover:opacity-90 transition-opacity">
                                Destek Talebi Oluştur
                            </Link>
                        </EnterpriseCard>
                    </div>
                </div>
            </div>
        </EnterprisePageShell>
    );
}
