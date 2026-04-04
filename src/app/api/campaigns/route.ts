
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize } from '@/lib/auth';

export async function GET(request: Request) {
    try {
        const auth = await authorize();
        if (!auth.authorized) return auth.response;

        const { searchParams } = new URL(request.url);
        const channel = searchParams.get('channel');

        const whereClause: any = {
            tenantId: (auth as any).user.tenantId,
            companyId: (auth as any).user.companyId,
            deletedAt: null
        };

        if (channel) {
            whereClause.channels = { has: channel };
        }

        const campaigns = await prisma.campaign.findMany({
            where: whereClause,
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
                tenantId: (auth as any).user.tenantId,
                companyId: (auth as any).user.companyId,
                name: data.name,
                type: data.type || "percent_discount",
                campaignType: data.campaignType,
                description: data.description,
                conditions: data.conditions || {},
                discountRate: data.discountRate ? parseFloat(data.discountRate) : null,
                pointsRate: data.pointsRate ? parseFloat(data.pointsRate) : null,
                startDate: data.startDate ? new Date(data.startDate) : new Date(),
                endDate: data.endDate ? new Date(data.endDate) : undefined,
                isActive: data.isActive ?? true,
                targetCustomerCategoryIds: data.targetCustomerCategoryIds || [],
                channels: data.channels || ['GLOBAL'],
                priority: data.priority ? parseInt(data.priority) : 0,
                stackingRule: data.stackingRule || 'STACKABLE',
                validFrom: data.validFrom ? new Date(data.validFrom) : null,
                validUntil: data.validUntil ? new Date(data.validUntil) : null,
                minOrderAmount: data.minOrderAmount ? parseFloat(data.minOrderAmount) : null,
                minQuantity: data.minQuantity ? parseInt(data.minQuantity) : null,
                productIds: data.productIds || [],
                categoryIds: data.categoryIds || [],
                customerSegment: data.customerSegment,
                salesRepId: data.salesRepId,
                regionId: data.regionId,
                hubVisibility: data.hubVisibility
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
            where: { id, tenantId: (auth as any).user.tenantId, companyId: (auth as any).user.companyId }
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
            where: { id, tenantId: (auth as any).user.tenantId, companyId: (auth as any).user.companyId },
            data: { deletedAt: new Date(), isActive: false, status: 'DELETED' }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
