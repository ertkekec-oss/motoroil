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
        const body = await req.json();
        const msg = await CounterpartyWorkflow.submitCounterOffer(id, tenantId, {
            price: body.price,
            quantity: body.quantity,
            message: body.message || 'Counter offer'
        });

        return NextResponse.json({ success: true, messageId: msg.id });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Failed to submit counter offer' }, { status: 500 });
    }
}
