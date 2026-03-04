"use client";

import React, { useState } from "react";
import EnterpriseCard from "@/components/enterprise/EnterpriseCard";
import EnterpriseTable from "@/components/enterprise/EnterpriseTable";
import { Shield } from "lucide-react";

export default function AdminB2BPoliciesPage() {
    const [policy, setPolicy] = useState({
        loginMode: "OTP_REQUIRED",
        inviteExpiry: "7",
        riskDefault: "WARNING"
    });

    return (
        <div className="p-8 space-y-6">
            <h1 className="text-2xl font-bold mb-4">Platform B2B Portal Kuralları (Policies)</h1>
            <p className="text-gray-500">Bayi portalı genel kural seti, global risk ve giriş politikaları (Sadece Super Admin).</p>
            <div className="mt-4 p-6 bg-slate-50 text-slate-700 rounded-xl flex items-center gap-4 border border-slate-100 shadow-sm">
                <Shield className="w-6 h-6 text-slate-500" />
                <span>Bu ayarlar tüm tenantlar için bağlayıcıdır ve tenant yöneticileri tarafından değiştirilemez.</span>
            </div>

            <EnterpriseCard title="Giriş ve Oturum Politikaları">
                <div className="space-y-4 max-w-lg mt-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Dealer Portal Login Mode</label>
                        <select
                            value={policy.loginMode}
                            onChange={(e) => setPolicy({ ...policy, loginMode: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        >
                            <option value="OTP_REQUIRED">Sadece OTP (Şifresiz)</option>
                            <option value="PASSWORD_AND_OTP">Şifre + OTP (MFA)</option>
                            <option value="PASSWORD_ONLY">Sadece Şifre</option>
                        </select>
                    </div>
                </div>
            </EnterpriseCard>

            <EnterpriseCard title="Davet (Invite) Politikası">
                <div className="space-y-4 max-w-lg mt-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Davet Linki Geçerlilik Süresi (Gün)</label>
                        <input
                            type="number"
                            value={policy.inviteExpiry}
                            onChange={(e) => setPolicy({ ...policy, inviteExpiry: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                    </div>
                </div>
            </EnterpriseCard>

            <EnterpriseCard title="Risk ve Kredi Politikası Varsayılanları">
                <div className="space-y-4 max-w-lg mt-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Varsayılan Limit Aşım Aksiyonu</label>
                        <select
                            value={policy.riskDefault}
                            onChange={(e) => setPolicy({ ...policy, riskDefault: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        >
                            <option value="STRICT">Kapat / Siparişi Engelle</option>
                            <option value="WARNING">Uyarı Ver / Onaya Düşür</option>
                        </select>
                    </div>
                </div>
            </EnterpriseCard>
        </div>
    );
}
