import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getOrCreateNetworkProfile, updateNetworkProfile } from '@/services/network/engine/profile';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const tenantId = (session as any).tenantId;
        if (!tenantId) return NextResponse.json({ error: 'No tenant context' }, { status: 400 });

        const profile = await getOrCreateNetworkProfile(tenantId);
        return NextResponse.json({ success: true, profile });
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
        const updated = await updateNetworkProfile(tenantId, body);

        return NextResponse.json({ success: true, profile: updated });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
