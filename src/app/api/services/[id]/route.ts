import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorize, resolveCompanyId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await authorize();
        if (!auth.authorized) return auth.response;

        const companyId = await resolveCompanyId(auth.user);
        if (!companyId) return NextResponse.json({ success: false, error: 'Firma bulunamadı.' }, { status: 400 });

        const { id } = await params;

        const service = await prisma.serviceRecord.findFirst({
            where: { id, companyId },
            include: {
                customer: {
                    select: { id: true, name: true, phone: true }
                }
            }
        });

        if (!service) {
            return NextResponse.json({ success: false, error: 'Service record not found or access denied.' }, { status: 404 });
        }

        return NextResponse.json({ success: true, service });
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
        const { plate, km, nextKm, nextDate, vehicleBrand, vehicleSerial, notes, status, totalAmount, items } = body;

        const existing = await prisma.serviceRecord.findFirst({
            where: { id, companyId }
        });

        if (!existing) {
            return NextResponse.json({ success: false, error: 'Service record not found or access denied.' }, { status: 404 });
        }

        const updatedService = await prisma.serviceRecord.update({
            where: { id },
            data: {
                plate,
                km: km ? parseInt(km.toString()) : undefined,
                nextKm: nextKm ? parseInt(nextKm.toString()) : undefined,
                nextDate: nextDate ? new Date(nextDate) : undefined,
                vehicleBrand,
                vehicleSerial,
                notes,
                status,
                totalAmount,
                items
            }
        });

        return NextResponse.json({ success: true, service: updatedService });
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

        const existing = await prisma.serviceRecord.findFirst({
            where: { id, companyId }
        });

        if (!existing) {
            return NextResponse.json({ success: false, error: 'Service record not found or access denied.' }, { status: 404 });
        }

        await prisma.serviceRecord.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
