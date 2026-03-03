import { SmsProvider } from "./provider"

function env(name: string) {
    const v = process.env[name]
    if (!v) throw new Error(`MISSING_ENV:${name}`)
    return v
}

function timeoutMs() {
    const v = Number(process.env.SMS_TIMEOUT_MS || "6000")
    return Number.isFinite(v) ? v : 6000
}

function basicAuthHeader() {
    const username = env("NETGSM_USERCODE")
    const password = env("NETGSM_PASSWORD")
    const token = Buffer.from(`${username}:${password}`).toString("base64")
    return `Basic ${token}`
}

async function sendOnce(to: string, message: string) {
    const baseUrl = process.env.NETGSM_BASE_URL || "https://api.netgsm.com.tr"

    const controller = new AbortController()
    const t = setTimeout(() => controller.abort(), timeoutMs())

    try {
        const res = await fetch(`${baseUrl}/sms/send/otp`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: basicAuthHeader(),
            },
            body: JSON.stringify({
                msgheader: env("NETGSM_HEADER"),
                msg: message,
                no: to.replace(/^\+/, ""), // +90 → 90
                iysfilter: "0",
                referansID: crypto.randomUUID(),
            }),
            signal: controller.signal,
            cache: "no-store",
        })

        const text = await res.text()

        if (!res.ok) {
            throw new Error(`NETGSM_HTTP_${res.status}:${text}`)
        }

        // Başarılı durumda jobid veya "00" gibi kod döner
        const jobId = text.trim()

        // Hata kodlarını kontrol et
        if (
            jobId === "20" ||
            jobId === "30" ||
            jobId === "40" ||
            jobId === "50" ||
            jobId === "60" ||
            jobId === "70" ||
            jobId === "80" ||
            jobId === "85"
        ) {
            throw new Error(`NETGSM_ERROR_${jobId}`)
        }

        return { provider: "netgsm", messageId: jobId }
    } finally {
        clearTimeout(t)
    }
}

export const netgsmProvider: SmsProvider = {
    async send(to, message) {
        try {
            return await sendOnce(to, message)
        } catch (err: any) {
            const msg = String(err?.message || "")

            const retryable =
                msg.includes("aborted") ||
                msg.includes("ETIMEDOUT") ||
                msg.includes("ECONNRESET") ||
                msg.startsWith("NETGSM_HTTP_500") ||
                msg.startsWith("NETGSM_HTTP_502") ||
                msg.startsWith("NETGSM_HTTP_503")

            if (!retryable) throw err

            await new Promise((r) => setTimeout(r, 250))
            return await sendOnce(to, message)
        }
    },
}
