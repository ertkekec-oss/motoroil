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

        // ✅ companyId resolve from auth session
        const companyId = auth.user.companyId;
        if (!companyId) return new Response(JSON.stringify({ error: "Firma bağlamı bulunamadı" }), { status: 403 });

        const idempotencyKey = `LABEL_V4_${format}:${companyId}:${marketplace}:${shipmentPackageId}`;
        const ctx = `[LABEL:${marketplace}][IDEMP:${idempotencyKey}]`;
        // Helper: Respond and Log
        const respondWith = (res: Response) => {
            console.info(`${ctx} responding status=${res.status}`);
            return res;
        };

        const respondWithSuccess = async (storageKey: string) => {
            try {
                const b64 = await redisConnection.get(`LABEL_CACHE:${storageKey}`);
                if (b64) {
                    const buf = Buffer.from(b64, 'base64');
                    if (isDocumentRequest(request)) {
                        return respondWith(new Response(buf, {
                            status: 200,
                            headers: {
                                "Content-Type": "application/pdf",
                                "Content-Disposition": `inline; filename="${storageKey.split('/').pop() || 'label.pdf'}"`,
                                "Cache-Control": "no-cache, no-store, must-revalidate",
                                "Pragma": "no-cache",
                                "Expires": "0"
                            }
                        }));
                    }
                    return respondWith(new Response(JSON.stringify({ status: "READY", pdfBase64: b64 }), {
                        status: 200,
                        headers: { "Content-Type": "application/json" }
                    }));
                }
            } catch (ex) {
                console.warn(`${ctx} Redis Cache read failed:`, ex);
            }

            const { getLabelSignedUrl } = await import("@/lib/s3");
            try {
                const signedUrl = await getLabelSignedUrl(storageKey);

                if (isDocumentRequest(request)) {
                    return respondWith(Response.redirect(signedUrl, 303));
                }

                return respondWith(new Response(JSON.stringify({ status: "READY", url: signedUrl }), {
                    status: 200,
                    headers: { "Content-Type": "application/json" }
                }));
            } catch (s3Err: any) {
                console.error(`${ctx} S3 Signed URL generation failed:`, s3Err);
                if (isDocumentRequest(request)) {
                    return respondWith(new Response(errorHtml(`Redis Cache'te bulunamadı ve S3 kimlik bilgileri eksik olduğu için etiket dosyası gösterilemiyor.\n\nSistem Hatası: ${s3Err.message}`), {
                        status: 500, headers: { "Content-Type": "text/html; charset=utf-8" }
                    }));
                }
                return respondWith(new Response(JSON.stringify({ error: "Depolama hatası", detail: s3Err.message, status: "FAILED" }), { status: 500 }));
            }
        };

        // 1) Fast Path: Check existing state
        const existingLabel = await (prisma as any).marketplaceLabel.findUnique({
            where: { companyId_marketplace_shipmentPackageId: { companyId: companyId, marketplace, shipmentPackageId } }
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
            companyId: companyId,
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

            if (isDocumentRequest(request)) {
                return respondWith(new Response(errorHtml(result.errorMessage || "Etiket alınamadı"), {
                    status, headers: { "Content-Type": "text/html; charset=utf-8" }
                }));
            }

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
    <p class="muted" style="margin-top: 1.5rem; font-size: 0.8rem;">Etiket oluşturulduğunda bu sayfa otomatik olarak açılacaktır.<br/>Lütfen bu sekmeyi kapatmayın.</p>
  </div>
</body>
</html>`;
}

function errorHtml(message: string) {
    return `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Etiket Sistem Hatası</title>
  <style>
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto; padding: 0; margin: 0; background: #0f172a; color: white; display: flex; align-items: center; justify-content: center; min-height: 100vh; text-align: center; }
    .card { max-width: 800px; width: 90%; padding: 2rem; border-radius: 1.5rem; background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(239, 68, 68, 0.3); box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
    h2 { font-size: 1.7rem; margin-bottom: 0.5rem; font-weight: 600; color: #ef4444; }
    .muted { color: #94a3b8; font-size: 0.95rem; line-height: 1.5; margin-bottom: 1.5rem; }
    .debug-box { background: rgba(0,0,0,0.5); padding: 1.5rem; border-radius: 1rem; text-align: left; overflow-x: auto; border: 1px solid rgba(255,255,255,0.05); }
    pre { margin: 0; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 0.85rem; color: #34d399; white-space: pre-wrap; word-break: break-all; }
  </style>
</head>
<body>
  <div class="card">
    <svg style="width: 48px; height: 48px; color: #ef4444; margin: 0 auto 1.5rem;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
    <h2>İşlem Başarısız</h2>
    <p class="muted">Etiket çekilirken Trendyol sistemi tarafından bir hata döndürüldü. İnceleme için raw log aşağıdadır:</p>
    
    <div class="debug-box">
      <pre>${String(message).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
    </div>

    <button onclick="window.close()" style="margin-top: 2rem; background: #334155; border: none; color: white; padding: 0.75rem 2rem; border-radius: 0.5rem; cursor: pointer; font-size: 1rem; transition: background 0.2s;">
        Sekmeyi Kapat
    </button>
  </div>
</body>
</html>`;
}
