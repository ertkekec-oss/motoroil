
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session: any = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const body = await req.json();
        const { stops } = body; // stops: { customerId: string, sequence: number }[]

        if (!Array.isArray(stops)) {
            return NextResponse.json({ error: 'Invalid stops data' }, { status: 400 });
        }

        // Verify route belongs to company (simplified for now as in existing field-sales routes)
        const route = await (prisma as any).route.findUnique({
            where: { id }
        });

        if (!route) {
            return NextResponse.json({ error: 'Route not found' }, { status: 404 });
        }

        // Create stops
        const createdStops = await Promise.all(
            stops.map(stop =>
                (prisma as any).routeStop.create({
                    data: {
                        routeId: id,
                        customerId: stop.customerId,
                        sequence: stop.sequence,
                        status: 'PENDING'
                    }
                })
            )
        );

        return NextResponse.json({ success: true, count: createdStops.length });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
