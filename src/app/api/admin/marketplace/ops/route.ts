import { NextRequest } from "next/server";
import { getRequestContext, apiResponse, apiError } from "@/lib/api-context";
import prisma from "@/lib/prisma";
import { marketplaceQueue, marketplaceDlq } from "@/lib/queue";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    let ctx;
    try {
        ctx = await getRequestContext(req);

        // RBAC: Sadece sistem yöneticileri erişebilir
        const role = (ctx.role || "").toUpperCase();
        if (role !== "PLATFORM_ADMIN" && role !== "SUPER_ADMIN") {
            return apiError({ message: "Unauthorized", status: 403, code: 'FORBIDDEN' }, ctx.requestId);
        }

        const url = new URL(req.url);
        const status = url.searchParams.get("status");
        const marketplace = url.searchParams.get("marketplace");

        const audits = await (prisma as any).marketplaceActionAudit.findMany({
            where: {
                ...(status ? { status } : {}),
                ...(marketplace ? { marketplace } : {}),
            },
            orderBy: { createdAt: "desc" },
            take: 50,
        });

        // Also get queue stats
        const [waiting, active, failed, completed, dlq] = await Promise.all([
            marketplaceQueue.getWaitingCount(),
            marketplaceQueue.getActiveCount(),
            marketplaceQueue.getFailedCount(),
            marketplaceQueue.getCompletedCount(),
            marketplaceDlq.getJobs(['waiting', 'active', 'failed', 'completed', 'delayed']).then(j => j.length)
        ]);

        return apiResponse({
            audits,
            stats: { waiting, active, failed, completed, dlq }
        }, { requestId: ctx.requestId });
    } catch (error: any) {
        return apiError(error, ctx?.requestId);
    }
}

export async function POST(req: NextRequest) {
    let ctx;
    try {
        ctx = await getRequestContext(req);

        // RBAC: Sadece sistem yöneticileri operasyon yapabilir
        const role = ctx.role?.toUpperCase() || "";
        if (role !== "PLATFORM_ADMIN" && role !== "SUPER_ADMIN") {
            return apiError({ message: "Unauthorized", status: 403, code: 'FORBIDDEN' }, ctx.requestId);
        }

        const { action, auditId } = await req.json();

        // Safety: Global Read-Only Mode
        if (process.env.MARKETPLACE_OPS_READONLY === 'true') {
            return apiError({ message: "SİSTEM KORUMASI: Şu anda sadece okuma moduna izin verilmektedir (Outage Window).", status: 503, code: 'READ_ONLY' }, ctx.requestId);
        }

        const audit = await (prisma as any).marketplaceActionAudit.findUnique({
            where: { id: auditId }
        });

        if (!audit) return apiError({ message: "Audit not found", status: 404, code: 'NOT_FOUND' }, ctx.requestId);

        if (action === "RETRY") {
            // Re-enqueue the job using the same idempotency key as jobId
            await marketplaceQueue.add(`${audit.marketplace}:${audit.actionKey}`, audit.requestPayload, {
                jobId: audit.idempotencyKey,
                attempts: 3
            });

            await (prisma as any).marketplaceActionAudit.update({
                where: { id: auditId },
                data: { status: "PENDING", errorMessage: null, lockExpiresAt: new Date(Date.now() + 60000) }
            });

            return apiResponse({ success: true, message: "Job re-enqueued" }, { requestId: ctx.requestId });
        }

        if (action === "UNLOCK") {
            await (prisma as any).marketplaceActionAudit.update({
                where: { id: auditId },
                data: { lockExpiresAt: new Date(0), status: "FAILED", errorMessage: "Force unlocked by admin" }
            });
            return apiResponse({ success: true, message: "Job unlocked" }, { requestId: ctx.requestId });
        }

        return apiError({ message: "Invalid action", status: 400, code: 'BAD_REQUEST' }, ctx.requestId);

    } catch (error: any) {
        return apiError(error, ctx?.requestId);
    }
}

