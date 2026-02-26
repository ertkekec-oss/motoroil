import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// In-memory cache could be used here for HIGH performance, but per prompt DB is fine for simplicity.
export async function isFeatureEnabled(params: { tenantId: string; key: string }): Promise<boolean> {
    const { tenantId, key } = params;

    const tenantFlag = await prisma.tenantFeatureFlag.findUnique({
        where: {
            tenantId_featureKey: { tenantId, featureKey: key }
        }
    });

    if (tenantFlag) return tenantFlag.enabled;

    const globalFlag = await prisma.featureFlag.findUnique({
        where: { key }
    });

    if (globalFlag) return globalFlag.defaultValue;

    // Hard fallback if not seeded
    if (key === 'CHARGEBACK_AUTO_DEDUCT') return true;
    return false; // Default off for safety (ESCROW, BOOST, DYNAMIC_RELEASE, PILOT_MODE)
}

export async function setTenantFeature(params: { adminUserId: string; tenantId: string; key: string; enabled: boolean }) {
    const { adminUserId, tenantId, key, enabled } = params;

    const flg = await prisma.tenantFeatureFlag.upsert({
        where: { tenantId_featureKey: { tenantId, featureKey: key } },
        update: { enabled },
        create: { tenantId, featureKey: key, enabled }
    });

    await prisma.financeOpsLog.create({
        data: {
             action: 'TENANT_FEATURE_UPDATED',
             entityType: 'TenantFeatureFlag',
             entityId: flg.id,
             severity: 'INFO',
             payloadJson: { adminUserId, tenantId, key, enabled }
        }
    });

    return { success: true, flag: flg };
}

export async function seedDefaultFeatureFlags() {
    const defaults = [
        { key: 'ESCROW_ENABLED', defaultValue: false, description: 'Allows receiving via Escrow flow' },
        { key: 'BOOST_ENABLED', defaultValue: false, description: 'Allows sponsored listings' },
        { key: 'DYNAMIC_RELEASE_ENABLED', defaultValue: false, description: 'Allows trust-score dynamic release deductions' },
        { key: 'CHARGEBACK_AUTO_DEDUCT', defaultValue: true, description: 'Auto subtract chargeback receivables from payouts' },
        { key: 'PILOT_MODE', defaultValue: false, description: 'Tenant is in pilot' }
    ];

    for (const d of defaults) {
        await prisma.featureFlag.upsert({
             where: { key: d.key },
             update: {}, // don't mutate if exists
             create: d
        });
    }
}
