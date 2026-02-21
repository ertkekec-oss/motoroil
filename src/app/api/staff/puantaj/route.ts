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
        const period = searchParams.get('period'); // "2024-02"
        const branch = searchParams.get('branch');

        if (!period) return NextResponse.json({ error: 'Dönem gereklidir (YYYY-MM)' }, { status: 400 });

        const [year, month] = period.split('-').map(Number);
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        // Fetch all staff
        const staffList = await prisma.staff.findMany({
            where: {
                deletedAt: null,
                ...(branch && branch !== 'all' ? { branch } : {})
            },
            select: { id: true, name: true, role: true, workType: true, dailyWorkingHours: true }
        });

        // Fetch all attendance for this period
        const attendance = await (prisma as any).attendance.findMany({
            where: {
                date: { gte: startDate, lte: endDate }
            }
        });

        // Fetch all leaves for this period
        const leaves = await (prisma as any).leaveRequest.findMany({
            where: {
                status: 'Onaylandı',
                OR: [
                    { startDate: { lte: endDate }, endDate: { gte: startDate } }
                ]
            }
        });

        // Build report
        const report = staffList.map(staff => {
            const staffAttendance = attendance.filter((a: any) => a.staffId === staff.id);
            const staffLeaves = leaves.filter((l: any) => l.staffId === staff.id);

            const daysInMonth = endDate.getDate();
            const dailyStats = [];

            let totalWorkedDays = 0;
            let totalWorkedHours = 0;
            let totalLeaveDays = 0;

            for (let d = 1; d <= daysInMonth; d++) {
                const currentDate = new Date(year, month - 1, d);
                const att = staffAttendance.find((a: any) => new Date(a.date).getDate() === d);
                const leave = staffLeaves.find((l: any) => currentDate >= new Date(l.startDate) && currentDate <= new Date(l.endDate));

                let status = 'ABSENT';
                if (att) {
                    status = 'WORKED';
                    totalWorkedDays++;
                    totalWorkedHours += att.workingHours || 0;
                } else if (leave) {
                    status = 'LEAVE';
                    totalLeaveDays++;
                } else if (currentDate.getDay() === 0) { // Default Sunday off
                    status = 'OFF_DAY';
                }

                dailyStats.push({ day: d, status, hours: att?.workingHours || 0 });
            }

            return {
                staffId: staff.id,
                name: staff.name,
                role: staff.role,
                summary: {
                    workedDays: totalWorkedDays,
                    workedHours: totalWorkedHours.toFixed(1),
                    leaveDays: totalLeaveDays
                },
                dailyStats
            };
        });

        return NextResponse.json(report);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
