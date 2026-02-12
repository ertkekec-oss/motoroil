import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { marketplaceQueue } from "@/lib/queue";

export async function GET(request: Request) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;

    // RBAC: Sadece sistem yöneticileri erişebilir
    const role = auth.user.role?.toUpperCase() || "";
    if (role !== "PLATFORM_ADMIN" && role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const marketplace = url.searchParams.get("marketplace");

    try {
        const audits = await (prisma as any).marketplaceActionAudit.findMany({
            where: {
                ...(status ? { status } : {}),
                ...(marketplace ? { marketplace } : {}),
            },
            orderBy: { createdAt: "desc" },
            take: 50,
        });

        // Also get queue stats
        const [waiting, active, failed, completed] = await Promise.all([
            marketplaceQueue.getWaitingCount(),
            marketplaceQueue.getActiveCount(),
            marketplaceQueue.getFailedCount(),
            marketplaceQueue.getCompletedCount()
        ]);

        // Threshold-based Alerting Logic
        const { logger } = await import("@/lib/observability");
        if (waiting > 20) {
            logger.alert(`Queue Backlog High: ${waiting} jobs waiting`, { alertType: 'QUEUE_BACKLOG', size: waiting });
        }

        return NextResponse.json({
            audits,
            stats: { waiting, active, failed, completed }
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;

    // RBAC: Sadece sistem yöneticileri operasyon yapabilir
    const role = auth.user.role?.toUpperCase() || "";
    if (role !== "PLATFORM_ADMIN" && role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const { action, auditId } = await request.json();

        const audit = await (prisma as any).marketplaceActionAudit.findUnique({
            where: { id: auditId }
        });

        if (!audit) return NextResponse.json({ error: "Audit not found" }, { status: 404 });

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

            return NextResponse.json({ success: true, message: "Job re-enqueued" });
        }

        if (action === "UNLOCK") {
            await (prisma as any).marketplaceActionAudit.update({
                where: { id: auditId },
                data: { lockExpiresAt: new Date(0), status: "FAILED", errorMessage: "Force unlocked by admin" }
            });
            return NextResponse.json({ success: true, message: "Job unlocked" });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
