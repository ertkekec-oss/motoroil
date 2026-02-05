import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const quote = await prisma.quote.findUnique({
            where: { id },
            include: { customer: true }
        });
        if (!quote) return NextResponse.json({ success: false, error: 'Quote not found' }, { status: 404 });
        return NextResponse.json({ success: true, quote });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id: paramId } = await params;
    try {
        const body = await req.json();
        // Exclude id, quoteNo, createdAt from data
        const { id, quoteNo, createdAt, customer, ...data } = body;

        const quote = await prisma.quote.update({
            where: { id: paramId },
            data: {
                ...data,
                validUntil: data.validUntil ? new Date(data.validUntil) : undefined
            }
        });
        return NextResponse.json({ success: true, quote });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        await prisma.quote.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
