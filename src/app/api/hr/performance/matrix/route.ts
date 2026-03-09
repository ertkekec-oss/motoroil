import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: Request) {
    const session = await getSession();
    if (!session?.tenantId) return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });

    const companyId = session.tenantId === 'PLATFORM_ADMIN'
        ? (await prisma.company.findFirst())?.id
        : (await prisma.company.findFirst({ where: { tenantId: session.tenantId } }))?.id;

    if (!companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    const plans = await prisma.targetPlan.findMany({
        where: { companyId },
        include: {
            periods: {
                orderBy: { startDate: 'asc' },
                include: {
                    assignments: {
                        include: { staff: true }
                    }
                }
            }
        },
        orderBy: { year: 'desc' }
    });

    const staffList = await prisma.staff.findMany({
        where: { companyId },
        select: { id: true, name: true, role: true, department: true }
    });

    return NextResponse.json({ success: true, plans, staffList });
}

export async function POST(req: Request) {
    const session = await getSession();
    if (!session?.tenantId) return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });

    if (session.role !== 'SUPER_ADMIN' && session.role !== 'PLATFORM_ADMIN' && session.role !== 'TENANT_ADMIN' && session.role !== 'ADMIN' && session.role !== 'HR_MANAGER') {
        return NextResponse.json({ error: 'Yetkisiz eylem. Sadece yöneticiler matrix tanımı yapabilir.' }, { status: 403 });
    }

    try {
        const companyId = session.tenantId === 'PLATFORM_ADMIN'
            ? (await prisma.company.findFirst())?.id
            : (await prisma.company.findFirst({ where: { tenantId: session.tenantId } }))?.id;

        if (!companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

        const body = await req.json();
        const { year, totalTarget, bonusPool, staffIds } = body;

        if (!year || !totalTarget || !bonusPool) {
            return NextResponse.json({ error: 'Zorunlu alanlar eksik.' }, { status: 400 });
        }

        // 1. Create TargetPlan
        const plan = await prisma.targetPlan.create({
            data: {
                tenantId: session.tenantId,
                companyId: companyId,
                year: Number(year),
                totalTarget: Number(totalTarget),
                bonusPool: Number(bonusPool),
                mode: 'STANDARD',
                status: 'PUBLISHED'
            }
        });

        // 2. Define standard quarters
        const quarterTargets = Number(totalTarget) / 4;
        const quarterWeight = 0.25;

        const qDefinitions = [
            { name: 'Q1', startDate: new Date(`${year}-01-01`), endDate: new Date(`${year}-03-31`) },
            { name: 'Q2', startDate: new Date(`${year}-04-01`), endDate: new Date(`${year}-06-30`) },
            { name: 'Q3', startDate: new Date(`${year}-07-01`), endDate: new Date(`${year}-09-30`) },
            { name: 'Q4', startDate: new Date(`${year}-10-01`), endDate: new Date(`${year}-12-31`) }
        ];

        for (const q of qDefinitions) {
            const period = await prisma.targetPeriod.create({
                data: {
                    tenantId: session.tenantId,
                    companyId: companyId,
                    planId: plan.id,
                    name: q.name,
                    startDate: q.startDate,
                    endDate: q.endDate,
                    targetAmount: quarterTargets,
                    weight: quarterWeight
                }
            });

            // 3. Assign to selected Staff
            if (staffIds && Array.isArray(staffIds)) {
                const staffQuarterTarget = quarterTargets / staffIds.length;
                const staffQuarterBonus = (Number(bonusPool) / 4) / staffIds.length;

                for (const staffId of staffIds) {
                    await prisma.targetAssignment.create({
                        data: {
                            tenantId: session.tenantId,
                            companyId: companyId,
                            planId: plan.id,
                            periodId: period.id,
                            staffId,
                            target: staffQuarterTarget,
                            bonusPotential: staffQuarterBonus
                        }
                    });
                }
            }
        }

        return NextResponse.json({ success: true, plan });
    } catch (error: any) {
        console.error("Matrix Creation Error", error);
        return NextResponse.json({ error: 'Matrix oluşturulamadı.' }, { status: 500 });
    }
}
