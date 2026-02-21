import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period'); // e.g. "2024-02"
    const branch = searchParams.get('branch');

    const where: any = {};
    if (period) where.period = period;

    // Filter by staff branch if needed, but payroll links to staff. 
    // If branch param exists, we filter staff.
    if (branch && branch !== 'all') {
        where.staff = { branch: branch };
    }

    try {
        const payrolls = await prisma.payroll.findMany({
            where,
            include: { staff: true },
            orderBy: { staff: { name: 'asc' } }
        });
        return NextResponse.json({ success: true, payrolls });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { period, staffIds } = body; // Array of staff IDs to generate for

        if (!period) return NextResponse.json({ success: false, error: 'Dönem girilmelidir' }, { status: 400 });

        let processed = 0;

        // Use transaction? Or loop.
        // For each staff, check if payroll exists for this period. If not, create.

        const staffList = await prisma.staff.findMany({
            where: {
                deletedAt: null,
                ...(staffIds && staffIds.length ? { id: { in: staffIds } } : {})
            }
        });

        for (const staff of staffList) {
            const exists = await prisma.payroll.findUnique({
                where: {
                    staffId_period: {
                        staffId: staff.id,
                        period: period
                    }
                }
            });

            if (!exists) {
                // Calculate performance bonuses for this period
                let calculatedBonus = 0;

                // Parse period to start/end dates for target matching
                const [year, month] = period.split('-').map(Number);
                const periodStart = new Date(year, month - 1, 1);
                const periodEnd = new Date(year, month, 0, 23, 59, 59);

                const periodTargets = await (prisma as any).staffTarget.findMany({
                    where: {
                        staffId: staff.id,
                        startDate: { lte: periodEnd },
                        endDate: { gte: periodStart },
                        status: 'ACTIVE'
                    }
                });

                for (const target of periodTargets) {
                    let currentValue = 0;
                    if (target.type === 'TURNOVER') {
                        const fieldAgg = await (prisma as any).salesOrder.aggregate({
                            where: {
                                staffId: staff.id,
                                createdAt: { gte: target.startDate, lte: target.endDate },
                                status: { not: 'CANCELLED' }
                            },
                            _sum: { totalAmount: true }
                        });
                        const storeAgg = await (prisma as any).order.aggregate({
                            where: {
                                staffId: staff.id,
                                orderDate: { gte: target.startDate, lte: target.endDate },
                                status: { notIn: ['CANCELLED', 'Returned'] }
                            },
                            _sum: { totalAmount: true }
                        });
                        currentValue = Number(fieldAgg._sum?.totalAmount || 0) + Number(storeAgg._sum?.totalAmount || 0);

                        if (target.commissionRate > 0) {
                            calculatedBonus += (currentValue * Number(target.commissionRate)) / 100;
                        }
                    } else if (target.type === 'VISIT') {
                        currentValue = await (prisma as any).salesVisit.count({
                            where: {
                                staffId: staff.id,
                                checkInTime: { gte: target.startDate, lte: target.endDate }
                            }
                        });
                    }

                    if (currentValue >= Number(target.targetValue) && target.bonusAmount > 0) {
                        calculatedBonus += Number(target.bonusAmount);
                    }
                }

                await prisma.payroll.create({
                    data: {
                        staffId: staff.id,
                        period,
                        salary: staff.salary || 0,
                        bonus: calculatedBonus,
                        netPay: Number(staff.salary || 0) + calculatedBonus,
                        status: 'Bekliyor'
                    }
                });
                processed++;
            }
        }

        return NextResponse.json({ success: true, message: `${processed} adet bordro oluşturuldu.` });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
