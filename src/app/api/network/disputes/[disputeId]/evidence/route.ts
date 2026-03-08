import { NextResponse } from 'next/server';
import { getRequestContext, apiError } from '@/lib/api-context';
import { DisputeEvidenceService, AddEvidenceSchema } from '@/services/disputes';

export async function POST(req: Request, props: { params: Promise<{ disputeId: string }> }) {
    const params = await props.params;
    try {
        const { tenantId, userId } = await getRequestContext(req as any);
        const { disputeId } = params;
        const body = await req.json();
        const input = AddEvidenceSchema.parse(body);

        const evidence = await DisputeEvidenceService.addEvidence(tenantId, userId, disputeId, input);

        return NextResponse.json({ success: true, evidence });
    } catch (error) {
        return apiError(error);
    }
}
