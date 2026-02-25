import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import ContractDetailClient from "./ContractDetailClient";

export const dynamic = "force-dynamic";

export default async function BuyerContractDetailPage({ params }: { params: { id: string } }) {
    const session: any = await getSession();
    const user = session?.user || session;

    if (!user) redirect("/login");
    const buyerCompanyId = user.companyId || session?.companyId;

    const contract = await prisma.contract.findUnique({
        where: { id: params.id, buyerCompanyId },
        include: {
            items: {
                include: { tiers: { orderBy: { minQty: 'asc' } } }
            },
            slas: true,
            recurringOrders: true
        }
    });

    if (!contract) {
        return <div className="p-10 text-center">Contract not found or access denied.</div>;
    }

    const seller = await prisma.company.findUnique({
        where: { id: contract.sellerCompanyId }
    });

    // Resolve products
    const itemsEnhanced = await Promise.all(
        contract.items.map(async (item) => {
            const product = await prisma.globalProduct.findUnique({ where: { id: item.productId } });
            return {
                ...item,
                productName: product?.name || "Unknown Product"
            };
        })
    );

    return (
        <div className="min-h-screen bg-[#F6F7F9] text-slate-900 p-6 font-sans">
            <div className="max-w-[1200px] mx-auto space-y-6">

                <div className="flex items-center gap-2 text-sm text-slate-500 border-b border-slate-200 pb-4">
                    <Link href="/contracts" className="hover:text-[#1F3A5F] hover:underline">My Contracts</Link>
                    <span>/</span>
                    <span className="font-semibold text-slate-800">#{contract.id.slice(-8).toUpperCase()}</span>
                </div>

                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-[#1F3A5F]">Contract Details</h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Supplier: <span className="font-bold text-slate-800">{seller?.name || "Unknown"}</span>
                        </p>
                    </div>
                </div>

                <ContractDetailClient contract={contract} items={itemsEnhanced} />

            </div>
        </div>
    );
}
