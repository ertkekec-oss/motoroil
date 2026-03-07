import { NextResponse } from 'next/server';
import { getRequestContext } from '@/lib/api-context';
import { CounterpartyWorkflow } from '@/services/network/tradeExecution/counterpartyWorkflow';
import { ProposalConversion } from '@/services/network/tradeExecution/proposalConversion';

export async function POST(req: any, { params }: { params: { id: string } }) {
    const { tenantId } = await getRequestContext(req);
    const { id } = params;

    if (!tenantId) {
        return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
    }

    try {
        const result = await CounterpartyWorkflow.acceptProposal(id, tenantId);

        // Auto-convert to order upon acceptance
        const execution = await ProposalConversion.convertProposalToOrder(id);

        return NextResponse.json({ success: true, ...result, execution });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Failed to accept proposal' }, { status: 500 });
    }
}
