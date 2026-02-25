import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ProductStatus } from "@prisma/client";
import ProductModerationClient from "./ProductModerationClient";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage({ searchParams }: { searchParams: { status?: string } }) {
    const statusFilter = (searchParams.status as ProductStatus) || ProductStatus.PENDING;

    const products = await prisma.globalProduct.findMany({
        where: { status: statusFilter },
        include: {
            category: true,
            listings: { include: { company: true } }
        },
        orderBy: { createdAt: "desc" }
    });

    return (
        <div className="p-6 bg-[#F6F7F9] min-h-screen text-slate-800 font-sans">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                    <div>
                        <h1 className="text-2xl font-bold text-[#1F3A5F]">Product Moderation</h1>
                        <p className="text-sm text-slate-500">Review and approve products submitted by suppliers.</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 border-b border-slate-200">
                    {[ProductStatus.PENDING, ProductStatus.APPROVED, ProductStatus.REJECTED].map(s => (
                        <Link
                            key={s}
                            href={`/admin/products?status=${s}`}
                            className={`pb-2 px-4 font-bold text-sm transition-colors border-b-4 ${statusFilter === s ? "border-[#1F3A5F] text-[#1F3A5F]" : "border-transparent text-slate-400 hover:text-slate-600"}`}
                        >
                            {s}
                        </Link>
                    ))}
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b">
                            <tr>
                                <th className="p-4 font-bold text-slate-500 uppercase text-xs">Product Details</th>
                                <th className="p-4 font-bold text-slate-500 uppercase text-xs">Category</th>
                                <th className="p-4 font-bold text-slate-500 uppercase text-xs">Suppliers</th>
                                <th className="p-4 font-bold text-slate-500 uppercase text-xs">Submitted</th>
                                <th className="p-4 font-bold text-slate-500 uppercase text-xs text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {products.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-10 text-center text-slate-400">No products in this queue.</td>
                                </tr>
                            ) : (
                                products.map(prod => (
                                    <tr key={prod.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4">
                                            <div className="font-bold text-[#1F3A5F]">{prod.name}</div>
                                            <div className="text-[10px] text-slate-400 font-mono">{prod.id}</div>
                                        </td>
                                        <td className="p-4 text-slate-600">
                                            {prod.category?.name || <span className="text-slate-300">Uncategorized</span>}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-wrap gap-1">
                                                {prod.listings.map(l => (
                                                    <span key={l.id} className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100">
                                                        {l.company.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="p-4 text-slate-500 text-xs">
                                            {new Date(prod.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 text-right">
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
    );
}
