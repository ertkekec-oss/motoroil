"use client";

import { useState } from 'react';
import { confirmDeliveryAction } from '@/actions/confirmDeliveryAction';
import { useRouter } from 'next/navigation';
import { CheckCircle, Truck, PackageCheck } from 'lucide-react'; // Ensure lucide-react is installed

export default function ConfirmDeliveryAction({
    orderId,
    allShipmentsDelivered,
    alreadyConfirmed
}: {
    orderId: string,
    allShipmentsDelivered: boolean,
    alreadyConfirmed: boolean
}) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    if (alreadyConfirmed) {
        return (
            <div className="bg-green-50 text-green-700 p-4 rounded-xl flex items-center gap-3 border border-green-200 shadow-sm">
                <PackageCheck className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span className="font-medium text-sm leading-relaxed">Paketler teslim alındı ve satıcı ödemesi serbest bırakıldı.</span>
            </div>
        );
    }

    return (
        <div className="bg-white p-5 lg:p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex flex-col gap-4 items-start">
                <div>
                    <h4 className="text-base font-semibold text-gray-900 tracking-tight flex items-center gap-2">Teslimatı Onayla <Truck className="w-4 h-4 text-gray-400" /></h4>
                    <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                        Tüm gönderilerinizin elinize ulaştığından eminseniz, tutarın Iyzico Escrow havuzundan çıkarak satıcıya aktarılması için onayı tamamlayın.
                    </p>
                </div>

                {!allShipmentsDelivered ? (
                    <div className="w-full bg-amber-50 text-amber-700 p-3 rounded-lg border border-amber-200 text-xs font-semibold">
                        Bu siparişe ait açıkta olan (yola çıkmış veya bekleyen) paketler mevcut. Tüm parçalar "Teslim Edildi" olmadan işlemi tamamlayamazsınız.
                    </div>
                ) : null}

                <button
                    onClick={async () => {
                        if (!confirm("Teslimatı onayladığınızda satıcıya ödeme geçilir. Geri alınamaz. Emin misiniz?")) return;
                        setLoading(true);
                        try {
                            await confirmDeliveryAction(orderId);
                            router.refresh();
                        } catch (e: any) {
                            alert(e.message || "Bir hata oluştu");
                        } finally {
                            setLoading(false);
                        }
                    }}
                    disabled={!allShipmentsDelivered || loading}
                    className={`w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all flex justify-center items-center gap-2
              ${!allShipmentsDelivered
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                            : 'bg-black text-white hover:bg-gray-800 active:scale-[0.98] shadow-md border border-gray-900'}`}
                >
                    {loading ? <span className="animate-spin border-2 border-white/20 border-t-white rounded-full w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                    {loading ? 'Onaylanıyor...' : 'Alımı Onaylıyorum'}
                </button>
            </div>
        </div>
    );
}
