import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorize, verifyWriteAccess } from '@/lib/auth';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await authorize();
        if (!auth.authorized) return auth.response;

        const { id } = await params;
        const invoice = await prisma.salesInvoice.findFirst({
            where: { id, companyId: auth.user.companyId },
            include: {
                customer: true,
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
        const auth = await authorize();
        if (!auth.authorized) return auth.response;

        const writeCheck = verifyWriteAccess(auth.user);
        if (!writeCheck.authorized) return writeCheck.response;

        const { id } = await params;
        const body = await request.json();
        const { invoiceNo, invoiceDate, items, totalAmount, status } = body;

        // Ensure ownership
        const existing = await prisma.salesInvoice.findFirst({
            where: { id, companyId: auth.user.companyId }
        });
        if (!existing) return NextResponse.json({ success: false, error: 'Fatura bulunamadı' }, { status: 404 });

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
        const auth = await authorize();
        if (!auth.authorized) return auth.response;

        const writeCheck = verifyWriteAccess(auth.user);
        if (!writeCheck.authorized) return writeCheck.response;

        const { id } = await params;

        // Ensure ownership
        const invoice = await prisma.salesInvoice.findFirst({
            where: { id, companyId: auth.user.companyId }
        });
        if (!invoice) {
            return NextResponse.json({ success: false, error: 'Fatura zaten silinmiş veya bulunamadı' }, { status: 404 });
        }

        await prisma.salesInvoice.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
