import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { redisConnection } from '@/lib/queue/redis';
import { shipmentSyncQueue } from '@/queues/shipmentQueue';

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        // Require Bearer token for admin endpoints
        const adminToken = process.env.ADMIN_TOKEN || process.env.CRON_SECRET;

        if (adminToken && authHeader !== `Bearer ${adminToken}`) {
            return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
        }

        const components: any = {};
        const warnings: string[] = [];
        let isOk = true;

        // 1. Database Check (Connection Engine)
        try {
            await prisma.$queryRaw`SELECT 1`;
            components.db = { status: 'up' };
        } catch (e: any) {
            components.db = { status: 'down', error: e.message };
            isOk = false;
        }

        // 2. Prisma Migrations Drift Guard
        try {
            // Check latest applied migration
            const latestMigration: any = await prisma.$queryRaw`
                SELECT migration_name, finished_at 
                FROM "_prisma_migrations" 
                ORDER BY finished_at DESC NULLS LAST 
                LIMIT 1
            `;
            if (latestMigration && latestMigration.length > 0) {
                components.migrations = { status: 'synced', latest: latestMigration[0].migration_name };
            } else {
                components.migrations = { status: 'unknown', warning: 'No migrations found or shadow DB in use' };
            }
        } catch (e: any) {
            components.migrations = { status: 'drift_potential', error: e.message };
            warnings.push('Could not verify migration table. Schema drift potential.');
            // We do not fail the whole ok=false because this might be a fresh dev env without _prisma_migrations created yet.
        }

        // 3. Redis Ping Check
        try {
            const pingResult = await redisConnection.ping();
            if (pingResult === 'PONG') {
                components.redis = { status: 'up' };
            } else {
                throw new Error(`Unexpected ping response: ${pingResult}`);
            }
        } catch (e: any) {
            components.redis = { status: 'down', error: e.message };
            isOk = false; // Redis is critical for queues, rate limit etc.
        }

        // 4. BullMQ Queue Stats
        try {
            const counts = await shipmentSyncQueue.getJobCounts('wait', 'active', 'completed', 'failed', 'delayed');
            components.queue = { status: 'online', name: shipmentSyncQueue.name, counts };

            // Drift detection on Queue: If active or waiting count is unusually huge over delayed/completed, warning.
            if ((counts.wait + counts.active) > 1000) {
                warnings.push(`High queue backlog detected: ${counts.wait + counts.active}`);
            }
        } catch (e: any) {
            components.queue = { status: 'down', error: e.message };
            warnings.push('BullMQ Queue stats unavailable.');
            // Assuming fallback logic does not completely fail system, but it's severe
            isOk = false;
        }

        // 5. Recent System Activity (Last 15 minutes payout released event check)
        try {
            const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
            // Instead of raw text logs, we check PayoutEventInbox or Ledger or NetworkPayment
            const recentRelease = await prisma.networkPayment.findFirst({
                where: {
                    payoutStatus: 'RELEASED',
                    releasedAt: { gte: fifteenMinsAgo }
                },
                select: { id: true, releasedAt: true }
            });

            const recentOrdersCount = await prisma.networkOrder.count({
                where: {
                    createdAt: { gte: fifteenMinsAgo }
                }
            });

            components.activity = {
                recentOrderTraffic: recentOrdersCount > 0,
                recentPayoutReleased: !!recentRelease
            };

            if (!recentRelease && recentOrdersCount > 0) {
                // Lots of orders but no payouts in last 15 min could be normal late at night, or a warning
                warnings.push('Recent network order activity is high, but no escrow payouts processed in last 15 minutes.');
            }

        } catch (e: any) {
            components.activity = { status: 'unknown' };
        }

        // Ultimate Status
        return NextResponse.json(
            {
                ok: isOk,
                timestamp: new Date().toISOString(),
                warnings,
                components
            },
            { status: isOk ? 200 : 503 }
        );

    } catch (e: any) {
        console.error('System Health Check Error:', e);
        return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
    }
}
