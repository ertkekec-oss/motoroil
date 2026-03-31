import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { marketplaceQueue } from '@/lib/queue';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 300;

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        
        if (
            process.env.CRON_SECRET &&
            authHeader !== `Bearer ${process.env.CRON_SECRET}`
        ) {
            return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
        }

        // Bypass security extensions since this is an automated system job
        process.env.PRISMA_BYPASS_EXTENSION = "true";

        // Find orders delivered within the last 30 days
        const limitDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const ordersToSync = await prisma.order.findMany({
            where: {
                marketplace: { in: ['Trendyol', 'trendyol', 'Hepsiburada', 'hepsiburada', 'N11', 'n11'] },
                status: { in: ['Teslim Edildi', 'Delivered'] },
                orderDate: { gte: limitDaysAgo }
            },
            select: { id: true, companyId: true, marketplace: true, orderNumber: true },
        });

        if (!ordersToSync || ordersToSync.length === 0) {
            return NextResponse.json({ ok: true, message: 'Senkronize edilecek yeni siparis yok.' });
        }

        let queuedCount = 0;
        let skippedCount = 0;

        for (const order of ordersToSync) {
            const idempotencyKey = `SYNC_SETTLEMENT_${order.id}`;

            // Check if this action was already successfully executed to save Redis/Queue bloat
            const existingAudit = await prisma.marketplaceActionAudit.findUnique({
                where: { idempotencyKey }
            });

            if (existingAudit && existingAudit.status === 'SUCCESS') {
                skippedCount++;
                continue;
            }

            // Bulk push to queue gracefully
            await marketplaceQueue.add('SYNC_SETTLEMENT', {
                companyId: order.companyId,
                marketplace: order.marketplace.toLowerCase() as 'trendyol' | 'hepsiburada' | 'n11',
                orderId: order.id,
                actionKey: 'SYNC_SETTLEMENT',
                idempotencyKey,
                payload: { orderNumber: order.orderNumber }
            }, {
                jobId: idempotencyKey,
                attempts: 3,
                backoff: { type: 'exponential', delay: 5000 }
            });

            queuedCount++;
        }

        return NextResponse.json({ 
            ok: true, 
            message: `Scheduler Triggered: ${queuedCount} queued, ${skippedCount} skipped.`,
            processed: ordersToSync.length, 
            queued: queuedCount, 
            skipped: skippedCount 
        });

    } catch (e: any) {
        console.error('Marketplace Settlement Cron Error:', e);
        return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
    }
}
