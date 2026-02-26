import { PrismaClient } from '@prisma/client';
import { reconcileShippingInvoice } from './reconcile';
import { postShippingChargeback } from './postChargeback';

const prisma = new PrismaClient();

export async function runShippingReconcileCycle({
    batchSize = 50,
    now = new Date(),
} = {}) {
    const metrics = {
        invoicesProcessed: 0,
        matched: 0,
        unmatched: 0,
        multiMatch: 0,
        posted: 0,
        skippedAlreadyDone: 0,
        failed: 0,
    };

    // Find invoices that are PARSED or RECONCILING
    const invoices = await prisma.shippingInvoice.findMany({
        where: {
            status: { in: ['PARSED', 'RECONCILING'] },
        },
        take: batchSize,
        include: { lines: true },
    });

    for (const invoice of invoices) {
        try {
            // 1. Reconcile
            const reconcileResults = await reconcileShippingInvoice(invoice.id);
            metrics.matched += reconcileResults.matchedCount;
            metrics.unmatched += reconcileResults.unmatchedCount;
            metrics.multiMatch += reconcileResults.multiMatchCount;

            // 2. Fetch matched lines again to post chargeback
            const linesToPost = await prisma.shippingInvoiceLine.findMany({
                where: {
                    shippingInvoiceId: invoice.id,
                    matchStatus: 'MATCHED', // from RECONCILING it might already be MATCHED 
                },
            });

            // 3. Post chargeback
            for (const line of linesToPost) {
                try {
                    await postShippingChargeback(line.id);
                    metrics.posted++;
                } catch (error: any) {
                    if (error.message === 'ALREADY_SUCCEEDED') {
                        metrics.skippedAlreadyDone++;
                    } else {
                        metrics.failed++;
                        console.error(`Chargeback posting failed for line ${line.id}`, error);
                    }
                }
            }

            // 4. Update Invoice Status based on lines
            const statusCounts = await prisma.shippingInvoiceLine.groupBy({
                by: ['matchStatus'],
                where: { shippingInvoiceId: invoice.id },
                _count: true,
            });

            const counts = Object.fromEntries(statusCounts.map(s => [s.matchStatus, s._count]));
            const outOfPolicy = counts['OUT_OF_POLICY'] || 0;
            const disputed = counts['DISPUTED'] || 0;
            const multiMatch = counts['MULTI_MATCH'] || 0;
            const unmatched = counts['UNMATCHED'] || 0;

            let newStatus = invoice.status;
            if (outOfPolicy > 0 || disputed > 0) {
                newStatus = 'DISPUTED';
            } else if (unmatched > 0 || multiMatch > 0) {
                newStatus = 'PARTIALLY_RECONCILED';
            } else {
                newStatus = 'RECONCILED';
            }

            if (newStatus !== invoice.status) {
                await prisma.shippingInvoice.update({
                    where: { id: invoice.id },
                    data: { status: newStatus }
                });
            }

            metrics.invoicesProcessed++;

        } catch (err) {
            metrics.failed++;
            console.error(`Failed to reconcile invoice ${invoice.id}`, err);
        }
    }

    return metrics;
}
