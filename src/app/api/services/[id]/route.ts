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
        const { 
            plate, km, nextKm, nextDate, vehicleBrand, vehicleSerial, vehicleType, checklist,
            notes, status, totalAmount, subTotal, taxTotal, 
            items, technicianId, startTime, endTime, photos, customerApproved 
        } = body;

        const existing = await prisma.serviceRecord.findFirst({
            where: { id, companyId }
        });

        if (!existing) {
            return NextResponse.json({ success: false, error: 'Service record not found or access denied.' }, { status: 404 });
        }

        const data: any = {
            plate,
            km: km !== undefined ? parseInt(km.toString()) : undefined,
            nextKm: nextKm !== undefined ? parseInt(nextKm.toString()) : undefined,
            nextDate: nextDate ? new Date(nextDate) : undefined,
            vehicleBrand,
            vehicleSerial,
            vehicleType,
            checklist,
            notes,
            status,
            totalAmount,
            subTotal,
            taxTotal,
            items,
            technicianId,
            customerApproved: customerApproved !== undefined ? !!customerApproved : undefined,
            photos: photos || undefined
        };

        if (startTime) data.startTime = new Date(startTime);
        if (endTime) data.endTime = new Date(endTime);

        // Filter undefined
        Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);

        const updatedService = await prisma.serviceRecord.update({
            where: { id },
            data
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
