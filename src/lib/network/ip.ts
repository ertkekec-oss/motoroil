import { headers } from "next/headers"

export async function getClientIp() {
    const headersList = await headers()

    // Vercel/Proxy standard
    const xf = headersList.get("x-forwarded-for")
    if (xf) return xf.split(",")[0].trim()

    const realIp = headersList.get("x-real-ip")
    if (realIp) return realIp.trim()

    return "0.0.0.0"
}
