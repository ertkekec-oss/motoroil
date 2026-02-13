import { NextResponse } from 'next/server';
import { marketplaceQueue, marketplaceDlq } from '@/lib/queue';
import { redisConnection } from '@/lib/queue/redis';
import { authorize } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * POST /api/admin/marketplace/queue/replay
 * Replays a specific job from DLQ back to the main queue with guardrails
 */
export async function POST(request: Request) {
    try {
        const auth = await authorize();
        if (!auth.authorized) return auth.response;

        const role = (auth.user.role || "").toUpperCase();
        if (role !== "PLATFORM_ADMIN" && role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { dlqJobId, action, reason, companyId: targetCompanyId } = await request.json();

        // Safety: Global Read-Only Mode
        if (process.env.MARKETPLACE_OPS_READONLY === 'true') {
            return NextResponse.json({ error: "SİSTEM KORUMASI: Şu anda sadece okuma moduna izin verilmektedir (Outage Window)." }, { status: 503 });
        }

        if (action === "REPLAY_DLQ" && dlqJobId) {
            if (!reason || reason.length < 5) {
                return NextResponse.json({ error: 'Lütfen geçerli bir Replay sebebi girin (min 5 karakter).' }, { status: 400 });
            }

            const job = await marketplaceDlq.getJob(dlqJobId);
            if (!job) {
                return NextResponse.json({ error: 'Job not found in DLQ' }, { status: 404 });
            }

            const data = job.data;
            const idempotencyKey = data.input?.idempotencyKey;
            const jobCompanyId = data.input?.companyId;

            // Security Check
            if (targetCompanyId && jobCompanyId !== targetCompanyId) {
                return NextResponse.json({ error: 'Tenant Mismatch: Yetkisiz erişim.' }, { status: 403 });
            }

            // 1. Cooldown Check (60s)
            const coolKey = `replay_cooldown:${idempotencyKey}`;
            const isCooling = await (redisConnection as any).get(coolKey);
            if (isCooling) {
                return NextResponse.json({ error: 'Bu işlem için cooldown aktif. Lütfen 60 saniye bekleyin.' }, { status: 429 });
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
                            operator: auth.user.email,
                            reason: reason,
                            replayId,
                            verifiedCompanyId: jobCompanyId
                        }
                    }
                }
            });

            // 5. Remove from DLQ
            await job.remove();

            return NextResponse.json({
                success: true,
                message: `Action re-enqueued successfully. Tracking ID: ${replayId}`
            });
        }

        return NextResponse.json({ error: 'Invalid operation' }, { status: 400 });

    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
