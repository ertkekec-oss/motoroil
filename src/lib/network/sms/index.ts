import { SmsProvider } from "./provider"
import { netgsmProvider } from "./netgsm"
import { mockProvider } from "./mock"

export function getSmsProvider(): SmsProvider {
    const enabled = process.env.SMS_SENDER_ENABLED === "true"
    if (!enabled) return mockProvider

    const p = (process.env.SMS_PROVIDER || "mock").toLowerCase()
    if (p === "netgsm") return netgsmProvider
    return mockProvider
}
