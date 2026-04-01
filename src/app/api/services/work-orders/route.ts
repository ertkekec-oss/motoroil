import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { customerId, assetId, complaint, branch, status } = body;

        const customer = await prisma.customer.findUnique({
            where: { id: customerId }
        });

        if (!customer) {
            return NextResponse.json({ error: 'Müşteri bulunamadı.' }, { status: 404 });
        }

        const workOrder = await prisma.serviceOrder.create({
            data: {
                companyId: customer.companyId,
                customerId,
                assetId: assetId || null,
                complaint,
                branch: branch || 'Merkez',
                status: status || 'PENDING',
                appointmentDate: new Date(),
                totalAmount: 0,
                subTotal: 0,
                taxTotal: 0
            }
        });

        return NextResponse.json(workOrder);

    } catch (error: any) {
        console.error('WorkOrder creation error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
