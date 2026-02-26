import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function meterDiscoveryRequest(params: {
    requestId: string;
}) {
    const { requestId } = params;

    return prisma.$transaction(async (tx) => {
        // 1. Ensure we haven't metered the entire request yet
        const existingState = await tx.discoveryRequestBillingState.findUnique({
            where: { requestId }
        });

        if (existingState?.meteredAt) {
            return { success: true, message: 'Already metered' };
        }

        const allImpressions = await tx.discoveryImpression.findMany({
            where: { requestId },
            include: { listing: true }
        });
        
        const impressions = allImpressions.filter(imp => {
            const reason: any = typeof imp.reasonJson === 'string' ? JSON.parse(imp.reasonJson) : imp.reasonJson;
            return reason?.isSponsored === true;
        });

        if (impressions.length === 0) {
            // Nothing to meter, but mark as processed
            await tx.discoveryRequestBillingState.upsert({
                 where: { requestId },
                 update: { meteredAt: new Date() },
                 create: { requestId, meteredAt: new Date() }
            });
            return { success: true, count: 0 };
        }

        // 3. Group by sellerTenantId
        const tenantCounts: Record<string, number> = {};
        for (const imp of impressions) {
            const sellerTenantId = imp.listing?.sellerCompanyId;
            if (!sellerTenantId) continue;
            tenantCounts[sellerTenantId] = (tenantCounts[sellerTenantId] || 0) + 1;
        }

        // 4. Update usage quotas
        for (const [tenantId, count] of Object.entries(tenantCounts)) {
             const sampleDate = impressions[0].createdAt || new Date();
             sampleDate.setUTCHours(sampleDate.getUTCHours() + 3);
             const dayStr = sampleDate.toISOString().split('T')[0];
             const periodKey = `${sampleDate.getUTCFullYear()}-${String(sampleDate.getUTCMonth()+1).padStart(2,'0')}`;

             // Check idempotency event
             const ev = await tx.boostUsageEvent.findUnique({
                  where: { requestId_sellerTenantId: { requestId, sellerTenantId: tenantId } }
             });

             if (ev) continue; // safety net if state was partially written

             // Insert Event
             await tx.boostUsageEvent.create({
                  data: {
                       requestId,
                       sellerTenantId: tenantId,
                       day: dayStr,
                       sponsoredImpressions: count
                  }
             });

             // Upsert Daily Table
             await tx.boostUsageDaily.upsert({
                  where: { sellerTenantId_day: { sellerTenantId: tenantId, day: dayStr } },
                  update: {
                       sponsoredImpressions: { increment: count },
                       billableImpressions: { increment: count }
                  },
                  create: {
                       sellerTenantId: tenantId,
                       day: dayStr,
                       sponsoredImpressions: count,
                       billableImpressions: count,
                       periodKey
                  }
             });
        }

        // 5. Mark request complete
        await tx.discoveryRequestBillingState.upsert({
            where: { requestId },
            update: { meteredAt: new Date() },
            create: { requestId, meteredAt: new Date() }
       });

       await tx.financeOpsLog.create({
           data: {
                action: 'BOOST_METERED',
                entityType: 'DiscoveryRequest',
                entityId: requestId,
                severity: 'INFO',
                payloadJson: { requestId, tenantCounts }
           }
       });

        return { success: true, tenantCounts };
    });
}
