
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const invoice = await prisma.salesInvoice.findUnique({
            where: { id },
            include: {
                customer: true,
                branch: true
            }
        });

        if (!invoice) {
            return NextResponse.json({ success: false, error: 'Fatura bulunamadı' }, { status: 404 });
        }

        return NextResponse.json({ success: true, invoice });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { invoiceNo, invoiceDate, items, totalAmount, status } = body;

        const updatedInvoice = await prisma.salesInvoice.update({
            where: { id },
            data: {
                invoiceNo,
                invoiceDate: invoiceDate ? new Date(invoiceDate) : undefined,
                items,
                totalAmount,
                status
            }
        });

        return NextResponse.json({ success: true, invoice: updatedInvoice });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const invoice = await prisma.salesInvoice.findUnique({ where: { id } });
        if (!invoice) {
            return NextResponse.json({ success: false, error: 'Fatura zaten silinmiş veya bulunamadı' }, { status: 404 });
        }

        // If formal/approved, maybe we shouldn't allow simple delete?
        // For now, let's allow it but warn in UI.

        await prisma.salesInvoice.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
