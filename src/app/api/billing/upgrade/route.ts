
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getRequestContext } from '@/lib/api-context';
import { iyzico } from '@/lib/iyzico';

export async function POST(req: NextRequest) {
    try {
        const ctx = await getRequestContext(req);
        const { planId } = await req.json();

        // 1. Planı ve Detayları Getir
        const [plan, tenant, user] = await Promise.all([
            prisma.plan.findUnique({ where: { id: planId } }),
            prisma.tenant.findUnique({
                where: { id: ctx.tenantId },
                include: { companies: { take: 1 } } // Fatura bilgisi için ilk şirketi alıyoruz
            }),
            prisma.user.findUnique({ where: { id: ctx.userId } })
        ]);

        if (!plan || !plan.iyzicoPlanCode) {
            return NextResponse.json({ error: 'Seçilen paket ödeme için hazır değil (iyzicoPlanCode eksik).' }, { status: 400 });
        }

        if (!tenant || !user) {
            return NextResponse.json({ error: 'Kullanıcı veya hesap bilgileri bulunamadı.' }, { status: 404 });
        }

        const company = tenant.companies[0] || { name: tenant.name, address: 'Merkez', city: 'Istanbul' };

        // Name/Surname Split
        const nameParts = (user.name || 'Müşteri').trim().split(' ');
        const name = nameParts[0];
        const surname = nameParts.length > 1 ? nameParts.slice(1).join(' ') : name;

        // 2. Iyzico Checkout Formunu Başlat
        const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/iyzico/callback`;

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
                gsmNumber: '+905000000000', // Gerçek veride phone alanı olmalı
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
            return NextResponse.json({ error: result.errorMessage || 'Iyzico başlatılamadı.' }, { status: 500 });
        }

        // 3. Sonucu Dön (Frontend'de HTML content render edilecek)
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
