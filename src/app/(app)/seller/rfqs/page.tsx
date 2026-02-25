import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SellerRfqsListPage() {
    const session: any = await getSession();
    const user = session?.user || session;

    if (!user) redirect("/login");
    const sellerCompanyId = user.companyId || session?.companyId;

    // Find all RFQs where this seller has an item and the RFQ is SENT or RESPONDED
    const rfqs = await prisma.rfq.findMany({
        where: {
            status: { in: ["SENT", "RESPONDED", "ACCEPTED"] },
            items: {
                some: { sellerCompanyId }
            }
        },
        include: {
            items: {
                where: { sellerCompanyId } // Only include THIS seller's requested items
            },
            offers: {
                where: { sellerCompanyId } // Only include THIS seller's offers
            }
        },
        orderBy: { updatedAt: "desc" }
    });

    const rfqsEnhanced = await Promise.all(rfqs.map(async r => {
        const buyer = await prisma.company.findUnique({ where: { id: r.buyerCompanyId } });
        return {
            ...r,
            buyerName: buyer?.name || "Unknown Buyer"
        }
    }));

    return (
        <div className="min-h-screen bg-[#F6F7F9] text-slate-900 p-6 font-sans">
            <div className="max-w-[1200px] mx-auto space-y-6">

                <div className="flex items-center gap-2 text-sm text-slate-500 border-b border-slate-200 pb-4">
                    <span className="font-semibold text-slate-800">Inbound RFQs (Quote Requests)</span>
                </div>

                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-[#1F3A5F]">Inbound Negotiable Quotes</h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Respond to direct B2B buyer catalog requests with custom prices.
                        </p>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-md overflow-hidden flex flex-col h-[calc(100vh-200px)]">
                    <div className="overflow-auto flex-1 relative">
                        <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
                            <thead className="bg-[#1F3A5F] text-white sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-3 font-semibold">RFQ ID</th>
                                    <th className="px-4 py-3 font-semibold">Requesting Company</th>
                                    <th className="px-4 py-3 font-semibold text-center">Your Items</th>
                                    <th className="px-4 py-3 font-semibold text-center">My Offer Status</th>
                                    <th className="px-4 py-3 font-semibold text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-slate-700">
                                {rfqs.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-slate-500 font-medium">No inbound quotes pending your response.</td>
                                    </tr>
                                ) : (
                                    rfqsEnhanced.map(r => {
                                        const myOffer = r.offers[0]; // Assuming one offer per seller per RFQ in MVP
                                        return (
                                            <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-4 py-3 font-mono font-medium text-slate-900">
                                                    #{r.id.slice(-6).toUpperCase()}
                                                </td>
                                                <td className="px-4 py-3 font-medium text-slate-900">
                                                    {r.buyerName}
                                                </td>
                                                <td className="px-4 py-3 text-center font-mono font-bold">
                                                    {r.items.length}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${!myOffer ? 'bg-red-100 text-red-700' :
                                                        myOffer.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-700' :
                                                            myOffer.status === 'COUNTERED' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'
                                                        }`}>
                                                        {!myOffer ? "UNRESPONDED" : myOffer.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <Link
                                                        href={`/seller/rfqs/${r.id}`}
                                                        className="inline-block px-3 py-1 bg-black text-white text-xs font-semibold rounded-md hover:opacity-90 active:scale-95 transition-transform"
                                                    >
                                                        Review & Counter
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}
