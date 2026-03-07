import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const tenantId = (session as any).tenantId;
        if (!tenantId) return NextResponse.json({ error: 'No tenant context' }, { status: 400 });

        const opportunity = await prisma.networkTradeOpportunity.findUnique({
            where: { id: params.id },
            include: {
                supplierProfile: { include: { trustScore: true } },
                buyerProfile: { include: { trustScore: true } }
            }
        });

        if (!opportunity) {
            return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
        }

        // Is this tenant involved?
        if (opportunity.supplierProfile.tenantId !== tenantId && opportunity.buyerProfile.tenantId !== tenantId) {
            return NextResponse.json({ error: 'Unauthorized bounds' }, { status: 403 });
        }

        return NextResponse.json({ success: true, opportunity });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
