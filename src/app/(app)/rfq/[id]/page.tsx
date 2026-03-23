import Link from "next/link";
import { prisma, prismaRaw } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import RfqDetailClient from "./RfqDetailClient";
import { ArrowLeft, CheckCircle2, Clock, XCircle, FileText } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BuyerRfqPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session: any = await getSession();
    const user = session?.user || session;

    if (!user) redirect("/login");
    const buyerCompanyId = user.companyId || session?.companyId;

    const rfq = await prisma.rfq.findUnique({
        where: { id, buyerCompanyId },
        include: {
            items: {
                include: {
                    rfq: true,
                }
            },
            offers: {
                include: {
                    items: true,
                    rfq: true,
                }
            }
        }
    });

    if (!rfq) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] flex items-center justify-center p-6">
                <div className="bg-white dark:bg-[#1e293b] p-8 rounded-2xl shadow-sm text-center max-w-md border border-slate-200 dark:border-white/10">
                    <XCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">İhale Bulunamadı</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">Aradığınız ihale kaydı bulunamadı veya bu kayda erişim yetkiniz yok.</p>
                    <Link href="/rfq" className="inline-flex items-center justify-center bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors">
                        İhale Listesine Dön
                    </Link>
                </div>
            </div>
        );
    }

    // Enhance items with GlobalProduct and Seller company names
    const itemsEnhanced = await Promise.all(
        rfq.items.map(async (item) => {
            const product = await prisma.globalProduct.findUnique({ where: { id: item.productId } });
            const seller = await prismaRaw.company.findUnique({ where: { id: item.sellerCompanyId } });
            return {
                ...item,
                productName: product?.name || "Bilinmeyen Ürün",
                sellerName: seller?.name || "Bilinmeyen Satıcı (Ağ)",
            };
        })
    );

    const offersEnhanced = await Promise.all(
        rfq.offers.map(async (o) => {
            const seller = await prismaRaw.company.findUnique({ where: { id: o.sellerCompanyId } });
            return {
                ...o,
                sellerName: seller?.name || "Bilinmeyen Satıcı (Ağ)",
            };
        })
    );

    const statusConfig = {
        'DRAFT': { label: 'TASLAK', icon: FileText, color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800/50', border: 'border-slate-200 dark:border-slate-700' },
        'SENT': { label: 'TEKLİF BEKLİYOR', icon: Clock, color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/20' },
        'RESPONDED': { label: 'YANITLANDI', icon: CheckCircle2, color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-200 dark:border-blue-500/20' },
        'ACCEPTED': { label: 'KABUL EDİLDİ', icon: CheckCircle2, color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20' },
        'CANCELLED': { label: 'İPTAL EDİLDİ', icon: XCircle, color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800/50', border: 'border-slate-200 dark:border-slate-700' },
    }[rfq.status] || { label: rfq.status, icon: FileText, color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200' };

    const StatusIcon = statusConfig.icon;

    return (
        <div className="bg-slate-50 min-h-screen dark:bg-[#0f172a] pb-16 w-full font-sans">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">

                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-white/10 pb-4 mb-6">
                    <Link href="/catalog" className="hover:text-slate-900 dark:hover:text-white transition-colors">Katalog</Link>
                    <span>/</span>
                    <Link href="/rfq" className="hover:text-slate-900 dark:hover:text-white transition-colors">Teklif Taleplerim</Link>
                    <span>/</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">#{rfq.id.slice(-6).toUpperCase()}</span>
                </div>

                <div className="mb-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                                Teklif Talebi
                            </h1>
                            <div className="flex items-center gap-2 mt-3">
                                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Durum:</span>
                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border ${statusConfig.bg} ${statusConfig.color} ${statusConfig.border}`}>
                                    <StatusIcon className="w-3.5 h-3.5" />
                                    {statusConfig.label}
                                </div>
                            </div>
                        </div>
                        <Link href="/rfq" className="inline-flex items-center justify-center gap-2 bg-white dark:bg-[#1e293b] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 px-4 py-2 rounded-xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm shrink-0">
                            <ArrowLeft className="w-4 h-4" />
                            Geri Dön
                        </Link>
                    </div>
                </div>
                <RfqDetailClient 
                    rfq={JSON.parse(JSON.stringify(rfq))} 
                    items={JSON.parse(JSON.stringify(itemsEnhanced))} 
                    offers={JSON.parse(JSON.stringify(offersEnhanced))} 
                />

            </div>
        </div>
    );
}
