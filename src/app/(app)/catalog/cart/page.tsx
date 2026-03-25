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
        <div className="bg-slate-50 min-h-screen  pb-16 w-full font-sans">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">

                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 mb-6 border-b border-slate-200  pb-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400  mb-2">
                            <Link href="/catalog" className="hover:text-indigo-600 :text-indigo-400 transition-colors">B2B Ortak Katalog</Link>
                            <span>/</span>
                            <span className="text-slate-700 ">Ağ Sepetim</span>
                        </div>
                        <h1 className="text-xl font-bold text-slate-900  flex items-center gap-2">
                            <ShoppingCart className="w-5 h-5 text-indigo-600 " />
                            Ağ Sepetim (B2B Cart)
                        </h1>
                        <p className="text-[13px] text-slate-500  mt-1.5 max-w-4xl">
                            Ağ üzerinden farklı tedarikçilerden sepete eklediğiniz ürünlerin listesi.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 mt-4 md:mt-0">
                        <Link href="/catalog" className="h-8 px-4 inline-flex items-center justify-center rounded-lg text-[12px] font-bold bg-white  text-slate-700  border border-slate-200  hover:bg-slate-50 :bg-slate-800 transition-colors shadow-sm gap-2">
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Alışverişe Devam Et
                        </Link>
                    </div>
                </div>

                <CartClient initialItems={validItems} />

            </div>
        </div>
    );
}
