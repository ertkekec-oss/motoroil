import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import AddToCartButton from "./AddToCartButton";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({ params }: { params: { productId: string } }) {
    const session: any = await getSession();
    const user = session?.user || session;

    if (!user) {
        redirect("/login");
    }

    const { productId } = params;

    const product = await prisma.globalProduct.findUnique({
        where: { id: productId },
    });

    if (!product) {
        return (
            <div className="p-10 text-center text-slate-500">
                Product not found. <Link href="/catalog" className="text-[#1F3A5F] underline">Go back</Link>
            </div>
        );
    }

    const listings = await prisma.networkListing.findMany({
        where: { globalProductId: productId, status: "ACTIVE" },
        include: { company: true },
        orderBy: { price: "asc" }
    });

    return (
        <div className="min-h-screen bg-[#F6F7F9] text-slate-900 p-6 font-sans">
            <div className="max-w-[1200px] mx-auto space-y-6">

                {/* Header / Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-slate-500 border-b border-slate-200 pb-4">
                    <Link href="/catalog" className="hover:text-[#1F3A5F] hover:underline">Catalog</Link>
                    <span>/</span>
                    <span className="font-semibold text-slate-800">{product.name}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* LEFT COL: Product General Info */}
                    <div className="md:col-span-1 space-y-4">
                        <div className="bg-white border border-slate-200 rounded-md p-6">
                            {product.imageUrl ? (
                                <img src={product.imageUrl} alt={product.name} className="w-full h-auto rounded-md border border-slate-100 mb-4" />
                            ) : (
                                <div className="w-full aspect-square bg-slate-50 border border-slate-100 rounded-md flex items-center justify-center text-slate-300 font-medium mb-4">
                                    No Image
                                </div>
                            )}

                            <h1 className="text-xl font-bold tracking-tight text-[#1F3A5F] leading-tight mb-2">
                                {product.name}
                            </h1>
                            <div className="flex flex-col gap-1 text-sm text-slate-600 mb-4">
                                <div><span className="font-semibold text-slate-400">Barcode:</span> {product.barcode || 'N/A'}</div>
                                <div><span className="font-semibold text-slate-400">Category:</span> {product.category || 'N/A'}</div>
                            </div>

                            <hr className="border-slate-100 my-4" />

                            <h3 className="text-sm font-semibold text-slate-800 mb-2">Technical Info</h3>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                {product.description || 'No detailed description available for this global product.'}
                            </p>
                        </div>
                    </div>

                    {/* RIGHT COL: Sellers Matrix */}
                    <div className="md:col-span-2 space-y-4">
                        <div className="bg-white border border-slate-200 rounded-md flex flex-col h-full overflow-hidden">
                            <div className="p-4 border-b border-slate-200 bg-slate-50/50">
                                <h2 className="text-sm font-bold text-slate-800">Sellers Offering This Product</h2>
                                <p className="text-xs text-slate-500 mt-0.5">Compare prices, availability, and lead times from B2B network suppliers.</p>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full text-left text-sm whitespace-nowrap border-collapse">
                                    <thead className="bg-[#1F3A5F] text-white">
                                        <tr>
                                            <th className="px-4 py-2.5 font-semibold">Firma (Supplier)</th>
                                            <th className="px-4 py-2.5 font-semibold text-right">Price (TRY)</th>
                                            <th className="px-4 py-2.5 font-semibold text-center">Stock</th>
                                            <th className="px-4 py-2.5 font-semibold text-center">Lead Time</th>
                                            <th className="px-4 py-2.5 font-semibold text-center w-24">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {listings.length === 0 ? (
                                            <tr><td colSpan={5} className="p-6 text-center text-slate-500">Currently out of stock or not available for B2B procurement.</td></tr>
                                        ) : (
                                            listings.map(l => {
                                                const isOOS = l.availableQty < l.minQty;
                                                const isNotReady = !l.price || l.price.equals(0);

                                                return (
                                                    <tr key={l.id} className={`hover:bg-slate-50 transition-colors group ${isOOS ? 'opacity-60' : ''}`}>
                                                        <td className="px-4 py-3">
                                                            <div className="font-semibold text-[#1F3A5F]">{l.company.name}</div>
                                                            {l.minQty > 1 && <div className="text-[10px] text-slate-400 font-medium">Min order: {l.minQty}</div>}
                                                        </td>
                                                        <td className="px-4 py-3 font-mono font-bold text-right text-slate-900 text-base">
                                                            {Number(l.price).toFixed(2)}
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            {l.availableQty >= l.minQty ? (
                                                                <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded text-xs shadow-[0_1px_1px_rgba(0,0,0,0.02)]">
                                                                    {l.availableQty}
                                                                </span>
                                                            ) : (
                                                                <span className="text-amber-700 font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-xs">
                                                                    {l.availableQty > 0 ? `Only ${l.availableQty} (Min ${l.minQty})` : 'Out of Stock'}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-center text-slate-600 font-mono text-xs">
                                                            {l.leadTimeDays === 0 ? (
                                                                <span className="text-emerald-600 font-medium">Same Day</span>
                                                            ) : (
                                                                <span>{l.leadTimeDays} days</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <AddToCartButton
                                                                productId={product.id}
                                                                sellerCompanyId={l.sellerCompanyId}
                                                                maxQty={l.availableQty}
                                                                disabled={isOOS || isNotReady}
                                                            />
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

            </div>
        </div>
    );
}
