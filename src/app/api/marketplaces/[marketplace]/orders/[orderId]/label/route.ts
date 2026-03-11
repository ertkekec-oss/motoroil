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
                if (result.result?.fallbackData && result.result.fallbackData.cargoTrackingNumber) {
                     return respondWith(new Response(fallbackLabelHtml(result.result.fallbackData, result.errorMessage || ""), {
                         status: 200, headers: { "Content-Type": "text/html; charset=utf-8" }
                     }));
                }
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
    .card { max-width: 480px; padding: 2rem; border-radius: 1.5rem; background: rgba(30, 41, 59, 0.7);  border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
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
    .card { max-width: 800px; width: 90%; padding: 2rem; border-radius: 1.5rem; background: rgba(30, 41, 59, 0.7);  border: 1px solid rgba(239, 68, 68, 0.3); box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
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

function fallbackLabelHtml(fallbackData: any, errorMessage: string) {
    const orderNumber = fallbackData.orderNumber || fallbackData.id || "BİLİNMİYOR";
    const addressInfo = fallbackData.shipmentAddress || fallbackData.invoiceAddress || {};
    const fullName = addressInfo.fullName || (fallbackData.customerFirstName + " " + fallbackData.customerLastName) || "Alıcı Adı Yok";
    const fullAddress = addressInfo.fullAddress || [addressInfo.address1, addressInfo.address2, addressInfo.district, addressInfo.city].filter(Boolean).join(" ") || "Adres Bilgisi Yok";
    const providerName = fallbackData.cargoProviderName || "Kargo Firması Yok";
    const trackingNumber = fallbackData.cargoTrackingNumber || "";

    const linesHtml = Array.isArray(fallbackData.lines) ? fallbackData.lines.map((l: any) => `
        <tr>
            <td>
                <strong>${l.productName || 'Ürün'}</strong><br/>
                <span style="color: #666;">Renk: ${l.productColor || '-'} | Beden: ${l.productSize || '-'} | Stok Kodu: ${l.merchantSku || l.stockCode || '-'}</span>
            </td>
            <td>${l.quantity || 1} Adet</td>
            <td>${l.barcode || l.sku || '-'}</td>
        </tr>
    `).join("") : "<tr><td colspan='3'>Ürün detayı bulunamadı</td></tr>";

    return `<!doctype html>
<html lang="tr">
<head>
    <meta charset="utf-8">
    <title>Kargo Etiketi - ${orderNumber}</title>
    <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
    <style>
        @page { size: A4; margin: 0; }
        body { font-family: Arial, sans-serif; background: #e2e8f0; color: #000; padding: 20mm; margin: 0; display: flex; flex-direction: column; align-items: center; }
        .print-btn { padding: 12px 24px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer; display: inline-block; margin-bottom: 20px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .print-btn:hover { background: #1d4ed8; }
        .label-container { background: #fff; border: 2px solid #333; padding: 30px; width: 100%; max-width: 800px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); box-sizing: border-box; }
        .header { display: flex; justify-content: space-between; margin-bottom: 20px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
        .buyer-info { flex: 1.5; font-size: 15px; line-height: 1.6; padding-right: 20px; }
        .barcode-section { flex: 1; text-align: center; border-left: 2px solid #e2e8f0; padding-left: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        h3 { margin: 0 0 15px 0; font-size: 18px; font-weight: bold; color: #1e293b; text-transform: uppercase; }
        .info-row { display: flex; margin-bottom: 8px; }
        .info-label { width: 100px; font-weight: bold; flex-shrink: 0; }
        .info-value { flex-grow: 1; font-weight: 500; }
        .barcode-svg-container { background: white; padding: 10px; border: 1px dashed #cbd5e1; border-radius: 8px; margin-top: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
        th { background: #f8fafc; border-bottom: 2px solid #cbd5e1; padding: 12px; text-align: left; font-weight: bold; color: #475569; }
        td { border-bottom: 1px solid #e2e8f0; padding: 12px; vertical-align: top; }
        .error-footer { margin-top:30px; font-size: 11px; color: #64748b; text-align: center; padding: 10px; background: #f1f5f9; border-radius: 6px; border: 1px dashed #cbd5e1; }
        @media print { 
            body { background: white; padding: 0; align-items: flex-start; }
            .print-btn { display: none; } 
            .label-container { border: 2px solid #000; box-shadow: none; max-width: 100%; width: 100%; padding: 20px; border-radius: 0; page-break-inside: avoid; } 
        }
    </style>
</head>
<body>
    <button class="print-btn" onclick="window.print()">🖨️ A4 Olarak Yazdır</button>
    <div class="label-container">
        <div class="header">
            <div class="buyer-info">
                <h3>Kargo Alıcı Bilgileri</h3>
                <div class="info-row"><div class="info-label">Sipariş No</div><div class="info-value">: ${orderNumber}</div></div>
                <div class="info-row"><div class="info-label">Ad-Soyad</div><div class="info-value">: ${fullName}</div></div>
                <div class="info-row"><div class="info-label">Adres</div><div class="info-value">: ${fullAddress}</div></div>
            </div>
            <div class="barcode-section">
                <h3>Kargo Barkodu</h3>
                ${!trackingNumber ? '<div style="color:red;font-weight:bold;margin-top:20px;">Barkod Numarası Yok</div>' : `
                <div class="barcode-svg-container">
                    <svg id="barcode"></svg>
                </div>
                <div style="font-weight:bold; margin-top: 10px; font-size: 14px;">${providerName}</div>
                `}
            </div>
        </div>
        <div class="items">
            <h3>Sipariş İçeriği</h3>
            <table>
                <thead><tr><th>Ürün Bilgisi</th><th>Adet</th><th>Barkod</th></tr></thead>
                <tbody>
                    ${linesHtml}
                </tbody>
            </table>
        </div>
        <div class="error-footer">
            Bu etiket, kargo firması ZPL servisinde geçici bir arıza (${String(errorMessage).substring(0, 50)}) yaşandığı için Periodya Güvenlik Ağı tarafından A4 Fallback formatında otomatik oluşturulmuştur. Bu belgeyi yazdırıp paketinize yapıştırabilirsiniz.
        </div>
    </div>
    <script>
        if("${trackingNumber}") {
            JsBarcode("#barcode", "${trackingNumber}", {
                format: "CODE128",
                width: 2,
                height: 80,
                displayValue: true,
                fontSize: 18,
                fontOptions: "bold",
                textMargin: 8,
                margin: 0
            });
        }
        setTimeout(() => { window.print(); }, 500);
    </script>
</body>
</html>`;
}
