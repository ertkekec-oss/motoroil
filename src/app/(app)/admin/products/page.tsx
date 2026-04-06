import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ProductStatus } from "@prisma/client";
import ProductModerationClient from "./ProductModerationClient";
import { EnterprisePageShell } from "@/components/ui/enterprise";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage(props: { searchParams: Promise<any> }) {
    const sp = await props.searchParams;
    const statusFilter = (sp?.status as ProductStatus) || ProductStatus.PENDING;

    const products = await prisma.globalProduct.findMany({
        where: { status: statusFilter },
        include: {
            category: true,
            listings: { include: { company: true } }
        },
        orderBy: { createdAt: "desc" }
    });

    const statusLabels: Record<string, string> = {
        [ProductStatus.PENDING]: "BKL (BEKLEYEN)",
        [ProductStatus.APPROVED]: "ONAYLI",
        [ProductStatus.REJECTED]: "REDDEDİLEN"
    };

    return (
        <div className="w-full">
            <EnterprisePageShell
            title="Ürün Moderasyonu"
            description="Tedarikçiler tarafından gönderilen ürünleri inceleyin ve onaylayın."
        >
            <div className="space-y-6">
                

                {/* Tabs */}
                <div className="flex gap-4 border-b border-slate-200 dark:border-white/10">
                    {[ProductStatus.PENDING, ProductStatus.APPROVED, ProductStatus.REJECTED]?.map(s => (
                        <Link
                            key={s}
                            href={`/admin/products?status=${s}`}
                            className={`pb-3 px-4 font-black text-[11px] tracking-widest transition-colors border-b-[3px] uppercase ${statusFilter === s ? "border-indigo-600 text-indigo-600 dark:border-emerald-500 dark:text-emerald-400" : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"}`}
                        >
                            {statusLabels[s] || s}
                        </Link>
                    ))}
                </div>

                <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden flex flex-col shadow-sm">
                    <div className="overflow-auto flex-1 relative">
                        <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
                            <thead className="bg-[#F6F7F9] dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 sticky top-0 z-10 border-b border-slate-300 dark:border-slate-700 shadow-sm backdrop-blur-sm">
                                <tr>
                                    <th className="px-5 py-3.5 font-black uppercase tracking-widest text-[10px] border-r border-slate-200 dark:border-white/5">Ürün Detayları</th>
                                    <th className="px-5 py-3.5 font-black uppercase tracking-widest text-[10px] border-r border-slate-200 dark:border-white/5 w-48">Kategori</th>
                                    <th className="px-5 py-3.5 font-black uppercase tracking-widest text-[10px] border-r border-slate-200 dark:border-white/5 w-64">Tedarikçiler</th>
                                    <th className="px-5 py-3.5 font-black uppercase tracking-widest text-[10px] border-r border-slate-200 dark:border-white/5 w-40 text-center">Eklenme Tarihi</th>
                                    <th className="px-5 py-3.5 font-black uppercase tracking-widest text-[10px] text-center w-36 text-slate-500 dark:text-slate-400">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {products.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-5 py-12 text-center text-slate-500 dark:text-slate-400 font-bold text-[11px] uppercase tracking-widest">Bu kuyrukta ürün bulunmuyor.</td>
                                    </tr>
                                ) : (
                                    products?.map(prod => (
                                        <tr key={prod.id} className="hover:bg-slate-50 border-b border-transparent hover:border-slate-200 dark:hover:bg-white/5 transition-colors group">
                                            <td className="px-5 py-4 border-r border-slate-100 dark:border-white/5">
                                                <div className="font-bold text-slate-900 dark:text-white truncate max-w-sm">{prod.name}</div>
                                                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-1 font-bold">#{prod.id.slice(-8).toUpperCase()}</div>
                                            </td>
                                            <td className="px-5 py-4 border-r border-slate-100 dark:border-white/5 text-slate-700 dark:text-slate-300 font-bold text-[11px] tracking-widest uppercase">
                                                {prod.category?.name || <span className="text-slate-400 dark:text-slate-500">Kategorize Edilmemiş</span>}
                                            </td>
                                            <td className="px-5 py-4 border-r border-slate-100 dark:border-white/5">
                                                <div className="flex flex-wrap gap-1.5 break-all whitespace-normal">
                                                    {prod.listings?.map(l => (
                                                        <span key={l.id} className="text-[9px] font-black uppercase tracking-widest bg-indigo-50 border-indigo-200 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-400 px-2 py-1 rounded shadow-sm border">
                                                            {l.company.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 border-r border-slate-100 dark:border-white/5 text-slate-600 dark:text-slate-400 text-[11px] font-mono font-bold text-center">
                                                {new Date(prod.createdAt).toLocaleDateString('tr-TR')}
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <ProductModerationClient productId={prod.id} currentStatus={prod.status} />
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            </EnterprisePageShell>
        </div>
    );
}
