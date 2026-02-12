import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authorize } from "@/lib/auth";
import { ActionProviderRegistry } from "@/services/marketplaces/actions/registry";

export const runtime = "nodejs";

export async function POST(
    request: Request,
    { params }: { params: { marketplace: string; orderId: string } }
) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;

    const { marketplace, orderId } = params;

    try {
        const body = await request.json();
        const { actionKey, idempotencyKey, payload } = body ?? {};

        if (!actionKey || !idempotencyKey) {
            return NextResponse.json(
                { status: "FAILED", errorMessage: "actionKey ve idempotencyKey gerekli" },
                { status: 400 }
            );
        }

        // ✅ companyId resolve (tenantId -> company)
        const company = await prisma.company.findFirst({
            where: { tenantId: auth.user.tenantId },
            select: { id: true },
        });

        if (!company) {
            return NextResponse.json({ status: "FAILED", errorMessage: "Firma bulunamadı" }, { status: 403 });
        }

        const provider = ActionProviderRegistry.getProvider(marketplace);

        const result = await provider.executeAction({
            companyId: company.id,
            marketplace: marketplace as any,
            orderId,
            actionKey,
            idempotencyKey,
            payload,
        });

        // 5) Hata Ayıklama İçin JSON Log
        console.log(JSON.stringify({
            level: "INFO",
            event: "MARKETPLACE_ACTION_TRIGGERED",
            requestId: request.headers.get("x-request-id") || `req_${Date.now()}`,
            companyId: company.id,
            orderId,
            actionKey,
            idempotencyKey,
            auditId: result.auditId,
            user: auth.user.username,
            timestamp: new Date().toISOString()
        }));

        // Return 202 for all queued actions
        return NextResponse.json(result, { status: 202 });
    } catch (error: any) {
        console.error(JSON.stringify({
            level: "ERROR",
            event: "MARKETPLACE_ACTION_ERROR",
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        }));
        return NextResponse.json(
            { status: "FAILED", errorMessage: error?.message ?? "Unknown error" },
            { status: 500 }
        );
    }
}
