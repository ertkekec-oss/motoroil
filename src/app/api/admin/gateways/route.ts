import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize } from '@/lib/auth';

export async function GET(request: Request) {
    try {
        const auth = await authorize();
        if (!auth.authorized) return auth.response;

        const user = (auth as any).user;
        if (user.role !== 'SUPER_ADMIN' && user.role !== 'PLATFORM_ADMIN') {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 });
        }

        const gateways = await prisma.paymentGateway.findMany({
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ success: true, data: gateways });
    } catch (error: any) {
        console.error('Gateways API Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const auth = await authorize();
        if (!auth.authorized) return auth.response;

        const user = (auth as any).user;
        if (user.role !== 'SUPER_ADMIN' && user.role !== 'PLATFORM_ADMIN') {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 });
        }

        const body = await request.json();
        const { provider, isActive, isTestMode, apiKey, apiSecret, merchantId, supportedTypes } = body;

        // Check uniqueness
        const existing = await prisma.paymentGateway.findUnique({
            where: { provider }
        });

        if (existing) {
            return NextResponse.json({ success: false, error: 'Bu sağlayıcı zaten ekli' }, { status: 400 });
        }

        const gateway = await prisma.paymentGateway.create({
            data: {
                provider,
                isActive: !!isActive,
                isTestMode: !!isTestMode,
                apiKey,
                apiSecret,
                merchantId,
                supportedTypes: supportedTypes || []
            }
        });

        return NextResponse.json({ success: true, data: gateway });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const auth = await authorize();
        if (!auth.authorized) return auth.response;

        const user = (auth as any).user;
        if (user.role !== 'SUPER_ADMIN' && user.role !== 'PLATFORM_ADMIN') {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 });
        }

        const body = await request.json();
        const { id, provider, isActive, isTestMode, apiKey, apiSecret, merchantId, supportedTypes } = body;

        if (!id) return NextResponse.json({ success: false, error: 'ID gereklidir' }, { status: 400 });

        const gateway = await prisma.paymentGateway.update({
            where: { id },
            data: {
                provider,
                isActive: !!isActive,
                isTestMode: !!isTestMode,
                apiKey,
                apiSecret,
                merchantId,
                supportedTypes: supportedTypes || [] // Format: ["SAAS", "SMS", "EINVOICE"]
            }
        });

        return NextResponse.json({ success: true, data: gateway });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const auth = await authorize();
        if (!auth.authorized) return auth.response;

        const user = (auth as any).user;
        if (user.role !== 'SUPER_ADMIN' && user.role !== 'PLATFORM_ADMIN') {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ success: false, error: 'ID gereklidir' }, { status: 400 });

        await prisma.paymentGateway.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
