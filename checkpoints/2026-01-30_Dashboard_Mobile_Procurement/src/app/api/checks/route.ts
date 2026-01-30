
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const checks = await prisma.check.findMany({
            orderBy: { dueDate: 'asc' },
            include: {
                customer: true,
                supplier: true
            }
        });
        return NextResponse.json({ success: true, checks });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { type, number, bank, dueDate, amount, description, customerId, supplierId } = body;

        const check = await prisma.check.create({
            data: {
                type,
                number,
                bank,
                dueDate: new Date(dueDate),
                amount: parseFloat(amount),
                description,
                customerId,
                supplierId
            }
        });

        return NextResponse.json({ success: true, check });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
