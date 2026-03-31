"use client";

import { Shield } from "lucide-react";
import { EnterprisePageShell, EnterpriseCard } from "@/components/ui/enterprise";

export default function AdminB2BSettingsPage() {
    return (
        <EnterprisePageShell
            title="Platform B2B Portal Kuralları"
            description="Bayi portalı genel kural seti ve global OTP login politikaları (Sadece Super Admin)."
            className="min-h-screen bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 font-sans w-full pb-16 focus:outline-none"
        >
            <div className="mt-8">
                <EnterpriseCard className="p-6 bg-slate-50 dark:bg-slate-800/30 text-slate-700 dark:text-slate-300 flex items-center gap-4 text-[11px] uppercase" >
                    <Shield className="w-6 h-6 shrink-0 text-indigo-500" />
                    <span className="leading-relaxed font-black tracking-widest text-[11px] uppercase">Authentication (OTP/Parola) mode ayarları Platform Policy olarak buradan yönetilir. Tenantlar kendi seviyelerinde bunu değiştiremez.</span>
                </EnterpriseCard>
            </div>
        </EnterprisePageShell>
    );
}
