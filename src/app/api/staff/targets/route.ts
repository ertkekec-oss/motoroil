
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const sessionResult: any = await getSession();
        const session = sessionResult?.user || sessionResult;
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const searchParams = req.nextUrl.searchParams;
        const staffId = searchParams.get('staffId');
        const mine = searchParams.get('mine');

        // Resolve Company ID
        let company;
        if (session.tenantId === 'PLATFORM_ADMIN') {
            company = await (prisma as any).company.findFirst();
        } else {
            company = await (prisma as any).company.findFirst({
                where: { tenantId: session.tenantId }
            });
        }
        if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

        const where: any = { companyId: company.id };

        if (mine === 'true') {
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
                return NextResponse.json({ targets: [] });
            }
        } else if (staffId) {
            where.staffId = staffId;
        }

        const targets = await (prisma as any).staffTarget.findMany({
            where,
            include: {
                staff: { select: { name: true, id: true } }
            },
            orderBy: { startDate: 'desc' }
        });

        // Calculate progress for each target
        const detailedTargets = await Promise.all(targets.map(async (target: any) => {
            let currentValue = 0;
            if (target.type === 'TURNOVER') {
                const aggregate = await (prisma as any).salesOrder.aggregate({
                    where: {
                        staffId: target.staffId,
                        createdAt: {
                            gte: target.startDate,
                            lte: target.endDate
                        },
                        status: { not: 'CANCELLED' }
                    },
                    _sum: { totalAmount: true }
                });
                currentValue = Number(aggregate._sum?.totalAmount || 0);
            } else if (target.type === 'VISIT') {
                const count = await (prisma as any).salesVisit.count({
                    where: {
                        staffId: target.staffId,
                        checkInTime: {
                            gte: target.startDate,
                            lte: target.endDate
                        }
                    }
                });
                currentValue = count;
            }

            return {
                ...target,
                currentValue
            };
        }));

        return NextResponse.json(detailedTargets);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const sessionResult: any = await getSession();
        const session = sessionResult?.user || sessionResult;
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { staffId, type, targetValue, startDate, endDate, period } = body;

        // Resolve Company ID
        let company;
        if (session.tenantId === 'PLATFORM_ADMIN') {
            company = await (prisma as any).company.findFirst();
        } else {
            company = await (prisma as any).company.findFirst({
                where: { tenantId: session.tenantId }
            });
        }
        if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

        const target = await (prisma as any).staffTarget.create({
            data: {
                companyId: company.id,
                staffId,
                type,
                targetValue,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                period: period || 'MONTHLY',
                status: 'ACTIVE'
            }
        });

        return NextResponse.json(target);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
