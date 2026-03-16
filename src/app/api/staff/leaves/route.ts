
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const staffId = searchParams.get('staffId');
        const status = searchParams.get('status');

        const where: any = {};
        if (staffId) where.staffId = staffId;
        if (status) where.status = status;

        const leaves = await prisma.leaveRequest.findMany({
            where,
            include: {
                staff: {
                    select: { name: true, role: true }
                }
            },
            orderBy: { startDate: 'desc' }
        });

        return NextResponse.json(leaves);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch leaves' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { staffId, type, startDate, endDate, days, reason } = body;

        const leave = await prisma.leaveRequest.create({
            data: {
                staffId,
                type,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                days,
                reason,
                status: 'Bekliyor'
            }
        });

        return NextResponse.json(leave);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create leave request' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, status, approvedBy } = body;

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        const leave = await prisma.leaveRequest.update({
            where: { id },
            data: {
                status,
                approvedBy: status === 'Onaylandı' ? approvedBy : null
            },
            include: { staff: true }
        });

        if (status === 'Onaylandı') {
            // 1. PUANTAJ (Attendance) Yansıması
            const sDate = new Date(leave.startDate);
            const eDate = new Date(leave.endDate);
            
            for (let d = new Date(sDate); d <= eDate; d.setDate(d.getDate() + 1)) {
                await prisma.attendance.create({
                    data: {
                        staffId: leave.staffId,
                        date: new Date(d),
                        checkIn: new Date(new Date(d).setHours(9, 0, 0, 0)),
                        status: "ON_LEAVE",
                        isPuantajOk: true,
                        notes: `Onaylı İzin: ${leave.type}`,
                        workingHours: 0
                    }
                });
            }

            // 2. VARDİYA (Shift) Yansıması
            await prisma.shift.create({
                data: {
                    staffId: leave.staffId,
                    start: new Date(leave.startDate),
                    end: new Date(leave.endDate),
                    type: `İzin: ${leave.type}`,
                    branch: leave.staff?.branch || 'MERKEZ',
                    notes: leave.reason
                }
            });

            // 3. BORDRO (Payroll) Yansıması (Opsiyonel / Ücretsiz İzin İse Kesinti)
            if (leave.type === 'Ücretsiz İzin' && leave.staff?.salary) {
                const year = new Date(leave.startDate).getFullYear();
                const month = String(new Date(leave.startDate).getMonth() + 1).padStart(2, '0');
                const periodStr = `${year}-${month}`;
                
                const dailyWage = Number(leave.staff.salary) / 30;
                const deductionAmount = dailyWage * leave.days;

                const existingPayroll = await prisma.payroll.findFirst({
                    where: { staffId: leave.staffId, period: periodStr }
                });

                if (existingPayroll) {
                    await prisma.payroll.update({
                        where: { id: existingPayroll.id },
                        data: {
                            deductions: Number(existingPayroll.deductions) + deductionAmount,
                            netPay: Number(existingPayroll.netPay) - deductionAmount
                        }
                    });
                }
            }
        }

        return NextResponse.json(leave);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update leave request' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        await prisma.leaveRequest.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete leave request' }, { status: 500 });
    }
}
