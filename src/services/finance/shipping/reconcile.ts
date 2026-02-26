import { PrismaClient, Prisma } from '@prisma/client';
import { ReconcileError } from './errors';

const prisma = new PrismaClient();

function normalizeTracking(trackingNo: string): string {
    return trackingNo.trim().replace(/[^a-zA-Z0-9]/g, '');
}

export async function reconcileShippingInvoice(invoiceId: string) {
    const invoice = await prisma.shippingInvoice.findUnique({
        where: { id: invoiceId },
        include: { lines: true },
    });

    if (!invoice) {
        throw new ReconcileError(`Invoice ${invoiceId} not found`);
    }

    let matchedCount = 0;
    let unmatchedCount = 0;
    let multiMatchCount = 0;

    for (const line of invoice.lines) {
        if (line.matchStatus !== 'UNMATCHED' && line.matchStatus !== 'MULTI_MATCH') {
            continue;
        }

        const { trackingNo } = line;

        // 1. Exact match attempt
        let shipments = await prisma.shipment.findMany({
            where: { trackingNumber: trackingNo, carrierCode: invoice.carrierId },
            include: { order: true },
        });

        let matchReason = 'EXACT_MATCH';

        // 2. Fallback normalized match
        if (shipments.length === 0) {
            const normalizedTrack = normalizeTracking(trackingNo);
            shipments = await prisma.shipment.findMany({
                where: { normalizedTracking: normalizedTrack, carrierCode: invoice.carrierId },
                include: { order: true },
            });
            matchReason = 'NORMALIZED_MATCH';
        }

        if (shipments.length === 1) {
            const shipment = shipments[0];
            const orderCurrency = shipment.order.currency || 'TRY';

            if (orderCurrency !== invoice.currency) {
                await prisma.shippingInvoiceLine.update({
                    where: { id: line.id },
                    data: {
                        matchStatus: 'OUT_OF_POLICY',
                        matchReason: `Currency mismatch: order=${orderCurrency}, invoice=${invoice.currency}`,
                        shipmentId: shipment.id,
                        networkOrderId: shipment.networkOrderId,
                        sellerTenantId: shipment.order.sellerCompanyId,
                        buyerTenantId: shipment.order.buyerCompanyId,
                    },
                });
                unmatchedCount++;
            } else {
                await prisma.shippingInvoiceLine.update({
                    where: { id: line.id },
                    data: {
                        matchStatus: 'MATCHED',
                        matchReason,
                        shipmentId: shipment.id,
                        networkOrderId: shipment.networkOrderId,
                        sellerTenantId: shipment.order.sellerCompanyId,
                        buyerTenantId: shipment.order.buyerCompanyId,
                    },
                });
                matchedCount++;
            }
        } else if (shipments.length > 1) {
            await prisma.shippingInvoiceLine.update({
                where: { id: line.id },
                data: {
                    matchStatus: 'MULTI_MATCH',
                    matchReason: `Matched ${shipments.length} shipments`,
                },
            });
            multiMatchCount++;
        } else {
            unmatchedCount++;
        }
    }

    // We don't update invoice status here directly to RECONCILED. It's handled by worker.
    // However, if we're parsing for the first time, we can set it to RECONCILING
    if (invoice.status === 'PARSED') {
        await prisma.shippingInvoice.update({
            where: { id: invoiceId },
            data: { status: 'RECONCILING' },
        });
    }

    return { matchedCount, unmatchedCount, multiMatchCount };
}
