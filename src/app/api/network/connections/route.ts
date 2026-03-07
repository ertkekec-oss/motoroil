import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { listTenantConnections } from '@/services/network/engine/relationship';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const tenantId = (session as any).tenantId;
        if (!tenantId) return NextResponse.json({ error: 'No tenant context' }, { status: 400 });

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') || undefined;
        const type = searchParams.get('type') || undefined;

        const connections = await listTenantConnections(tenantId, { status, type });

        return NextResponse.json({ success: true, count: connections.length, connections });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
