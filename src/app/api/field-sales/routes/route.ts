
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const session: any = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const staffId = searchParams.get('staffId');

        const mine = searchParams.get('mine');

        // Resolve Company ID (Platform Admin Support)
        let company;
        if (session.tenantId === 'PLATFORM_ADMIN') {
            company = await (prisma as any).company.findFirst();
        } else {
            company = await (prisma as any).company.findFirst({
                where: { tenantId: session.tenantId }
            });
        }

        if (!company) {
            // For Platform Admin or edge cases, handle gracefully
            // But Field Sales implies a company context.
            return NextResponse.json({
                error: `Firma bulunamadı. (TenantID: ${session.tenantId || 'YOK'})`
            }, { status: 404 });
        }

        const where: any = { companyId: company.id };

        if (mine === 'true') {
            // Find staff record for current user
            const staffUser = await (prisma as any).staff.findFirst({
                where: {
                    OR: [
                        { email: session.user?.email },
                        { username: session.user?.username || session.user?.email }
                    ]
                }
            });
            if (staffUser) {
                where.staffId = staffUser.id;
            } else {
                if (session.tenantId === 'PLATFORM_ADMIN') {
                    // Admin testing: Show all routes if no staff record found
                } else {
                    return NextResponse.json({ error: 'Staff record not found for user' }, { status: 404 });
                }
            }
        } else {
            if (status) where.status = status;
            if (staffId) where.staffId = staffId;
        }

        const routes = await (prisma as any).route.findMany({
            where,
            include: {
                staff: { select: { id: true, name: true } },
                _count: { select: { stops: true } }
            },
            orderBy: { date: 'desc' }
        });

        return NextResponse.json(routes);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session: any = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { name, staffId, date } = body;

        if (!name || !staffId || !date) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        // Resolve Company ID (Platform Admin Support)
        let company;
        if (session.tenantId === 'PLATFORM_ADMIN') {
            company = await (prisma as any).company.findFirst();
        } else {
            company = await (prisma as any).company.findFirst({
                where: { tenantId: session.tenantId }
            });
        }

        if (!company) {
            return NextResponse.json({
                error: `Firma bulunamadı. (TenantID: ${session.tenantId || 'YOK'})`
            }, { status: 404 });
        }

        const route = await (prisma as any).route.create({
            data: {
                companyId: company.id,
                name,
                staffId,
                date: new Date(date),
                status: 'PENDING'
            }
        });

        return NextResponse.json(route);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
