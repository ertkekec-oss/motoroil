
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const warranty = await prisma.warranty.findUnique({
            where: { id },
            include: { customer: true }
        });

        if (!warranty) {
            return NextResponse.json({ success: false, error: 'Garanti kaydı bulunamadı' }, { status: 404 });
        }

        return NextResponse.json({ success: true, warranty });
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
        const { productName, serialNo, startDate, endDate, period, status, invoiceNo } = body;

        const updatedWarranty = await prisma.warranty.update({
            where: { id },
            data: {
                productName,
                serialNo,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined,
                period,
                status,
                invoiceNo
            }
        });

        return NextResponse.json({ success: true, warranty: updatedWarranty });
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

        await prisma.warranty.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
