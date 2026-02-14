import { PriceSettings } from "@/components/pricing/PriceSettings";

export default function PricingPage() {
    return (
        <div className="p-8 space-y-8">
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Fiyatlandırma Yönetimi</h1>
            <p className="text-slate-500 max-w-2xl">
                Müşteri grupları, özel fiyat listeleri ve toplu güncelleme kurallarını buradan yönetebilirsiniz.
            </p>
            <PriceSettings />
        </div>
    );
}
