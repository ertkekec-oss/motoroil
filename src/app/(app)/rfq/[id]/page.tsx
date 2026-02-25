import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import RfqDetailClient from "./RfqDetailClient";

export const dynamic = "force-dynamic";

export default async function BuyerRfqPage({ params }: { params: { id: string } }) {
    const session: any = await getSession();
    const user = session?.user || session;

    if (!user) redirect("/login");
    const buyerCompanyId = user.companyId || session?.companyId;

    const rfq = await prisma.rfq.findUnique({
        where: { id: params.id, buyerCompanyId },
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
        return <div className="p-10 text-center">RFQ not found or access denied.</div>;
    }

    // Enhance items with GlobalProduct and Seller company names
    const itemsEnhanced = await Promise.all(
        rfq.items.map(async (item) => {
            const product = await prisma.globalProduct.findUnique({ where: { id: item.productId } });
            const seller = await prisma.company.findUnique({ where: { id: item.sellerCompanyId } });
            return {
                ...item,
                productName: product?.name || "Unknown Product",
                sellerName: seller?.name || "Unknown Seller",
            };
        })
    );

    const offersEnhanced = await Promise.all(
        rfq.offers.map(async (o) => {
            const seller = await prisma.company.findUnique({ where: { id: o.sellerCompanyId } });
            return {
                ...o,
                sellerName: seller?.name || "Unknown Seller",
            };
        })
    );

    return (
        <div className="min-h-screen bg-[#F6F7F9] text-slate-900 p-6 font-sans">
            <div className="max-w-[1200px] mx-auto space-y-6">

                <div className="flex items-center gap-2 text-sm text-slate-500 border-b border-slate-200 pb-4">
                    <Link href="/catalog" className="hover:text-[#1F3A5F] hover:underline">Catalog</Link>
                    <span>/</span>
                    <Link href="/rfq" className="hover:text-[#1F3A5F] hover:underline">My RFQs</Link>
                    <span>/</span>
                    <span className="font-semibold text-slate-800">#{rfq.id.slice(-6).toUpperCase()}</span>
                </div>

                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-[#1F3A5F]">Request for Quote</h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Status: <span className="font-bold uppercase px-2 py-0.5 rounded bg-slate-200 text-slate-700">{rfq.status}</span>
                        </p>
                    </div>
                </div>

                <RfqDetailClient rfq={rfq} items={itemsEnhanced} offers={offersEnhanced} />

            </div>
        </div>
    );
}
