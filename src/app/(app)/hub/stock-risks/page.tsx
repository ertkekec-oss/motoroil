import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function StockRisksPage() {
    const session = await getSession();
    if (!session?.companyId) return redirect("/login");

    // Fetch products where stock <= minStock
    const riskyProducts = await prisma.product.findMany({
        where: {
            companyId: session.companyId,
            deletedAt: null,
            stock: {
                lte: prisma.product.fields.minStock
            }
        },
        orderBy: { stock: 'asc' },
        take: 50,
        select: {
            id: true,
            name: true,
            code: true,
            stock: true,
            minStock: true,
            price: true,
            category: true
        }
    });

    return (
        <div className="bg-slate-50 min-h-screen  pb-16 w-full font-sans">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
                <div className="mb-8">
                    <h1 className="text-2xl font-semibold text-slate-900  tracking-tight mb-2">⚠️ Stok ve Tedarik Riskleri</h1>
                    <p className="text-sm text-slate-600 ">Minimum stok uyarısı veren ürünleriniz (Kritik Stok Seviyesi).</p>
                </div>

                <div className="bg-white  rounded-2xl border border-slate-200  shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 ">
                        <h3 className="text-base font-semibold text-slate-900 ">Riskli Ürünler Listesi</h3>
                        <p className="text-[13px] text-slate-500  mt-1">Stok seviyesi 'Minimum Stok' sınırının altında olan operasyonel riskler.</p>
                    </div>

                    <div className="p-0">
                        {riskyProducts.length === 0 ? (
                            <div className="p-16 text-center">
                                <span className="text-4xl">🎉</span>
                                <h3 className="font-semibold text-slate-900 mt-4">Harika! Stok Riski Yok</h3>
                                <p className="text-slate-500 text-sm mt-2">Tüm ürünlerinizin stok seviyesi belirlenen minimum barajın üzerinde.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-slate-600 ">
                                    <thead className="bg-slate-50  text-xs uppercase font-semibold text-slate-500 border-b border-slate-200 ">
                                        <tr>
                                            <th className="px-6 py-4">Ürün Adı</th>
                                            <th className="px-6 py-4">Ürün Kodu</th>
                                            <th className="px-6 py-4">Kategori</th>
                                            <th className="px-6 py-4">Mevcut Stok</th>
                                            <th className="px-6 py-4">Kritik Sınır (Min)</th>
                                            <th className="px-6 py-4 text-right">Durum</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 ">
                                        {riskyProducts.map(p => (
                                            <tr key={p.id} className="hover:bg-slate-50 :bg-slate-800/20 transition-colors">
                                                <td className="px-6 py-4 font-medium text-slate-900 ">{p.name}</td>
                                                <td className="px-6 py-4">{p.code}</td>
                                                <td className="px-6 py-4">{p.category || '-'}</td>
                                                <td className="px-6 py-4 font-bold text-red-600">{p.stock}</td>
                                                <td className="px-6 py-4">{p.minStock}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-red-100 text-red-800 border border-red-200">
                                                        {p.stock <= 0 ? "Tükendi" : "Kritik Seviye"}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
