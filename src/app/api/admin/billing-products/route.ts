import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize } from '@/lib/auth';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');
        const activeOnly = searchParams.get('activeOnly') !== 'false';

        // Hem admin hem normal kullanıcılar görebilir (satın alma ekranı için admin şart değil).
        // Eğer type verilmişse sadece o tipi döndür (SAAS, SMS, EINVOICE)

        const where: any = {};
        if (type) where.type = type;
        if (activeOnly) where.isActive = true;

        const products = await prisma.billingProduct.findMany({
            where,
            orderBy: [{ type: 'asc' }, { price: 'asc' }]
        });

        return NextResponse.json({ success: true, data: products });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const auth = await authorize();
        if (!auth.authorized) return auth.response;

        const user = (auth as any).user;
        if (user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 });
        }

        const body = await request.json();
        const { type, name, description, price, currency, creditAmount, planId, isActive } = body;

        if (!['SAAS', 'SMS', 'EINVOICE'].includes(type) || !name || price === undefined) {
            return NextResponse.json({ error: 'Eksik veya hatalı bilgi' }, { status: 400 });
        }

        const product = await prisma.billingProduct.create({
            data: {
                type,
                name,
                description,
                price: parseFloat(price.toString()),
                currency: currency || 'TRY',
                creditAmount: parseInt((creditAmount || 0).toString(), 10),
                planId,
                isActive: isActive !== undefined ? !!isActive : true
            }
        });

        return NextResponse.json({ success: true, data: product });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const auth = await authorize();
        if (!auth.authorized) return auth.response;

        const user = (auth as any).user;
        if (user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 });
        }

        const body = await request.json();
        const { id, type, name, description, price, currency, creditAmount, planId, isActive } = body;

        if (!id) return NextResponse.json({ error: 'ID gereklidir' }, { status: 400 });

        const product = await prisma.billingProduct.update({
            where: { id },
            data: {
                type,
                name,
                description,
                price: price !== undefined ? parseFloat(price.toString()) : undefined,
                currency,
                creditAmount: creditAmount !== undefined ? parseInt(creditAmount.toString(), 10) : undefined,
                planId,
                isActive: isActive !== undefined ? !!isActive : undefined
            }
        });

        return NextResponse.json({ success: true, data: product });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const auth = await authorize();
        if (!auth.authorized) return auth.response;

        const user = (auth as any).user;
        if (user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ success: false, error: 'ID gereklidir' }, { status: 400 });

        await prisma.billingProduct.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
