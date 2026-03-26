import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import SellerProductForm from "./SellerProductForm";

export const dynamic = "force-dynamic";

export default async function SellerProductEditPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session: any = await getSession();
    const user = session?.user || session;

    if (!user) {
        redirect("/login");
    }

    const companyId = user.companyId || session?.companyId || session?.settings?.companyId;
    if (!companyId && user.role !== "SUPER_ADMIN" && user.role !== "admin" && user.role !== "OWNER") {
        redirect("/403");
    }

    const whereClause: any = { id, deletedAt: null };
    if (companyId) {
        whereClause.companyId = companyId;
    }

    const erpProduct = await prisma.product.findFirst({
        where: whereClause,
        include: {
            networkListings: true,
        },
    });

    if (!erpProduct) {
        return (
            <div className="p-10 text-center text-slate-500 font-medium">
                Sistemde bu ürün bulunamadı veya erişim yetkiniz yok. <Link href="/seller/products" className="text-blue-600 hover:underline font-bold">Geri Dön</Link>
            </div>
        );
    }

    const listing = erpProduct.networkListings[0] || null;

    return (
        <div className="min-h-screen bg-slate-50  text-slate-900 p-6 font-sans">
            <div className="max-w-[800px] mx-auto space-y-8 animate-in fade-in duration-300 pt-4">

                {/* Header / Breadcrumb */}
                <div className="flex items-center gap-2 text-[13px] text-slate-500 border-b border-slate-200  pb-4">
                    <Link href="/seller/products" className="hover:text-blue-600 font-semibold transition-colors">Yayınlanan Ürünler</Link>
                    <span className="text-slate-300">/</span>
                    <span className="font-bold text-slate-900  truncate max-w-[400px]">{erpProduct.name}</span>
                </div>

                <div className="bg-white  border border-slate-200  rounded-2xl shadow-sm p-8">
                    <h2 className="text-2xl font-black text-slate-900  mb-8 tracking-tight">
                        {listing ? "Katalog Kaydını Güncelle" : "B2B Ağında Ürün Yayınla"}
                    </h2>

                    <div className="mb-8 p-5 bg-slate-50  border border-slate-100  rounded-xl space-y-2.5 text-sm text-slate-600  shadow-inner">
                        <div className="font-black text-slate-900  uppercase tracking-widest text-[10px] mb-3 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span> ERP Entegrasyon Referansı
                        </div>
                        <div className="flex items-center justify-between"><span className="font-bold text-slate-400">Stok Kodu (SKU):</span> <span className="font-bold text-slate-800  bg-white  px-2 py-0.5 rounded border border-slate-100 ">{erpProduct.code}</span></div>
                        <div className="flex items-center justify-between"><span className="font-bold text-slate-400">Kategori:</span> <span className="font-bold uppercase tracking-tight">{erpProduct.category || '-'}</span></div>
                        <div className="flex items-center justify-between"><span className="font-bold text-slate-400">SistemdekiFiziksel Stok:</span> <span className="font-black text-blue-600  text-[15px]">{erpProduct.stock} Adet</span></div>
                    </div>

                    <SellerProductForm erpProduct={erpProduct} existingListing={listing} />
                </div>
            </div>
        </div>
    );
}
