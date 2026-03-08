import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { LiquidityEngine } from '@/services/network/liquidity/liquidityEngine';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const tenantId = (session as any).tenantId;
        if (!tenantId) return NextResponse.json({ error: 'No tenant context' }, { status: 400 });

        const { searchParams } = new URL(request.url);
        const refresh = searchParams.get('refresh') === 'true';

        // Integrate with the real Liquidity Engine
        if (refresh) {
            await Promise.all([
                LiquidityEngine.scanAndLogSupply(),
                LiquidityEngine.scanAndLogDemand()
            ]);
            // Generate matches
            await LiquidityEngine.processLiquidityMatches();
        }

        // Return real liquidity matches for the current tenant
        const matches = await prisma.networkLiquidityMatch.findMany({
            where: {
                OR: [
                    { buyerTenantId: tenantId },
                    { sellerTenantId: tenantId }
                ],
                status: 'CANDIDATE' // Only show new candidates
            },
            include: {
                opportunity: true
            },
            orderBy: { finalMatchScore: 'desc' },
            take: 20
        });

        // Resolve display names & map to dashboard expected shape
        const tenantIdsToFetch = Array.from(new Set(matches.flatMap(m => [m.buyerTenantId, m.sellerTenantId])));
        const identityMap = new Map();

        if (tenantIdsToFetch.length > 0) {
            const identities = await prisma.companyIdentity.findMany({
                where: { tenantId: { in: tenantIdsToFetch } },
                select: { tenantId: true, legalName: true }
            });
            identities.forEach(i => identityMap.set(i.tenantId, i.legalName));
        }

        const mappedOpps = matches.map(match => {
            const isBuyer = match.buyerTenantId === tenantId;
            const counterpartyId = isBuyer ? match.sellerTenantId : match.buyerTenantId;
            return {
                id: match.id, // Using Match ID for generating RFQs!
                signalType: match.opportunity?.opportunityType === 'SUPPLY_SURPLUS' ? 'OVERSTOCK' : 'HIGH_DEMAND',
                confidence: match.finalMatchScore,
                categoryId: match.categoryId || 'GENERAL',
                // Mocking the profile format the dashboard expects:
                supplierProfile: isBuyer ? { id: counterpartyId, displayName: identityMap.get(counterpartyId) || 'Unknown Supplier' } : null,
                buyerProfile: !isBuyer ? { id: counterpartyId, displayName: identityMap.get(counterpartyId) || 'Unknown Buyer' } : null,
            };
        });

        return NextResponse.json({ success: true, opportunities: mappedOpps });
    } catch (error: any) {
        console.error("[TradeOpportunities API Error]", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
