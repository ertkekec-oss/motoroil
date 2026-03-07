import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getRoutingPolicyForTenant, upsertRoutingPolicy, resolveEffectiveRoutingPolicy } from '@/services/network/routing/policy';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const tenantId = (session as any).tenantId;
        if (!tenantId) return NextResponse.json({ error: 'No tenant context' }, { status: 400 });

        const policy = await resolveEffectiveRoutingPolicy(tenantId);
        return NextResponse.json({ success: true, policy });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const tenantId = (session as any).tenantId;
        if (!tenantId) return NextResponse.json({ error: 'No tenant context' }, { status: 400 });

        const body = await request.json();
        const policy = await upsertRoutingPolicy(tenantId, body);

        return NextResponse.json({ success: true, policy });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
