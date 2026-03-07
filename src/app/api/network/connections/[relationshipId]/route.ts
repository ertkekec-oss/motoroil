import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getConnectionDetails } from '@/services/network/engine/relationship';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { relationshipId: string } }) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const tenantId = (session as any).tenantId;
        if (!tenantId) return NextResponse.json({ error: 'No tenant context' }, { status: 400 });

        const connection = await getConnectionDetails(tenantId, params.relationshipId);

        return NextResponse.json({ success: true, connection });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 404 });
    }
}
