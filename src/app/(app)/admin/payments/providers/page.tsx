import { EnterprisePageShell, EnterpriseCard, EnterpriseTable, EnterpriseButton, EnterpriseSwitch } from "@/components/ui/enterprise";
import { CreditCard, Cog } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminPaymentProvidersPage() {
    return (
        <EnterprisePageShell
            title="Ödeme Sağlayıcıları"
            description="B2B Network ve Platform Tahsilat altyapıları"
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <EnterpriseCard borderLeftColor="#1F3A5F">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex gap-3 items-center">
                            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                <CreditCard className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800">Iyzico B2B</h3>
                                <p className="text-xs text-slate-500">Pazaryeri ve Escrow Split</p>
                            </div>
                        </div>
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-[10px] font-bold uppercase rounded">Aktif</span>
                    </div>
                    <div className="space-y-3 mb-6">
                        <div className="flex justify-between text-sm py-2 border-b border-slate-100">
                            <span className="text-slate-500">Hold & Split (Native Escrow)</span>
                            <span className="font-semibold">Destekleniyor</span>
                        </div>
                        <div className="flex justify-between text-sm py-2 border-b border-slate-100">
                            <span className="text-slate-500">Delayed Payout</span>
                            <span className="font-semibold">Destekleniyor</span>
                        </div>
                    </div>
                    <EnterpriseButton variant="secondary" className="w-full">
                        <Cog className="w-4 h-4 mr-2" /> Yapılandırma
                    </EnterpriseButton>
                </EnterpriseCard>

                <EnterpriseCard>
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex gap-3 items-center">
                            <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                                <CreditCard className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800">Ödeal POS</h3>
                                <p className="text-xs text-slate-500">Fiziksel / Mobil Tahsilat</p>
                            </div>
                        </div>
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase rounded">Pasif</span>
                    </div>
                    <div className="space-y-3 mb-6">
                        <div className="flex justify-between text-sm py-2 border-b border-slate-100">
                            <span className="text-slate-500">Hold & Split (Native Escrow)</span>
                            <span className="font-semibold text-rose-600">Yok (Operational)</span>
                        </div>
                        <div className="flex justify-between text-sm py-2 border-b border-slate-100">
                            <span className="text-slate-500">Delayed Payout</span>
                            <span className="font-semibold text-slate-500">Yok</span>
                        </div>
                    </div>
                    <EnterpriseButton variant="secondary" className="w-full">
                        <Cog className="w-4 h-4 mr-2" /> Yapılandırma
                    </EnterpriseButton>
                </EnterpriseCard>
            </div>
        </EnterprisePageShell>
    );
}
