import React from 'react';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import HelpSearch from '@/components/HelpSearch';
import { AIAssistantPanel } from '@/components/help/AIAssistantPanel';
import { EnterpriseCard, EnterpriseEmptyState } from '@/components/ui/enterprise';
import { Book, ChevronRight, FileText, LifeBuoy, Inbox, Sparkles, FolderIcon, TrendingUp } from 'lucide-react';
import { ClientSideAIButton } from '@/components/help/ClientSideAIButton';

export const metadata = {
    title: 'Bilgi Merkezi - Periodya Enterprise',
};

// NextJS config logic removed to avoid dynamic request collisions with revalidate
// export const revalidate = 60; 

export default async function KnowledgeHubPage() {
    const session = await getSession();
    if (!session?.tenantId) {
        redirect('/login');
    }

    const tenantFilter = { OR: [{ tenantId: session.tenantId }, { tenantId: null }] };

    let categories = [], popularArticles = [], recentArticles = [];
    try {
        const results = await Promise.all([
            prisma.helpCategory.findMany({
                orderBy: { order: 'asc' },
                take: 24, // scalable up to 24 categories
                include: {
                    _count: {
                        select: { articles: true }
                    }
                }
            }),
            prisma.helpArticle.findMany({
                where: { status: 'PUBLISHED', ...tenantFilter },
                orderBy: { viewCount: 'desc' },
                take: 5,
                include: { category: { select: { name: true } } }
            }),
            prisma.helpArticle.findMany({
                where: { status: 'PUBLISHED', ...tenantFilter },
                orderBy: { updatedAt: 'desc' },
                take: 6,
                include: { category: { select: { name: true } } }
            })
        ]);
        categories = results[0] || [];
        popularArticles = results[1] || [];
        recentArticles = results[2] || [];
    } catch (err: any) {
        return <div className="p-10 text-red-500 font-bold">SERVER SIDE DB CRASH IN HELP PAGE: {err.message}</div>;
    }

    return (
        <div className="bg-slate-50 dark:bg-[#020617] min-h-screen">
            <AIAssistantPanel />

            {/* HERO BANNER - Edge to edge */}
            <div className="relative pt-20 pb-24 px-6 flex flex-col items-center justify-center text-center overflow-hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                {/* Ambient Background Glows */}
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 dark:bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 space-y-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-widest shadow-sm">
                        <Sparkles className="w-3.5 h-3.5" /> Periodya Destek Merkezi
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                        Nasıl yardımcı olabiliriz?
                    </h1>
                    <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
                        Arama yapın, yapay zeka asistanımıza danışın veya sizin için hazırladığımız özel kütüphaneyi keşfedin.
                    </p>
                </div>

                {/* Search Bar slightly elevated to break the gradient line */}
                <div className="w-full max-w-3xl mt-10 relative z-20">
                    <HelpSearch />
                </div>
            </div>

            {/* MAIN CONTENT WRAPPER */}
            <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-10 space-y-16 relative z-30">

                {/* CATEGORIES GRID */}
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm -mt-16">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Kategoriler</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Platform özelliklerini ve modüllerini keşfedin</p>
                        </div>
                    </div>
                    {categories.length === 0 ? (
                        <EnterpriseEmptyState title="Kategori Bulunamadı" description="Sistemde yayınlanan bilgi bankası kategorisi yoktur." icon={<FolderIcon size={40} className="mx-auto block" />} />
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {categories.map((cat: any) => (
                                <Link href={`/help/articles?category=${cat?.id}`} key={cat?.id} className="block group">
                                    <EnterpriseCard noPadding className="h-full p-5 hover:border-blue-300 dark:hover:border-blue-800 transition-all hover:shadow-md bg-white dark:bg-slate-950">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-xl shrink-0 bg-blue-50 dark:bg-slate-900 flex items-center justify-center text-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shadow-sm border border-slate-100 dark:border-slate-800">
                                                {cat?.icon || '📁'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h5 className="font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{cat?.name}</h5>
                                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mt-1">{cat?._count?.articles || 0} Makale</p>
                                            </div>
                                        </div>
                                    </EnterpriseCard>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* ARTICLES COL (2/3) */}
                    <div className="lg:col-span-8 space-y-12">

                        {/* POPULAR ARTICLES */}
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-rose-50 dark:bg-rose-500/10 rounded-lg text-rose-600 dark:text-rose-400">
                                    <TrendingUp className="w-5 h-5" />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Popüler Konular</h2>
                            </div>

                            {!popularArticles || popularArticles.length === 0 ? (
                                <EnterpriseEmptyState title="Makale Bulunamadı" description="Sistemde popüler makale bulunmuyor." icon={<Book size={40} className="mx-auto block" />} />
                            ) : (
                                <div className="space-y-3">
                                    {popularArticles.map((article: any) => (
                                        <Link href={`/help/articles/${article?.slug}`} key={article?.id} className="block group">
                                            <EnterpriseCard noPadding className="p-4 md:p-5 hover:border-blue-300 dark:hover:border-blue-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all bg-white dark:bg-slate-900">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-2 text-base truncate">
                                                            {article?.title}
                                                        </h4>
                                                        <div className="flex items-center justify-start gap-4 text-xs font-semibold text-slate-500 w-full overflow-x-auto pb-1 scrollbar-hide">
                                                            <div className="flex items-center gap-1.5 whitespace-nowrap"><Book className="w-4 h-4 text-slate-400" /> {article?.viewCount || 0} Okunma</div>
                                                            <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                                                            <div className="flex-shrink-0">Yakın zamanda güncellendi</div>
                                                        </div>
                                                    </div>
                                                    <div className="hidden sm:flex shrink-0 w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-950 items-center justify-center text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 dark:group-hover:bg-blue-900/50 dark:group-hover:text-blue-400 transition-colors border border-slate-100 dark:border-slate-800">
                                                        <ChevronRight className="w-5 h-5" />
                                                    </div>
                                                </div>
                                            </EnterpriseCard>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* RECENT ARTICLES GRID */}
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg text-emerald-600 dark:text-emerald-400">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Yeni Eklenenler</h2>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {recentArticles?.map((article: any) => (
                                    <Link href={`/help/articles/${article?.slug}`} key={article?.id} className="block h-full group">
                                        <EnterpriseCard noPadding className="h-full p-5 hover:border-blue-300 dark:hover:border-blue-800 transition-colors flex flex-col bg-white dark:bg-slate-900">
                                            <div className="mb-4">
                                                {article?.category?.name && (
                                                    <span className="inline-flex items-center px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded font-bold text-[10px] uppercase tracking-wider text-slate-500 border border-slate-200 dark:border-slate-700">
                                                        {article.category.name}
                                                    </span>
                                                )}
                                            </div>
                                            <h4 className="font-bold text-slate-900 dark:text-white text-base mb-3 line-clamp-2 leading-relaxed group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                {article?.title}
                                            </h4>
                                            <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                <span>Tamamını Oku</span>
                                                <ChevronRight className="w-4 h-4" />
                                            </div>
                                        </EnterpriseCard>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* SIDEBAR COL (1/3) */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* AI BOX */}
                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-6 md:p-8 text-white shadow-xl shadow-slate-900/10 border border-slate-700 relative overflow-hidden">
                            {/* Decorative */}
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Sparkles className="w-32 h-32" />
                            </div>

                            <div className="relative z-10">
                                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md border border-white/20">
                                    <Sparkles className="w-7 h-7 text-blue-300" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">Otonom Destek AI</h3>
                                <p className="text-slate-300 text-sm mb-8 leading-relaxed">
                                    Dökümanlar arasında vakit kaybetmeyin. Yapay zeka destekli asistanımıza sorununuzu yazın, anında adım adım çözüm üretsin.
                                </p>
                                <ClientSideAIButton />
                            </div>
                        </div>

                        {/* ACTION LINKS BOX */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col items-stretch">
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950">
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Destek Araçları</h3>
                            </div>
                            <div className="divide-y divide-slate-100 dark:divide-slate-800 p-3 flex-1 flex flex-col justify-around">
                                <Link href="/help/tickets/new" className="flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                    <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-800/50">
                                        <LifeBuoy className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Talep Oluştur</p>
                                        <p className="text-xs text-slate-500 mt-1 flex-wrap break-words">Ekibimizle 7/24 iletişime geçin</p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-blue-500" />
                                </Link>
                                <Link href="/help/tickets" className="flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                    <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-800">
                                        <Inbox className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Destek Taleplerim</p>
                                        <p className="text-xs text-slate-500 mt-1 flex-wrap break-words">Aktif ve geçmiş talepleriniz</p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-blue-500" />
                                </Link>
                                <Link href="/help/articles" className="flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                    <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-800">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Tüm Kütüphane</p>
                                        <p className="text-xs text-slate-500 mt-1 flex-wrap break-words">Yayınlanan makaleleri keşfedin</p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-blue-500" />
                                </Link>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
