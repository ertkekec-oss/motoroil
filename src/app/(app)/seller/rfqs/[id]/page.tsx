import Link from "next/link";
import { prisma, prismaRaw } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import CounterClient from "./CounterClient";
import { ArrowLeft, Building2, Package, XCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SellerRfqDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session: any = await getSession();
    const user = session?.user || session;

    if (!user) redirect("/login");
    const sellerCompanyId = user.companyId || session?.companyId;

    const rfq = await prisma.rfq.findUnique({
        where: { id },
        include: {
            items: {
                where: { sellerCompanyId },
                include: { rfq: true }
            },
            offers: {
                where: { sellerCompanyId }
            }
        }
    });

    if (!rfq || rfq.items.length === 0) {
         return (
             <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] flex items-center justify-center p-6">
                 <div className="bg-white dark:bg-[#1e293b] p-8 rounded-2xl shadow-sm text-center max-w-md border border-slate-200 dark:border-white/10">
                     <XCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
                     <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">İhale Bulunamadı</h2>
                     <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">Aradığınız ihale kaydı bulunamadı veya yetkiniz yok.</p>
                     <Link href="/seller/rfqs" className="inline-flex items-center justify-center bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors">
                         Müzakerelere Dön
                     </Link>
                 </div>
             </div>
         );
    }

    const buyerCompany = await prismaRaw.company.findUnique({
        where: { id: rfq.buyerCompanyId }
    });

    // Enhance items with global product info
    const itemsEnhanced = await Promise.all(
        rfq.items.map(async (item) => {
            const product = await prisma.globalProduct.findUnique({ where: { id: item.productId } });
            return {
                ...item,
                productName: product?.name || "Bilinmeyen Ürün",
            };
        })
    );

    const offer = rfq.offers[0]; // Active offer if any

    return (
        <div className="bg-slate-50 min-h-screen dark:bg-[#0f172a] pb-16 w-full font-sans">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">

                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-white/10 pb-4 mb-6">
                    <Link href="/seller/rfqs" className="hover:text-slate-900 dark:hover:text-white transition-colors">Gelen İhaleler</Link>
                    <span>/</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">#{rfq.id.slice(-6).toUpperCase()}</span>
                </div>

                <div className="mb-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                                Gelen İhale (Fiyat Talebi)
                            </h1>
                            <div className="flex items-center gap-2 mt-3 text-sm text-slate-600 dark:text-slate-400">
                                <Building2 className="w-4 h-4" />
                                <span className="font-semibold text-slate-800 dark:text-white">{buyerCompany?.name || "Bilinmeyen Alıcı"}</span> firmasından geldi.
                            </div>
                        </div>
                        <Link href="/seller/rfqs" className="inline-flex items-center justify-center gap-2 bg-white dark:bg-[#1e293b] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 px-4 py-2 rounded-xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm shrink-0">
                            <ArrowLeft className="w-4 h-4" />
                            İhalelere Dön
                        </Link>
                    </div>
                </div>

                <CounterClient 
                    rfq={JSON.parse(JSON.stringify(rfq))} 
                    items={JSON.parse(JSON.stringify(itemsEnhanced))} 
                    offer={offer ? JSON.parse(JSON.stringify(offer)) : null} 
                />

            </div>
        </div>
    );
}
