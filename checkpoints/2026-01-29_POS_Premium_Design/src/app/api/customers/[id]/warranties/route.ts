
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: customerId } = await params;
        const body = await request.json();
        const { productName, serialNo, startDate, endDate, period, invoiceNo } = body;

        const warranty = await prisma.warranty.create({
            data: {
                customerId,
                productName,
                serialNo,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                period,
                invoiceNo,
                status: 'Active'
            }
        });

        return NextResponse.json(warranty);
    } catch (error: any) {
        console.error('Warranty creation error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: customerId } = await params;
        const warranties = await prisma.warranty.findMany({
            where: { customerId },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(warranties);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
