"use client";

import { Shield } from "lucide-react";

export default function AdminB2BSettingsPage() {
    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Platform B2B Portal Kuralları</h1>
            <p className="text-gray-500">Bayi portalı genel kural seti ve global OTP login politikaları (Sadece Super Admin).</p>
            <div className="mt-8 p-6 bg-slate-50 text-slate-700 rounded-xl flex items-center gap-4 border border-slate-100 shadow-sm">
                <Shield className="w-6 h-6" />
                <span>Authentication (OTP/Parola) mode ayarları Platform Policy olarak buradan yönetilir. Tenantlar kendi seviyelerinde bunu değiştiremez.</span>
            </div>
        </div>
    );
}
