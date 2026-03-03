import { SmsProvider } from "./provider"

export const mockProvider: SmsProvider = {
    async send(toE164, message) {
        // PROD'da bile enabled=false ise buraya düşer
        // Güvenlik gereği OTP'nin kendisi değil, yalnızca gönderildiğine dair meta verisi loglanır.
        console.log("[SMS MOCK]", { toE164, len: message.length })
        return { provider: "mock" }
    },
}
