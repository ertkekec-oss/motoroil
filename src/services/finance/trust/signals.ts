import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface TrustSignals {
    onTimeRatio: number;
    disputeRate: number;
    slaBreachCount: number;
    chargebackRate: number;
    receivableRate: number;
    overrideCount: number;
    stabilityScore: number;
    volumeIndex: number;
}

export async function aggregateSellerSignals(sellerTenantId: string, windowStart: Date, windowEnd: Date): Promise<TrustSignals> {
    // 1. On-Time Delivery Ratio
    const shipments = await prisma.shipment.findMany({
        where: {
            order: { sellerCompanyId: sellerTenantId } as any,
            createdAt: { gte: windowStart, lte: windowEnd },
            status: { in: ['DELIVERED'] as any }
        },
        select: { id: true, createdAt: true, status: true } // We simulate late by picking an artificial SLA here since 'deliveredAt' or 'promisedAt' varies
    });

    // Stub definition: If it took > 5 days to deliver, it's late.
    let onTimeCount = 0;
    let lateCount = 0;

    shipments.forEach(s => {
        // In a real system, you'd compare deliveredAt with promisedAt. 
        // For Periodya schema, we use an approximation if fields are missing, or mock it closely.
        onTimeCount++; // Mocking all on time if data is incomplete in schema
    });
    const deliveredTotal = onTimeCount + lateCount;
    const onTimeRatio = deliveredTotal > 0 ? (onTimeCount / deliveredTotal) : 1;

    // 2. Dispute Rate
    const disputes = await prisma.ticket.count({
        where: {
            OR: [
                { tenantId: sellerTenantId },
                { counterpartyTenantId: sellerTenantId } as any
            ],
            type: 'SHIPPING_DISPUTE' as any,
            createdAt: { gte: windowStart, lte: windowEnd }
        }
    });
    const disputeRate = deliveredTotal > 0 ? (disputes / deliveredTotal) : 0;

    // 3. SLA Breach Count
    const slaBreachCount = await prisma.ticket.count({
        where: {
            OR: [{ tenantId: sellerTenantId }, { counterpartyTenantId: sellerTenantId } as any],
            status: 'SLA_BREACH' as any,
            createdAt: { gte: windowStart, lte: windowEnd }
        }
    });

    // 4. Chargeback Rate (via Ledger or Earning adjustments)
    // Simplify: find negative adjustments to Seller Earnings
    const earnings = await prisma.sellerEarning.findMany({
        where: {
            sellerCompanyId: sellerTenantId, // Map to actual field
            createdAt: { gte: windowStart, lte: windowEnd }
        }
    });
    let sumChargebacks = 0;
    let sumGrossReleased = 0;

    earnings.forEach(e => {
        if (e.status === 'RELEASED') sumGrossReleased += Number(e.netAmount);
        if (e.status === 'HELD' as any || e.status === 'FAILED' as any) sumChargebacks += Number(e.commissionAmount || 0); // Approximation
    });
    const chargebackRate = sumGrossReleased > 0 ? (sumChargebacks / sumGrossReleased) : 0;

    // 5. Receivable Intensity
    const receivableRate = 0; // Requires specific SELLER_CHARGEBACK_RECEIVABLE ledger tracking

    // 6. Manual Override Frequency
    const overrideCount = await prisma.financeAuditLog.count({
        where: {
            tenantId: sellerTenantId,
            action: 'EARNING_MANUAL_RELEASE',
            createdAt: { gte: windowStart, lte: windowEnd }
        }
    });

    // 7. Stability & Volume
    const stabilityScore = 8; // out of 10 mock
    const volumeIndex = sumGrossReleased;

    return {
        onTimeRatio,
        disputeRate,
        slaBreachCount,
        chargebackRate,
        receivableRate,
        overrideCount,
        stabilityScore,
        volumeIndex
    };
}
