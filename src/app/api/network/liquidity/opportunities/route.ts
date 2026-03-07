import { NextResponse } from 'next/server';
import { getRequestContext } from '@/lib/api-context';
import { LiquidityProjection } from '@/services/network/liquidity/liquidityProjection';

export async function GET(req: any) {
    const { tenantId, role } = await getRequestContext(req);

    if (!tenantId) {
        return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
    }

    try {
        const opportunities = await LiquidityProjection.getTenantOpportunities(tenantId);
        return NextResponse.json({ success: true, count: opportunities.length, opportunities });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Failed to fetch opportunities' }, { status: 500 });
    }
}
