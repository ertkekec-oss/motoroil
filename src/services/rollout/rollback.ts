import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function mutatePolicyPause(adminUserId: string, tenantId: string, flagField: 'payoutPaused' | 'escrowPaused' | 'boostPaused', actionName: string) {
    const policy = await prisma.tenantRolloutPolicy.findUnique({ where: { tenantId } });
    if (policy && policy[flagField]) {
        return { success: true, policy, message: 'Already paused' }; // idempotent no-op
    }

    const updated = await prisma.tenantRolloutPolicy.upsert({
        where: { tenantId },
        update: { [flagField]: true },
        create: { tenantId, [flagField]: true }
    });

    await prisma.financeOpsLog.create({
        data: {
             action: actionName,
             entityType: 'TenantRolloutPolicy',
             entityId: updated.id,
             severity: 'WARNING',
             payloadJson: { adminUserId, tenantId, [flagField]: true }
        }
    });

    await prisma.financeOpsLog.create({
        data: {
             action: actionName + '_AUDIT',
             entityType: 'Tenant',
             entityId: tenantId,
             severity: 'WARNING',
             payloadJson: { adminUserId, [flagField]: true }
        }
    });

    return { success: true, policy: updated };
}

export async function pauseEscrow(adminUserId: string, tenantId: string) {
    return mutatePolicyPause(adminUserId, tenantId, 'escrowPaused', 'TENANT_ESCROW_PAUSED');
}

export async function pausePayout(adminUserId: string, tenantId: string) {
    return mutatePolicyPause(adminUserId, tenantId, 'payoutPaused', 'TENANT_PAYOUT_PAUSED');
}

export async function pauseBoost(adminUserId: string, tenantId: string) {
    return mutatePolicyPause(adminUserId, tenantId, 'boostPaused', 'TENANT_BOOST_PAUSED');
}

export async function resumeAll(adminUserId: string, tenantId: string) {
    const policy = await prisma.tenantRolloutPolicy.findUnique({ where: { tenantId } });
    if (policy && !policy.payoutPaused && !policy.escrowPaused && !policy.boostPaused) {
        return { success: true, policy, message: 'Already active' }; // idempotent no-op
    }

    const updated = await prisma.tenantRolloutPolicy.upsert({
        where: { tenantId },
        update: { payoutPaused: false, escrowPaused: false, boostPaused: false },
        create: { tenantId, payoutPaused: false, escrowPaused: false, boostPaused: false }
    });

    await prisma.financeOpsLog.create({
        data: {
             action: 'TENANT_RESUMED_ALL',
             entityType: 'TenantRolloutPolicy',
             entityId: updated.id,
             severity: 'INFO',
             payloadJson: { adminUserId, tenantId }
        }
    });
    
    await prisma.financeOpsLog.create({
        data: {
             action: 'TENANT_RESUMED_ALL_AUDIT',
             entityType: 'Tenant',
             entityId: tenantId,
             severity: 'INFO',
             payloadJson: { adminUserId, resumed: true }
        }
    });

    return { success: true, policy: updated };
}
