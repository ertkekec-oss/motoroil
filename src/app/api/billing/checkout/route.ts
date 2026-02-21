
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getRequestContext } from '@/lib/api-context';
import { iyzico } from '@/lib/iyzico';

export const dynamic = 'force-dynamic';

export async function GET() {
    return NextResponse.json({ message: 'Upgrade API is alive' });
}

export async function POST(req: NextRequest) {
    try {
        const ctx = await getRequestContext(req);

        // PLATFORM_ADMIN check
        if (ctx.tenantId === 'PLATFORM_ADMIN') {
            return NextResponse.json({
                error: 'Sistem yöneticileri plan yükseltmesi yapamaz. Lütfen bir müşteri hesabı ile test edin.'
            }, { status: 403 });
        }

        const body = await req.json().catch(() => ({}));
        const { planId } = body;

        if (!planId) {
            return NextResponse.json({ error: 'Plan ID zorunludur.' }, { status: 400 });
        }

        // 1. Planı ve Detayları Getir
        const [plan, tenant, user] = await Promise.all([
            prisma.plan.findUnique({ where: { id: planId } }),
            prisma.tenant.findUnique({
                where: { id: ctx.tenantId },
                include: { companies: { take: 1 } }
            }),
            prisma.user.findUnique({ where: { id: ctx.userId } })
        ]);

        if (!plan) {
            return NextResponse.json({ error: 'Seçilen paket bulunamadı.' }, { status: 404 });
        }

        if (!plan.iyzicoPlanCode) {
            return NextResponse.json({
                error: 'Bu paket şu anda ödemeye açık değil (Iyzico yapılandırması eksik).'
            }, { status: 400 });
        }

        if (!tenant || !user) {
            return NextResponse.json({ error: 'Hesap veya kullanıcı bilgileri bulunamadı.' }, { status: 404 });
        }

        const company = tenant.companies[0] || { name: tenant.name, address: 'Merkez', city: 'Istanbul' };

        // Name/Surname Split
        const nameParts = (user.name || 'Müşteri').trim().split(' ');
        const name = nameParts[0];
        const surname = nameParts.length > 1 ? nameParts.slice(1).join(' ') : name;

        // 2. Iyzico Checkout Formunu Başlat
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://periodya.com';
        const callbackUrl = `${baseUrl}/api/webhooks/iyzico/callback`;

        const checkoutData = {
            locale: 'tr',
            conversationId: `sub_${ctx.tenantId}_${Date.now()}`,
            callbackUrl: callbackUrl,
            pricingPlanCode: plan.iyzicoPlanCode,
            subscriptionAddress: {
                contactName: user.name || 'Müşteri',
                city: company.city || 'Istanbul',
                country: 'Turkey',
                address: company.address || 'Merkez'
            },
            customer: {
                name: name,
                surname: surname,
                email: user.email,
                gsmNumber: '+905000000000',
                identityNumber: '11111111111',
                billingAddress: {
                    contactName: user.name || 'Müşteri',
                    city: company.city || 'Istanbul',
                    country: 'Turkey',
                    address: company.address || 'Merkez'
                }
            }
        };

        const result = await iyzico.initializeSubscriptionCheckout(checkoutData as any);

        if (result.status !== 'success') {
            return NextResponse.json({
                error: result.errorMessage || 'Iyzico başlatılamadı.'
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            checkoutFormContent: result.checkoutFormContent,
            token: result.token
        });

    } catch (error: any) {
        console.error("Upgrade API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
