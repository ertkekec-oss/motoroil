import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import NetworkRfqForm from "./NetworkRfqForm";

export const dynamic = "force-dynamic";

export default async function CreateNetworkRfqPage() {
    const session: any = await getSession();
    const user = session?.user || session;

    if (!user) redirect("/login");

    // Preload available Network Products for the Dropdown.
    // In a massive system, this would be a debounced search API, but for MVP, we'll fetch popular/active ones.
    const activeProductsRaw = await prisma.networkListing.findMany({
        where: { status: "ACTIVE" },
        include: { globalProduct: true },
        distinct: ['globalProductId'], // Fetch unique global products
    });

    const products = activeProductsRaw
        .map(p => ({
            id: p.globalProductId,
            name: p.globalProduct?.name || "Unknown Product",
            code: p.globalProduct?.metadata ? (p.globalProduct.metadata as any).code : null
        }))
        .filter(p => p.id); // Filter out nulls

    return (
        <div className="bg-slate-50 min-h-screen dark:bg-[#0f172a] pb-16 w-full font-sans">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
                
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3">
                        <Link href="/rfq" className="text-sm font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors bg-white dark:bg-[#1e293b] px-3 py-1.5 rounded-lg shadow-sm border border-slate-200 dark:border-white/10 uppercase tracking-widest leading-none">&larr; RFQ Listesi</Link>
                    </div>
                    <h1 className="text-2xl mt-4 font-bold text-slate-900 dark:text-white tracking-tight leading-tight">Ağ Üzerinde Açık İhale Başlat (Network Demand)</h1>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-2xl">
                        Ağdaki yetkin tedarikçilere ulaşmak için akıllı teklif motorunu kullanın. Aradığınız ürünü ve hedef miktarınızı girin; motor otomatik olarak stok tutan satıcılara RFQ (Teklif İsteği) fırlatacaktır.
                    </p>
                </div>

                <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm p-6 lg:p-10">
                    <NetworkRfqForm initialProducts={products} />
                </div>
                
                {/* Information Card */}
                <div className="mt-8 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-6">
                    <h4 className="text-sm font-bold text-blue-900 dark:text-blue-300 uppercase tracking-widest mb-2 flex items-center gap-2">
                        Akıllı Yönlendirme (Routing) Nasıl Çalışır?
                    </h4>
                    <p className="text-sm text-blue-800/80 dark:text-blue-200/80 leading-relaxed mb-4">
                        Manuel olarak satıcı seçmenize gerek yoktur. Sistem, katalogda girdiğiniz ürünü "Aktif" olarak sağlayan, algoritmanın güvendiği satıcıların tamamına otonom bildirim atar. Onlar da kendi fiyatlarını "Gelen Teklifler" (Inbound RFQ) tablosunda görerek anında rekabetçi fiyat girebilirler.
                    </p>
                </div>

            </div>
        </div>
    );
}
