
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
                // 1. Field Sales turnover (SalesOrder)
                const fieldAggregate = await (prisma as any).salesOrder.aggregate({
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

                // 2. Store Sales turnover (Order)
                const storeAggregate = await (prisma as any).order.aggregate({
                    where: {
                        staffId: target.staffId,
                        orderDate: {
                            gte: target.startDate,
                            lte: target.endDate
                        },
                        status: { notIn: ['CANCELLED', 'Returned'] }
                    },
                    _sum: { totalAmount: true }
                });

                currentValue = Number(fieldAggregate._sum?.totalAmount || 0) + Number(storeAggregate._sum?.totalAmount || 0);
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

            // Calculate estimated bonus/commission
            let estimatedBonus = 0;
            const progressPercent = target.targetValue > 0 ? (currentValue / Number(target.targetValue)) * 100 : 0;

            // Percentage based commission on total turnover
            if (target.type === 'TURNOVER' && target.commissionRate > 0) {
                estimatedBonus += (currentValue * Number(target.commissionRate)) / 100;
            }

            // Fixed bonus if target is met
            if (currentValue >= Number(target.targetValue) && target.bonusAmount > 0) {
                estimatedBonus += Number(target.bonusAmount);
            }

            return {
                ...target,
                currentValue,
                progressPercent,
                estimatedBonus
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
        const { staffId, type, targetValue, startDate, endDate, period, commissionRate, bonusAmount } = body;

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
                commissionRate: commissionRate ? Number(commissionRate) : 0,
                bonusAmount: bonusAmount ? Number(bonusAmount) : 0,
                status: 'ACTIVE'
            }
        });

        return NextResponse.json(target);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
