import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prepareRoutingSession, generateSupplierCandidatesForRFQ, buildRoutingWaves } from '@/services/network/routing/rfqRouting';
import { generateTradeMatchCandidates } from '@/services/network/routing/aiMatching';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: { rfqId: string } }) {
    try {
        const sessionAuth = await getSession();
        if (!sessionAuth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const tenantId = (sessionAuth as any).tenantId;
        if (!tenantId) return NextResponse.json({ error: 'No tenant context' }, { status: 400 });

        const body = await request.json();
        const categories = body.categories || [];

        // 1. Prepare Session
        let session = await prepareRoutingSession(params.rfqId, tenantId);

        if (session.status === 'DRAFT') {
            // 2. Generate and Score Candidates
            await generateSupplierCandidatesForRFQ(params.rfqId, tenantId, categories);

            // 3. Formulate Waves
            session = await buildRoutingWaves(session.id);
        }

        // Return candidates
        const candidates = await generateTradeMatchCandidates(params.rfqId, tenantId);

        return NextResponse.json({ success: true, session, candidates });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
