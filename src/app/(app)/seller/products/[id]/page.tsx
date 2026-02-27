import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import SellerProductForm from "./SellerProductForm";

export const dynamic = "force-dynamic";

export default async function SellerProductEditPage({ params }: { params: { id: string } }) {
    const session: any = await getSession();
    const user = session?.user || session;

    if (!user) {
        redirect("/login");
    }

    const companyId = user.companyId || session?.companyId || session?.settings?.companyId;
    if (!companyId && user.role !== "SUPER_ADMIN" && user.role !== "admin") {
        redirect("/403");
    }

    const whereClause: any = { id: params.id, deletedAt: null };
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
            <div className="p-10 text-center text-slate-500">
                ERP Product not found or unauthorized. <Link href="/seller/products" className="text-[#1F3A5F] underline">Go back</Link>
            </div>
        );
    }

    const listing = erpProduct.networkListings[0] || null;

    return (
        <div className="min-h-screen bg-[#F6F7F9] text-slate-900 p-6 font-sans">
            <div className="max-w-[800px] mx-auto space-y-6">

                {/* Header / Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-slate-500 border-b border-slate-200 pb-4">
                    <Link href="/seller/products" className="hover:text-[#1F3A5F] hover:underline">Seller Products</Link>
                    <span>/</span>
                    <span className="font-semibold text-slate-800">{erpProduct.name}</span>
                </div>

                <div className="bg-white border border-slate-200 rounded-md p-6">
                    <h2 className="text-lg font-bold text-[#1F3A5F] mb-4">
                        {listing ? "Manage Network Listing" : "Publish to B2B Catalog"}
                    </h2>

                    <div className="mb-6 p-4 bg-slate-50 border border-slate-100 rounded-md space-y-1 text-sm text-slate-600">
                        <div className="font-semibold text-slate-800">ERP Info Reference:</div>
                        <div><span className="font-semibold text-slate-400">Code:</span> {erpProduct.code}</div>
                        <div><span className="font-semibold text-slate-400">Category:</span> {erpProduct.category || '-'}</div>
                        <div><span className="font-semibold text-slate-400">Current Stock:</span> {erpProduct.stock}</div>
                    </div>

                    <SellerProductForm erpProduct={erpProduct} existingListing={listing} />
                </div>
            </div>
        </div>
    );
}
