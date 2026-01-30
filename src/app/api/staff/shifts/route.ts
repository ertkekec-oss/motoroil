
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

        const shift = await prisma.shift.create({
            data: {
                staffId,
                start: new Date(start),
                end: new Date(end),
                type,
                branch,
                notes
            }
        });

        return NextResponse.json(shift);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create shift' }, { status: 500 });
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
