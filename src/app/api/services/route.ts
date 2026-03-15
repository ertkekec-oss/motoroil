import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorize, resolveCompanyId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const auth = await authorize();
        if (!auth.authorized) return auth.response;

        const companyId = await resolveCompanyId(auth.user);
        if (!companyId) return NextResponse.json({ success: false, error: 'Firma bulunamadı.' }, { status: 400 });

        const { searchParams } = new URL(request.url);
        const customerId = searchParams.get('customerId');

        const where: any = { companyId, deletedAt: null };
        if (customerId) {
            where.customerId = customerId;
        }

        const services = await prisma.serviceRecord.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                customer: {
                    select: { name: true }
                }
            }
        });

        return NextResponse.json({ success: true, services });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const auth = await authorize();
        if (!auth.authorized) return auth.response;

        const companyId = await resolveCompanyId(auth.user);
        if (!companyId) return NextResponse.json({ success: false, error: 'Firma bulunamadı.' }, { status: 400 });

        const body = await request.json();
        const { customerId, plate, vehicleBrand, vehicleSerial, km, nextKm, nextDate, notes, items, totalAmount } = body;

        if (customerId) {
            const customer = await prisma.customer.findFirst({ where: { id: customerId, companyId } });
            if (!customer) throw new Error("Müşteri bulunamadı veya erişim yetkiniz yok.");
        }

        const service = await prisma.serviceRecord.create({
            data: {
                customerId,
                companyId,
                plate,
                vehicleBrand,
                vehicleSerial,
                km: km ? parseInt(km) : null,
                nextKm: nextKm ? parseInt(nextKm) : null,
                nextDate: nextDate ? new Date(nextDate) : null,
                notes,
                items,
                totalAmount: parseFloat(totalAmount),
                status: 'Tamamlandı'
            }
        });

        return NextResponse.json({ success: true, service });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
