import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { discoverSuppliers } from '@/services/network/discovery/supplierDiscovery';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const tenantId = (session as any).tenantId;
        if (!tenantId) return NextResponse.json({ error: 'No tenant context' }, { status: 400 });

        const { searchParams } = new URL(request.url);
        const categoryId = searchParams.get('category') || undefined;
        const capabilityType = searchParams.get('type') as any;
        const minTrustScore = Number(searchParams.get('minScore')) || 0;
        const country = searchParams.get('country') || undefined;

        const suppliers = await discoverSuppliers(tenantId, {
            categoryId,
            capabilityType,
            minTrustScore,
            country,
            limit: 20
        });

        return NextResponse.json({ success: true, suppliers });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
