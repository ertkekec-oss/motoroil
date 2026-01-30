import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const code = searchParams.get('code');
        const customerId = searchParams.get('customerId');

        if (code) {
            const coupon = await prisma.coupon.findUnique({
                where: { code },
                include: { customer: true }
            });
            return NextResponse.json(coupon);
        }

        const where: any = {};
        if (customerId) where.customerId = customerId;

        const coupons = await prisma.coupon.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: { customer: true }
        });
        return NextResponse.json(coupons);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const coupon = await prisma.coupon.create({
            data: {
                code: data.code || Math.random().toString(36).substring(2, 8).toUpperCase(),
                type: data.type,
                value: data.value,
                minPurchaseAmount: data.minPurchaseAmount,
                customerCategoryId: data.customerCategoryId,
                customerId: data.customerId,
                expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
                isUsed: false
            }
        });
        return NextResponse.json(coupon);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const data = await request.json();
        const { id, ...updateData } = data;

        if (updateData.expiryDate) updateData.expiryDate = new Date(updateData.expiryDate);

        const coupon = await prisma.coupon.update({
            where: { id },
            data: updateData
        });
        return NextResponse.json(coupon);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

        await prisma.coupon.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
