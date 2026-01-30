
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const period = searchParams.get('period');
        const staffId = searchParams.get('staffId');

        const where: any = {};
        if (period) where.period = period;
        if (staffId) where.staffId = staffId;

        const payrolls = await prisma.payroll.findMany({
            where,
            include: {
                staff: {
                    select: { name: true, role: true, branch: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(payrolls);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch payrolls' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { staffId, period, salary, bonus, deductions, note } = body;

        const netPay = parseFloat(salary) + parseFloat(bonus || 0) - parseFloat(deductions || 0);

        const payroll = await prisma.payroll.create({
            data: {
                staffId,
                period,
                salary,
                bonus,
                deductions,
                netPay,
                note,
                status: 'Bekliyor'
            }
        });

        return NextResponse.json(payroll);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create payroll record' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, status } = body;

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        const payroll = await prisma.payroll.update({
            where: { id },
            data: {
                status,
                paidAt: status === 'Ödendi' ? new Date() : null
            }
        });

        return NextResponse.json(payroll);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update payroll status' }, { status: 500 });
    }
}
