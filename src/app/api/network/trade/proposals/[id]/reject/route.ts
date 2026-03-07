import { NextResponse } from 'next/server';
import { getRequestContext } from '@/lib/api-context';
import { CounterpartyWorkflow } from '@/services/network/tradeExecution/counterpartyWorkflow';

export async function POST(req: any, { params }: { params: { id: string } }) {
    const { tenantId } = await getRequestContext(req);
    const { id } = params;

    if (!tenantId) {
        return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
    }

    try {
        const { reason } = await req.json();
        const result = await CounterpartyWorkflow.rejectProposal(id, tenantId, reason || 'Manually rejected');

        return NextResponse.json({ success: true, ...result });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Failed to reject proposal' }, { status: 500 });
    }
}
