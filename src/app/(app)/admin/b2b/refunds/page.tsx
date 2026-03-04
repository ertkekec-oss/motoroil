"use client";

import { RefreshCw } from "lucide-react";

export default function AdminB2BRefundsPage() {
    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Platform B2B İade İzleme</h1>
            <p className="text-gray-500">Tüm tenant'ların bayi iade talepleri platform seviyesinde izlenir (Sadece Super Admin).</p>
            <div className="mt-8 p-6 bg-blue-50 text-blue-700 rounded-xl flex items-center gap-4 border border-blue-100">
                <RefreshCw className="w-6 h-6" />
                <span>Bu sayfa B2B Domain Standardization kapsamında tenant yönetiminden ayrıştırılmıştır.</span>
            </div>
        </div>
    );
}
