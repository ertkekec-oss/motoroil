import { headers } from "next/headers";

export async function applyPortalRateLimit(req: Request, tokenHash?: string): Promise<{ ok: boolean, error?: string, status?: number, ip?: string, userAgent?: string }> {
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for") || "unknown";
    const userAgent = headersList.get("user-agent") || "unknown";

    // Rate Limit Tiers Placeholder:
    // For IP: max 100 requests / 15 min
    // For tokenHash: max 20 requests / 15 min

    // TODO: Replace with real Redis/Vercel KV based Sliding Window strategy
    /*
    const rateLimitExceeded = await checkRedisRateLimit({ ip, tokenHash });
    if (rateLimitExceeded) {
        return { ok: false, error: 'Too many requests from this IP or Token', status: 429 };
    }
    */

    return { ok: true, ip, userAgent, status: 200 };
}

export function buildPortalAuditPayload(action: string, security: any, extras: any = {}) {
    return {
        action,
        metaJson: {
            source: "PUBLIC_PORTAL",
            ip: security.ip,
            userAgent: security.userAgent,
            timestamp: new Date().toISOString(),
            ...extras
        }
    };
}

/**
 * Triggers internal in-app notifications and email hooks 
 * when an important action happens on the Public Portal.
 */
export async function triggerInternalNotification(params: {
    tenantId: string;
    companyId: string | null;
    reconciliationId: string;
    action: 'ACCEPTED' | 'REJECTED' | 'DISPUTED';
    note?: string;
    customerName: string;
    periodInfo: string;
}) {
    console.log(`[EXTERNAL NOTIFICATION HOOK] -> To Internal Ops:`, params);

    // 1. In-App Notification (Mocked / Future Ready)
    console.log(`[IN-APP] Sending notification to tenant: ${params.tenantId} about ${params.customerName} - ${params.action}`);

    // 2. Email Loop Back to Sender (Mocked / Future Ready)
    let subject = "";
    if (params.action === 'ACCEPTED') subject = `✅ Mutabakat Onaylandı: ${params.customerName}`;
    else if (params.action === 'REJECTED') subject = `❌ Mutabakat Reddedildi: ${params.customerName}`;
    else if (params.action === 'DISPUTED') subject = `⚠️ Yeni İtiraz (Dispute): ${params.customerName}`;

    console.log(`[EMAIL SEND] To Finance Team / Account Manager -> Subject: ${subject}`);
    // await sendMail({ to: 'finance@tenant.com', subject, body: ... })
}

