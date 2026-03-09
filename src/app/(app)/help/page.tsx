import React from 'react';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import HelpSearch from '@/components/HelpSearch';
import { AIAssistantPanel } from '@/components/help/AIAssistantPanel';
import { EnterprisePageShell, EnterpriseCard, EnterpriseSectionHeader, EnterpriseEmptyState } from '@/components/ui/enterprise';
import { Book, ChevronRight, FileText, LifeBuoy, Inbox, Sparkles } from 'lucide-react';

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
                        select: { articles: true } // Changed topics to articles just in case
                    }
                }
            }),
            prisma.helpArticle.findMany({
                where: { status: 'PUBLISHED', ...tenantFilter },
                orderBy: { viewCount: 'desc' },
                take: 6,
                include: { category: { select: { name: true } } }
            }),
            prisma.helpArticle.findMany({
                where: { status: 'PUBLISHED', ...tenantFilter },
                orderBy: { updatedAt: 'desc' },
                take: 6,
                include: { category: { select: { name: true } } }
            })
        ]);
        categories = results[0];
        popularArticles = results[1];
        recentArticles = results[2];
    } catch (err: any) {
        return <div className="p-10 text-red-500 font-bold">SERVER SIDE DB CRASH IN HELP PAGE: {err.message}</div>;
    }

    const popularTopics = [
        'ERP', 'Finans', 'Envanter', 'SalesX', 'B2B Hub',
        'Entegrasyonlar', 'E-Fatura', 'Kargo', 'API', 'İçe Aktarma', 'Abonelik'
    ];

    return (
        <EnterprisePageShell className="bg-slate-50 dark:bg-slate-950 min-h-screen">

            <AIAssistantPanel />

            {/* 1) HERO SEARCH */}
            <div className="flex flex-col items-center justify-center text-center py-16 px-4">
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-4">
                    Nasıl yardımcı olabiliriz?
                </h1>
                <p className="text-lg text-slate-500 dark:text-slate-400 mb-10 max-w-2xl">
                    Konu arayın, AI asistandan yardım alın veya destek talebi oluşturun.
                </p>

                <div className="w-full max-w-3xl relative z-20">
                    <HelpSearch />
                </div>

                {/* 2) POPULAR TOPICS CHIPS */}
                <div className="mt-8">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Hızlı Konular</p>
                    <div className="flex flex-wrap justify-center gap-2 max-w-3xl">
                        {popularTopics.map(topic => (
                            <Link
                                href={`/help/articles?q=${encodeURIComponent(topic)}`}
                                key={topic}
                                className="px-4 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-full text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
                            >
                                {topic}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto space-y-16 pb-20">

                {/* 3) CATEGORY GRID */}
                <section>
                    <EnterpriseSectionHeader
                        title="Bilgi Bankası Kategorileri"
                        subtitle="Tüm Periodya platform özelliklerinin dökümantasyonunu keşfedin. (1000+ Makale)"
                    />
                    {categories.length === 0 ? (
                        <EnterpriseEmptyState title="Kategori Bulunamadı" description="Sistemde yayınlanan bilgi bankası kategorisi yoktur." icon="📂" />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {categories.map(cat => (
                                <Link href={`/help/articles?category=${cat?.id}`} key={cat?.id}>
                                    <EnterpriseCard className="h-full flex flex-col hover:border-blue-200 dark:hover:border-blue-900/50 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors cursor-pointer p-5!">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 rounded-lg shrink-0 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl">
                                                {cat?.icon || '📁'}
                                            </div>
                                            <div>
                                                <h5 className="font-semibold text-slate-900 dark:text-slate-100 text-base">{cat?.name}</h5>
                                                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{cat?._count?.articles || 0} Makale</p>
                                            </div>
                                        </div>
                                        {cat?.description && (
                                            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mt-auto">
                                                {cat.description}
                                            </p>
                                        )}
                                    </EnterpriseCard>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Main Feed: Articles */}
                    <div className="lg:col-span-2 space-y-12">

                        {/* 4) POPULAR ARTICLES */}
                        <section>
                            <EnterpriseSectionHeader title="En Çok Okunanlar" subtitle="Kullanıcıların platformda en çok faydalandığı makaleler." />
                            {!popularArticles || popularArticles.length === 0 ? (
                                <EnterpriseEmptyState title="Makale Bulunamadı" description="Sistemde popüler makale bulunmuyor." icon="📖" />
                            ) : (
                                <div className="space-y-3">
                                    {popularArticles.map(article => (
                                        <Link href={`/help/articles/${article?.slug}`} key={article?.id} className="block group">
                                            <EnterpriseCard className="p-4! group-hover:bg-slate-50 dark:group-hover:bg-slate-900/50 transition-colors rounded-xl border-slate-200 dark:border-slate-800">
                                                <div className="flex justify-between items-start gap-4">
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-base mb-1">
                                                            {article?.title}
                                                        </h4>
                                                        <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                                                            {article?.category?.name && (
                                                                <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-widest text-slate-600 dark:text-slate-400">
                                                                    {article.category.name}
                                                                </span>
                                                            )}
                                                            <span>•</span>
                                                            <span>Yakın zamanda güncellendi</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center text-xs text-slate-400 font-medium whitespace-nowrap">
                                                        <Book className="w-3.5 h-3.5 mr-1" />
                                                        {article?.viewCount || 0} Okunma
                                                    </div>
                                                </div>
                                            </EnterpriseCard>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* 5) RECENT ARTICLES */}
                        <section>
                            <EnterpriseSectionHeader title="Son Eklenenler & Güncellemeler" subtitle="Periodya'daki en yeni özelliklerin dökümantasyonu." />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {recentArticles?.map(article => (
                                    <Link href={`/help/articles/${article?.slug}`} key={article?.id} className="block h-full">
                                        <EnterpriseCard className="h-full p-4! hover:border-slate-300 dark:hover:border-slate-700 transition-colors flex flex-col">
                                            {article?.category?.name && (
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                                                    {article.category.name}
                                                </span>
                                            )}
                                            <h4 className="font-medium text-slate-900 dark:text-slate-100 text-sm mb-3 line-clamp-2">
                                                {article?.title}
                                            </h4>
                                            <div className="mt-auto flex items-center justify-between text-xs text-slate-500 group-hover:text-blue-600 transition-colors">
                                                <span>Makaleyi İncele</span>
                                                <ChevronRight className="w-4 h-4" />
                                            </div>
                                        </EnterpriseCard>
                                    </Link>
                                ))}
                            </div>
                        </section>

                    </div>

                    {/* 6) HELP ACTIONS (Right Sidebar) */}
                    <div className="space-y-6">
                        <EnterpriseSectionHeader title="Otonom Destek Merkezi" />

                        <div className="grid grid-cols-1 gap-3">
                            <Link href="/help/tickets/new" className="group">
                                <EnterpriseCard className="p-4! border-blue-200 dark:border-blue-900/50 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                        <LifeBuoy className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Destek Talebi Oluştur</h4>
                                        <p className="text-xs text-slate-500">Ekibimizle direkt iletişime geçin.</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                                </EnterpriseCard>
                            </Link>

                            <Link href="/help/tickets" className="group">
                                <EnterpriseCard className="p-4! hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
                                        <Inbox className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Taleplerim & Geçmiş</h4>
                                        <p className="text-xs text-slate-500">Aktif ve çözülmüş biletleriniz.</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                                </EnterpriseCard>
                            </Link>

                            <Link href="/help/articles" className="group">
                                <EnterpriseCard className="p-4! hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Tüm Kütüphane</h4>
                                        <p className="text-xs text-slate-500">Bilgi bankasının tamamı.</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                                </EnterpriseCard>
                            </Link>

                            <div className="group cursor-pointer hover:opacity-95 transition-opacity">
                                <EnterpriseCard className="p-4! bg-slate-900 dark:bg-slate-100 border-transparent flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-white/10 dark:bg-black/10 flex items-center justify-center text-white dark:text-slate-900">
                                        <Sparkles className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-semibold text-white dark:text-slate-900">AI Asistanı Başlat</h4>
                                        <p className="text-xs text-slate-400 dark:text-slate-500">Saniyeler içinde çözüm bulun.</p>
                                    </div>
                                </EnterpriseCard>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </EnterprisePageShell>
    );
}
