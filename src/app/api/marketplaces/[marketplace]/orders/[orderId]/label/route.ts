import prisma from "@/lib/prisma";
import { authorize } from "@/lib/auth";
import { ActionProviderRegistry } from "@/services/marketplaces/actions/registry";

export const runtime = "nodejs";
export const maxDuration = 60; // Allow up to 60 seconds for slow Trendyol responses
export const dynamic = "force-dynamic";

export async function GET(
    request: Request,
    { params }: { params: { marketplace: string; orderId: string } }
) {
    try {
        const auth = await authorize();
        if (!auth.authorized) return auth.response;

        const { marketplace, orderId } = await (params as any);

        const url = new URL(request.url);
        const shipmentPackageId = url.searchParams.get("shipmentPackageId");
        const format = (url.searchParams.get("format") ?? "A4").toUpperCase();

        if (!shipmentPackageId) {
            return new Response(JSON.stringify({ error: "shipmentPackageId gerekli" }), { status: 400 });
        }
        if (format !== "A4") {
            return new Response(JSON.stringify({ error: "Şimdilik sadece A4 destekleniyor" }), { status: 400 });
        }

        // ✅ companyId resolve
        const company = await prisma.company.findFirst({
            where: { tenantId: auth.user.tenantId },
            select: { id: true },
        });
        if (!company) return new Response(JSON.stringify({ error: "Firma bulunamadı" }), { status: 403 });

        // 1) Check if label already exists in DB
        const existingLabel = await (prisma as any).marketplaceLabel.findUnique({
            where: {
                companyId_marketplace_shipmentPackageId: {
                    companyId: company.id,
                    marketplace,
                    shipmentPackageId
                }
            }
        });

        if (existingLabel) {
            console.log(`[LABEL] DB Hit for ${shipmentPackageId}. Generating signed URL.`);
            const { getLabelSignedUrl } = await import("@/lib/s3");
            const signedUrl = await getLabelSignedUrl(existingLabel.storageKey);

            return Response.redirect(signedUrl, 302);
        }

        // 2) If not exists, check if there's an in-progress action or start one
        const idempotencyKey = `LABEL_A4:${company.id}:${marketplace}:${shipmentPackageId}`;

        // Check active audit
        const existingAudit = await (prisma as any).marketplaceActionAudit.findUnique({
            where: { idempotencyKey }
        });

        if (existingAudit) {
            if (existingAudit.status === 'SUCCESS' && existingAudit.responsePayload?.storageKey) {
                console.log(`[LABEL] Audit SUCCESS Hit. Redirecting.`);
                const { getLabelSignedUrl } = await import("@/lib/s3");
                const signedUrl = await getLabelSignedUrl(existingAudit.responsePayload.storageKey);
                return Response.redirect(signedUrl, 302);
            }
            // If PENDING, we purposefully FALL THROUGH to executeAction
            // This forces a re-check against Trendyol API instead of just returning stale DB status.
        }

        const provider = ActionProviderRegistry.getProvider(marketplace);

        const result = await provider.executeAction({
            companyId: company.id,
            marketplace: marketplace as any,
            orderId,
            actionKey: "PRINT_LABEL_A4",
            idempotencyKey,
            payload: { labelShipmentPackageId: shipmentPackageId },
        });

        // Handle Synchronous Success
        if (result.status === "SUCCESS") {
            const storageKey = result.result?.storageKey;

            if (storageKey) {
                console.log(`[LABEL] Sync Success. redirecting to ${storageKey}`);
                const { getLabelSignedUrl } = await import("@/lib/s3");
                const signedUrl = await getLabelSignedUrl(storageKey);
                return Response.redirect(signedUrl, 302);
            }
        }

        const retryAfterSec = 3;

        if (isDocumentRequest(request)) {
            return new Response(pendingHtml(retryAfterSec), {
                status: 200,
                headers: {
                    "Content-Type": "text/html; charset=utf-8",
                    "Cache-Control": "no-store",
                    "Retry-After": String(retryAfterSec),
                },
            });
        }

        return new Response(JSON.stringify({
            status: "PENDING",
            message: "Etiket hazırlanıyor...",
            auditId: result.auditId
        }), {
            status: 202,
            headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-store",
                "Retry-After": String(retryAfterSec)
            }
        });

    } catch (error: any) {
        console.error(`[LABEL_CRITICAL_ERROR]`, error);
        return new Response(JSON.stringify({
            error: error?.message ?? "Unknown error",
            stack: error?.stack
        }), {
            status: 500,
            headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-store"
            },
        });
    }
}

// --- Helpers for UX-focused Label Generation ---

function isDocumentRequest(req: Request) {
    const accept = (req.headers.get("accept") || "").toLowerCase();
    const dest = (req.headers.get("sec-fetch-dest") || "").toLowerCase();
    return dest === "document" || accept.includes("text/html");
}

function pendingHtml(retryAfterSec: number) {
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
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="card">
    <div class="loader"></div>
    <h2>Etiket Hazırlanıyor…</h2>
    <p class="muted">${retryAfterSec} saniye sonra sistem otomatik olarak kontrol edilecek.</p>
    <p class="muted">PDF oluşturulduğunda bu sayfa otomatik olarak açılacaktır.<br/>Lütfen bu sekmeyi kapatmayın.</p>
  </div>
</body>
</html>`;
}
