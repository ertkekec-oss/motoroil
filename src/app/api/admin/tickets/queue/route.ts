import { NextRequest, NextResponse } from 'next/server';
import { requireTicketAccess } from '../../../../../services/tickets/guards';
import { PrismaClient, TicketPriority, TicketType } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    try {
        const { isPlatformAdmin } = await requireTicketAccess(req);

        if (!isPlatformAdmin) {
            return NextResponse.json({ error: 'Auth failed' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const priority = searchParams.get('priority') as TicketPriority | null;
        const type = searchParams.get('type') as TicketType | null;

        const where: any = {
            status: { in: ['OPEN', 'IN_PROGRESS', 'SLA_BREACH'] }
        };

        if (priority) where.priority = priority;
        if (type) where.type = type;

        const tickets = await prisma.ticket.findMany({
            where,
            orderBy: [
                { slaDueAt: 'asc' }
            ],
            include: {
                tenant: { select: { id: true } }
            }
        });

        // Simple manual sort to ensure SLA_BREACH is universally top
        const sorted = tickets.sort((a, b) => {
            if (a.status === 'SLA_BREACH' && b.status !== 'SLA_BREACH') return -1;
            if (b.status === 'SLA_BREACH' && a.status !== 'SLA_BREACH') return 1;
            return 0; // fallback to prisma's SLA date order
        });

        return NextResponse.json({ data: sorted });
    } catch (e: any) {
        if (e.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Auth failed' }, { status: 403 });
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
