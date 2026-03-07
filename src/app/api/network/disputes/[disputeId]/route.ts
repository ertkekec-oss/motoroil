import { NextResponse } from 'next/server';
import { getRequestContext, apiError } from '@/lib/api-context';
import { DisputeProjection, DisputeTimelineService } from '@/services/disputes';
import prisma from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: { disputeId: string } }) {
    try {
        const { tenantId } = await getRequestContext(req as any);
        const { disputeId } = params;

        const dispute = await prisma.networkDispute.findUnique({
            where: { id: disputeId },
            include: {
                evidences: true,
            }
        });

        if (!dispute) {
            return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
        }

        const projectedDispute = DisputeProjection.projectForTenant(tenantId, dispute);

        if (!projectedDispute) {
            return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 });
        }

        // Optionally get timeline events if it's the detail view
        const timeline = await DisputeTimelineService.buildUnifiedTimeline(disputeId);

        // We might want to filter timeline events for tenants (e.g. admin notes)
        // For now returning the blended timeline, which is primarily internal. 
        // In production, we'd further project timeline events.

        return NextResponse.json({
            success: true,
            dispute: projectedDispute,
            timeline
        });
    } catch (error) {
        return apiError(error);
    }
}
