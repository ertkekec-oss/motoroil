import prisma from "@/lib/prisma";
import { authorize } from "@/lib/auth";
import { ActionProviderRegistry } from "@/services/marketplaces/actions/registry";

export const runtime = "nodejs";

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
                const { getLabelSignedUrl } = await import("@/lib/s3");
                const signedUrl = await getLabelSignedUrl(existingAudit.responsePayload.storageKey);
                return Response.redirect(signedUrl, 302);
            }
            if (existingAudit.status === 'PENDING') {
                return new Response(JSON.stringify({
                    status: "PENDING",
                    message: "Etiket hazırlanıyor (Mevcut İşlem)...",
                    auditId: existingAudit.id
                }), { status: 202, headers: { "Content-Type": "application/json" } });
            }
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

        // Handle Async/Processing
        return new Response(JSON.stringify({
            status: "PENDING",
            message: "Etiket hazırlanıyor...",
            auditId: result.auditId
        }), { status: 202, headers: { "Content-Type": "application/json" } });

    } catch (error: any) {
        console.error(`[LABEL_CRITICAL_ERROR]`, error);
        return new Response(JSON.stringify({
            error: error?.message ?? "Unknown error",
            stack: error?.stack
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
