
import { NextRequest, NextResponse } from 'next/server';
import { logUpsellEvent } from '@/lib/upsell-engine';
import { getRequestContext } from '@/lib/api-context';

export async function POST(req: NextRequest) {
    try {
        const ctx = await getRequestContext(req);
        const body = await req.json();

        const { type, source, targetPlanId, payload, converted } = body;

        // If it's a conversion log, we find the last event and mark as converted or create new
        // For simplicity, let's just create a new record for each event.

        await logUpsellEvent({
            tenantId: ctx.tenantId,
            type,
            source,
            targetPlanId,
            payload: { ...payload, converted: converted || false }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
