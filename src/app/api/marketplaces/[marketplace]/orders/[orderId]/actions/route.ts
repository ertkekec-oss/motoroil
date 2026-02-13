import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authorize } from "@/lib/auth";
import { ActionProviderRegistry } from "@/services/marketplaces/actions/registry";
import { isRedisHealthy } from "@/lib/queue";

export const runtime = "nodejs";

export async function POST(
    request: Request,
    { params }: { params: { marketplace: string; orderId: string } }
) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;

    const { marketplace, orderId } = await (params as any);

    try {
        // ============================================================================
        // 1. REDIS HEALTH CHECK
        // ============================================================================
        const redisHealthy = await isRedisHealthy();
        if (!redisHealthy) {
            console.error(JSON.stringify({
                event: 'redis_unavailable',
                timestamp: new Date().toISOString(),
                marketplace,
                orderId,
            }));
            return NextResponse.json(
                {
                    status: "FAILED",
                    errorMessage: "Queue service temporarily unavailable. Please try again later.",
                    code: "REDIS_UNAVAILABLE"
                },
                { status: 503 } // Service Unavailable
            );
        }

        // ============================================================================
        // 2. VALIDATE REQUEST BODY
        // ============================================================================
        let body: any;
        try {
            body = await request.json();
        } catch (e) {
            return NextResponse.json({ status: "FAILED", errorMessage: "Invalid JSON body", code: "INVALID_JSON" }, { status: 400 });
        }

        const { actionKey, idempotencyKey, payload } = body ?? {};

        if (!actionKey || !idempotencyKey) {
            return NextResponse.json(
                {
                    status: "FAILED",
                    errorMessage: "actionKey and idempotencyKey are required",
                    code: "MISSING_REQUIRED_FIELDS"
                },
                { status: 400 }
            );
        }

        // ============================================================================
        // 3. RESOLVE COMPANY
        // ============================================================================
        const company = await prisma.company.findFirst({
            where: { tenantId: auth.user.tenantId },
            select: { id: true, name: true },
        });

        if (!company) {
            return NextResponse.json({ status: "FAILED", errorMessage: "Company not found", code: "COMPANY_NOT_FOUND" }, { status: 403 });
        }

        // ============================================================================
        // 4. VALIDATE MARKETPLACE CONFIG
        // ============================================================================
        // IMPORTANT: Always use lowercased string for factory and registry
        const mplaceLower = marketplace.toLowerCase();
        const normalizedMarketplace = marketplace.charAt(0).toUpperCase() + marketplace.slice(1).toLowerCase();

        const config = await (prisma as any).marketplaceConfig.findFirst({
            where: {
                companyId: company.id,
                type: { in: [mplaceLower, normalizedMarketplace, marketplace] },
                deletedAt: null
            },
        });

        if (!config) {
            return NextResponse.json(
                {
                    status: "FAILED",
                    errorMessage: `Marketplace configuration not found for ${marketplace}.`,
                    code: "CONFIG_NOT_FOUND"
                },
                { status: 400 }
            );
        }

        // ============================================================================
        // 5. VALIDATE ORDER EXISTS
        // ============================================================================
        const order = await prisma.order.findFirst({
            where: { id: orderId, companyId: company.id },
            select: { id: true, shipmentPackageId: true, orderNumber: true },
        });

        if (!order) {
            return NextResponse.json({ status: "FAILED", errorMessage: "Order not found", code: "ORDER_NOT_FOUND" }, { status: 404 });
        }

        // ============================================================================
        // 6. VALIDATE/RESOLVE shipmentPackageId FOR LABEL/CARGO ACTIONS
        // ============================================================================
        // Trendyol needs shipmentPackageId for almost all operational actions.
        // If it's missing in DB, we attempt to 'Self-Heal' by fetching it from API.
        const requiresShipmentId = actionKey === 'PRINT_LABEL_A4' || actionKey === 'CHANGE_CARGO';

        let effectiveShipmentPackageId = order.shipmentPackageId || payload?.labelShipmentPackageId || payload?.shipmentPackageId;

        if (requiresShipmentId && !effectiveShipmentPackageId) {
            try {
                // IMPORTANT: Ensure mplaceLower is used to avoid factory crash
                const service = MarketplaceServiceFactory.createService(mplaceLower as any, config.settings);
                if (order.orderNumber) {
                    const mOrder = await (service as any).getOrderByNumber(order.orderNumber);
                    if (mOrder?.shipmentPackageId) {
                        effectiveShipmentPackageId = mOrder.shipmentPackageId;
                        await prisma.order.update({
                            where: { id: orderId },
                            data: { shipmentPackageId: effectiveShipmentPackageId }
                        });
                    }
                }
            } catch (healError: any) {
                console.error(`[ACTIONS] Healing Crash:`, healError.message);
            }
        }

        if (requiresShipmentId && !effectiveShipmentPackageId) {
            return NextResponse.json(
                {
                    status: "FAILED",
                    errorMessage: "E_ORDER_DATA_MISSING: shipmentPackageId bulunamadı. Lütfen önce 'Durum Yenile' yapın veya siparişi kargoya hazır hale getirin.",
                    code: "SHIPMENT_PACKAGE_ID_MISSING",
                    meta: { required: ["shipmentPackageId"] }
                },
                { status: 400 } // Controlled failure
            );
        }

        // ============================================================================
        // 7. EXECUTE ACTION
        // ============================================================================
        // Ensure the payload has the resolved shipment ID
        const finalPayload = {
            ...payload,
            shipmentPackageId: effectiveShipmentPackageId,
            labelShipmentPackageId: effectiveShipmentPackageId
        };
        let provider;
        try {
            provider = ActionProviderRegistry.getProvider(marketplace);
        } catch (registryError: any) {
            return NextResponse.json(
                {
                    status: "FAILED",
                    errorMessage: registryError.message || `Provider not found for ${marketplace}`,
                    code: "PROVIDER_NOT_FOUND"
                },
                { status: 400 }
            );
        }

        if (!provider) {
            return NextResponse.json(
                {
                    status: "FAILED",
                    errorMessage: "Marketplace provider instance is null",
                    code: "PROVIDER_NULL"
                },
                { status: 400 }
            );
        }

        const result = await provider.executeAction({
            companyId: company.id,
            marketplace: mplaceLower as any,
            orderId,
            actionKey,
            idempotencyKey,
            payload: finalPayload,
        });

        // ============================================================================
        // 8. STRUCTURED LOGGING
        // ============================================================================
        console.log(JSON.stringify({
            event: 'job_enqueued',
            timestamp: new Date().toISOString(),
            requestId: request.headers.get("x-request-id") || `req_${Date.now()}`,
            companyId: company.id,
            orderId,
            actionKey,
            idempotencyKey,
            auditId: result.auditId,
            user: auth.user.username,
            marketplace,
        }));

        // Return 202 Accepted for all queued actions
        return NextResponse.json(result, { status: 202 });

    } catch (error: any) {
        // ============================================================================
        // 9. GENERIC ERROR HANDLER (Last Resort)
        // ============================================================================
        console.error(JSON.stringify({
            event: 'marketplace_action_error',
            timestamp: new Date().toISOString(),
            error: error.message,
            stack: error.stack,
            marketplace,
            orderId,
        }));

        return NextResponse.json(
            {
                status: "FAILED",
                errorMessage: error?.message ?? "Internal server error",
                code: "INTERNAL_ERROR"
            },
            { status: 500 }
        );
    }
}
