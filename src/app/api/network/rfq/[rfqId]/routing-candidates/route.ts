import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { generateTradeMatchCandidates } from '@/services/network/routing/aiMatching';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, props: { params: Promise<{ rfqId: string }> }) {
    const params = await props.params;
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const tenantId = (session as any).tenantId;
        if (!tenantId) return NextResponse.json({ error: 'No tenant context' }, { status: 400 });

        // Retrieve the routing session
        const rfqSession = await prisma.rFQRoutingSession.findUnique({
            where: { rfqId: params.rfqId },
            include: { waves: true }
        });

        if (!rfqSession || rfqSession.buyerTenantId !== tenantId) {
            return NextResponse.json({ error: 'Session not found or forbidden' }, { status: 403 });
        }

        const candidates = await generateTradeMatchCandidates(params.rfqId, tenantId);

        return NextResponse.json({ success: true, session: rfqSession, candidates });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
