import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import CounterClient from "./CounterClient";

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
        return <div className="p-10 text-center">RFQ not found or access denied.</div>;
    }

    const buyerCompany = await prisma.company.findUnique({
        where: { id: rfq.buyerCompanyId }
    });

    // Enhance items with global product info
    const itemsEnhanced = await Promise.all(
        rfq.items.map(async (item) => {
            const product = await prisma.globalProduct.findUnique({ where: { id: item.productId } });
            return {
                ...item,
                productName: product?.name || "Unknown Product",
            };
        })
    );

    const offer = rfq.offers[0]; // Active offer if any

    return (
        <div className="min-h-screen bg-[#F6F7F9] text-slate-900 p-6 font-sans">
            <div className="max-w-[1000px] mx-auto space-y-6">

                <div className="flex items-center gap-2 text-sm text-slate-500 border-b border-slate-200 pb-4">
                    <Link href="/seller/rfqs" className="hover:text-[#1F3A5F] hover:underline">Inbound RFQs</Link>
                    <span>/</span>
                    <span className="font-semibold text-slate-800">#{rfq.id.slice(-6).toUpperCase()}</span>
                </div>

                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-[#1F3A5F]">Inbound Request for Quote</h1>
                        <p className="text-sm text-slate-500 mt-1">
                            From: <span className="font-bold text-slate-800">{buyerCompany?.name || "Unknown"}</span>
                        </p>
                    </div>
                </div>

                <CounterClient rfq={rfq} items={itemsEnhanced} offer={offer} />

            </div>
        </div>
    );
}
