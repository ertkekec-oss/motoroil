import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { acceptConnectionInvite } from '@/services/network/engine/invitation';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: { inviteId: string } }) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const tenantId = (session as any).tenantId;
        if (!tenantId) return NextResponse.json({ error: 'No tenant context' }, { status: 400 });

        const result = await acceptConnectionInvite(tenantId, params.inviteId);

        return NextResponse.json({ success: true, result });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
