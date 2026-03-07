import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { generateTradeOpportunities } from '@/services/network/inventory/opportunityEngine';
import { detectOverstockSignals } from '@/services/network/inventory/overstockDetection';
import { detectStockoutSignals } from '@/services/network/inventory/stockoutDetection';
import { detectDemandSignals } from '@/services/network/inventory/demandSignal';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const tenantId = (session as any).tenantId;
        if (!tenantId) return NextResponse.json({ error: 'No tenant context' }, { status: 400 });

        const profile = await prisma.networkCompanyProfile.findUnique({
            where: { tenantId }
        });

        if (!profile) return NextResponse.json({ success: true, opportunities: [] });

        const { searchParams } = new URL(request.url);
        const refresh = searchParams.get('refresh') === 'true';

        // Background Job Simulation: For real-time sync requests
        if (refresh) {
            // Signal recalculation before generating opps
            await Promise.all([
                detectOverstockSignals(tenantId),
                detectStockoutSignals(tenantId),
                detectDemandSignals(tenantId)
            ]);
            await generateTradeOpportunities();
        }

        // Return opportunities where user is BUYER or SUPPLIER
        const opps = await prisma.networkTradeOpportunity.findMany({
            where: {
                OR: [
                    { buyerProfileId: profile.id },
                    { supplierProfileId: profile.id }
                ]
            },
            include: {
                supplierProfile: { include: { trustScore: true } },
                buyerProfile: { include: { trustScore: true } }
            },
            orderBy: { opportunityScore: 'desc' },
            take: 20
        });

        return NextResponse.json({ success: true, opportunities: opps });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
