
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const customerId = searchParams.get('customerId');

        if (!customerId) {
            return NextResponse.json({ success: false, error: 'Customer ID required' }, { status: 400 });
        }

        const warranties = await prisma.warranty.findMany({
            where: { customerId },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ success: true, warranties });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { customerId, productName, serialNo, startDate, endDate, period, status, invoiceNo } = body;

        const warranty = await prisma.warranty.create({
            data: {
                customerId,
                productName,
                serialNo,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                period,
                status: status || 'Active',
                invoiceNo
            }
        });

        return NextResponse.json({ success: true, warranty });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
