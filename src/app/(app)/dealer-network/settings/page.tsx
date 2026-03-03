"use client"

import { useApp } from "@/contexts/AppContext"

export default function DealerNetworkSettings() {
    const { currentUser } = useApp()

    return (
        <div className="p-6 max-w-2xl">
            <h1 className="text-2xl font-semibold">Dealer Network Ayarları</h1>
            <p className="text-sm text-muted-foreground mt-1 mb-6">Bayilerinizle ilgili temel yönetim yapılandırmaları ve kredi limit ayarları.</p>

            <div className="bg-card border shadow-sm rounded-xl p-6">
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Kredi Limiti Politikası</label>
                    <select
                        disabled
                        className="w-full h-10 px-3 rounded-md border bg-muted text-sm text-muted-foreground focus:outline-none cursor-not-allowed"
                        defaultValue="STRICT"
                    >
                        <option value="STRICT">Kredi aşımında otomatik durdur (Katı)</option>
                        <option value="WARNING">Kredi aşımında uyar, onay al (Esnek)</option>
                    </select>
                </div>

                <div className="text-sm text-muted-foreground mb-6">
                    <p>Not: Giriş, OTP ve Auth güvenlik politikaları sadece Platform Super Admin tarafından merkezi olarak yönetilebilir.</p>
                </div>

                <button
                    disabled
                    className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium opacity-50 cursor-not-allowed"
                >
                    Ayarları Kaydet
                </button>
            </div>
        </div>
    )
}
