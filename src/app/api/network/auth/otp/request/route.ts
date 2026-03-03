import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { randomNumericCode, sha256Base64 } from "@/lib/network/crypto"
import { consumeRateLimit, RateLimitError, cleanupRateLimitEvents } from "@/lib/network/rateLimit"
import { getClientIp } from "@/lib/network/ip"
import { getSmsProvider } from "@/lib/network/sms"

const OTP_TTL_MIN = 5

export async function POST(req: Request) {
    const { phoneE164, supplierTenantId } = await req.json().catch(() => ({}))
    if (!phoneE164 || typeof phoneE164 !== "string" || !supplierTenantId) {
        return NextResponse.json({ ok: false, error: "INVALID_PHONE_OR_TENANT" }, { status: 400 })
    }

    const config = await prisma.tenantPortalConfig.findUnique({
        where: { tenantId: supplierTenantId },
        select: { dealerAuthMode: true }
    })
    const authMode = config?.dealerAuthMode || "PASSWORD_ONLY"

    if (authMode === "PASSWORD_ONLY") {
        return NextResponse.json({ ok: false, error: "AUTH_MODE_PASSWORD_ONLY" }, { status: 403 })
    }

    const ip = await getClientIp()

    try {
        // Phone limits
        await consumeRateLimit({ key: `otp:phone:1m:${phoneE164}`, windowMs: 60_000, limit: 1 })
        await consumeRateLimit({ key: `otp:phone:5m:${phoneE164}`, windowMs: 5 * 60_000, limit: 3 })

        // IP limit
        await consumeRateLimit({ key: `otp:ip:5m:${ip}`, windowMs: 5 * 60_000, limit: 10 })

        // Global Limit
        await consumeRateLimit({ key: `otp:global:1m`, windowMs: 60_000, limit: 200 })
    } catch (e: any) {
        if (e instanceof RateLimitError) {
            return NextResponse.json(
                { ok: false, error: "RATE_LIMITED", retryAfterSec: e.retryAfterSec },
                {
                    status: 429,
                    headers: { "Retry-After": String(e.retryAfterSec) },
                }
            )
        }
        return NextResponse.json({ ok: false, error: "RATE_LIMIT_CHECK_FAILED" }, { status: 500 })
    }

    // Periodic cleanup (1% probability to keep DB lean)
    if (Math.random() < 0.01) {
        cleanupRateLimitEvents().catch(() => { })
    }

    const code = randomNumericCode(6)
    const codeHash = sha256Base64(code)
    const expiresAt = new Date(Date.now() + OTP_TTL_MIN * 60 * 1000)

    // Fail-Closed SMS Kurgusu (Önce SMS Send, Başarılıysa DB Upsert)
    const sms = getSmsProvider()
    const message = `Periodya dogrulama kodunuz: ${code}`

    try {
        await sms.send(phoneE164, message)
    } catch (error) {
        // SMS başarısız olursa database'e challenge yaratma, OTP bloğunu pas geç. Kullanıcı deneyimi: Hata alır.
        return NextResponse.json({ ok: false, error: "SMS_SEND_FAILED" }, { status: 502 })
    }

    // SMS başarılıysa challenge yaz
    await prisma.dealerOtpChallenge.upsert({
        where: { phoneE164 },
        update: { codeHash, expiresAt, attempts: 0, createdAt: new Date() },
        create: { phoneE164, codeHash, expiresAt },
    })

    // info leak yok
    return NextResponse.json({ ok: true })
}
