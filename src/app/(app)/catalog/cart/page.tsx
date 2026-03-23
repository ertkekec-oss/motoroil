import { getSession } from "@/lib/auth";
import { getCartAction } from "@/actions/cartActions";
import { prisma, prismaRaw } from "@/lib/prisma";
import CartClient from "./CartClient";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShoppingCart } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CartPage() {
    const session: any = await getSession();
    const user = session?.user || session;

    if (!user) {
        redirect("/login");
    }

    const cart = await getCartAction();

    // Map cart items with their product and supplier details
    // Use prismaRaw to bypass strict tenant isolation for network entities
    const cartDisplay = await Promise.all(
        cart.map(async (item) => {
            const listing = await prismaRaw.networkListing.findFirst({
                where: {
                    sellerCompanyId: item.sellerCompanyId,
                    globalProductId: item.productId,
                    status: "ACTIVE"
                },
                include: { globalProduct: true, company: true }
            });

            if (!listing) return null;

            return {
                productId: item.productId,
                sellerCompanyId: item.sellerCompanyId,
                qty: item.qty,
                price: Number(listing.price),
                productName: listing.globalProduct?.name || "Bilinmeyen Ürün",
                sellerName: listing.company?.name || "Kayıtsız Satıcı",
            };
        })
    );

    const validItems = cartDisplay.filter(item => item !== null) as any[];

    return (
        <div className="bg-slate-50 min-h-screen dark:bg-[#0f172a] pb-16 w-full font-sans">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">

                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-white/10 pb-4 mb-6">
                    <Link href="/catalog" className="hover:text-slate-900 dark:hover:text-white transition-colors">B2B Ortak Katalog</Link>
                    <span>/</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Ağ Sepetim</span>
                </div>

                <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                            <ShoppingCart className="w-6 h-6 text-indigo-500" />
                            Alışveriş Sepeti (B2B Cart)
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Ağ üzerinden farklı tedarikçilerden sepete eklediğiniz ürünlerin listesi.</p>
                    </div>
                    <Link href="/catalog" className="inline-flex items-center justify-center gap-2 bg-white dark:bg-[#1e293b] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 px-4 py-2 rounded-xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm shrink-0">
                        <ArrowLeft className="w-4 h-4" />
                        Alışverişe Devam Et
                    </Link>
                </div>

                <CartClient initialItems={validItems} />

            </div>
        </div>
    );
}
