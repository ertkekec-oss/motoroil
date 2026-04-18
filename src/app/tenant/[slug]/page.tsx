import React from 'react';
import Link from 'next/link';
import { ArrowRight, ShoppingBag, Store, ShieldCheck } from 'lucide-react';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const tenant = await prisma.tenant.findUnique({
        where: { tenantSlug: slug },
    });
    
    // If not found, use a fallback generic title
    return {
        title: tenant?.name ? `${tenant.name} Portalı` : 'Firma Portalı',
        description: 'Müşteri ve Bayi Portalı'
    };
}

export default async function TenantGatewayPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const tenant = await prisma.tenant.findUnique({
        where: { tenantSlug: slug },
        select: { id: true, name: true }
    });

    if (!tenant) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0B1220] flex items-center justify-center p-4">
            {/* Soft decorative background elements */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-blue-500/5 dark:bg-blue-500/10 blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-orange-500/5 dark:bg-orange-500/10 blur-3xl pointer-events-none"></div>
            
            <div className="max-w-2xl w-full bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl overflow-hidden relative z-10 border border-slate-200 dark:border-slate-800/80">
                {/* Header */}
                <div className="p-8 pb-10 text-center border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/30">
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">{tenant.name}</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Lütfen giriş yapmak istediğiniz modülü seçin.</p>
                </div>

                {/* Gateway Cards */}
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                    
                    {/* Q-Menu Card */}
                    <Link href={`/menu`} className="group">
                        <div className="h-full flex flex-col p-6 rounded-[24px] border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-all duration-300 relative overflow-hidden">
                            <div className="w-14 h-14 rounded-2xl bg-orange-100 dark:bg-orange-500/20 text-orange-600 flex items-center justify-center mb-6 shrink-0 group-hover:scale-110 transition-transform">
                                <Utensils size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Q-Menu / Sipariş</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 flex-1">
                                Restoran veya mağaza menüsüne göz atın, ürünleri inceleyin ve online olarak anında sparişinizi verin (Tüketici Portalı).
                            </p>
                            <div className="flex items-center text-sm font-bold text-orange-600 uppercase tracking-widest gap-2">
                                Menüye Git <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
                            </div>
                        </div>
                    </Link>

                    {/* B2B Portal Card */}
                    <Link href={`/b2b`} className="group">
                        <div className="h-full flex flex-col p-6 rounded-[24px] border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-600/10 transition-all duration-300 relative overflow-hidden">
                            <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-600/20 text-blue-600 flex items-center justify-center mb-6 shrink-0 group-hover:scale-110 transition-transform">
                                <Store size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">B2B Bayi Ağı</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 flex-1">
                                Toptan siparişler, bayi hesabınız, cari ekstralarınız ve özel iskontolarınızı görebilmek için giriş yapın (Yetkili Portal).
                            </p>
                            <div className="flex items-center text-sm font-bold text-blue-600 uppercase tracking-widest gap-2">
                                Portala Dön <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
                            </div>
                        </div>
                    </Link>

                </div>

                {/* Footer Security Badge */}
                <div className="px-8 py-5 flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                        <ShieldCheck size={14} /> Periodya Security & Auth
                    </div>
                </div>
            </div>
        </div>
    );
}

// Icon hack to avoid missing imports since Utensils isn't imported from lucide-react above.
function Utensils({ size, className }: { size: number, className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>
            <path d="M7 2v20"/>
            <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
        </svg>
    )
}
