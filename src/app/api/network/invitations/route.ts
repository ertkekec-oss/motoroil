import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { sendConnectionInvite } from '@/services/network/engine/invitation';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const tenantId = (session as any).tenantId;
        if (!tenantId) return NextResponse.json({ error: 'No tenant context' }, { status: 400 });

        const { searchParams } = new URL(request.url);
        const direction = searchParams.get('direction') || 'received'; // 'sent' or 'received'

        const invitations = await prisma.networkConnectionInvite.findMany({
            where: direction === 'sent'
                ? { fromTenantId: tenantId }
                : { toTenantId: tenantId },
            include: {
                fromProfile: true,
                toProfile: true
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ success: true, count: invitations.length, invitations });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const tenantId = (session as any).tenantId;
        if (!tenantId) return NextResponse.json({ error: 'No tenant context' }, { status: 400 });

        const body = await request.json();
        const invite = await sendConnectionInvite(tenantId, body);

        return NextResponse.json({ success: true, invite });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
