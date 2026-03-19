"use client"

import { useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useNetworkPath } from "@/hooks/useNetworkPath"

type RedeemState =
    | { status: "idle" }
    | { status: "loading" }
    | { status: "success" }
    | { status: "error"; message: string }

function normalizePhone(input: string) {
    // Minimal normalize (TR için): boşluk/()/- temizle
    // E.164 doğrulamasını backend'de de yapın.
    return input.replace(/[^\d+]/g, "")
}

export default function InviteRedeemPage() {
    const getPath = useNetworkPath()
    const router = useRouter()
    const params = useParams()
    const token = params?.token as string

    const [phone, setPhone] = useState("")
    const [email, setEmail] = useState("")
    const [legalName, setLegalName] = useState("")
    const [taxNo, setTaxNo] = useState("")
    const [taxOffice, setTaxOffice] = useState("")
    const [contactPerson, setContactPerson] = useState("")
    const [iban, setIban] = useState("")
    const [city, setCity] = useState("")
    const [district, setDistrict] = useState("")
    const [address, setAddress] = useState("")
    const [password, setPassword] = useState("")
    const [passwordConfirm, setPasswordConfirm] = useState("")
    const [state, setState] = useState<RedeemState>({ status: "idle" })

    const canSubmit = useMemo(() => {
        return (
            !!token &&
            normalizePhone(phone).length >= 10 &&
            email.includes("@") &&
            legalName.trim().length >= 2 &&
            taxNo.trim().length >= 10 &&
            (!password || password === passwordConfirm)
        )
    }, [token, phone, email, legalName, taxNo, password, passwordConfirm])

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!canSubmit) return

        setState({ status: "loading" })

        const res = await fetch("/api/network/invites/redeem", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
            body: JSON.stringify({
                token,
                phoneE164: normalizePhone(phone),
                email,
                company: {
                    legalName,
                    taxNo: taxNo.trim(),
                    taxOffice: taxOffice.trim() || undefined,
                    contactPerson: contactPerson.trim() || undefined,
                    iban: iban.trim() || undefined,
                    city: city.trim() || undefined,
                    district: district.trim() || undefined,
                    address: address.trim() || undefined,
                },
                password: password ? password : undefined
            }),
        })

        const data = await res.json().catch(() => null)

        if (!res.ok || !data?.ok) {
            const msg =
                data?.error === "INVITE_EXPIRED"
                    ? "Bu davetin süresi dolmuş."
                    : data?.error === "INVITE_NOT_FOUND"
                        ? "Davet bağlantısı geçersiz."
                        : data?.error === "PHONE_MISMATCH"
                            ? "Bu davet bu telefon numarası için oluşturulmamış."
                            : data?.error === "EMAIL_REQUIRED"
                                ? "Email zorunlu."
                                : data?.error === "PASSWORD_REQUIRED"
                                    ? "Hesap güvenliği için şifre belirlemeniz zorunludur."
                                    : "Davet kabul edilemedi. Lütfen tekrar deneyin."
            setState({ status: "error", message: msg })
            return
        }

        setState({ status: "success" })

        // Login'e yönlendir (prefill için query geçilebilir)
        const qs = new URLSearchParams()
        qs.set("phone", normalizePhone(phone))
        qs.set("email", email)

        setTimeout(() => {
            router.push(getPath(`/network/login?${qs.toString()}`))
        }, 900)
    }

    return (
        <div className="min-h-[calc(100vh-0px)] flex items-center justify-center px-4 py-12 bg-background">
            <div className="w-full max-w-lg">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <span className="font-semibold text-primary">P</span>
                        </div>
                        <div>
                            <div className="text-sm text-muted-foreground">Periodya</div>
                            <div className="text-base font-semibold leading-tight">Dealer Network</div>
                        </div>
                    </div>
                    <span className="text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground">
                        Invite-only
                    </span>
                </div>

                {/* Card */}
                <div className="rounded-2xl border bg-card shadow-sm">
                    <div className="p-6 border-b">
                        <h1 className="text-xl font-semibold">Bayi Ağı Daveti</h1>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Daveti kabul ederek ilgili tedarikçinin B2B kataloğuna erişim talebini başlatırsın.
                        </p>
                    </div>

                    <div className="p-6">
                        {state.status === "error" && (
                            <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm">
                                <div className="font-medium text-destructive">İşlem başarısız</div>
                                <div className="text-muted-foreground mt-1">{state.message}</div>
                            </div>
                        )}

                        {state.status === "success" ? (
                            <div className="rounded-xl border bg-muted/30 p-4">
                                <div className="font-medium">Başarılı ✅</div>
                                <div className="text-sm text-muted-foreground mt-1">
                                    Giriş ekranına yönlendiriliyorsun…
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={onSubmit} className="space-y-4">
                                <Field
                                    label="Telefon"
                                    placeholder="+90 5xx xxx xx xx"
                                    value={phone}
                                    onChange={setPhone}
                                    hint="OTP doğrulaması için kullanılır."
                                />
                                <Field
                                    label="Email"
                                    placeholder="ornek@firma.com"
                                    value={email}
                                    onChange={setEmail}
                                    hint="Davet kaydı ve bildirimler için zorunlu."
                                />
                                <Field
                                    label="Firma Ünvanı"
                                    placeholder="ABC Otomotiv Ltd. Şti."
                                    value={legalName}
                                    onChange={setLegalName}
                                />
                                <Field
                                    label="Yetkili Kişi"
                                    placeholder="Ad Soyad"
                                    value={contactPerson}
                                    onChange={setContactPerson}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <Field
                                        label="Vergi No"
                                        placeholder="Zorunlu"
                                        value={taxNo}
                                        onChange={setTaxNo}
                                    />
                                    <Field
                                        label="Vergi Dairesi"
                                        placeholder="Opsiyonel"
                                        value={taxOffice}
                                        onChange={setTaxOffice}
                                    />
                                </div>
                                <Field
                                    label="IBAN"
                                    placeholder="TR..."
                                    value={iban}
                                    onChange={setIban}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <Field
                                        label="İl"
                                        placeholder="Örn. İstanbul"
                                        value={city}
                                        onChange={setCity}
                                    />
                                    <Field
                                        label="İlçe"
                                        placeholder="Örn. Kadıköy"
                                        value={district}
                                        onChange={setDistrict}
                                    />
                                </div>
                                <Field
                                    label="Açık Adres"
                                    placeholder="Mahalle, Sokak..."
                                    value={address}
                                    onChange={setAddress}
                                />
                                <div className="border-t pt-4 mt-4">
                                    <h3 className="text-sm font-medium mb-3">Hesap Şifresi (Sisteme giriş için)</h3>
                                    <div className="space-y-4">
                                        <Field
                                            label="Şifre"
                                            type="password"
                                            placeholder="En az 6 karakter"
                                            value={password}
                                            onChange={setPassword}
                                            hint="Platforma şifreyle giriş yapacaksanız zorunludur."
                                        />
                                        <Field
                                            label="Şifre (Tekrar)"
                                            type="password"
                                            placeholder="Şifreyi doğrula"
                                            value={passwordConfirm}
                                            onChange={setPasswordConfirm}
                                        />
                                        {password && password !== passwordConfirm && (
                                            <div className="text-xs text-destructive">Şifreler eşleşmiyor.</div>
                                        )}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={!canSubmit || state.status === "loading"}
                                    className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {state.status === "loading" ? "İşleniyor…" : "Onayla"}
                                </button>

                                <div className="text-xs text-muted-foreground mt-4 text-center">
                                    Devam ederek kullanım koşulları ve KVKK metnini kabul etmiş olursun.
                                </div>
                            </form>
                        )}
                    </div>
                </div>

                <div className="mt-6 text-center text-xs text-muted-foreground">
                    Sorun mu yaşıyorsun? <span className="underline cursor-pointer">destek@periodya.com</span>
                </div>
            </div>
        </div>
    )
}

function Field({
    label,
    placeholder,
    value,
    onChange,
    hint,
    type = "text"
}: {
    label: string
    placeholder?: string
    value: string
    onChange: (v: string) => void
    hint?: string
    type?: string
}) {
    return (
        <div>
            <label className="text-sm font-medium">{label}</label>
            <input
                type={type}
                className="mt-2 w-full h-11 rounded-xl border bg-background px-3 outline-none focus:ring-2 focus:ring-primary/30"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                autoComplete="off"
            />
            {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
        </div>
    )
}
