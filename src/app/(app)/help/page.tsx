import React from 'react';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import HelpSearch from '@/components/HelpSearch';
import { AIAssistantPanel } from '@/components/help/AIAssistantPanel';
import { EnterpriseCard, EnterpriseEmptyState, EnterprisePageShell } from '@/components/ui/enterprise';
import { Book, ChevronRight, FileText, LifeBuoy, Inbox, Sparkles, FolderIcon, TrendingUp, Cpu, Activity, PlayCircle, Grid, Search } from 'lucide-react';
import { ClientSideAIButton } from '@/components/help/ClientSideAIButton';

export const metadata = {
    title: 'Bilgi Merkezi - Periodya Enterprise',
};

export default async function KnowledgeHubPage() {
    const session = await getSession();
    if (!session?.tenantId) {
        redirect('/login');
    }

    const tenantFilter = { OR: [{ tenantId: session.tenantId }, { tenantId: null }] };

    let categories: any[] = [], popularArticles: any[] = [], recentArticles: any[] = [];
    try {
        const results = await Promise.all([
            prisma.helpCategory.findMany({
                orderBy: { order: 'asc' },
                take: 24,
                include: { _count: { select: { articles: true } } }
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
        return <div className="p-10 text-red-500 font-bold">Veritabanı bağlantı hatası: {err.message}</div>;
    }

    return (
        <EnterprisePageShell
            title="Sistem & Yardım Merkezi"
            description="Tüm platform özelliklerini keşfedin, yapay zekaya sorun veya canlı destek talebi oluşturun."
        >
            <div className="space-y-6">
                <AIAssistantPanel />

                {/* ADVANCED AI SEARCH HERO */}
                <EnterpriseCard className="relative overflow-hidden bg-slate-950 dark:bg-slate-950 border-0 shadow-[0_10px_40px_-15px_rgba(30,27,75,0.6)] !p-0">
                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none mix-blend-screen">
                        <Cpu className="w-64 h-64 text-indigo-500" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-emerald-500/5 pointer-events-none" />
                    
                    <div className="relative z-10 p-8 md:p-12 lg:p-16 flex flex-col md:flex-row items-center gap-10">
                        <div className="flex-1 space-y-6">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-black uppercase tracking-widest backdrop-blur-sm">
                                <Sparkles className="w-3.5 h-3.5" /> Otonom Asistan Aktif
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
                                Merhaba, {session.name?.split(' ')[0] || 'Kullanıcı'} <br/>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">Size nasıl yardımcı olabilirim?</span>
                            </h1>
                            <p className="text-slate-400 max-w-xl text-sm leading-relaxed font-medium">
                                Ekibimiz ve otonom zekamız 7/24 hizmetinizde. Modüller hakkında bilgi almak veya bir sorunu çözmek için arama yapabilir veya doğrudan destek masasına bağlanabilirsiniz.
                            </p>

                            <div className="w-full max-w-2xl translate-y-2">
                                <HelpSearch />
                            </div>
                        </div>

                        <div className="w-full md:w-80 shrink-0">
                            <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-white/10 p-6 flex flex-col gap-4 shadow-2xl">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                                        <Activity className="w-5 h-5 text-emerald-400" />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold text-sm">Sistem Durumu</h4>
                                        <p className="text-emerald-400 text-[10px] uppercase tracking-widest font-black">Tüm Operasyonlar Stabil</p>
                                    </div>
                                </div>
                                <div className="h-px bg-white/5 w-full"></div>
                                <ClientSideAIButton />
                            </div>
                        </div>
                    </div>
                </EnterpriseCard>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* LEFT CONTENT COL */}
                    <div className="lg:col-span-8 space-y-6">
                        
                        {/* KATEGORI KILAVUZU */}
                        <EnterpriseCard className="border border-slate-200 dark:border-white/5 bg-white dark:bg-[#0f172a] shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-widest uppercase flex items-center gap-2">
                                    <Grid className="w-5 h-5 text-indigo-500" /> Kategori Kılavuzu
                                </h2>
                            </div>

                            {categories.length === 0 ? (
                                <EnterpriseEmptyState title="Sistemde Kategori Yok" description="Destek merkezine henüz bir kategori eklenmemiş." icon={<FolderIcon size={40} className="mx-auto block text-slate-400" />} />
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {categories.map((cat: any) => (
                                        <Link href={`/help/articles?category=${cat?.id}`} key={cat?.id} className="group block h-full">
                                            <div className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-800 hover:border-indigo-300 dark:hover:border-indigo-500/40 transition-all h-full shadow-sm hover:shadow-md">
                                                <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-950 flex items-center justify-center text-xl shrink-0 border border-slate-200 dark:border-white/5 group-hover:scale-110 transition-transform">
                                                    {cat?.icon || '📁'}
                                                </div>
                                                <div>
                                                    <h5 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">{cat?.name}</h5>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">{cat?._count?.articles || 0} İçerik Mevcut</p>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </EnterpriseCard>

                        {/* YENİ EKLENENLER */}
                        <EnterpriseCard className="border border-slate-200 dark:border-white/5 bg-white dark:bg-[#0f172a] shadow-sm">
                            <div className="flex items-center gap-2 mb-6">
                                <PlayCircle className="w-5 h-5 text-emerald-500" />
                                <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-widest uppercase">Platform Haberleri & Güncellemeler</h2>
                            </div>

                            <div className="space-y-3">
                                {recentArticles?.length === 0 ? (
                                    <div className="py-8 text-center text-sm font-bold text-slate-500 dark:text-slate-600">Henüz yayınlanan bir haber yok.</div>
                                ) : (
                                    recentArticles.map((article: any) => (
                                        <Link href={`/help/articles/${article?.slug}`} key={article?.id} className="group block">
                                            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 hover:border-emerald-300 dark:hover:border-emerald-500/40 transition-all shadow-sm">
                                                <div className="flex items-center gap-4 min-w-0">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400">{article?.title}</h4>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        </Link>
                                    ))
                                )}
                            </div>
                        </EnterpriseCard>

                    </div>

                    {/* RIGHT SIDEBAR COL */}
                    <div className="lg:col-span-4 space-y-6">
                        
                        {/* DESTEK TALEPLERI & QUICK ACTIONS */}
                        <EnterpriseCard className="border border-slate-200 dark:border-white/5 bg-white dark:bg-[#0f172a] shadow-sm !p-0 overflow-hidden">
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-5 border-b border-slate-100 dark:border-white/5">
                                <h3 className="font-black text-slate-900 dark:text-white text-sm tracking-widest uppercase flex items-center gap-2">
                                    <LifeBuoy className="w-4 h-4 text-indigo-500" /> Hızlı Erişim
                                </h3>
                            </div>
                            <div className="p-3 flex flex-col gap-2">
                                <Link href="/support/new" className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                                    <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-500/20 shadow-sm">
                                        <Inbox className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Yeni Talep Oluştur</p>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Destek uzmanına bağlan</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500" />
                                </Link>

                                <Link href="/support" className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                                    <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 shadow-sm">
                                        <TrendingUp className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-slate-600 dark:group-hover:text-white transition-colors">Açık Taleplerim</p>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Geçmiş ve mevcut biletler</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-500" />
                                </Link>
                                
                                <Link href="/help/articles" className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                                    <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 shadow-sm">
                                        <Book className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-slate-600 dark:group-hover:text-white transition-colors">Tüm Kılavuzlar</p>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Makale kütüphanesi</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-500" />
                                </Link>
                            </div>
                        </EnterpriseCard>

                        {/* POPÜLER OKUNANLAR (TRENDING) */}
                        <EnterpriseCard className="border border-slate-200 dark:border-white/5 bg-white dark:bg-[#0f172a] shadow-sm !p-0 overflow-hidden">
                            <div className="p-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                                <h3 className="font-black text-slate-900 dark:text-white text-sm tracking-widest uppercase flex items-center gap-2">
                                    <Search className="w-4 h-4 text-rose-500" /> En Sık Sorulanlar
                                </h3>
                            </div>
                            <div className="p-4 flex flex-col gap-3">
                                {popularArticles?.length === 0 ? (
                                    <div className="text-center text-xs font-bold text-slate-500">Veri yok.</div>
                                ) : (
                                    popularArticles.map((article: any, index: number) => (
                                        <Link href={`/help/articles/${article?.slug}`} key={article?.id} className="group flex gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors">
                                            <div className="w-6 h-6 rounded flex items-center justify-center font-black text-xs text-rose-500 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 shrink-0">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <h5 className="font-bold text-slate-800 dark:text-slate-200 text-xs line-clamp-2 leading-relaxed group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                                    {article?.title}
                                                </h5>
                                                <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">{article?.viewCount || 0} Çözüm Okuması</div>
                                            </div>
                                        </Link>
                                    ))
                                )}
                            </div>
                        </EnterpriseCard>

                    </div>
                </div>
            </div>
        </EnterprisePageShell>
    );
}
