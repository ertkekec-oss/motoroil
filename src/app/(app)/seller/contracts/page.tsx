import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SellerContractsPage() {
    const session: any = await getSession();
    const user = session?.user || session;

    if (!user) redirect("/login");
    const sellerCompanyId = user.companyId || session?.companyId;

    const contracts = await prisma.contract.findMany({
        where: { sellerCompanyId },
        include: {
            items: {
                include: { reservedStock: true }
            },
            recurringOrders: true
        },
        orderBy: { createdAt: "desc" }
    });

    // Resolve buyer names
    const contractsEnhanced = await Promise.all(
        contracts.map(async (c) => {
            const buyer = await prisma.company.findUnique({ where: { id: c.buyerCompanyId } });
            return {
                ...c,
                buyerName: buyer?.name || "Unknown Buyer"
            };
        })
    );

    return (
        <div className="min-h-screen bg-[#F6F7F9] text-slate-900 p-6 font-sans">
            <div className="max-w-[1200px] mx-auto space-y-6">

                <div className="flex items-center gap-2 text-sm text-slate-500 border-b border-slate-200 pb-4">
                    <span className="font-semibold text-slate-800">My Supplier Contracts</span>
                </div>

                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-[#1F3A5F]">Active Supply Agreements</h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Monitor the enterprise purchasing contracts where you are the supplier.
                        </p>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
                    <table className="min-w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-[#1F3A5F] text-white">
                            <tr>
                                <th className="px-4 py-3 font-semibold">Contract Ref</th>
                                <th className="px-4 py-3 font-semibold">Purchaser (Buyer)</th>
                                <th className="px-4 py-3 font-semibold text-center">Status</th>
                                <th className="px-4 py-3 font-semibold text-center">Active Items</th>
                                <th className="px-4 py-3 font-semibold text-center">Settlement</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {contractsEnhanced.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500 font-medium">You have no active supplier contracts yet.</td>
                                </tr>
                            ) : (
                                contractsEnhanced.map(c => (
                                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3 font-mono font-medium text-slate-900">
                                            {c.id.slice(-8).toUpperCase()}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600 font-semibold text-[13px]">
                                            {c.buyerName}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${c.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                                                    c.status === 'DRAFT' ? 'bg-slate-200 text-slate-600' :
                                                        'bg-amber-100 text-amber-700'
                                                }`}>
                                                {c.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center font-mono font-bold">
                                            {c.items.length}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded uppercase">{c.settlementCycle}</span>
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
