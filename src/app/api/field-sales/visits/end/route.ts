
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const session: any = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { visitId, location, notes, photos } = body;

        if (!visitId) return NextResponse.json({ error: 'Visit ID required' }, { status: 400 });

        const visit = await (prisma as any).salesVisit.findUnique({
            where: { id: visitId }
        });

        if (!visit) return NextResponse.json({ error: 'Visit not found' }, { status: 404 });
        if (visit.checkOutTime) return NextResponse.json({ success: true, message: 'Already checked out' });

        // Update Visit
        await (prisma as any).salesVisit.update({
            where: { id: visitId },
            data: {
                checkOutTime: new Date(),
                checkOutLocation: location || {},
                notes,
                photos: photos || []
            }
        });

        // Update Route Stop Status if linked
        if (visit.routeStopId) {
            await (prisma as any).routeStop.update({
                where: { id: visit.routeStopId },
                data: { status: 'VISITED' }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
