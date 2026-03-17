import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize } from '@/lib/auth';

export async function GET(req: Request) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;

    const { searchParams } = new URL(req.url);
    const staffId = searchParams.get('staffId');
    const period = searchParams.get('period');

    const where: any = {};
    if (staffId) where.staffId = staffId;
    if (period) where.period = period;

    try {
        const data = await prisma.advanceDeduction.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                staff: {
                    select: { name: true, role: true }
                }
            }
        });
        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;

    try {
        const body = await req.json();
        const { staffId, type, amount, period, description } = body;

        if (!staffId || !type || !amount || !period) {
            return NextResponse.json({ success: false, error: 'Eksik bilgi' }, { status: 400 });
        }

        const data = await prisma.advanceDeduction.create({
            data: {
                staffId,
                type,
                amount: Number(amount),
                period,
                description,
                status: 'APPROVED' // Varsayılan olarak direkt eklendiği için approved
            }
        });

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ success: false, error: 'ID gerekli' }, { status: 400 });

    try {
        await prisma.advanceDeduction.delete({
            where: { id }
        });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
