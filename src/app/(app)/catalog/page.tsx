import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CatalogPage({ searchParams }: { searchParams: { q?: string } }) {
    const session: any = await getSession();
    const user = session?.user || session;

    if (!user) {
        redirect("/login");
    }

    const SHOW_OOS = process.env.CATALOG_SHOW_OUT_OF_STOCK === "true";
    const HIDE_LT_MIN = process.env.CATALOG_HIDE_IF_AVAILABLE_LT_MINQTY !== "false"; // Default true

    // Query active network listings joined with their APPROVED GlobalProduct
    const listings = await prisma.networkListing.findMany({
        where: {
            status: "ACTIVE",
            globalProduct: {
                status: "APPROVED" // Only approved products in catalog
            },
            // If we are NOT showing out of stock, enforce availableQty > 0
            // More strict minQty check handled in JS loop for better precision
            ...(SHOW_OOS ? {} : { availableQty: { gt: 0 } })
        },
        include: {
            globalProduct: true,
        },
    });

    // Group by GlobalProduct
    const catalogMap = new Map<string, { product: any; minPrice: number; maxPrice: number; sellersCount: number; availableQty: number }>();

    for (const listing of listings) {
        if (!listing.globalProduct) continue;

        // Post-fetch gating: Hide if available < minQty unless SHOW_OOS is on
        if (!SHOW_OOS && HIDE_LT_MIN && listing.availableQty < listing.minQty) {
            continue;
        }

        const gId = listing.globalProduct.id;
        const p = Number(listing.price);
        const qty = listing.availableQty;

        if (catalogMap.has(gId)) {
            const entry = catalogMap.get(gId)!;
            entry.minPrice = Math.min(entry.minPrice, p);
            entry.maxPrice = Math.max(entry.maxPrice, p);
            entry.sellersCount += 1;
            entry.availableQty += qty;
        } else {
            catalogMap.set(gId, {
                product: listing.globalProduct,
                minPrice: p,
                maxPrice: p,
                sellersCount: 1,
                availableQty: qty,
            });
        }
    }

    const items = Array.from(catalogMap.values());

    return (
        <div className="min-h-screen bg-[#F6F7F9] text-slate-900 p-6 font-sans">
            <div className="max-w-[1200px] mx-auto space-y-6">

                <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-[#1F3A5F]">B2B Product Catalog</h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Browse products and available sellers on the network.
                        </p>
                    </div>
                </div>

                {/* Filters Mockup Header */}
                <div className="bg-white border border-slate-200 rounded-md p-4 flex gap-4 items-center">
                    <input type="text" placeholder="Search by name or code..." className="text-sm border border-slate-300 rounded-md px-3 py-1.5 focus:outline-none focus:border-[#1F3A5F] w-64" />
                    <button className="px-4 py-1.5 bg-black text-white text-sm font-medium rounded-md hover:opacity-90 active:scale-95 transition-transform">
                        Filter
                    </button>
                </div>

                <div className="bg-white border border-slate-200 rounded-md overflow-hidden flex flex-col h-[calc(100vh-280px)]">
                    <div className="overflow-auto flex-1 relative">
                        <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
                            <thead className="bg-[#1F3A5F] text-white sticky top-0 z-10">
                                <tr>
                                    <th className="px-3 py-2 font-semibold">SKU / Code</th>
                                    <th className="px-3 py-2 font-semibold">Product Name</th>
                                    <th className="px-3 py-2 font-semibold">Category</th>
                                    <th className="px-3 py-2 font-semibold text-right">Price Range (TRY)</th>
                                    <th className="px-3 py-2 font-semibold text-center">Sellers</th>
                                    <th className="px-3 py-2 font-semibold text-center">Total Stock</th>
                                    <th className="px-3 py-2 font-semibold text-center w-24">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-slate-700">
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-3 py-6 text-center text-slate-500">No active products found in the catalog.</td>
                                    </tr>
                                ) : (
                                    items.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-3 py-2 font-mono text-slate-500">{item.product.barcode || item.product.id.slice(0, 8)}</td>
                                            <td className="px-3 py-2 font-medium text-slate-900">{item.product.name}</td>
                                            <td className="px-3 py-2">{item.product.category || '-'}</td>
                                            <td className="px-3 py-2 font-mono font-medium text-right">
                                                {item.minPrice === item.maxPrice
                                                    ? item.minPrice.toFixed(2)
                                                    : `${item.minPrice.toFixed(2)} - ${item.maxPrice.toFixed(2)}`}
                                            </td>
                                            <td className="px-3 py-2 text-center text-slate-500">
                                                <span className="inline-block px-2 py-0.5 rounded border border-slate-200 bg-white shadow-sm text-xs font-medium">
                                                    {item.sellersCount} Suppliers
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 text-center">
                                                {item.availableQty > 0 ? (
                                                    <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-xs">
                                                        {item.availableQty} available
                                                    </span>
                                                ) : (
                                                    <span className="text-amber-700 font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-xs">
                                                        Out of Stock
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-3 py-2 text-center">
                                                <Link
                                                    href={`/catalog/${item.product.id}`}
                                                    className="inline-block px-3 py-1 bg-black text-white text-xs font-semibold rounded-md hover:bg-slate-800 active:scale-95 transition-transform"
                                                >
                                                    View
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
        </div>
    );
}
