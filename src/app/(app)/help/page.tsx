import React from 'react';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import HelpSearch from '@/components/HelpSearch';
import { AIAssistantPanel } from '@/components/help/AIAssistantPanel';
import { EnterprisePageShell, EnterpriseCard, EnterpriseSectionHeader, EnterpriseButton } from '@/components/ui/enterprise';

export const metadata = {
    title: 'Support Hub - Periodya Enterprise',
};

export default async function HelpCenterPage() {
    const session = await getSession();
    if (!session?.tenantId) {
        redirect('/login');
    }

    // Parallel fetch initial required data
    const [categories, recentTickets, recommendedArticles] = await Promise.all([
        prisma.helpCategory.findMany({
            orderBy: { order: 'asc' },
            take: 10,
            include: {
                _count: {
                    select: { topics: true }
                }
            }
        }),
        prisma.supportTicket.findMany({
            where: { tenantId: session.tenantId, createdByUserId: session.id },
            orderBy: { createdAt: 'desc' },
            take: 3,
            select: { id: true, subject: true, status: true, priority: true, createdAt: true }
        }),
        prisma.helpArticle.findMany({
            where: { status: 'PUBLISHED', OR: [{ tenantId: session.tenantId }, { tenantId: null }] },
            orderBy: { viewCount: 'desc' },
            take: 3
        })
    ]);

    return (
        <EnterprisePageShell className="bg-slate-50 dark:bg-slate-950 min-h-screen">

            {/* AI Floating Panel */}
            <AIAssistantPanel />

            {/* A) Hero Search Area */}
            <div className="flex flex-col items-center justify-center text-center py-12 px-4">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-3">
                    Nasıl yardımcı olabiliriz?
                </h1>
                <p className="text-base text-slate-500 dark:text-slate-400 mb-8 max-w-xl">
                    Konu arayın, AI asistandan anında yardım alın veya teknik ekibimizle iletişime geçmek için destek talebi oluşturun.
                </p>

                <div className="w-full max-w-2xl relative">
                    <HelpSearch />
                </div>
            </div>

            <div className="max-w-[1080px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">

                {/* Left Column (Main Content) */}
                <div className="lg:col-span-2 space-y-8">

                    {/* B) Suggested Help */}
                    <section>
                        <EnterpriseSectionHeader title="Önerilen Çözümler" subtitle="Sizin için en çok aranan ve faydalı bulunan makaleler." />
                        <div className="grid sm:grid-cols-2 gap-4">
                            {recommendedArticles.map(article => (
                                <Link href={`/help/articles/${article.slug}`} key={article.id}>
                                    <EnterpriseCard className="hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer h-full flex flex-col justify-between">
                                        <div>
                                            <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-2 truncate">{article.title}</h4>
                                            <p className="text-xs text-slate-500 line-clamp-2">{article.summary || 'Makale detayını görüntülemek için tıklayın.'}</p>
                                        </div>
                                        <div className="mt-4 text-[10px] uppercase font-bold text-slate-400 tracking-wider flex justify-between items-center">
                                            <span>Makaleyi Oku →</span>
                                            {article.viewCount > 0 && <span>{article.viewCount} Görüntülenme</span>}
                                        </div>
                                    </EnterpriseCard>
                                </Link>
                            ))}
                        </div>
                    </section>

                    {/* C) Knowledge Base Categories */}
                    <section>
                        <EnterpriseSectionHeader title="Bilgi Bankası Kategorileri" subtitle="Modül veya özellik bazında dökümantasyona göz atın." />
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {categories.map(cat => (
                                <Link href={`/help/articles?category=${cat.id}`} key={cat.id}>
                                    <EnterpriseCard className="flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors cursor-pointer p-4!">
                                        <div className="w-8 h-8 rounded shrink-0 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg">
                                            {cat.icon || '📁'}
                                        </div>
                                        <div className="overflow-hidden">
                                            <h5 className="font-semibold text-slate-800 dark:text-slate-200 text-sm truncate">{cat.name}</h5>
                                            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{cat._count.topics} Mdkale</p>
                                        </div>
                                    </EnterpriseCard>
                                </Link>
                            ))}
                        </div>
                    </section>

                </div>

                {/* Right Column (Sidebar) */}
                <div className="space-y-8">

                    {/* E) Quick Support Actions */}
                    <section>
                        <EnterpriseSectionHeader title="Hızlı İşlemler" />
                        <EnterpriseCard noPadding className="divide-y divide-slate-100 dark:divide-slate-800">
                            <Link href="/help/tickets/new" className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                <div className="flex items-center gap-3">
                                    <span className="w-8 h-8 rounded bg-slate-900 text-white dark:bg-white dark:text-slate-900 flex items-center justify-center font-bold text-xs shrink-0">+</span>
                                    <span className="font-medium text-sm text-slate-800 dark:text-slate-200">Destek Talebi Oluştur</span>
                                </div>
                                <span className="text-slate-400 group-hover:translate-x-1 transition-transform">→</span>
                            </Link>
                            <Link href="/help/tickets" className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                <div className="flex items-center gap-3">
                                    <span className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 font-bold text-xs shrink-0">B</span>
                                    <span className="font-medium text-sm text-slate-800 dark:text-slate-200">Biletlerim & Taleplerim</span>
                                </div>
                                <span className="text-slate-400 group-hover:translate-x-1 transition-transform">→</span>
                            </Link>
                            <Link href="/help/articles" className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                <div className="flex items-center gap-3">
                                    <span className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 font-bold text-xs shrink-0">D</span>
                                    <span className="font-medium text-sm text-slate-800 dark:text-slate-200">Tüm Makaleler</span>
                                </div>
                                <span className="text-slate-400 group-hover:translate-x-1 transition-transform">→</span>
                            </Link>
                        </EnterpriseCard>
                    </section>

                    {/* D) Recent Tickets */}
                    <section>
                        <EnterpriseSectionHeader title="Açık Talepleriniz" subtitle="Son oluşturduğunuz biletler." />
                        {recentTickets.length === 0 ? (
                            <div className="p-6 border border-slate-200 dark:border-slate-800 border-dashed rounded-xl text-center">
                                <p className="text-sm text-slate-500">Şu anda açık bir destek talebiniz bulunmuyor.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {recentTickets.map(ticket => (
                                    <Link href={`/help/tickets/${ticket.id}`} key={ticket.id} className="block">
                                        <EnterpriseCard className="p-4! hover:border-slate-300 dark:hover:border-slate-600 transition-colors cursor-pointer flex flex-col gap-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <h5 className="font-medium text-sm text-slate-800 dark:text-slate-200 truncate">{ticket.subject}</h5>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider shrink-0 ${ticket.status === 'OPEN' ? 'bg-blue-100 text-blue-700' : ticket.status === 'IN_PROGRESS' || ticket.status === 'WAITING_USER' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                                                    {ticket.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium tracking-wide">
                                                <span className={`${ticket.priority === 'CRITICAL' ? 'text-rose-600' : ticket.priority === 'HIGH' ? 'text-orange-500' : ''}`}>
                                                    Öncelik: {ticket.priority}
                                                </span>
                                                <span>{ticket.createdAt.toLocaleDateString('tr-TR')}</span>
                                            </div>
                                        </EnterpriseCard>
                                    </Link>
                                ))}
                                <Link href="/help/tickets" className="block text-center text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 mt-4 leading-none py-2">
                                    Tümünü Gör
                                </Link>
                            </div>
                        )}
                    </section>

                </div>
            </div>
        </EnterprisePageShell>
    );
}
