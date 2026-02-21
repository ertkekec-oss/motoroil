
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const session: any = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Find Staff linked to this user
        const staff = await (prisma as any).staff.findFirst({
            where: {
                OR: [
                    { email: session.user.email },
                    { username: session.user.username || session.user.email }
                ]
            }
        });

        if (!staff) {
            return NextResponse.json({ visits: [] });
        }

        const visits = await (prisma as any).salesVisit.findMany({
            where: {
                staffId: staff.id
            },
            include: {
                customer: { select: { id: true, name: true } },
                orders: { select: { id: true, total: true } }
            },
            orderBy: {
                checkInTime: 'desc'
            },
            take: 50
        });

        return NextResponse.json({ visits });
    } catch (error: any) {
        console.error('Field visits API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
