import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const workOrder = await prisma.serviceOrder.findUnique({
            where: { id },
            include: { customer: true, asset: true, items: true }
        });

        if (!workOrder) {
            return NextResponse.json({ error: 'İş emri bulunamadı.' }, { status: 404 });
        }

        return NextResponse.json(workOrder);
    } catch (error: any) {
        console.error('WorkOrder error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { status, nextKm_or_Use, nextMaintenanceAt, technicianNotes, attachments, digitalSignature } = body;

        const updateData: any = {};
        if (status) updateData.status = status;
        if (nextKm_or_Use !== undefined) updateData.nextKm_or_Use = nextKm_or_Use;
        if (nextMaintenanceAt !== undefined) updateData.nextMaintenanceAt = nextMaintenanceAt;
        if (technicianNotes !== undefined) updateData.technicianNotes = technicianNotes;
        if (attachments !== undefined) updateData.attachments = attachments;
        if (digitalSignature !== undefined) updateData.digitalSignature = digitalSignature;

        if (status === 'IN_PROGRESS') {
            updateData.startedAt = new Date();
        } else if (status === 'COMPLETED') {
            updateData.completedAt = new Date();
        }

        const workOrder = await prisma.serviceOrder.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json(workOrder);
    } catch (error: any) {
        console.error('WorkOrder update error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
