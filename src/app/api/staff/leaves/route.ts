
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
            }
        });

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
