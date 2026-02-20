import prisma from "@/lib/prisma";
import { authorize } from "@/lib/auth";
import { ActionProviderRegistry } from "@/services/marketplaces/actions/registry";
import { redisConnection } from "@/lib/queue/redis";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ marketplace: string; orderId: string }> }
) {
    try {
        const auth = await authorize();
        if (!auth.authorized) return auth.response;

        const { marketplace, orderId } = await params;

        const url = new URL(request.url);
        const shipmentPackageId = url.searchParams.get("shipmentPackageId");
        const format = (url.searchParams.get("format") ?? "A4").toUpperCase();

        if (!shipmentPackageId) {
            return new Response(JSON.stringify({ error: "shipmentPackageId gerekli" }), { status: 400 });
        }

        console.info(`[LABEL_START] ${marketplace} orderId=${orderId} shipmentPackageId=${shipmentPackageId}`);

        // ✅ companyId resolve
        const company = await prisma.company.findFirst({
            where: { tenantId: auth.user.tenantId },
            select: { id: true },
        });
        if (!company) return new Response(JSON.stringify({ error: "Firma bulunamadı" }), { status: 403 });

        const idempotencyKey = `LABEL_${format}:${company.id}:${marketplace}:${shipmentPackageId}`;
        const ctx = `[LABEL:${marketplace}][IDEMP:${idempotencyKey}]`;
        // Helper: Respond and Log
        const respondWith = (res: Response) => {
            console.info(`${ctx} responding status=${res.status}`);
            return res;
        };

        const respondWithSuccess = async (storageKey: string) => {
            const { getLabelSignedUrl } = await import("@/lib/s3");
            const signedUrl = await getLabelSignedUrl(storageKey);

            if (isDocumentRequest(request)) {
                return respondWith(Response.redirect(signedUrl, 303));
            }

            return respondWith(new Response(JSON.stringify({ status: "READY", url: signedUrl }), {
                status: 200,
                headers: { "Content-Type": "application/json" }
            }));
        };

        // 1) Fast Path: Check existing state
        const existingLabel = await (prisma as any).marketplaceLabel.findUnique({
            where: { companyId_marketplace_shipmentPackageId: { companyId: company.id, marketplace, shipmentPackageId } }
        });
        if (existingLabel) {
            console.log(`${ctx} Found existing label in DB. Responding with success.`);
            return respondWithSuccess(existingLabel.storageKey);
        }

        const existingAudit = await (prisma as any).marketplaceActionAudit.findUnique({ where: { idempotencyKey } });
        if (existingAudit?.status === 'SUCCESS' && existingAudit.responsePayload?.storageKey) {
            console.log(`${ctx} Found existing successful audit. Responding with success.`);
            return respondWithSuccess(existingAudit.responsePayload.storageKey);
        }

        // 2) Attempt Tracking (Throttle expensive calls)
        const attemptKey = `attempts:label:${idempotencyKey}`;
        const currentAttempt = await redisConnection.incr(attemptKey);
        await redisConnection.expire(attemptKey, 300); // 5 min TTL

        const shouldSkipHeavy = currentAttempt > 1 && currentAttempt % 3 !== 0;
        // If it's not the 1st, 3rd, 6th... attempt, and we know it was pending, we can just return 202 quickly.
        if (shouldSkipHeavy && existingAudit?.status === 'PENDING') {
            console.log(`${ctx} Throttling (Attempt ${currentAttempt}). Returning 202 without re-execution.`);
            const retryAfterSec = 3;
            if (isDocumentRequest(request)) {
                return respondWith(new Response(pendingHtml(retryAfterSec, existingAudit.errorMessage || "Hazırlanıyor..."), {
                    status: 202, headers: { "Content-Type": "text/html; charset=utf-8", "Retry-After": String(retryAfterSec) }
                }));
            }
            return respondWith(new Response(JSON.stringify({
                status: "PENDING",
                message: "Hazırlanıyor...",
                attempt: currentAttempt
            }), {
                status: 202, headers: { "Content-Type": "application/json", "Retry-After": String(retryAfterSec) }
            }));
        }

        // 3) Execute Action ONCE
        const provider = ActionProviderRegistry.getProvider(marketplace);
        const result = await provider.executeAction({
            companyId: company.id,
            marketplace: marketplace as any,
            orderId,
            actionKey: `PRINT_LABEL_${format}` as any,
            idempotencyKey,
            payload: { labelShipmentPackageId: shipmentPackageId },
        });

        // 4) Handle Result
        if (result.status === "SUCCESS" && result.result?.storageKey) {
            console.log(`${ctx} Execution SUCCESS. Responding with success.`);
            return respondWithSuccess(result.result.storageKey);
        }

        if (result.status === "FAILED") {
            console.error(`${ctx} Execution FAILED:`, result.errorMessage);
            const status = result.httpStatus || 502;
            return respondWith(new Response(JSON.stringify({ error: result.errorMessage || "Etiket alınamadı", status: "FAILED", auditId: result.auditId }), {
                status, headers: { "Content-Type": "application/json" }
            }));
        }

        // ⏳ PENDING: Return 202 Accepted
        const retryAfterSec = 3;
        const msg = result.errorMessage || "Etiket hazırlanıyor...";
        console.log(`${ctx} Execution PENDING. Responding with 202.`);

        if (isDocumentRequest(request)) {
            return respondWith(new Response(pendingHtml(retryAfterSec, msg), {
                status: 202,
                headers: { "Content-Type": "text/html; charset=utf-8", "Retry-After": String(retryAfterSec) }
            }));
        }

        return respondWith(new Response(JSON.stringify({
            status: "PENDING",
            message: msg,
            auditId: result.auditId,
            attempt: currentAttempt
        }), {
            status: 202,
            headers: { "Content-Type": "application/json", "Retry-After": String(retryAfterSec) }
        }));

    } catch (error: any) {
        console.error(`[LABEL_CRITICAL_ERROR]`, error);
        return new Response(JSON.stringify({ error: error?.message ?? "Sistem Hatası" }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}

// --- Helpers for UX-focused Label Generation ---

function isDocumentRequest(req: Request) {
    const accept = (req.headers.get("accept") || "").toLowerCase();
    // Prioritize text/html check
    return accept.includes("text/html");
}

function pendingHtml(retryAfterSec: number, message: string) {
    return `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta http-equiv="refresh" content="${retryAfterSec}">
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Etiket hazırlanıyor...</title>
  <style>
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto; padding: 0; margin: 0; background: #0f172a; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; text-align: center; }
    .card { max-width: 480px; padding: 2rem; border-radius: 1.5rem; background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
    .loader { width: 48px; height: 48px; border: 4px solid rgba(255,255,255,0.1); border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1.5rem; }
    h2 { font-size: 1.5rem; margin-bottom: 0.5rem; font-weight: 600; }
    .muted { color: #94a3b8; font-size: 0.95rem; line-height: 1.5; }
    .status-badge { display: inline-block; padding: 0.4rem 0.8rem; background: rgba(59, 130, 246, 0.1); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 2rem; font-size: 0.85rem; margin-top: 1rem; }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="card">
    <div class="loader"></div>
    <h2>Etiket Hazırlanıyor…</h2>
    <p class="muted">${retryAfterSec} saniye sonra sistem otomatik olarak kontrol edilecek.</p>
    <div class="status-badge">${message}</div>
    <p class="muted" style="margin-top: 1.5rem; font-size: 0.8rem;">PDF oluşturulduğunda bu sayfa otomatik olarak açılacaktır.<br/>Lütfen bu sekmeyi kapatmayın.</p>
  </div>
</body>
</html>`;
}
