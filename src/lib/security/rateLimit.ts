// src/lib/security/rateLimit.ts
/**
 * 🛡️ Basit In-Memory Oran Sınırlayıcı (Rate Limiter)
 * İdeal mimaride bu Upstash Redis üzerinden yapılmalıdır.
 * Fakat acil Brute-Force güvenlik açığını kapamak için In-Memory Cache kullanılmıştır.
 */

const rateLimitCache = new Map<string, { count: number; timestamp: number }>();

export function checkRateLimit(ip: string, limit: number = 5, windowMs: number = 60000): { success: boolean; resetIn?: number } {
    const now = Date.now();
    const record = rateLimitCache.get(ip);

    if (!record) {
        rateLimitCache.set(ip, { count: 1, timestamp: now });
        return { success: true };
    }

    if (now - record.timestamp > windowMs) {
        // Reset the window
        rateLimitCache.set(ip, { count: 1, timestamp: now });
        return { success: true };
    }

    if (record.count >= limit) {
        return { success: false, resetIn: windowMs - (now - record.timestamp) };
    }

    record.count++;
    rateLimitCache.set(ip, record);
    return { success: true };
}

// Güvenlik: Her 15 dakikada bir eski (süresi dolmuş) cache'i temizle, belleği şişirmesin (OOM Engelleme)
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitCache.entries()) {
        if (now - value.timestamp > 60000 * 15) { // 15 mins
            rateLimitCache.delete(key);
        }
    }
}, 1000 * 60 * 15);
