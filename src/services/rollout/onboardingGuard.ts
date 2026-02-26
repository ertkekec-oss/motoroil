import { PrismaClient } from '@prisma/client';
import { isFeatureEnabled, setTenantFeature } from './featureFlags';

const prisma = new PrismaClient();

export async function activatePilotSubMerchant(params: {
    adminUserId: string;
    tenantId: string;
}) {
    const { adminUserId, tenantId } = params;

    // 1. Verify requirements
    const payoutDest = await prisma.payoutDestination.findFirst({
         where: { tenantId, status: 'VERIFIED' }
    });
    if (!payoutDest) throw new Error('Payout destination not verified');

    let policy = await prisma.tenantRolloutPolicy.findUnique({
        where: { tenantId }
    });

    if (!policy) {
         policy = await prisma.tenantRolloutPolicy.create({
              data: { tenantId, cohort: 'PILOT' }
         });
    } else if (policy.cohort !== 'PILOT') {
         policy = await prisma.tenantRolloutPolicy.update({
             where: { tenantId },
             data: { cohort: 'PILOT' }
         });
    }

    const escrowGlobal = await isFeatureEnabled({ tenantId, key: 'ESCROW_ENABLED' });
    if (!escrowGlobal) {
         await setTenantFeature({ adminUserId, tenantId, key: 'ESCROW_ENABLED', enabled: true });
    }

    // 2. Set defaults
    await setTenantFeature({ adminUserId, tenantId, key: 'PILOT_MODE', enabled: true });

    // Ensure +3 days hold for pilot unless overridden
    if (policy.holdDaysOverride == null) {
        await prisma.tenantRolloutPolicy.update({
             where: { tenantId },
             data: { holdDaysOverride: 3, earlyReleaseAllowed: false }
        });
    }

    await prisma.financeOpsLog.create({
        data: {
             action: 'TENANT_PILOT_ACTIVATED',
             entityType: 'Tenant',
             entityId: tenantId,
             severity: 'INFO',
             payloadJson: { adminUserId, cohort: 'PILOT', holdDaysOverride: policy.holdDaysOverride ?? 3 }
        }
    });

    return { success: true, policy };
}
