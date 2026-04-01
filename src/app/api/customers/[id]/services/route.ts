import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: customerId } = await params;

        const services = await prisma.serviceOrder.findMany({
            where: { customerId },
            include: { asset: true, items: true },
            orderBy: { createdAt: 'desc' }
        });

        // Map to match the existing UI if necessary, or just return
        return NextResponse.json(services);

    } catch (error: any) {
        console.error('Fetch services error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
