import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class LiquidityProjection {
    static async getTenantOpportunities(tenantId: string) {
        return await prisma.networkLiquidityOpportunity.findMany({
            where: {
                OR: [
                    { supplyTenantId: tenantId },
                    { demandTenantId: tenantId }
                ]
            },
            orderBy: { createdAt: 'desc' },
            take: 20
        });
    }

    static async getTenantMatches(tenantId: string) {
        return await prisma.networkLiquidityMatch.findMany({
            where: {
                OR: [
                    { buyerTenantId: tenantId },
                    { sellerTenantId: tenantId }
                ]
            },
            include: { opportunity: true },
            orderBy: { finalMatchScore: 'desc' },
            take: 50
        });
    }

    static async getCategorySnapshots() {
        return await prisma.networkLiquiditySnapshot.findMany({
            orderBy: { createdAt: 'desc' },
            take: 50
        });
    }
}
