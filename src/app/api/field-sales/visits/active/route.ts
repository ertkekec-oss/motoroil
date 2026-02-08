
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const session: any = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Find Staff
        let staff = await (prisma as any).staff.findFirst({
            where: {
                OR: [
                    { email: session.user.email },
                    { username: session.user.username || session.user.email }
                ]
            }
        });

        if (!staff && session.tenantId === 'PLATFORM_ADMIN') {
            // Admin Test Mode: Use first available staff
            staff = await (prisma as any).staff.findFirst();
        }

        if (!staff) return NextResponse.json({ activeVisit: null });

        const activeVisit = await (prisma as any).salesVisit.findFirst({
            where: {
                staffId: staff.id,
                checkOutTime: null
            },
            include: {
                customer: { select: { id: true, name: true } },
                stop: { select: { id: true, sequence: true } }
            }
        });

        return NextResponse.json({ activeVisit });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
