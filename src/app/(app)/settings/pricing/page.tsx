import { PriceSettings } from "@/components/pricing/PriceSettings";

export default function PricingPage() {
    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 border border-blue-500 shadow-inner flex items-center justify-center text-white text-lg font-bold shrink-0">
                            💰
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                            Fiyatlandırma Yönetimi
                        </h1>
                    </div>
                    <div className="flex items-center gap-2 pl-[52px] mt-1">
                        <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse shadow-sm"></span>
                        <p className="text-slate-500 font-bold text-[11px] uppercase tracking-widest">
                            ÇOKLU FİYAT LİSTELERİ, MÜŞTERİ GRUPLARI VE FORMÜL KURALLARI
                        </p>
                    </div>
                </div>
            </div>

            <PriceSettings />
        </div>
    );
}
