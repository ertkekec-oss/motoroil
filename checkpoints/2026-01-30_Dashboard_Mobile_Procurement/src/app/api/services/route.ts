
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const customerId = searchParams.get('customerId');

        if (!customerId) {
            return NextResponse.json({ success: false, error: 'Customer ID required' }, { status: 400 });
        }

        const services = await prisma.serviceRecord.findMany({
            where: { customerId },
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
        const body = await request.json();
        const { customerId, plate, vehicleBrand, vehicleSerial, km, nextKm, nextDate, notes, items, totalAmount } = body;

        const service = await prisma.serviceRecord.create({
            data: {
                customerId,
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
