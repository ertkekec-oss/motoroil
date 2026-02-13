import { NextRequest } from 'next/server';
import { marketplaceQueue, marketplaceDlq } from '@/lib/queue';
import { redisConnection } from '@/lib/queue/redis';
import { getRequestContext, apiResponse, apiError } from '@/lib/api-context';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/marketplace/queue/replay
 * Replays a specific job from DLQ back to the main queue with guardrails
 */
export async function POST(req: NextRequest) {
    let ctx;
    try {
        ctx = await getRequestContext(req);

        const role = (ctx.role || "").toUpperCase();
        if (role !== "PLATFORM_ADMIN" && role !== "SUPER_ADMIN") {
            return apiError({ message: 'Unauthorized', status: 403, code: 'FORBIDDEN' }, ctx.requestId);
        }

        const { dlqJobId, action, reason, companyId: targetCompanyId } = await req.json();

        // Safety: Global Read-Only Mode
        if (process.env.MARKETPLACE_OPS_READONLY === 'true') {
            return apiError({ message: "SİSTEM KORUMASI: Şu anda sadece okuma moduna izin verilmektedir (Outage Window).", status: 503, code: 'READ_ONLY' }, ctx.requestId);
        }

        if (action === "REPLAY_DLQ" && dlqJobId) {
            if (!reason || reason.length < 5) {
                return apiError({ message: 'Lütfen geçerli bir Replay sebebi girin (min 5 karakter).', status: 400, code: 'BAD_REQUEST' }, ctx.requestId);
            }

            const job = await marketplaceDlq.getJob(dlqJobId);
            if (!job) {
                return apiError({ message: 'Job not found in DLQ', status: 404, code: 'NOT_FOUND' }, ctx.requestId);
            }

            const data = job.data;
            const idempotencyKey = data.input?.idempotencyKey;
            const jobCompanyId = data.input?.companyId;

            // Security Check
            if (targetCompanyId && jobCompanyId !== targetCompanyId) {
                return apiError({ message: 'Tenant Mismatch: Yetkisiz erişim.', status: 403, code: 'FORBIDDEN' }, ctx.requestId);
            }

            // 1. Cooldown Check (60s)
            const coolKey = `replay_cooldown:${idempotencyKey}`;
            const isCooling = await (redisConnection as any).get(coolKey);
            if (isCooling) {
                return apiError({ message: 'Bu işlem için cooldown aktif. Lütfen 60 saniye bekleyin.', status: 429, code: 'TOO_MANY_REQUESTS' }, ctx.requestId);
            }

            // 2. Replay Action
            const replayId = `replay:${idempotencyKey}:${Date.now()}`;
            await marketplaceQueue.add(job.name.replace('dead:', ''), data.input, {
                jobId: replayId
            });

            // 3. Set Cooldown
            await (redisConnection as any).set(coolKey, "1", "EX", 60);

            // 4. Update Audit with Replay Info
            await (prisma as any).marketplaceActionAudit.update({
                where: { idempotencyKey },
                data: {
                    status: 'PENDING',
                    errorMessage: null,
                    errorCode: null,
                    failureHistory: {
                        push: {
                            timestamp: new Date().toISOString(),
                            event: 'MANUAL_REPLAY',
                            operator: ctx.username || 'System',
                            reason: reason,
                            replayId,
                            verifiedCompanyId: jobCompanyId || null
                        }
                    }
                }
            });

            // 5. Remove from DLQ
            await job.remove();

            return apiResponse({
                success: true,
                message: `Action re-enqueued successfully. Tracking ID: ${replayId}`
            }, { requestId: ctx.requestId });
        }

        return apiError({ message: 'Invalid operation', status: 400, code: 'BAD_REQUEST' }, ctx.requestId);

    } catch (error: any) {
        return apiError(error, ctx?.requestId);
    }
}

