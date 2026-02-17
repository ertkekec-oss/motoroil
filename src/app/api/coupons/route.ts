import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize, resolveCompanyId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;
    const user = auth.user;

    try {
        const companyId = await resolveCompanyId(user);
        if (!companyId) return NextResponse.json([], { status: 200 });

        const { searchParams } = new URL(request.url);
        const code = searchParams.get('code');
        const customerId = searchParams.get('customerId');

        if (code) {
            const coupon = await prisma.coupon.findFirst({
                where: { code, companyId },
                include: { customer: true }
            });
            return NextResponse.json(coupon);
        }

        const where: any = { companyId };
        if (customerId) where.customerId = customerId;

        const coupons = await prisma.coupon.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: { customer: true }
        });
        return NextResponse.json(coupons);
    } catch (error: any) {
        console.error('[API_COUPONS_GET]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;
    const user = auth.user;

    try {
        const companyId = await resolveCompanyId(user);
        if (!companyId) throw new Error('Firma yetkisi bulunamadı.');

        const data = await request.json();

        // Multi-generate support
        if (data.count && data.count > 1) {
            const count = parseInt(data.count);
            const coupons = [];
            const prefix = data.campaignName ? data.campaignName.substring(0, 3).toUpperCase() : 'CPN';

            for (let i = 0; i < count; i++) {
                const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
                const code = `${prefix}-${randomSuffix}`;

                coupons.push({
                    code,
                    companyId,
                    campaignName: data.campaignName,
                    type: data.type,
                    value: data.value,
                    minPurchaseAmount: data.minPurchaseAmount || 0,
                    customerCategoryId: data.customerCategoryId,
                    startDate: data.startDate ? new Date(data.startDate) : new Date(),
                    expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
                    conditions: data.conditions || { brands: [], categories: [] },
                    usageLimit: data.usageLimit || 1,
                    usedCount: 0,
                    isUsed: false
                });
            }

            const result = await prisma.coupon.createMany({
                data: coupons
            });
            return NextResponse.json({ success: true, count: result.count });
        }

        const coupon = await prisma.coupon.create({
            data: {
                companyId,
                code: data.code || Math.random().toString(36).substring(2, 8).toUpperCase(),
                campaignName: data.campaignName,
                type: data.type,
                value: data.value,
                minPurchaseAmount: data.minPurchaseAmount || 0,
                customerCategoryId: data.customerCategoryId,
                customerId: data.customerId,
                startDate: data.startDate ? new Date(data.startDate) : new Date(),
                expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
                conditions: data.conditions || { brands: [], categories: [] },
                usageLimit: data.usageLimit || 1,
                usedCount: 0,
                isUsed: false
            }
        });
        return NextResponse.json(coupon);
    } catch (error: any) {
        console.error('[API_COUPONS_POST]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;
    const user = auth.user;

    try {
        const companyId = await resolveCompanyId(user);
        if (!companyId) throw new Error('Firma yetkisi bulunamadı.');

        const data = await request.json();
        const { id, ...updateData } = data;

        if (updateData.expiryDate) updateData.expiryDate = new Date(updateData.expiryDate);

        const existing = await prisma.coupon.findFirst({ where: { id, companyId } });
        if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const coupon = await prisma.coupon.update({
            where: { id },
            data: updateData
        });
        return NextResponse.json(coupon);
    } catch (error: any) {
        console.error('[API_COUPONS_PUT]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const auth = await authorize();
    if (!auth.authorized) return auth.response;
    const user = auth.user;

    try {
        const companyId = await resolveCompanyId(user);
        if (!companyId) throw new Error('Firma yetkisi bulunamadı.');

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

        // Verify ownership and delete
        const existing = await prisma.coupon.findFirst({ where: { id, companyId } });
        if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        await prisma.coupon.delete({
            where: { id }
        });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[API_COUPONS_DELETE]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
