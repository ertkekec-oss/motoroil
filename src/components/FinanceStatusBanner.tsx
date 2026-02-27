"use client";

import { useApp } from "@/contexts/AppContext";

export default function FinanceStatusBanner() {
    // Simulated flags from context assuming these properties might exist on tenant/user level
    // Adjust according to the real schema context
    const { currentUser, subscription } = useApp();

    const isPayoutPaused = false; // Example flag
    const isBoostPaused = false; // Example flag
    const isEscrowPaused = false; // Example flag

    if (!isPayoutPaused && !isBoostPaused && !isEscrowPaused) return null;

    return (
        <div className="mb-6 space-y-2">
            {isPayoutPaused && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md shadow-sm">
                    <p className="text-sm font-bold text-red-700">Para Çekme İşlemleri Duraklatıldı</p>
                    <p className="text-xs text-red-600 mt-1">Hesabınızın ödeme alabilmesi için kısıtlamalar mevcuttur. Lütfen destek ile iletişime geçin.</p>
                </div>
            )}
            {isBoostPaused && (
                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-md shadow-sm">
                    <p className="text-sm font-bold text-amber-700">Boost (Reklam) Hizmetleri Duraklatıldı</p>
                    <p className="text-xs text-amber-600 mt-1">Gecikmiş ödemelerinizden dolayı Boost özellikleriniz geçici olarak askıya alınmıştır.</p>
                </div>
            )}
            {isEscrowPaused && (
                <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded-md shadow-sm">
                    <p className="text-sm font-bold text-indigo-700">Escrow (Güvenli Ödeme) Koruması Kısıtlandı</p>
                    <p className="text-xs text-indigo-600 mt-1">Risk politikaları gereği Escrow işlemlerinizde gecikmeler yaşanabilir.</p>
                </div>
            )}
        </div>
    );
}
