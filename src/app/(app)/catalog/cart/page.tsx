import { getSession } from "@/lib/auth";
import { getCartAction } from "@/actions/cartActions";
import { prisma } from "@/lib/prisma";
import CartClient from "./CartClient";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CartPage() {
    const session: any = await getSession();
    const user = session?.user || session;

    if (!user) {
        redirect("/login");
    }

    const cart = await getCartAction();

    // Map cart items with their product and supplier details
    const cartDisplay = await Promise.all(
        cart.map(async (item) => {
            const listing = await prisma.networkListing.findFirst({
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
                productName: listing.globalProduct?.name || "Unknown Product",
                sellerName: listing.company?.name || "Unknown Seller",
            };
        })
    );

    const validItems = cartDisplay.filter(item => item !== null) as any[];

    return (
        <div className="min-h-screen bg-[#F6F7F9] text-slate-900 p-6 font-sans">
            <div className="max-w-[1200px] mx-auto space-y-6">

                <div className="flex items-center gap-2 text-sm text-slate-500 border-b border-slate-200 pb-4">
                    <Link href="/catalog" className="hover:text-[#1F3A5F] hover:underline">Catalog</Link>
                    <span>/</span>
                    <span className="font-semibold text-slate-800">Sepet</span>
                </div>

                <CartClient initialItems={validItems} />

            </div>
        </div>
    );
}
