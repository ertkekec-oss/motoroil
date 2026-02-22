
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize } from '@/lib/auth';

export async function GET() {
    try {
        const auth = await authorize();
        if (!auth.authorized) return auth.response;

        const campaigns = await prisma.campaign.findMany({
            where: {
                companyId: auth.companyId,
                deletedAt: null
            },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(campaigns);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const auth = await authorize();
        if (!auth.authorized) return auth.response;

        const data = await request.json();
        const campaign = await prisma.campaign.create({
            data: {
                companyId: auth.companyId,
                name: data.name,
                type: data.type,
                description: data.description,
                conditions: data.conditions || {},
                discountRate: data.discountRate,
                pointsRate: data.pointsRate,
                startDate: data.startDate ? new Date(data.startDate) : new Date(),
                endDate: data.endDate ? new Date(data.endDate) : undefined,
                isActive: data.isActive ?? true,
                targetCustomerCategoryIds: data.targetCustomerCategoryIds || []
            }
        });
        return NextResponse.json(campaign);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const auth = await authorize();
        if (!auth.authorized) return auth.response;

        const data = await request.json();
        const { id, ...updateData } = data;

        // Verify ownership
        const existing = await prisma.campaign.findFirst({
            where: { id, companyId: auth.companyId }
        });
        if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
        if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);

        const campaign = await prisma.campaign.update({
            where: { id },
            data: updateData
        });
        return NextResponse.json(campaign);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const auth = await authorize();
        if (!auth.authorized) return auth.response;

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

        // Soft delete
        await prisma.campaign.updateMany({
            where: { id, companyId: auth.companyId },
            data: { deletedAt: new Date() }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
