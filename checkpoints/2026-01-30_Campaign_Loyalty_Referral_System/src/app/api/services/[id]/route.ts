
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        const service = await prisma.serviceRecord.findUnique({
            where: { id },
            include: {
                customer: {
                    select: { id: true, name: true, phone: true }
                }
            }
        });

        if (!service) {
            return NextResponse.json({ success: false, error: 'Service record not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, service });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
