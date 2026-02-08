
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session: any = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const body = await req.json();
        const { customerId } = body;

        if (!customerId) return NextResponse.json({ error: 'Customer ID required' }, { status: 400 });

        // Get current max sequence
        const lastStop = await (prisma as any).routeStop.findFirst({
            where: { routeId: id },
            orderBy: { sequence: 'desc' }
        });
        const nextSeq = (lastStop?.sequence || 0) + 1;

        // Check if customer already in route
        const existing = await (prisma as any).routeStop.findFirst({
            where: { routeId: id, customerId }
        });
        if (existing) {
            return NextResponse.json({ error: 'Customer already in route' }, { status: 400 });
        }

        const stop = await (prisma as any).routeStop.create({
            data: {
                routeId: id,
                customerId,
                sequence: nextSeq,
                status: 'PENDING'
            },
            include: {
                customer: { select: { id: true, name: true, city: true, district: true } }
            }
        });

        return NextResponse.json(stop);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
