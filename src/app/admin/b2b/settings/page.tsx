"use client"

import { useState, useEffect } from "react"

export default function DealerPortalSettings() {
    const [mode, setMode] = useState<string>("PASSWORD_ONLY")
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<{ text: string, type: "success" | "error" } | null>(null)

    useEffect(() => {
        fetch("/api/admin/settings/dealer-portal")
            .then(r => r.json())
            .then(data => {
                if (data.ok) setMode(data.dealerAuthMode)
            })
            .finally(() => setLoading(false))
    }, [])

    async function handleSave() {
        setSaving(true)
        setMessage(null)
        try {
            const res = await fetch("/api/admin/settings/dealer-portal", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ dealerAuthMode: mode })
            })
            const data = await res.json()
            if (data.ok) {
                setMessage({ text: "Ayarlar başarıyla kaydedildi.", type: "success" })
            } else {
                setMessage({ text: data.error || "Hata oluştu", type: "error" })
            }
        } catch (e) {
            setMessage({ text: "Sunucu hatası", type: "error" })
        }
        setSaving(false)
    }

    if (loading) return <div className="p-6 text-sm text-muted-foreground">Yükleniyor...</div>

    return (
        <div className="p-6 max-w-2xl">
            <h1 className="text-2xl font-semibold">Dealer Portal Ayarları</h1>
            <p className="text-sm text-muted-foreground mt-1 mb-6">Bayilerinizin B2B portalına nasıl giriş yapacağını yönetin.</p>

            {message && (
                <div className={`p-4 mb-4 rounded-xl text-sm ${message.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                    {message.text}
                </div>
            )}

            <div className="bg-card border shadow-sm rounded-xl p-6">
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Giriş Modu</label>
                    <select
                        value={mode}
                        onChange={(e) => setMode(e.target.value)}
                        className="w-full h-10 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                        <option value="PASSWORD_ONLY">Sadece Şifre (OTP Devre Dışı)</option>
                        <option value="OTP_ONLY">Sadece OTP (SMS/Email Kodu)</option>
                        <option value="OTP_OR_PASSWORD">Şifre veya OTP (Bayi seçimine bağlı)</option>
                    </select>
                </div>

                <div className="text-sm text-muted-foreground mb-6">
                    <p>Not: Yeni açılan bayiler "Şifre" modu aktifse şifre belirlemek zorunda kalırlar. OTP modunda kod girerek tek kullanımlık şifreleriyle hızlıca platforma erişebilirler.</p>
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                >
                    {saving ? "Kaydediliyor..." : "Ayarları Kaydet"}
                </button>
            </div>
        </div>
    )
}
