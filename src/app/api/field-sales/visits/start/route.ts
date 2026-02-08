
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const session: any = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { routeStopId, customerId, location } = body;

        if (!customerId) return NextResponse.json({ error: 'Customer ID required' }, { status: 400 });

        // 1. Find Staff
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

        if (!staff) {
            return NextResponse.json({ error: 'Personel kaydı bulunamadı.' }, { status: 403 });
        }

        // 2. Check for active visit
        const activeVisit = await (prisma as any).salesVisit.findFirst({
            where: {
                staffId: staff.id,
                checkOutTime: null
            },
            include: { customer: { select: { name: true } } }
        });

        if (activeVisit) {
            return NextResponse.json({
                error: `Zaten aktif bir ziyaretiniz var: ${activeVisit.customer?.name}`,
                activeVisitId: activeVisit.id
            }, { status: 409 });
        }

        // Resolve Company ID
        // Resolve Company ID (Platform Admin Support)
        let company;
        if (session.tenantId === 'PLATFORM_ADMIN') {
            company = await (prisma as any).company.findFirst();
        } else {
            company = await (prisma as any).company.findFirst({
                where: { tenantId: session.tenantId }
            });
        }
        if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

        // 3. Create Visit
        const visit = await (prisma as any).salesVisit.create({
            data: {
                companyId: company.id,
                staffId: staff.id,
                customerId,
                routeStopId,
                checkInTime: new Date(),
                checkInLocation: location || {},
                isOutOfRange: false // TODO: GPS Check
            }
        });

        // 4. Update Stop Status to VISITED (or IN_PROGRESS if supported, but Schema has PENDING/SKIPPED/VISITED)
        // I will keep it PENDING until Check-out?
        // Or make it VISITED only on check-out.
        // Let's keep PENDING, UI will show "Currently Visiting" if active visit exists.

        return NextResponse.json(visit);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
