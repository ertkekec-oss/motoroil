
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import Iyzipay from 'iyzipay';

// Iyzico Webhook İmzası Doğrulama
function verifySignature(req: NextRequest, body: any): boolean {
    const signature = req.headers.get('x-iyzico-webhook-signature'); // Header ismi dokümantasyona göre değişebilir
    // Not: Iyzico webhook imza doğrulama mekanizması abonelik servisi için
    // genellikle payload + secret key hash'i şeklindedir.
    // Şimdilik basic bir IP veya basic auth kontrolü veya path parametresi ile "secret token" kontrolü önerilir.
    // Ancak resmi dokümantasyona göre V2 abonelik webhookları için imza kontrolü yapılmalı.

    // Iyzico V2 için genelde bu başlık kullanılır: x-iyzico-hmac-sha256
    // Fakat basitlik adına şimdilik AppSettings'den alınan bir secret token ile
    // URL query parametresi kontrolü yapacağız (örn: /api/webhooks/iyzico?token=XYZ)
    // PROD'da HMAC doğrulaması EKLENMELİDİR.
    return true;
}

const mapIyzicoStatusToSubscription = (eventType: string): string | null => {
    switch (eventType) {
        case 'SUBSCRIPTION_CREATED':
        case 'SUBSCRIPTION_ACTIVATED':
        case 'PAYMENT_SUCCESS': // Veya 'subscription.payment.success'
            return 'ACTIVE';

        case 'PAYMENT_FAILED': // Veya 'subscription.payment.failed'
            return 'PAST_DUE';

        case 'SUBSCRIPTION_CANCELED':
        case 'SUBSCRIPTION_DEACTIVATED': // Trial bitişi de genelde bu veya özel bir event ile gelir
            return 'SUSPENDED'; // Veya 'CANCELLED'

        default:
            return null; // Unknown or irrelevant event
    }
};

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { searchParams } = new URL(req.url);
        const webhookToken = searchParams.get('token');

        // 1. Güvenlik Kontrolü
        // Gerçek dünyada Environment Variable veya DB'den gelen devasa bir secret olmalı.
        const EXPECTED_TOKEN = process.env.IYZICO_WEBHOOK_SECRET || 'temp-secret-change-me';
        if (webhookToken !== EXPECTED_TOKEN) {
            console.error("Iyzico Webhook Unauthorized Attempt");
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('[IYZICO WEBHOOK] Received:', JSON.stringify(body, null, 2));

        // 2. Event Tipi ve Veri Çıkarımı
        // Iyzico Webhook payload yapısı: { iyziEventType: '...', iyziEventTime: number, ...resource }
        // Veya subscription için farklı olabilir. Dokümandaki genel yapıya sadık kalacağız.
        const eventType = body.iyziEventType;
        const subscriptionReferenceCode = body.subscriptionReferenceCode || body.referenceCode;

        if (!eventType || !subscriptionReferenceCode) {
            return NextResponse.json({ message: 'Event ignored (missing info)' });
        }

        // 3. Status Mapping
        const newStatus = mapIyzicoStatusToSubscription(eventType);
        if (!newStatus) {
            console.log(`[IYZICO WEBHOOK] Unhandled event type: ${eventType}`);
            return NextResponse.json({ message: 'Event ignored (unhandled type)' });
        }

        // 4. Veritabanı Güncelleme
        // Subscription, referenceCode veya tenantId üzerinden bulunabilir.
        // Subscription modelimizde 'iyzicoSubCode' gibi bir alan yok, eklememiz lazım.
        // Veya tenantId = referenceCode varsayımı ile ilerleyebiliriz (Backfill aşamasında böyle kurulmalı).
        // Şimdilik 'id' veya 'tenantId'nin referenceCode olarak kullanıldığını varsayıyoruz.

        // Subscription bul (tenantId'ye göre mi, yoksa sub id'ye göre mi?)
        // En doğrusu Subscription modeline `providerSubId` eklemektir.
        // Ama şimdilik tenantId ile eşleştiğini varsayalım.

        // Önce Subscription modeline externalId eklemeliyiz, yoksa subscription'ı bulamayız.
        // Schema update gerekli.
        // Hızlı çözüm: body içinde custom parameter olarak tenantId geliyor mu?
        // Iyzico subscription init ederken metadata gönderebiliyorsak oradan alırız.

        // Subscription bul (externalId [Iyzico Reference Code] veya ID'ye göre)
        const subscription = await prisma.subscription.findFirst({
            where: {
                OR: [
                    { externalId: subscriptionReferenceCode },
                    { id: subscriptionReferenceCode }
                ]
            }
        });

        if (!subscription) {
            console.warn(`[IYZICO WEBHOOK] Subscription not found for ref: ${subscriptionReferenceCode}`);
            return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
        }

        console.log(`[IYZICO WEBHOOK] Updating Subscription ${subscription.id} status to ${newStatus}`);

        await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
                status: newStatus,
                // Eğer status SUSPENDED veya PAST_DUE ise endDate güncellenebilir veya korunabilir.
                // Eğer ACTIVE ise ve yıllık yenileme ise endDate uzatılmalı.
                // Payment success event'inde period bilgisi varsa tarihi de güncellemeliyiz.
            }
        });

        // 5. Subscription History Kaydı
        await prisma.subscriptionHistory.create({
            data: {
                subscriptionId: subscription.id,
                action: `WEBHOOK_${eventType}`,
                prevPlanId: subscription.planId,
                newPlanId: subscription.planId, // Plan değişmedi
            }
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('[IYZICO WEBHOOK ERROR]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
