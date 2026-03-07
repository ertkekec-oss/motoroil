import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { recommendCompaniesForTenant } from '@/services/network/recommendation/engine';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const tenantId = (session as any).tenantId;
        if (!tenantId) return NextResponse.json({ error: 'No tenant context' }, { status: 400 });

        const { searchParams } = new URL(request.url);
        const forceRefresh = searchParams.get('refresh') === 'true';

        let recs = [];

        if (forceRefresh) {
            await prisma.networkRecommendation.deleteMany({
                where: { viewerTenantId: tenantId }
            });
            recs = await recommendCompaniesForTenant(tenantId);
        } else {
            const dbRecs = await prisma.networkRecommendation.findMany({
                where: { viewerTenantId: tenantId },
                include: {
                    targetProfile: {
                        include: { trustScore: true, networkCapabilities: true }
                    }
                },
                orderBy: { score: 'desc' },
                take: 10
            });

            if (dbRecs.length === 0) {
                recs = await recommendCompaniesForTenant(tenantId);
            } else {
                recs = dbRecs;
            }
        }

        return NextResponse.json({ success: true, recommendations: recs });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
