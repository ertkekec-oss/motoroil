"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useModal } from "@/contexts/ModalContext";
import { CreditCard } from "lucide-react";
import { simulateNetworkPaymentAction } from "@/actions/networkPaymentActions";

export default function PaymentSimulationAction({ orderId, currentStatus }: { orderId: string, currentStatus: string }) {
    const { showSuccess, showError, showConfirm } = useModal();
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    if (currentStatus !== "INIT" && currentStatus !== "PENDING_PAYMENT") {
        return null; // Only show if payment is needed
    }

    const handlePay = () => {
        showConfirm("Ödeme Simülasyonu", "Bu B2B Siparişi için Ağ Finansmanı üzerinden ödemeyi gerçekleştirmiş varsaymak ister misiniz? (Gerçek pos entegrasyonu bağlanana kadar siparişi Kargoya Hazır aşamasına geçirir)", () => {
            startTransition(async () => {
                try {
                    const res = await simulateNetworkPaymentAction(orderId);
                    if (res && res.error) throw new Error(res.error);
                    showSuccess("Ödeme Başarılı", "Fon güvenli Escrow havuzuna alındı. Satıcıya bildirim gönderildi.");
                    router.refresh();
                } catch (err: any) {
                    showError("Ödeme Hatası", err.message);
                }
            });
        });
    };

    return (
        <button
            onClick={handlePay}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 py-4 bg-indigo-600 text-white text-sm font-black uppercase tracking-wider rounded-xl hover:bg-indigo-500 active:scale-[0.98] transition-all shadow-md hover:shadow-lg disabled:opacity-50"
        >
            <CreditCard className="w-5 h-5" />
            {isPending ? "İşleniyor..." : "B2B Ödemeyi Tamamla"}
        </button>
    );
}
