
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const start = searchParams.get('start');
        const end = searchParams.get('end');
        const staffId = searchParams.get('staffId');

        const where: any = {};

        if (start && end) {
            where.start = {
                gte: new Date(start),
                lte: new Date(end)
            };
        }

        if (staffId) {
            where.staffId = staffId;
        }

        const shifts = await prisma.shift.findMany({
            where,
            include: {
                staff: {
                    select: { name: true, role: true }
                }
            },
            orderBy: { start: 'asc' }
        });

        return NextResponse.json(shifts);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch shifts' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { staffId, start, end, type, branch, notes } = body;

        const startDate = new Date(start);
        let endDate = new Date(end);

        const startHour = startDate.getHours();
        const startMin = startDate.getMinutes();
        const endHour = endDate.getHours();
        const endMin = endDate.getMinutes();

        // Calculate how many days to loop over based on date parts alone (ignoring time)
        const sDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        const eDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

        const daysDiff = Math.round((eDateOnly.getTime() - sDateOnly.getTime()) / (1000 * 60 * 60 * 24));
        const shiftsData = [];

        // Determine if end time is next day visually (e.g. 22:00 to 06:00)
        let isNextDayEnd = false;
        if (endHour < startHour || (endHour === startHour && endMin < startMin)) {
            isNextDayEnd = true;
        }

        // Loop from 0 to daysDiff
        for (let i = 0; i <= Math.max(0, daysDiff); i++) {
            const shiftStart = new Date(sDateOnly);
            shiftStart.setDate(shiftStart.getDate() + i);
            shiftStart.setHours(startHour, startMin, 0, 0);

            const shiftEnd = new Date(sDateOnly);
            shiftEnd.setDate(shiftEnd.getDate() + i);
            if (isNextDayEnd) {
                shiftEnd.setDate(shiftEnd.getDate() + 1);
            }
            shiftEnd.setHours(endHour, endMin, 0, 0);

            shiftsData.push({
                staffId,
                start: shiftStart,
                end: shiftEnd,
                type,
                branch,
                notes
            });
        }

        const createdShifts = await prisma.$transaction(
            shiftsData.map(data => prisma.shift.create({ data }))
        );

        return NextResponse.json(createdShifts);
    } catch (error) {
        console.error("Shift creation error:", error);
        return NextResponse.json({ error: 'Failed to create shift(s)' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        await prisma.shift.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete shift' }, { status: 500 });
    }
}
