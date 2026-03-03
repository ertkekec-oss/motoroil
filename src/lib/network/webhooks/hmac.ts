import crypto from "crypto"
import prisma from "@/lib/prisma"

export async function verifyHmacOrThrow(opts: {
    provider: "IYZICO" | "ODEAL"
    rawBody: string
    signature: string | null
    timestamp: string | null
    nonce: string | null
    secret: string
    maxSkewSec?: number
}) {
    const maxSkewSec = opts.maxSkewSec ?? 300

    if (!opts.signature || !opts.timestamp || !opts.nonce) {
        throw new Error("WEBHOOK_MISSING_HEADERS")
    }

    const ts = Number(opts.timestamp)
    if (!Number.isFinite(ts)) throw new Error("WEBHOOK_BAD_TIMESTAMP")

    const nowSec = Math.floor(Date.now() / 1000)
    if (Math.abs(nowSec - ts) > maxSkewSec) throw new Error("WEBHOOK_TIMESTAMP_SKEW")

    // replay check (nonce unique)
    try {
        await prisma.webhookReplay.create({
            data: { provider: opts.provider as any, nonce: opts.nonce },
        })
    } catch {
        throw new Error("WEBHOOK_REPLAY")
    }

    // canonical: ts.nonce.rawBody
    const canonical = `${opts.timestamp}.${opts.nonce}.${opts.rawBody}`
    const expected = crypto.createHmac("sha256", opts.secret).update(canonical).digest("hex")

    // constant-time compare
    const a = Buffer.from(expected)
    const b = Buffer.from(opts.signature)
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        throw new Error("WEBHOOK_BAD_SIGNATURE")
    }
}
