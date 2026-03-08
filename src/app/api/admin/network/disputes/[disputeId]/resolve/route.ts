import { NextResponse } from 'next/server';
import { getRequestContext, apiError } from '@/lib/api-context';
import { DisputeResolutionEngine, ResolveDisputeSchema } from '@/services/disputes';

export async function POST(req: Request, props: { params: Promise<{ disputeId: string }> }) {
    const params = await props.params;
    try {
        const { userId } = await getRequestContext(req as any);
        const { disputeId } = params;
        const body = await req.json();
        const input = ResolveDisputeSchema.parse(body);

        const resolution = await DisputeResolutionEngine.resolveDispute(userId, disputeId, input);

        return NextResponse.json({ success: true, resolution });
    } catch (error) {
        return apiError(error);
    }
}
