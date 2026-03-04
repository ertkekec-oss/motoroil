"use client";

import { CheckCircle } from "lucide-react";

export default function AdminB2BOrdersPage() {
    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Platform B2B Sipariş İzleme</h1>
            <p className="text-gray-500">Tüm tenant'ların bayilerinden aldığı siparişlerin platform seviyesinde izlendiği alan (Sadece Super Admin).</p>
            <div className="mt-8 p-6 bg-emerald-50 text-emerald-700 rounded-xl flex items-center gap-4 border border-emerald-100">
                <CheckCircle className="w-6 h-6" />
                <span>Bu sayfa B2B Domain Standardization kapsamında tenant yönetiminden ayrıştırılmıştır.</span>
            </div>
        </div>
    );
}
