import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Box, Plus, Store, CheckCircle, AlertCircle, EyeOff } from "lucide-react";

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
        <div className="flex-1 overflow-y-auto w-full p-4 sm:p-8 xl:p-12 relative font-sans" style={{ scrollbarWidth: 'none' }}>
            <div className="max-w-[1400px] mx-auto space-y-8 pb-24">

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl hidden md:flex">
                            <Store className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-[32px] sm:text-[40px] font-[700] tracking-tight text-[#0F172A] dark:text-white leading-tight mb-1">Storefront Catalog (B2B)</h1>
                            <p className="text-[14px] font-semibold text-slate-500 dark:text-slate-400 tracking-wide uppercase whitespace-nowrap overflow-hidden text-ellipsis w-full">
                                Publish your local ERP products to the B2B marketplace network.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button className="px-5 py-3 rounded-xl text-sm font-bold border transition-all whitespace-nowrap bg-[#0F172A] text-white dark:bg-white dark:text-[#0F172A] border-transparent shadow-[0_4px_10px_rgba(15,23,42,0.1)] hover:shadow-[0_6px_15px_rgba(15,23,42,0.15)] hover:-translate-y-0.5 flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Yeni Ürün Ekle
                        </button>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#080911] border border-slate-200/60 dark:border-white/5 rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_6px_18px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col h-[65vh] min-h-[500px]">

                    <div className="px-6 py-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/30 dark:bg-slate-900/20">
                        <div className="flex items-center gap-2">
                            <Box className="w-5 h-5 text-slate-400" />
                            <p className="text-[15px] font-bold text-[#0F172A] dark:text-white">ERP Ürün Listesi</p>
                        </div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">{products.length} ürün</p>
                    </div>

                    <div className="overflow-auto flex-1 relative custom-scrollbar">
                        <table className="min-w-full text-left text-sm whitespace-nowrap border-collapse">
                            <thead className="bg-slate-50/80 dark:bg-slate-900/80 text-[11px] uppercase tracking-widest text-slate-500 dark:text-slate-400 font-bold border-b border-slate-100 dark:border-white/5 sticky top-0 z-10 backdrop-blur-md">
                                <tr>
                                    <th className="px-6 py-4 font-bold">ERP Code</th>
                                    <th className="px-6 py-4 font-bold">Product Name</th>
                                    <th className="px-6 py-4 font-bold text-center">ERP Stock</th>
                                    <th className="px-6 py-4 font-bold text-right">Listing Price (TRY)</th>
                                    <th className="px-6 py-4 font-bold text-center">Network Status</th>
                                    <th className="px-6 py-4 font-bold w-24 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-slate-300">
                                {products.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                            <div className="flex flex-col items-center gap-3">
                                                <Box className="w-12 h-12 text-slate-300 dark:text-slate-700" strokeWidth={1} />
                                                <span className="font-semibold text-sm">No products found in ERP.</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    products.map(p => {
                                        const listing = p.networkListings[0]; // Assuming one listing per ERP product
                                        const isListed = !!listing;

                                        return (
                                            <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                                                <td className="px-6 py-4 font-mono text-[11px] font-bold text-slate-400 dark:text-slate-500">{p.code || '-'}</td>
                                                <td className="px-6 py-4 font-bold text-[#0F172A] dark:text-white">{p.name}</td>
                                                <td className="px-6 py-4 text-center font-black text-slate-800 dark:text-slate-200">
                                                    {p.stock}
                                                </td>
                                                <td className="px-6 py-4 text-right font-black text-[15px] text-[#0F172A] dark:text-white">
                                                    {isListed ? Number(listing.price).toFixed(2) : '-'}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {isListed ? (
                                                        listing.status === 'ACTIVE' ? (
                                                            <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-3 py-1.5 rounded-xl text-[11px] tracking-wide uppercase">
                                                                <CheckCircle className="w-3.5 h-3.5" /> ACTIVE
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-1.5 rounded-xl text-[11px] tracking-wide uppercase">
                                                                <AlertCircle className="w-3.5 h-3.5" /> PAUSED
                                                            </span>
                                                        )
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-[11px] tracking-wide uppercase">
                                                            <EyeOff className="w-3.5 h-3.5" /> UNLISTED
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <Link
                                                        href={`/seller/products/${p.id}`}
                                                        className={`inline-block px-4 py-2 rounded-xl text-xs font-bold transition-all border ${isListed
                                                            ? 'bg-white dark:bg-[#080911] border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/20'
                                                            : 'bg-[#0F172A] dark:bg-white text-white dark:text-[#0F172A] border-transparent hover:-translate-y-0.5 shadow-sm'
                                                            }`}
                                                    >
                                                        {isListed ? "Yönet" : "Yayına Al"}
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
