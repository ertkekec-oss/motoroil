import { NextResponse } from 'next/server';
import { getRequestContext, apiError } from '@/lib/api-context';
import { OpenDisputeSchema, DisputeService, DisputeProjection } from '@/services/disputes';
import prisma from '@/lib/prisma';


export async function POST(req: Request) {
    try {
        const { tenantId, userId } = await getRequestContext(req as any);
        const body = await req.json();
        const input = OpenDisputeSchema.parse(body);

        const dispute = await DisputeService.openDispute(tenantId, userId, input);

        return NextResponse.json({ success: true, dispute });
    } catch (error) {
        return apiError(error);
    }
}

export async function GET(req: Request) {
    try {
        const { tenantId } = await getRequestContext(req as any);

        // List disputes where tenant is either initiator or counterparty
        const disputes = await prisma.networkDispute.findMany({
            where: {
                OR: [
                    { openedByTenantId: tenantId },
                    { againstTenantId: tenantId }
                ]
            },
            orderBy: { createdAt: 'desc' },
            include: {
                evidences: true,
            }
        });

        const safeDisputes = disputes.map(d => DisputeProjection.projectForTenant(tenantId, d));

        return NextResponse.json({ success: true, disputes: safeDisputes });
    } catch (error) {
        return apiError(error);
    }
}

