
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const sessionResult: any = await getSession();
        const session = sessionResult?.user || sessionResult;
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const staffUser = await (prisma as any).staff.findFirst({
            where: {
                OR: [
                    { email: session.email },
                    { username: session.username || session.email }
                ]
            }
        });

        if (!staffUser) return NextResponse.json({ expenses: [] });

        const expenses = await (prisma as any).expense.findMany({
            where: { staffId: staffUser.id },
            orderBy: { date: 'desc' },
            take: 50
        });

        return NextResponse.json({ success: true, expenses });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const sessionResult: any = await getSession();
        const session = sessionResult?.user || sessionResult;
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const staffUser = await (prisma as any).staff.findFirst({
            where: {
                OR: [
                    { email: session.email },
                    { username: session.username || session.email }
                ]
            }
        });

        if (!staffUser) return NextResponse.json({ error: 'Staff not found' }, { status: 404 });

        const body = await req.json();
        const { type, amount, description, date, receiptUrl } = body;

        const expense = await (prisma as any).expense.create({
            data: {
                companyId: staffUser.companyId,
                staffId: staffUser.id,
                type,
                amount: Number(amount),
                description,
                date: date ? new Date(date) : new Date(),
                receiptUrl,
                status: 'Beklemede'
            }
        });

        return NextResponse.json({ success: true, expense });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
