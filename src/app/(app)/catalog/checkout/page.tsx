import Link from "next/link";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { checkoutPreviewAction } from "@/actions/checkoutPreviewAction";
import CheckoutClient from "./CheckoutClient";
import { CreditCard, AlertCircle, ArrowLeft } from "lucide-react";

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
            <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] flex items-center justify-center p-6">
                <div className="bg-white dark:bg-[#1e293b] p-8 rounded-2xl shadow-sm text-center max-w-md border border-slate-200 dark:border-white/10">
                    <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Önizleme Hatası</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">{e.message}</p>
                    <Link href="/catalog/cart" className="inline-flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors">
                        Sepete Dön
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 min-h-screen dark:bg-[#0f172a] pb-16 w-full font-sans">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">

                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-white/10 pb-4 mb-6">
                    <Link href="/catalog" className="hover:text-slate-900 dark:hover:text-white transition-colors">B2B Ortak Katalog</Link>
                    <span>/</span>
                    <Link href="/catalog/cart" className="hover:text-slate-900 dark:hover:text-white transition-colors">Ağ Sepetim</Link>
                    <span>/</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Sipariş Onayı ve Ödeme</span>
                </div>

                <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                            <CreditCard className="w-8 h-8 text-emerald-500" />
                            B2B Tedarik Onayı (Checkout)
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-2xl text-balance">
                            Lütfen çoklu satıcı tedarik listenizi son kez gözden geçirin. Ağ açık hesabı veya güvenli emanet transferi (Escrow) yöntemiyle satın almayı tamamlayın.
                        </p>
                    </div>
                    <Link href="/catalog/cart" className="inline-flex items-center justify-center gap-2 bg-white dark:bg-[#1e293b] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm shrink-0">
                        <ArrowLeft className="w-4 h-4" />
                        Kurşun Süreleri Değiştir
                    </Link>
                </div>

                <CheckoutClient previewData={previewData} />

            </div>
        </div>
    );
}
