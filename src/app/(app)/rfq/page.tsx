import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function BuyerRfqListPage() {
    const session: any = await getSession();
    const user = session?.user || session;

    if (!user) redirect("/login");
    const buyerCompanyId = user.companyId || session?.companyId;

    const rfqs = await prisma.rfq.findMany({
        where: { buyerCompanyId },
        include: {
            items: true,
            offers: true,
        },
        orderBy: { createdAt: "desc" }
    });

    return (
        <div className="min-h-screen bg-[#F6F7F9] text-slate-900 p-6 font-sans">
            <div className="max-w-[1200px] mx-auto space-y-6">

                <div className="flex items-center gap-2 text-sm text-slate-500 border-b border-slate-200 pb-4">
                    <Link href="/catalog" className="hover:text-[#1F3A5F] hover:underline">Catalog</Link>
                    <span>/</span>
                    <span className="font-semibold text-slate-800">My Negotiated Quotes (RFQs)</span>
                </div>

                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-[#1F3A5F]">My RFQs</h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Track the status of your quote requests with B2B network suppliers.
                        </p>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
                    <table className="min-w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-[#1F3A5F] text-white">
                            <tr>
                                <th className="px-4 py-3 font-semibold">RFQ ID</th>
                                <th className="px-4 py-3 font-semibold">Date Created</th>
                                <th className="px-4 py-3 font-semibold text-center">Items</th>
                                <th className="px-4 py-3 font-semibold text-center">Active Offers</th>
                                <th className="px-4 py-3 font-semibold text-center">Status</th>
                                <th className="px-4 py-3 font-semibold text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {rfqs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500 font-medium">You have no active RFQ requests.</td>
                                </tr>
                            ) : (
                                rfqs.map((r: any) => (
                                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3 font-mono font-medium text-slate-900">
                                            #{r.id.slice(-6).toUpperCase()}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">
                                            {new Date(r.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3 text-center font-mono font-bold">
                                            {r.items.length}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {r.offers.filter((o: any) => o.status !== "REJECTED").length}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${r.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-700' :
                                                    r.status === 'DRAFT' ? 'bg-slate-200 text-slate-600' :
                                                        'bg-amber-100 text-amber-700'
                                                }`}>
                                                {r.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <Link
                                                href={`/rfq/${r.id}`}
                                                className="inline-block px-3 py-1 bg-black text-white text-xs font-semibold rounded-md hover:bg-slate-800 transition-colors active:scale-95"
                                            >
                                                Details
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
