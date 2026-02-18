import prisma from "@/lib/prisma";
import { authorize } from "@/lib/auth";
import { ActionProviderRegistry } from "@/services/marketplaces/actions/registry";

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

        // ✅ companyId resolve
        const company = await prisma.company.findFirst({
            where: { tenantId: auth.user.tenantId },
            select: { id: true },
        });
        if (!company) return new Response(JSON.stringify({ error: "Firma bulunamadı" }), { status: 403 });

        const idempotencyKey = `LABEL_${format}:${company.id}:${marketplace}:${shipmentPackageId}`;

        // Helper: Respond based on Accept header
        const respondWithSuccess = async (storageKey: string) => {
            const { getLabelSignedUrl } = await import("@/lib/s3");
            const signedUrl = await getLabelSignedUrl(storageKey);

            if (isDocumentRequest(request)) {
                // Browser context: Redirect to S3
                return Response.redirect(signedUrl, 303); // See Other is cleaner for GET results
            }

            // API context: Return JSON URL
            return new Response(JSON.stringify({
                status: "READY",
                url: signedUrl
            }), {
                status: 200,
                headers: { "Content-Type": "application/json" }
            });
        };

        // 1) Fast Path: Check existing state
        const existingLabel = await (prisma as any).marketplaceLabel.findUnique({
            where: { companyId_marketplace_shipmentPackageId: { companyId: company.id, marketplace, shipmentPackageId } }
        });
        if (existingLabel) return respondWithSuccess(existingLabel.storageKey);

        const existingAudit = await (prisma as any).marketplaceActionAudit.findUnique({ where: { idempotencyKey } });
        if (existingAudit?.status === 'SUCCESS' && existingAudit.responsePayload?.storageKey) {
            return respondWithSuccess(existingAudit.responsePayload.storageKey);
        }

        // 2) Synchronous Polling Loop (Time-Budgeted)
        const provider = ActionProviderRegistry.getProvider(marketplace);
        const deadline = Date.now() + 50_000; // 50s budget
        let lastResult: any = null;
        let attempt = 0;

        while (Date.now() < deadline) {
            attempt++;
            const result = await provider.executeAction({
                companyId: company.id,
                marketplace: marketplace as any,
                orderId,
                actionKey: `PRINT_LABEL_${format}` as any,
                idempotencyKey,
                payload: { labelShipmentPackageId: shipmentPackageId },
            });

            lastResult = result;

            if (result.status === "SUCCESS" && result.result?.storageKey) {
                return respondWithSuccess(result.result.storageKey);
            }

            if (result.status === "FAILED") {
                return new Response(JSON.stringify({
                    error: result.errorMessage || "Etiket alınamadı",
                    status: "FAILED",
                    auditId: result.auditId
                }), {
                    status: 502,
                    headers: { "Content-Type": "application/json" }
                });
            }

            if (result.status === "PENDING") {
                const sleepMs = (result.httpStatus === 556 || result.httpStatus === 429) ? 6000 : 3000;
                console.log(`[LABEL] Polling ${shipmentPackageId} (attempt ${attempt})...`);
                await new Promise(r => setTimeout(r, sleepMs));
                continue;
            }
        }

        // 3) Final Fallback (Timeout reached)
        const retryAfterSec = 3;
        const lastMsg = lastResult?.errorMessage || "Etiket hazırlanıyor...";

        if (isDocumentRequest(request)) {
            return new Response(pendingHtml(retryAfterSec, lastMsg), {
                status: 202,
                headers: {
                    "Content-Type": "text/html; charset=utf-8",
                    "Retry-After": String(retryAfterSec),
                },
            });
        }

        return new Response(JSON.stringify({
            status: "PENDING",
            message: lastMsg,
            auditId: lastResult?.auditId
        }), {
            status: 202,
            headers: {
                "Content-Type": "application/json",
                "Retry-After": String(retryAfterSec)
            }
        });

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
    <p class="muted" style="margin-top: 1rem; font-size: 0.8rem;">PDF oluşturulduğunda bu sayfa otomatik olarak açılacaktır.<br/>Lütfen bu sekmeyi kapatmayın.</p>
  </div>
</body>
</html>`;
}
