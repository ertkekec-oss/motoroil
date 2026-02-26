import { PrismaClient, SellerRiskTier } from '@prisma/client';

const prisma = new PrismaClient();

export async function resolveDynamicReleasePolicy(sellerTenantId: string) {
    const defaultHoldDays = 14; // the hardcoded policy default

    const score = await prisma.sellerTrustScore.findUnique({
        where: { sellerTenantId }
    });

    let holdDays = defaultHoldDays;

    if (score) {
        switch (score.tier) {
            case 'A': holdDays = Math.max(0, defaultHoldDays - 7); break;
            case 'B': holdDays = Math.max(0, defaultHoldDays - 3); break;
            case 'C': holdDays = defaultHoldDays; break;
            case 'D': holdDays = defaultHoldDays + 7; break;
        }
    }

    return { holdDays, tierAplicable: score?.tier || 'UNKNOWN' };
}

export function resolveEarlyReleaseFeeRate(tier: SellerRiskTier | undefined): number {
    switch (tier) {
        case 'A': return 0.005; // 0.5%
        case 'B': return 0.01;  // 1%
        case 'C': return 0.02;  // 2%
        case 'D': return 0.04;  // 4%
        default: return 0.02;   // Default to C risk
    }
}
