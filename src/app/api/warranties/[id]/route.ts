import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorize, resolveCompanyId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await authorize();
        if (!auth.authorized) return auth.response;

        const companyId = await resolveCompanyId(auth.user);
        if (!companyId) return NextResponse.json({ success: false, error: 'Firma bulunamadı.' }, { status: 400 });

        const { id } = await params;
        const warranty = await prisma.warranty.findUnique({
            where: { id },
            include: { customer: true }
        });

        if (!warranty || warranty.customer.companyId !== companyId) {
            return NextResponse.json({ success: false, error: 'Garanti kaydı bulunamadı veya yetkiniz yok.' }, { status: 404 });
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
        const auth = await authorize();
        if (!auth.authorized) return auth.response;

        const companyId = await resolveCompanyId(auth.user);
        if (!companyId) return NextResponse.json({ success: false, error: 'Firma bulunamadı.' }, { status: 400 });

        const { id } = await params;
        const body = await request.json();
        const { productName, serialNo, startDate, endDate, period, status, invoiceNo } = body;

        const warranty = await prisma.warranty.findUnique({
            where: { id },
            include: { customer: true }
        });

        if (!warranty || warranty.customer.companyId !== companyId) {
            return NextResponse.json({ success: false, error: 'Kayıt bulunamadı veya yetkiniz yok.' }, { status: 404 });
        }

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
        const auth = await authorize();
        if (!auth.authorized) return auth.response;

        const companyId = await resolveCompanyId(auth.user);
        if (!companyId) return NextResponse.json({ success: false, error: 'Firma bulunamadı.' }, { status: 400 });

        const { id } = await params;

        const warranty = await prisma.warranty.findUnique({
            where: { id },
            include: { customer: true }
        });

        if (!warranty || warranty.customer.companyId !== companyId) {
            return NextResponse.json({ success: false, error: 'Kayıt bulunamadı veya yetkiniz yok.' }, { status: 404 });
        }

        await prisma.warranty.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
