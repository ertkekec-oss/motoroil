import { NextResponse } from 'next/server';
import { getRequestContext } from '@/lib/api-context';
import { GraphQueryEngine } from '@/services/network/graphQuery/graphQueryEngine';
import { TenantGraphProjection } from '@/services/network/graphQuery/projection/tenantGraphProjection';

export async function GET(req: any) {
    const { tenantId } = await getRequestContext(req);
    if (!tenantId) return NextResponse.json({ error: 'Tenant required' }, { status: 400 });

    try {
        const result = await GraphQueryEngine.runGraphQuery({
            tenantId,
            actorType: 'TENANT',
            queryType: 'NEIGHBORHOOD_LOOKUP',
            filters: {},
            requireExplain: true,
            preferCache: true,
            allowFallback: true
        });

        if (!result.success) throw new Error(result.error);

        return NextResponse.json(
            TenantGraphProjection.projectNeighborhoodSummary(result.results, result.explanation)
        );
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
