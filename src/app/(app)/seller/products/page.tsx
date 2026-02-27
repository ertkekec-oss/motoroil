import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SellerProductsPage() {
    const session: any = await getSession();
    const user = session?.user || session;

    if (!user) redirect("/login");

    const companyId = user.companyId || session?.companyId || session?.settings?.companyId;
    if (!companyId && user.role !== "SUPER_ADMIN" && user.role !== "admin") redirect("/403");

    const whereClause: any = { deletedAt: null };
    if (companyId) {
        whereClause.companyId = companyId;
    }

    // Fetch all products of this seller and their NetworkListings
    const products = await prisma.product.findMany({
        where: whereClause,
        include: {
            networkListings: true,
        },
        orderBy: { createdAt: "desc" },
    });

    return (
        <div className="min-h-screen bg-[#F6F7F9] text-slate-900 p-6 font-sans">
            <div className="max-w-[1200px] mx-auto space-y-6">

                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-[#1F3A5F]">Storefront Catalog (B2B)</h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Publish your local ERP products to the B2B marketplace network.
                        </p>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-md overflow-hidden flex flex-col h-[calc(100vh-200px)]">
                    <div className="overflow-auto flex-1 relative">
                        <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
                            <thead className="bg-[#1F3A5F] text-white sticky top-0 z-10">
                                <tr>
                                    <th className="px-3 py-2 font-semibold">ERP Code</th>
                                    <th className="px-3 py-2 font-semibold">Product Name</th>
                                    <th className="px-3 py-2 font-semibold text-center">ERP Stock</th>
                                    <th className="px-3 py-2 font-semibold text-right">Listing Price (TRY)</th>
                                    <th className="px-3 py-2 font-semibold text-center">Network Status</th>
                                    <th className="px-3 py-2 font-semibold w-24 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-slate-700">
                                {products.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-3 py-8 text-center text-slate-500 font-medium">No products found in ERP.</td>
                                    </tr>
                                ) : (
                                    products.map(p => {
                                        const listing = p.networkListings[0]; // Assuming one listing per ERP product
                                        const isListed = !!listing;

                                        return (
                                            <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-3 py-2 font-mono text-slate-500">{p.code || '-'}</td>
                                                <td className="px-3 py-2 font-medium text-slate-900">{p.name}</td>
                                                <td className="px-3 py-2 text-center font-mono font-bold text-slate-600">
                                                    {p.stock}
                                                </td>
                                                <td className="px-3 py-2 text-right font-mono font-medium">
                                                    {isListed ? Number(listing.price).toFixed(2) : '-'}
                                                </td>
                                                <td className="px-3 py-2 text-center">
                                                    {isListed ? (
                                                        listing.status === 'ACTIVE' ? (
                                                            <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded text-xs">
                                                                ACTIVE
                                                            </span>
                                                        ) : (
                                                            <span className="text-amber-700 font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-xs">
                                                                PAUSED
                                                            </span>
                                                        )
                                                    ) : (
                                                        <span className="text-slate-400 font-bold bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-xs">
                                                            UNLISTED
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2 text-center">
                                                    <Link
                                                        href={`/seller/products/${p.id}`}
                                                        className="inline-block px-3 py-1 bg-black text-white text-xs font-semibold rounded-md hover:opacity-90 active:scale-95 transition-transform"
                                                    >
                                                        {isListed ? "Manage" : "Publish"}
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
