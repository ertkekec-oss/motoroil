import Link from "next/link";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { checkoutPreviewAction } from "@/actions/checkoutPreviewAction";
import CheckoutClient from "./CheckoutClient";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
    const session: any = await getSession();
    const user = session?.user || session;

    if (!user) {
        redirect("/login");
    }

    let previewData;
    try {
        previewData = await checkoutPreviewAction();
    } catch (e: any) {
        if (e.message === "Cart is empty") {
            redirect("/catalog/cart");
        }
        return (
            <div className="p-10 text-center text-red-600">
                Failed to load checkout preview: {e.message}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F6F7F9] text-slate-900 p-6 font-sans">
            <div className="max-w-[1000px] mx-auto space-y-6">

                <div className="flex items-center gap-2 text-sm text-slate-500 border-b border-slate-200 pb-4">
                    <Link href="/catalog" className="hover:text-[#1F3A5F] hover:underline">Catalog</Link>
                    <span>/</span>
                    <Link href="/catalog/cart" className="hover:text-[#1F3A5F] hover:underline">Cart</Link>
                    <span>/</span>
                    <span className="font-semibold text-slate-800">Checkout Preview</span>
                </div>

                <div className="bg-white border border-slate-200 rounded-md p-6">
                    <h1 className="text-2xl font-bold tracking-tight text-[#1F3A5F] mb-2">
                        B2B Order Confirmation
                    </h1>
                    <p className="text-sm text-slate-500 mb-6">
                        Please review your multi-seller orders. Payment is collected via direct or escrow method.
                    </p>

                    <CheckoutClient previewData={previewData} />
                </div>
            </div>
        </div>
    );
}
