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

    const { marketplace, orderId } = params;

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
        const body = await request.json();
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
            select: { id: true },
        });

        if (!company) {
            console.error(`[ACTIONS] Company not found for tenantId: ${auth.user.tenantId}`);
            return NextResponse.json(
                {
                    status: "FAILED",
                    errorMessage: "Company not found",
                    code: "COMPANY_NOT_FOUND"
                },
                { status: 403 }
            );
        }

        // ============================================================================
        // 4. VALIDATE MARKETPLACE CONFIG
        // ============================================================================
        // Case-insensitive lookup or handle naming mismatch (Trendyol vs trendyol)
        const normalizedMarketplace = marketplace.charAt(0).toUpperCase() + marketplace.slice(1).toLowerCase(); // trendyol -> Trendyol

        const config = await (prisma as any).marketplaceConfig.findFirst({
            where: {
                companyId: company.id,
                type: { in: [marketplace, normalizedMarketplace, marketplace.toLowerCase()] }
            },
        });

        if (!config) {
            console.warn(`[ACTIONS] Marketplace config not found for ${marketplace} (Company: ${company.id})`);
            return NextResponse.json(
                {
                    status: "FAILED",
                    errorMessage: `Marketplace configuration not found for ${marketplace}. Please connect your account first.`,
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
            select: { id: true, shipmentPackageId: true, marketplace: true },
        });

        if (!order) {
            console.warn(`[ACTIONS] Order not found: ${orderId} (Company: ${company.id})`);
            return NextResponse.json(
                {
                    status: "FAILED",
                    errorMessage: "Order not found",
                    code: "ORDER_NOT_FOUND"
                },
                { status: 404 }
            );
        }

        // ============================================================================
        // 6. VALIDATE shipmentPackageId FOR LABEL/CARGO ACTIONS
        // ============================================================================
        const requiresShipmentId = actionKey === 'PRINT_LABEL_A4' || actionKey === 'CHANGE_CARGO';
        if (requiresShipmentId && !order.shipmentPackageId && !payload?.labelShipmentPackageId && !payload?.shipmentPackageId) {
            return NextResponse.json(
                {
                    status: "FAILED",
                    errorMessage: "shipmentPackageId is required for this action. Please refresh order status first.",
                    code: "SHIPMENT_PACKAGE_ID_MISSING",
                    hint: "Click 'Refresh Status' button to fetch shipmentPackageId from marketplace"
                },
                { status: 409 } // Conflict - order exists but missing required field
            );
        }

        // ============================================================================
        // 7. EXECUTE ACTION
        // ============================================================================
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
            marketplace: marketplace as any,
            orderId,
            actionKey,
            idempotencyKey,
            payload,
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
