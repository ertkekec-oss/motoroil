
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { saveAutomationPolicyAction } from "@/actions/automationActions";
import { Visibility } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function SellerAutomationPage() {
    const session: any = await getSession();
    const user = session?.user || session;
    if (!user) redirect("/login");

    const companyId = user.companyId;
    if (!companyId) redirect("/403");

    let policy = await prisma.sellerAutomationPolicy.findUnique({
        where: { sellerCompanyId: companyId }
    });

    if (!policy) {
        policy = {
            id: 'temp',
            sellerCompanyId: companyId,
            autoPublishEnabled: false,
            minOnHandThreshold: 100,
            lowSalesThreshold: 3,
            maxReservedRatio: 0.2,
            minMarginPercent: null,
            minListingQualityScore: 50,
            defaultVisibility: Visibility.NETWORK,
            defaultMinOrderQty: 1,
            defaultLeadTimeDays: 3,
            allowAutoPriceAdjust: false
        } as any;
    }

    return (
        <div className="min-h-screen bg-[#F6F7F9] text-slate-900 p-6 font-sans">
            <div className="max-w-[800px] mx-auto space-y-6">

                <div className="flex items-center gap-4">
                    <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                        <svg className="w-6 h-6 text-[#1F3A5F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-[#1F3A5F]">Otomasyon Ayarları</h1>
                        <p className="text-sm text-slate-500 mt-0.5">
                            B2B kataloğunuzu otomatik veya yarı-otomatik yönetmek için eşik değerleri belirleyin.
                        </p>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <form action={saveAutomationPolicyAction} className="divide-y divide-slate-100">
                        {/* Status Toggle Block */}
                        <div className="p-6 bg-slate-50/50">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <label className="text-sm font-bold text-slate-900 leading-tight">Otomatik Yayınlama (Model B)</label>
                                    <p className="text-xs text-slate-500">
                                        Eğer koşullar sağlanırsa ürününüzü manuel onay beklemeden otomatik kataloga yerleştirir.
                                    </p>
                                </div>
                                <div className="relative inline-flex items-center cursor-pointer">
                                    <input name="autoPublishEnabled" type="checkbox" defaultChecked={policy?.autoPublishEnabled} value="true" className="sr-only peer" />
                                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1F3A5F]"></div>
                                </div>
                            </div>
                            {policy?.autoPublishEnabled && (
                                <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-md text-[11px] text-blue-700 font-medium">
                                    Not: Otomatik yayınlama (auto-publish) "Sprint 3" kapsamında gelecektir. Şu an sadece öneri üretilir.
                                </div>
                            )}
                        </div>

                        {/* Thresholds */}
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Min. Stok Eşiği</label>
                                <div className="relative">
                                    <input name="minOnHandThreshold" type="number" defaultValue={policy?.minOnHandThreshold} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#1F3A5F] text-sm font-semibold" />
                                    <span className="absolute right-4 top-2.5 text-[10px] text-slate-400 font-bold uppercase">Adet</span>
                                </div>
                                <p className="text-[10px] text-slate-400 italic">Eğer on-hand stok bu değerin altındaysa ürün kataloga önerilmez.</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Düşük Satış Eşiği</label>
                                <div className="relative">
                                    <input name="lowSalesThreshold" type="number" defaultValue={policy?.lowSalesThreshold} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#1F3A5F] text-sm font-semibold" />
                                    <span className="absolute right-4 top-2.5 text-[10px] text-slate-400 font-bold uppercase">Ay/Adet</span>
                                </div>
                                <p className="text-[10px] text-slate-400 italic">Ayda bu sayıdan az satan ürünler "Fazla Stok" kuralına girer.</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Maks. Rezerve Oranı</label>
                                <div className="relative">
                                    <input name="maxReservedRatio" step="0.05" type="number" defaultValue={policy?.maxReservedRatio} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#1F3A5F] text-sm font-semibold" />
                                    <span className="absolute right-4 top-2.5 text-[10px] text-slate-400 font-bold uppercase">Ondalık</span>
                                </div>
                                <p className="text-[10px] text-slate-400 italic">Rezerve/Toplam oranı bu değerin (Örn: 0.20 yani %20) üzerindeyse işlem önerilmez.</p>
                            </div>
                        </div>

                        {/* Defaults */}
                        <div className="p-6 space-y-6">
                            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Standart Yayın Değerleri</span>
                                <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-medium">Auto-fill</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-600">Varsayılan Min. Sipariş</label>
                                    <input name="defaultMinOrderQty" type="number" defaultValue={policy?.defaultMinOrderQty} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#1F3A5F] text-sm" />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-600">Varsayılan Hazırlık Süresi (Gün)</label>
                                    <input name="defaultLeadTimeDays" type="number" defaultValue={policy?.defaultLeadTimeDays} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#1F3A5F] text-sm" />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-600">Varsayılan Görünürlük</label>
                                    <select name="defaultVisibility" defaultValue={policy?.defaultVisibility} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#1F3A5F] text-sm appearance-none bg-white">
                                        <option value={Visibility.NETWORK}>Tüm Network (Açık)</option>
                                        <option value={Visibility.PRIVATE}>Özel (Belirli Gruplar)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 flex justify-end">
                            <button type="submit" className="px-10 py-2.5 bg-[#1F3A5F] text-white font-bold rounded-lg shadow-md hover:bg-[#1F3A5F]/90 active:scale-95 transition-all">
                                Ayarları Kaydet
                            </button>
                        </div>
                    </form>
                </div>

            </div>
        </div>
    );
}
