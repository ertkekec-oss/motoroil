import prisma from "../../../../lib/prisma";
import {
    MarketplaceActionInput,
    MarketplaceActionProvider,
    MarketplaceActionResult,
} from "../types";
import { marketplaceQueue } from "../../../../lib/queue";

export class TrendyolActionProvider implements MarketplaceActionProvider {
    async executeAction(input: MarketplaceActionInput): Promise<MarketplaceActionResult> {
        const { companyId, marketplace, orderId, actionKey, idempotencyKey, payload } = input;

        // Correlation Context
        const ctx = `[ACTION:${actionKey}][IDEMP:${idempotencyKey}]`;
        const LOCK_DURATION_MS = 60000; // 60 seconds

        // 1) Find existing audit
        const existing = await (prisma as any).marketplaceActionAudit.findUnique({
            where: { idempotencyKey },
        });

        if (existing) {
            if (existing.status === "SUCCESS") {
                console.log(`${ctx} Idempotency hit: SUCCESS`);
                return { status: "SUCCESS", auditId: existing.id, result: existing.responsePayload };
            }

            const now = new Date();
            const isLockExpired = existing.lockExpiresAt && new Date(existing.lockExpiresAt) < now;

            if (existing.status === "PENDING" && !isLockExpired) {
                console.log(`${ctx} Idempotency hit: PENDING (Active Lock)`);
                return { status: "PENDING", auditId: existing.id };
            }

            if (isLockExpired) {
                console.log(`${ctx} Lock EXPIRED. Stealing/Resetting...`);
                // We fall through to the update/upsert logic below to "steal" the lock
            }
        }

        // 2) Atomic Lock & Enqueue (Winner Takes All)
        const lockExpiresAt = new Date(Date.now() + LOCK_DURATION_MS);

        let audit: any;
        try {
            // If expired or new, upsert to become the new winner
            audit = await (prisma as any).marketplaceActionAudit.upsert({
                where: { idempotencyKey },
                update: {
                    status: "PENDING",
                    lockExpiresAt,
                    errorMessage: null
                },
                create: {
                    companyId,
                    marketplace,
                    orderId,
                    actionKey,
                    idempotencyKey,
                    status: "PENDING",
                    lockExpiresAt,
                    requestPayload: payload ?? undefined,
                },
            });

            console.log(`${ctx} Lock acquired. Enqueueing job...`);

            // 3) Enqueue Background Job
            const job = await marketplaceQueue.add(`${marketplace}:${actionKey}`, input, {
                jobId: idempotencyKey, // Ensure one job per idempotency key in the queue
            });

            // Update audit with jobId
            await (prisma as any).marketplaceActionAudit.update({
                where: { id: audit.id },
                data: { jobId: job.id }
            });

            return { status: "PENDING", auditId: audit.id };

        } catch (err: any) {
            // Unique constraint fail (P2002) - Someone else just won the race
            if (err.code === 'P2002') {
                const winner = await (prisma as any).marketplaceActionAudit.findUnique({ where: { idempotencyKey } });
                console.log(`${ctx} Race lost. Returning status: ${winner?.status}`);
                return { status: winner?.status || "PENDING", auditId: winner?.id! };
            }
            console.error(`${ctx} Error:`, err.message);
            return { status: "FAILED", auditId: audit?.id || 'unknown', errorMessage: err.message };
        }
    }
}
