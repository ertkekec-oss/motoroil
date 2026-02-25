import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function BuyerContractsPage() {
    const session: any = await getSession();
    const user = session?.user || session;

    if (!user) redirect("/login");
    const buyerCompanyId = user.companyId || session?.companyId;

    const contracts = await prisma.contract.findMany({
        where: { buyerCompanyId },
        include: {
            items: true,
            recurringOrders: true
        },
        orderBy: { createdAt: "desc" }
    });

    // Resolve seller names
    const contractsEnhanced = await Promise.all(
        contracts.map(async (c) => {
            const seller = await prisma.company.findUnique({ where: { id: c.sellerCompanyId } });
            return {
                ...c,
                sellerName: seller?.name || "Unknown Seller"
            };
        })
    );

    return (
        <div className="min-h-screen bg-[#F6F7F9] text-slate-900 p-6 font-sans">
            <div className="max-w-[1200px] mx-auto space-y-6">

                <div className="flex items-center gap-2 text-sm text-slate-500 border-b border-slate-200 pb-4">
                    <Link href="/catalog" className="hover:text-[#1F3A5F] hover:underline">Catalog</Link>
                    <span>/</span>
                    <span className="font-semibold text-slate-800">My Supplier Contracts</span>
                </div>

                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-[#1F3A5F]">Active Agreements (Contracts)</h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Manage your enterprise procurement contracts, specific tier pricings, and recurring schedules.
                        </p>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
                    <table className="min-w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-[#1F3A5F] text-white">
                            <tr>
                                <th className="px-4 py-3 font-semibold">Contract Ref</th>
                                <th className="px-4 py-3 font-semibold">Seller</th>
                                <th className="px-4 py-3 font-semibold text-center">Status</th>
                                <th className="px-4 py-3 font-semibold text-center">Active Items</th>
                                <th className="px-4 py-3 font-semibold text-center">Recurring Orders</th>
                                <th className="px-4 py-3 font-semibold text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {contractsEnhanced.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500 font-medium">No active contracts found. Contact admin to generate.</td>
                                </tr>
                            ) : (
                                contractsEnhanced.map(c => (
                                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3 font-mono font-medium text-slate-900">
                                            {c.id.slice(-8).toUpperCase()}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600 font-semibold text-[13px]">
                                            {c.sellerName}
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
                                            {c.recurringOrders.length > 0 ? (
                                                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 font-bold py-0.5 rounded">Active ({c.recurringOrders.length})</span>
                                            ) : (
                                                <span className="text-xs text-slate-400">None</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <Link
                                                href={`/contracts/${c.id}`}
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
