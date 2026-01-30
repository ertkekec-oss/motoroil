import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET all suspended sales
export async function GET() {
    try {
        const sales = await prisma.suspendedSale.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(sales);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// CREATE a suspended sale
export async function POST(request: Request) {
    try {
        const data = await request.json();
        const sale = await prisma.suspendedSale.create({
            data: {
                label: data.label,
                items: data.items,
                customer: data.customer,
                total: data.total,
                branch: data.branch
            }
        });
        return NextResponse.json(sale);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE a suspended sale
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) throw new Error('ID is required');

        await prisma.suspendedSale.delete({
            where: { id }
        });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
